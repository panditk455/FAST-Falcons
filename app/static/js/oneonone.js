var socket;

var room_num;
var username;
var currenttext = 0;
var allowedUsers = new Set(); 

function initializeNumbers() {
    // Set the Room Number based on the URL
    var pathArray = location.pathname.split("/");
    username = pathArray[2];

    allowedUsers.appendChild(username)

  
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

// When the button is clicked,
// this function asks the server for the number of a room that isn't full
// This function then calls redirectRoom to join the given room number
function join_oneonone_chat(){
    // player_name = document.getElementById("playerName").value;
     
     URL = "/requestRoomNum/" + username;
     fetch(URL).then( response => response.json()).then( the_json => redirectRoom(the_json) );
 }
 
 function redirectRoom(the_json){
     chat_list = the_json;
 
     URL = "/gameRoom/" + room_number + "/" + username;
 
     URL = "http://" + location.host + URL;
 
     location.href = URL;
 }
 
 