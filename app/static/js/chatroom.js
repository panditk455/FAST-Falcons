// This function is called from within fetchUpdate()
// This function changes the webpage based on the new numbers from the server
// Global Variable to store the websocket object
var socket;

// Global Variable to store the room number and player name
var room_num;
var currenttext = 0; // Start with 'red1'
var play_name;


// This function is called when the page loads
function initializeNumbers(){
    // Set the Room Number based on the URL
    var pathArray = location.pathname.split('/');
    play_name = pathArray[3];
    room_num = pathArray[2];
    
    //Open the Websocket when the page loads
    sock_url = "ws://" + location.host + "/openSocket";
    sock_url = sock_url + "/" + room_num + "/" + play_name
    
    console.log(sock_url)
    
    socket = new WebSocket(sock_url);
 
    // Fetch the initial numbers from the server
    fetchUpdate();

    // Fetch a new update whenever the socket receives a message
    socket.onmessage = function(event){
	fetchUpdate();
    }

}



// This function is called periodically to fetch updates from the server

function fetchUpdate() {
    URL = "/getupdate/" + room_num;
    fetch(URL).then( response => response.json()).then( the_json => applyUpdate(the_json) );
}

// function applyUpdate(the_json) {
//     new_red = the_json['red'];
  
//     red_elem = document.getElementById("redText");
    
//     red_elem.innerHTML = new_red;
// } // Start with 'red1'
function applyUpdate(the_json) {
    room_elem = document.getElementById("roomNumber");
    room_elem.innerHTML = room_num;
    counter = the_json['counter'];

   // new_red = the_json['red'][currenttext-1];
    //var updatetext = currenttext

    // Assuming the_json and currenttext are defined elsewhere in your code

  
    for (i = 0; i <= 4; i++) {
        new_red = the_json['red'][i];
        red_elem = document.getElementById("text" + i);
        red_elem.innerHTML = new_red;
        }
    
    // else{
    //     the_json['red'].shift();
    //     red_elem = document.getElementById("text" + 4);
    //     the_json['red'].push(red_elem);
    //     for (i = 0; i <= 4; i++) {
    //         new_red = the_json['red'][i];
    //         red_elem = document.getElementById("text" + i);
    //         red_elem.innerHTML = new_red;
    //         }
            

    // }
    // for (let i = 0; i <= counter; i++) {
    //     for (let j = 0; j <= i; j++) {
    //          new_red = the_json['red'][i - 1];
    //          red_elem = document.getElementById("text" + i-1);
    //          red_elem.innerHTML = new_red;
    
    
    //     }
    // }

    currenttext = counter;


    // if (currenttext == 0) {
    //     updatetext = 1;
    //     new_red = the_json['red'][currenttext];
    // }
    
    

    names_elem = document.getElementById("playerNames");
    names_elem.innerHTML = the_json['names'];
}

// // This function is called when the page loads
// function initializeNumbers(){
//     // Open the Websocket when the page loads
//     socket = new WebSocket("/openSocket");
    
//     // Fetch the initial numbers from the server
//     fetchUpdate();

//     // Fetch a new update whenever the socket receives a message
//     socket.onmessage = function(event){
// 	fetchUpdate();
//     }
// }

// This function runs when the user requests to change rooms


function sendMessage() {
    var message = document.getElementById('message_input').value;
    document.getElementById('message_input').value = '';
    currenttext += 1
    if (currenttext > 4){
        var blue_elem = document.getElementById("text" + 0);
        var red_elem = document.getElementById("text" + 1);
        blue_elem = red_elem
        var blue_elem = document.getElementById("text" + 1);
        var red_elem = document.getElementById("text" + 2);
        blue_elem = red_elem
        var blue_elem = document.getElementById("text" + 2);
        var red_elem = document.getElementById("text" + 3);
        blue_elem = red_elem
        var blue_elem = document.getElementById("text" + 3);
        var red_elem = document.getElementById("text" + 4);
        blue_elem = red_elem
        var red_elem = document.getElementById("text" + 4);
        red_elem.innerHTML = message;
    }else{
        // Get the current 'red' element based on the counter
    var red_elem = document.getElementById("text" + currenttext);
    red_elem.innerHTML = message;


    }
    

    
    // Update the URL and send the message to the server
   
        
        
    var URL = "/sendmessage/" + room_num + "/" + message + "/" + currenttext ;
    fetch(URL);

    // Increment the counter and wrap around if necessary
  
}


function leaveRoom(){
    
    // Alert the server that a player has left the room
    URL = "/leaveroom/" + room_num + "/" + play_name;
    fetch(URL).then( response => changeRoom() );
}

function changeRoom(){
    URL = "/sayles" 
    location.href = URL;
}


function redirectRoom(the_json){
    room_number = the_json['num'];

    URL = "/gameRoom/" + room_number + "/" + play_name;

    URL = "http://" + location.host + URL;

    location.href = URL;
}




// The following functions change the numbers when the buttons are clicked
// Each function also notifies the server of the change









    
