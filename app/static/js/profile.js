'use strict';
for (const kind of ['username', 'password']) {
  document.getElementById(`update-${kind}-form`).onsubmit = async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button');
    button.disabled = true;
    const payload = kind === 'username'
      ? { new_username: document.getElementById('new-username').value }
      : { current_password: document.getElementById('current-password').value, new_password: document.getElementById('new-password').value };
    try {
      const data = await carls.request(`/update_${kind}`, { method: 'POST', body: JSON.stringify(payload) });
      carls.notice(data.message);
      if (kind === 'username') {
        document.getElementById('profile-name').textContent = data.username;
        document.querySelector('.profile-menu summary span').textContent = data.username;
      } else form.reset();
    } catch (error) { carls.notice(error.message, true); }
    finally { button.disabled = false; }
  };
}
