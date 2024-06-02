// chatroom.js
// Daniel Lumbu, Kritika Pandit Daniel Estrada, Alex Wcislo,Palmy Klangsathorn
// Updated: May 31, 2024 
//This manages the chatroom functionality, including sending and receiving messages, and enabling message editing.


// Global Variable to store the websocket object
var socket;

// Global Variable to store the room number and player name
var room_num;
var currenttext = -1; 
var play_name;
var editedMessages = {};

// This function is called when the page loads
function initializeNumbers() {
  var pathArray = location.pathname.split("/");
  play_name = pathArray[3];
  room_num = pathArray[2];

  //Open the Websocket when the page loads
  sock_url = "ws://" + location.host + "/openSocket";
  sock_url = sock_url + "/" + room_num + "/" + play_name;

  console.log(sock_url);

  socket = new WebSocket(sock_url);

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
    
    if (part1 === username) {
      red_elem.className = "sent_text";
      red_elem.addEventListener("dblclick", enableEditing);   
    }else{
      red_elem.className = "red";
    }
    
    if (room_num > 1) {
      // Check if the message has been edited
      if (editedMessages.hasOwnProperty(i)) { 
        editedtext = editedMessages[i];
        editedindex = editedtext.indexOf(":");
        editedpart2 = editedtext.substring(index+1);

        red_elem.innerHTML = editedpart2;
        delete editedMessages[i];
      } else {
        red_elem.innerHTML = part2;
      }
    } else {
      // Check if the message has been edited
      if (editedMessages.hasOwnProperty(i)) { 
        red_elem.innerHTML = editedMessages[i]; 
        delete editedMessages[i];
      } else {
        red_elem.innerHTML = new_red;
      }
    }
}


  currenttext = counter;

  if(room_num == 1){
  names_elem = document.getElementById("playerNames");
  list_names = the_json["names"];
  names_elem.innerHTML = list_names.length;
  }else{
    names_elem = document.getElementById("playerNames");
    names_elem.innerHTML = the_json["names"];
    list_names = the_json["names"];
    if (list_names.length == 2) {
      wasLengthTwo = true;
  }
  
  // Check the flag variable in the if statement
  if (list_names.length == 1 && wasLengthTwo) {
    wasLengthTwo = false
    showPopup();
  }

  }

}

function sendMessage() {
  var message = document.getElementById("message_input").value;
  if (!message.trim()) return;
  document.getElementById("message_input").value = "";

  if(room_num == 1){
    message = play_name + ": " + message;
  }
  

  if (currenttext > 19) {
    for (var i = 0; i < 19; i++) {
      var currentElement = document.getElementById("text" + i);
      var nextElement = document.getElementById("text" + (i + 1));
      currentElement.className = nextElement.className;
      currentElement.innerHTML = nextElement.innerHTML;
    }
   
    var lastElement = document.getElementById("text19");
   
    lastElement.className = "sent_text";
    lastElement.innerHTML = message;
  } else {
    
    var red_elem = document.getElementById("text" + currenttext);
    red_elem.className = "sent_text"; 
    red_elem.innerHTML = message;
  }

  
  if(room_num > 1){
    message = play_name + ": " + message;
  }
  
  scrollToBottom();
  var URL = "/sendmessage/" + room_num + "/" + message + "/" + currenttext;
  fetch(URL);

}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("message_input")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    });
});


function leaveRoom() {
  URL = "/leaveroom/" + room_num + "/" + play_name;
  fetch(URL).then((response) => changeRoom());
}

function leaveOneonOne() {
  URL = "/sayles";
  location.href = URL;
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
// Function to enable text editing
function enableEditing(event) {
  var textElement = event.target;
  var textContent = textElement.innerHTML;
  if(room_num == 1){
  var colonSplit = textContent.indexOf(":");
  if (colonSplit !== -1) {
    var usernamePart = textContent.substring(0, colonSplit + 1);
    var messagePart = textContent.substring(colonSplit + 2); 
    textElement.setAttribute("data-username", usernamePart);
    textElement.innerHTML = messagePart;
  }
}
  textElement.setAttribute("data-original-text", textElement.innerHTML);
  textElement.contentEditable = true;
  textElement.focus();
  textElement.setAttribute("data-saved", "false"); 
  textElement.addEventListener("blur", disableEditing);
  textElement.addEventListener("keydown", saveOnEnter);
}

// Function to save edited message on Enter key press
function saveOnEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault(); 
    var textElement = event.target;
    var usernamePart = textElement.getAttribute("data-username");
    var messagePart = textElement.innerHTML;
    textElement.innerHTML = messagePart;
    textElement.contentEditable = false;
    textElement.removeEventListener("blur", disableEditing);
    textElement.removeEventListener("keydown", saveOnEnter);
    if (textElement.innerHTML !== textElement.getAttribute("data-original-text") && textElement.getAttribute("data-saved") === "false") {
      saveEditedMessage(textElement.id, messagePart);
      textElement.setAttribute("data-saved", "true"); 
    }
  }
}

// Function to disable editing on blur
function disableEditing(event) {
  var textElement = event.target;
  var usernamePart = textElement.getAttribute("data-username");
  var messagePart = textElement.innerHTML;
  if (room_num == 1) {
    textElement.innerHTML = usernamePart + " " + messagePart;
  } 
  textElement.contentEditable = false;
  textElement.removeEventListener("blur", disableEditing);
  textElement.removeEventListener("keydown", saveOnEnter);
  if (textElement.innerHTML !== textElement.getAttribute("data-original-text") && textElement.getAttribute("data-saved") === "false") {
    saveEditedMessage(textElement.id, messagePart);
    textElement.setAttribute("data-saved", "true"); 
  }
}

// Function to save edited message
function saveEditedMessage(elementId, newText) {
  var index = parseInt(elementId.replace("text", ""), 10);
  var message = play_name + ": " + newText;
  editedMessages[index] = message;
  var URL = "/editmessage/" + room_num + "/" + message + "/" + index;
  fetch(URL);
}

function showPopup() {
  document.getElementById("overlay").style.display = "block";
  document.getElementById("popup").style.display = "block";
}
