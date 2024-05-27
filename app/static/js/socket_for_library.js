// Establish WebSocket connection
const socket = new WebSocket("ws://your-backend-server-url");

socket.addEventListener("open", function (event) {
  console.log("WebSocket connected");
});

socket.addEventListener("message", function (event) {
  const data = JSON.parse(event.data);
  const { username, avatar_path, section } = data;

  // Update or create avatar based on received data
  updateAvatar(username, avatar_path, section);
});

function updateAvatar(username, avatarPath, sectionId) {
  // Create or update avatar element
  let avatar = document.querySelector(`#${username}`);
  if (!avatar) {
    avatar = document.createElement("div");
    avatar.id = username;
    avatar.classList.add("user-avatar");
    avatar.innerHTML = `<img src="${avatarPath}" alt="${username}'s Avatar" />`;
    document.querySelector(".image-wrapper").appendChild(avatar);
  }

  // Move avatar to the specified section
  moveAvatarToSection(avatar, sectionId);
}

// Function to send user's current section to the server
function sendSectionToServer(sectionId) {
  socket.send(JSON.stringify({ section: sectionId }));
}

// Event listeners for section clicks
document.getElementById("section1").addEventListener("click", function () {
  sendSectionToServer("section1");
});

// Add event listeners for other sections as needed
// Repeat the above pattern for section2, section3, etc.
