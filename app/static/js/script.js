let avatarIndex = 0;
const totalAvatars = 4;

const avatars = [
  "../static/asset/avatar.png",
  "../static/asset/avatar1.png",
  "../static/asset/avatar2.png",
  "../static/asset/avatar3.png",
];

const avatarContainer = document.querySelector(".avatar-container");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const saveBtn = document.getElementById("save-btn");

function updateAvatar() {
  avatarContainer.querySelector("img").src = avatars[avatarIndex];
}

updateAvatar();

leftBtn.addEventListener("click", () => {
  avatarIndex = (avatarIndex - 1 + totalAvatars) % totalAvatars;
  updateAvatar();
});

rightBtn.addEventListener("click", () => {
  avatarIndex = (avatarIndex + 1) % totalAvatars;
  updateAvatar();
});

saveBtn.addEventListener("click", () => {
  // Logic to save the chosen avatar state
  alert("Avatar saved successfully!");
});
