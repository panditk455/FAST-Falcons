// This function is called from within fetchUpdate()
// This function changes the webpage based on the new numbers from the server
// Global Variable to store the websocket object
var socket;

// Global Variable to store the room number and player name
var room_num;
var currenttext = -1; // Start with 'red1'
var play_name;

// This function is called when the page loads
function initializeNumbers() {
  // Set the Room Number based on the URL
  var pathArray = location.pathname.split("/");
  play_name = pathArray[3];
  room_num = pathArray[2];

  //Open the Websocket when the page loads
  sock_url = "ws://" + location.host + "/openSocket";
  sock_url = sock_url + "/" + room_num + "/" + play_name;

  console.log(sock_url);

  socket = new WebSocket(sock_url);

  // Fetch the initial numbers from the server
  fetchUpdate();

  // Fetch a new update whenever the socket receives a message
  socket.onmessage = function (event) {
    fetchUpdate();
  };
  // Setup text elements for messages
  const textContainer = document.getElementById("textContainer");
  for (let i = 0; i < 20; i++) {
    const bElement = document.createElement("b");
    bElement.className = "red";
    bElement.id = "text" + i;
    bElement.style.display = "block";
    textContainer.appendChild(bElement);
  }
}

function scrollToBottom() {
  var chatDiv = document.getElementById("textContainer");
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// This function is called periodically to fetch updates from the server

function fetchUpdate() {
  URL = "/getupdate/" + room_num;
  fetch(URL)
    .then((response) => response.json())
    .then((the_json) => applyUpdate(the_json));
}

function applyUpdate(the_json) {
  room_elem = document.getElementById("roomNumber");
  room_elem.innerHTML = room_num;
  counter = the_json["counter"];

  for (i = 0; i <= 19; i++) {
    new_red = the_json["red"][i];
    index = new_red.indexOf(":");
    part1 = new_red.substring(0, index);
    part2 = new_red.substring(index + 1);

    red_elem = document.getElementById("text" + i);
    // Check if "ohay" is in new_red
    if (part1 === username) {
      red_elem.className = "sent_text"
        
    }else{
      red_elem.className = "red"
    }
    
    if(room_num > 1){
      red_elem.innerHTML = part2;
    }else{
      red_elem.innerHTML = new_red;
    }
   
}


  currenttext = counter;


  names_elem = document.getElementById("playerNames");
  names_elem.innerHTML = the_json["names"];
}

function sendMessage() {
  var message = document.getElementById("message_input").value;
  if (!message.trim()) return; // Avoid sending empty messages
  document.getElementById("message_input").value = "";
  // currenttext += 1;
  if(room_num == 1){
    message = play_name + ": " + message;
  }
  

  if (currenttext > 19) {
    // Shift content of each element to the previous one, up to 'text19'
    for (var i = 0; i < 19; i++) {
      var currentElement = document.getElementById("text" + i);
      var nextElement = document.getElementById("text" + (i + 1));
      currentElement.className = nextElement.className
      currentElement.innerHTML = nextElement.innerHTML;
    }
    // Update the last element 'text19' with the new message
    var lastElement = document.getElementById("text19");
    // Change the class of the last element
    lastElement.className = "sent_text";
    lastElement.innerHTML = message;
  } else {
    // Update the current 'red' element based on the counter
    var red_elem = document.getElementById("text" + currenttext);
    red_elem.className = "sent_text"; 
    red_elem.innerHTML = message;
  }

  // Update the URL and send the message to the server
  if(room_num > 1){
    message = play_name + ": " + message;
  }
  
  scrollToBottom();
  var URL = "/sendmessage/" + room_num + "/" + message + "/" + currenttext;
  fetch(URL);

  // Increment the counter and wrap around if necessary
}

document.addEventListener("DOMContentLoaded", () => {
  // Add event listener for the Enter key
  document
    .getElementById("message_input")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    });
});


function leaveRoom() {
  // Alert the server that a player has left the room
  URL = "/leaveroom/" + room_num + "/" + play_name;
  fetch(URL).then((response) => changeRoom());
}

function changeRoom() {
  URL = "/";
  location.href = URL;
}

function redirectRoom(the_json) {
  room_number = the_json["num"];

  URL = "/gameRoom/" + room_number + "/" + play_name;

  URL = "http://" + location.host + URL;

  location.href = URL;
}

// The following functions change the numbers when the buttons are clicked
// Each function also notifies the server of the change
