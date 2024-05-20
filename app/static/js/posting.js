const textarea = document.querySelector("#post-desc");
const postBtn = document.querySelector(".post-btn");
const postAudienceBtn = document.querySelector(".post-audience");
const backBtn = document.querySelector(".arrow-left-icon");
const createPostSection = document.querySelector(".create-post");
const postAudienceSection = document.querySelector(".post-audience-section");
const emojiBtn = document.querySelector(".emoji");
const emojiPicker = document.querySelector("emoji-picker");
const audienceOptions = document.querySelectorAll(".audience-option");
const radioBtns = document.querySelectorAll(".audience-option-radio");

document.body.style.overflowX = "none";

textarea.addEventListener("input", () => {
  if (textarea.value != "") postBtn.disabled = false;
  else postBtn.disabled = true;
});
emojiBtn.addEventListener("click", () => {
  if (emojiPicker.style.display == "none") emojiPicker.style.display = "block";
  else emojiPicker.style.display = "none";
});
emojiPicker.addEventListener("emoji-click", (e) => {
  textarea.value += e.detail.unicode;
});
postAudienceBtn.addEventListener("click", () => {
  document.querySelector(".wrapper").classList.add("wrapper-active");
  postAudienceSection.style.display = "block";
  createPostSection.style.display = "none";
});
audienceOptions.forEach((option) => {
  option.addEventListener("click", (e) => {
    if (!option.classList.contains("active")) {
      option.classList.add("active");
      e.currentTarget.children[1].children[0].children[0].checked = true;
    }
    for (let i = 0; i < audienceOptions.length; i++) {
      if (e.currentTarget != audienceOptions[i]) {
        audienceOptions[i].classList.remove("active");
        radioBtns[i].checked = false;
      }
    }
  });
});
backBtn.addEventListener("click", () => {
  document.querySelector(".wrapper").classList.remove("wrapper-active");
  postAudienceSection.style.display = "none";
  createPostSection.style.display = "block";
});
