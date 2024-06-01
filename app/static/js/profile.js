// profile.js
// Daniel Lumbu, Kritika Pandit Daniel Estrada, Alex Wcislo,Palmy Klangsathorn
// Updated: May 31, 2024 
// This script fetches the user's avatar path and updates the image source, and 
// it handles form submissions for updating the username and password.

document.addEventListener("DOMContentLoaded", function () {
    // Fetch the avatar path and update the image source
    fetch("/get_avatar_path")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("profile-avatar").src = data.avatar_path;
        document.querySelector(".avatar-container img").src = data.avatar_path;
      });
  
    // Handle update username form submission
    document.getElementById("update-username-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const newUsername = document.getElementById("new-username").value;
      fetch("/update_username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_username: newUsername }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message);
        });
    });
  
    // Handle update password form submission
    document.getElementById("update-password-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const newPassword = document.getElementById("new-password").value;
      fetch("/update_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: newPassword }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message);
        });
    });
  });