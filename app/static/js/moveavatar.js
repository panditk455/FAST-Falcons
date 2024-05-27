document.addEventListener("DOMContentLoaded", function () {
  // Move the avatar to section1 by default when the page loads
  moveAvatarToSection("section1");
});

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

document.getElementById("section1").addEventListener("click", function () {
  moveAvatarToSection("section1");
});

document.getElementById("section2").addEventListener("click", function () {
  moveAvatarToSection("section2");
});

document.getElementById("section3").addEventListener("click", function () {
  moveAvatarToSection("section3");
});

document.getElementById("section4").addEventListener("click", function () {
  moveAvatarToSection("section4");
});
