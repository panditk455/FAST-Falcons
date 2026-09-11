'use strict';
const avatarImage = document.querySelector('.avatar-container img');
const avatars = ['', '1', '2', '3'].map(number => `/static/asset/avatar${number}.png`);
let avatarIndex = Math.max(0, avatars.indexOf(avatarImage.dataset.current));
function updateAvatar() {
  avatarImage.src = avatars[avatarIndex];
  document.getElementById('avatar-count').textContent = `${avatarIndex + 1} of ${avatars.length}`;
}
document.getElementById('left-btn').onclick = () => { avatarIndex = (avatarIndex + 3) % 4; updateAvatar(); };
document.getElementById('right-btn').onclick = () => { avatarIndex = (avatarIndex + 1) % 4; updateAvatar(); };
document.getElementById('save-btn').onclick = async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await carls.request('/save_avatar', { method: 'POST', body: JSON.stringify({ avatar_path: avatars[avatarIndex] }) });
    if (button.dataset.next) location.assign(button.dataset.next);
    else {
      document.querySelector('.profile-menu img').src = avatars[avatarIndex];
      carls.notice('Your campus companion is saved.');
    }
  } catch (error) { carls.notice(error.message, true); }
  finally { button.disabled = false; }
};
updateAvatar();
