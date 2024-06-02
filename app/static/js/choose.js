// choose.js
// Daniel Lumbu, Kritika Pandit Daniel Estrada, Alex Wcislo,Palmy Klangsathorn
// Updated: May 31, 2024 
// This allows users to select and 
// save an avatar by navigating through options and sending the chosen avatar path to the server.

document.addEventListener("DOMContentLoaded", function () {
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
    console.log("Left button clicked!");
    avatarIndex = (avatarIndex - 1 + totalAvatars) % totalAvatars;
    updateAvatar();
  });

  rightBtn.addEventListener("click", () => {
    console.log("Right button clicked!");
    avatarIndex = (avatarIndex + 1) % totalAvatars;
    updateAvatar();
  });

  saveBtn.addEventListener("click", () => {
    console.log("Save button clicked!");
    const avatarPath = avatars[avatarIndex];

    
    fetch("/save_avatar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ avatar_path: avatarPath }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Avatar saved successfully!");
        } else {
          alert("Error saving avatar: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});
