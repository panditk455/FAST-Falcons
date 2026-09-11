'use strict';
const joinButton = document.getElementById('joinRoomBtn');
const waiting = document.getElementById('waitingMessage');
const matchError = document.getElementById('match-error');
let matchTimer, searching = false;
function resetSearch() { searching = false; clearTimeout(matchTimer); waiting.hidden = true; joinButton.disabled = false; }
function showMatch(data) {
  if (data.status === 'open') { searching = false; location.assign(`/chat/${data.room_id}`); return; }
  if (data.status !== 'waiting') { resetSearch(); return; }
  waiting.hidden = false;
  matchTimer = setTimeout(pollMatch, 2500);
}
async function pollMatch() {
  if (!searching) return;
  try { const data = await carls.request('/api/match'); if (searching) showMatch(data); }
  catch (error) { matchError.textContent = error.message; matchError.hidden = false; matchTimer = setTimeout(pollMatch, 5000); }
}
joinButton.onclick = async () => {
  searching = true; joinButton.disabled = true; matchError.hidden = true;
  try { showMatch(await carls.request('/api/match', { method: 'POST', body: '{}' })); }
  catch (error) { matchError.textContent = error.message; matchError.hidden = false; resetSearch(); }
};
document.getElementById('cancel-match').onclick = async event => {
  event.currentTarget.disabled = true;
  searching = false; clearTimeout(matchTimer);
  try { await carls.request('/api/match', { method: 'DELETE', body: '{}' }); resetSearch(); }
  catch (error) { matchError.textContent = error.message; matchError.hidden = false; searching = true; matchTimer = setTimeout(pollMatch, 2500); }
  finally { event.target.disabled = false; }
};
window.addEventListener('pagehide', () => { searching = false; clearTimeout(matchTimer); });
