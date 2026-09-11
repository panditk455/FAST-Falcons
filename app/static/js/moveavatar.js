'use strict';
let selectedFloor = 1, playing = false;
const playButton = document.getElementById('muteButton');
const musicStatus = document.getElementById('music-status');
const tracks = Array.from(document.querySelectorAll('audio'));
const avatar = document.querySelector('.user-avatar');
function showFloor() {
  document.querySelectorAll('[data-floor]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.floor) === selectedFloor)));
  avatar.style.top = `${[82, 64, 45, 27][selectedFloor - 1]}%`;
  musicStatus.textContent = `Floor ${selectedFloor} · ${playing ? 'Your study soundtrack is playing.' : 'Press play when you’re ready.'}`;
  playButton.textContent = playing ? 'Pause music' : 'Play music';
  playButton.setAttribute('aria-pressed', String(playing));
}
async function playSelected() {
  try { await tracks[selectedFloor - 1].play(); playing = true; }
  catch (_) { playing = false; carls.notice('Music couldn’t start. Press play to try again.', true); }
  showFloor();
}
document.querySelectorAll('[data-floor]').forEach(button => {
  button.onclick = async () => {
    tracks.forEach(track => track.pause());
    selectedFloor = Number(button.dataset.floor);
    showFloor(); await playSelected();
  };
});
playButton.onclick = async () => {
  if (playing) { tracks.forEach(track => track.pause()); playing = false; showFloor(); }
  else await playSelected();
};
document.getElementById('volumeControl').oninput = event => tracks.forEach(track => { track.volume = Number(event.target.value) / 100; });
tracks.forEach(track => { track.volume = .5; });
window.addEventListener('pagehide', () => { tracks.forEach(track => track.pause()); playing = false; showFloor(); });
showFloor();
