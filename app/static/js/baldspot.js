
// baldspot.js
// Daniel Lumbu, Kritika Pandit Daniel Estrada, Alex Wcislo, Palmy Klangsathorn
// Updated: May 31, 2024 
// This  requests an available chat room from the server and redirects the user to join that room.

// When the button is clicked,
// this function asks the server for the number of a room that isn't full
// This function then calls redirectRoom to join the given room number

function joinRoom(){
   // player_name = document.getElementById("playerName").value;
    
    URL = "/requestRoomNum/" + username;
    fetch(URL).then( response => response.json()).then( the_json => redirectRoom(the_json) );
}

function redirectRoom(the_json){
    room_number = the_json['num'];

    URL = "/gameRoom/" + room_number + "/" + username;

    URL = "http://" + location.host + URL;

    location.href = URL;
}

