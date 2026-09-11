'use strict';
window.carls = {
  async request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content, ...options.headers }
    });
    const data = await response.json().catch(() => ({ message: 'Something went wrong. Please try again.' }));
    if (!response.ok) {
      if (response.status === 401) location.assign('/login');
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return data;
  },
  notice(message, error = false) {
    const element = document.getElementById('notice');
    element.textContent = message;
    element.classList.toggle('is-error', error);
    element.hidden = false;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => { element.hidden = true; }, 6000);
  }
};
document.addEventListener('click', (event) => {
  document.querySelectorAll('.profile-menu[open]').forEach(menu => {
    if (!menu.contains(event.target)) menu.open = false;
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.profile-menu').forEach(menu => { menu.open = false; });
});
