'use strict';
const chatPage = document.querySelector('.chat-page');
const roomId = chatPage.dataset.roomId;
const privateRoom = chatPage.dataset.private === 'true';
const messageList = document.getElementById('textContainer');
const messageInput = document.getElementById('message_input');
const messageForm = document.getElementById('message-form');
const connectionStatus = document.getElementById('connection-status');
const chatError = document.getElementById('chat-error');
const editDialog = document.getElementById('edit-dialog');
let socket, pollTimer, reconnectTimer, fetching = false, stopped = false, version = '', editedId = null, retryDelay = 1000, lastUpdate = 0;
function showChatError(message) { chatError.textContent = message; chatError.hidden = !message; }
function renderMessages(messages, userId) {
  const nextVersion = JSON.stringify(messages);
  if (nextVersion === version) return;
  const atBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 100;
  const firstRender = !version;
  version = nextVersion;
  const fragment = document.createDocumentFragment();
  if (!messages.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state'; empty.textContent = 'A quiet moment. Be the first to say hello.';
    fragment.append(empty);
  }
  for (const message of messages) {
    const item = document.createElement('article');
    item.className = `message ${message.user_id === userId ? 'mine' : ''}`;
    const author = document.createElement('div'); author.className = 'message-author';
    const authorName = document.createElement('strong'); authorName.textContent = message.user_id === userId ? 'You' : message.username;
    const time = document.createElement('time'); time.dateTime = new Date(message.created_at * 1000).toISOString();
    time.textContent = new Date(message.created_at * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    author.append(authorName, time);
    const body = document.createElement('p'); body.textContent = message.body;
    item.append(author, body);
    if (message.edited) { const note = document.createElement('small'); note.textContent = 'edited'; item.append(note); }
    if (message.user_id === userId) {
      const edit = document.createElement('button'); edit.className = 'edit-message'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', 'Edit your message');
      edit.onclick = () => { editedId = message.id; document.getElementById('edit-text').value = message.body; document.getElementById('edit-error').hidden = true; editDialog.showModal(); };
      item.append(edit);
    }
    fragment.append(item);
  }
  messageList.replaceChildren(fragment);
  if (atBottom || firstRender) messageList.scrollTop = messageList.scrollHeight;
}
async function fetchUpdate() {
  if (fetching || stopped) return;
  fetching = true;
  try {
    const data = await carls.request(`/api/rooms/${roomId}`);
    lastUpdate = Date.now();
    renderMessages(data.messages, data.user_id);
    document.getElementById('playerNames').textContent = privateRoom ? data.members.map(member => member.id === data.user_id ? 'You' : member.username).join(' & ') : `${data.members.length} ${data.members.length === 1 ? 'Carl' : 'Carls'} around`;
    connectionStatus.textContent = socket?.readyState === WebSocket.OPEN ? '● Live' : '● Connected';
    document.getElementById('conversation-ended').hidden = data.room.status !== 'closed';
    messageForm.hidden = data.room.status === 'closed';
  } catch (error) { connectionStatus.textContent = 'Reconnecting…'; showChatError(error.message); }
  finally { fetching = false; }
}
function connect() {
  if (stopped || chatPage.dataset.websockets !== 'true') return;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${location.host}/api/rooms/${roomId}/socket`);
  socket.onopen = () => { retryDelay = 1000; fetchUpdate(); };
  socket.onmessage = fetchUpdate;
  socket.onerror = () => socket.close();
  socket.onclose = () => {
    if (!stopped) { reconnectTimer = setTimeout(connect, retryDelay); retryDelay = Math.min(retryDelay * 2, 30000); }
  };
}
messageForm.onsubmit = async event => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  const button = messageForm.querySelector('button'); button.disabled = true;
  try {
    await carls.request(`/api/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
    if (messageInput.value.trim() === text) messageInput.value = '';
    showChatError('');
    await fetchUpdate(); messageList.scrollTop = messageList.scrollHeight; messageInput.focus();
  } catch (error) { showChatError(error.message); }
  finally { button.disabled = false; }
};
document.getElementById('edit-form').onsubmit = async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('[type="submit"]'); button.disabled = true;
  try {
    await carls.request(`/api/rooms/${roomId}/messages/${editedId}`, { method: 'PATCH', body: JSON.stringify({ text: document.getElementById('edit-text').value }) });
    editDialog.close(); await fetchUpdate();
  } catch (error) { const element = document.getElementById('edit-error'); element.textContent = error.message; element.hidden = false; }
  finally { button.disabled = false; }
};
document.getElementById('cancel-edit').onclick = () => editDialog.close();
document.getElementById('leave-room').onclick = async event => {
  event.currentTarget.disabled = true;
  try { await carls.request(`/api/rooms/${roomId}/leave`, { method: 'POST', body: '{}' }); stop(); location.assign(privateRoom ? '/sayles' : '/'); }
  catch (error) { showChatError(error.message); event.target.disabled = false; }
};
function stop() { stopped = true; clearTimeout(reconnectTimer); clearInterval(pollTimer); socket?.close(); }
function start() { stopped = false; fetchUpdate(); connect(); clearInterval(pollTimer); pollTimer = setInterval(() => { if (!document.hidden || Date.now() - lastUpdate > 60000) fetchUpdate(); }, 5000); }
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', event => { if (event.persisted) start(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) fetchUpdate(); });
start();
