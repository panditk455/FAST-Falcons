let avatarIndex = 0;
let clothesIndex = 0;
const totalAvatars = 3; // Assuming you have 3 different avatar options
const totalClothes = 3; // Assuming you have 3 different clothing options

const avatars = ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg"];

const clothes = ["cloth1.png", "cloth2.png", "cloth3.png"];

const avatarImg = document.getElementById("avatar");
const clothImg = document.getElementById("cloth");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const saveBtn = document.getElementById("save-btn");

avatarImg.addEventListener("click", () => {
  avatarIndex = (avatarIndex + 1) % totalAvatars;
  avatarImg.src = avatars[avatarIndex];
});

clothImg.addEventListener("click", () => {
  clothesIndex = (clothesIndex + 1) % totalClothes;
  clothImg.src = clothes[clothesIndex];
});

leftBtn.addEventListener("click", () => {
  clothesIndex = (clothesIndex - 1 + totalClothes) % totalClothes;
  clothImg.src = clothes[clothesIndex];
});

rightBtn.addEventListener("click", () => {
  clothesIndex = (clothesIndex + 1) % totalClothes;
  clothImg.src = clothes[clothesIndex];
});

saveBtn.addEventListener("click", () => {
  // Logic to save the chosen avatar state
  alert("Avatar saved successfully!");
});
