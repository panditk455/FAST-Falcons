function initializeSocket() {
  const socket = new WebSocket("ws://" + location.host + "/ws");

  socket.onopen = function () {
    console.log("WebSocket connection established.");
    socket.send(
      JSON.stringify({
        event: "join",
        username: user_data.username,
        avatar_path: user_data.avatar_path,
        room_num: room_number,
      })
    );
  };

  socket.onmessage = function (event) {
    console.log("WebSocket message received:", event.data);
    const data = JSON.parse(event.data);

    if (data.event === "update_users") {
      updateUsersList(data.users);
    }
  };

  socket.onclose = function () {
    console.log("WebSocket connection closed.");
  };

  socket.onerror = function (error) {
    console.log("WebSocket error:", error);
  };

  window.onbeforeunload = function () {
    socket.send(
      JSON.stringify({
        event: "leave",
        username: user_data.username,
        room_num: room_number,
      })
    );
  };
}

function updateUsersList(users) {
  console.log("Updating users list:", users);
  const usersListDiv = document.getElementById("usersList");
  usersListDiv.innerHTML = ""; // Clear current list

  users.forEach(function (user) {
    const userDiv = document.createElement("div");
    userDiv.className = "user";
    userDiv.innerHTML = `<img src="${user.avatar_path}" alt="${user.username}'s Avatar" /><p>${user.username}</p>`;
    usersListDiv.appendChild(userDiv);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initializeSocket();
});
