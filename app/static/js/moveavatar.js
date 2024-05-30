document.addEventListener("DOMContentLoaded", function () {
  // Move the avatar to section1 by default when the page loads
  moveAvatarToSection("section1");
  playMusic("music1");

  // Set up volume control
  const volumeControl = document.getElementById("volumeControl");
  volumeControl.addEventListener("input", function () {
    setVolume(this.value);
  });

  // Set up mute button
  const muteButton = document.getElementById("muteButton");
  muteButton.addEventListener("click", function () {
    toggleMute();
  });
});

let isMuted = false;
let currentMusicId = "music1";

function moveAvatarToSection(sectionId) {
  const section = document.getElementById(sectionId);
  const avatar = document.querySelector(".user-avatar");

  if (section && avatar) {
    const sectionRect = section.getBoundingClientRect();
    const imageWrapperRect = document
      .querySelector(".image-wrapper")
      .getBoundingClientRect();

    const imageWrapperStyle = window.getComputedStyle(
      document.querySelector(".image-wrapper")
    );
    const imageWrapperPaddingTop = parseFloat(imageWrapperStyle.paddingTop);

    avatar.style.top = `${
      sectionRect.top - imageWrapperRect.top + imageWrapperPaddingTop
    }px`;
    avatar.style.left = `${sectionRect.left - imageWrapperRect.left}px`;
  }
}

function playMusic(musicId) {
  const audios = document.querySelectorAll("audio");
  audios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });

  const music = document.getElementById(musicId);
  if (music && !isMuted) {
    music.play();
  }
  currentMusicId = musicId;
}

function setVolume(value) {
  const audios = document.querySelectorAll("audio");
  const volume = value / 100;
  audios.forEach((audio) => {
    audio.volume = volume;
  });
}

function toggleMute() {
  const audios = document.querySelectorAll("audio");
  const muteButton = document.getElementById("muteButton");

  isMuted = !isMuted;
  if (isMuted) {
    audios.forEach((audio) => {
      audio.pause();
    });
    muteButton.textContent = "Unmute";
  } else {
    const currentAudio = Array.from(audios).find(
      (audio) => audio.id === currentMusicId
    );
    if (currentAudio) {
      currentAudio.play();
    }
    muteButton.textContent = "Mute";
  }
}

document.getElementById("section1").addEventListener("click", function () {
  moveAvatarToSection("section1");
  playMusic("music1");
});

document.getElementById("section2").addEventListener("click", function () {
  moveAvatarToSection("section2");
  playMusic("music2");
});

document.getElementById("section3").addEventListener("click", function () {
  moveAvatarToSection("section3");
  playMusic("music3");
});

document.getElementById("section4").addEventListener("click", function () {
  moveAvatarToSection("section4");
  playMusic("music4");
});
