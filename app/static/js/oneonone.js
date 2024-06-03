
// oneonone.js
// Daniel Lumbu, Kritika Pandit Daniel Estrada, Alex Wcislo,Palmy Klangsathorn
// Updated: May 31, 2024 
// The  facilitates joining a one-on-one chat room, waiting for another user to join 
// if necessary, and then redirecting both users to the room.

// When the button is clicked,
// this function asks the server for the number of a room that isn't full
// This function then calls redirectRoom to join the given room number


function resetplayer() {
  URl = "/resetplayer";
  fetch(URl)
  }


 function join_oneonone_chat() {
    const joinBtn = document.getElementById("joinRoomBtn");
    joinBtn.disabled = true;

    URL = "/oneononechat/" + username;
    fetch(URL).then( response => response.json()).then( the_json => redirectRoom(the_json) );
 }
 function redirectRoom(the_json){
     chat_list = the_json;
 
     if (chat_list['count'] == 1) {
      document.getElementById("waitingMessage").style.display = "block";

      function chatwaiting() {
        URL = "/getchat"; 
        fetch(URL)
            .then(response => response.json())
            .then(updated_json => {
                chat_list = updated_json; })
        if (chat_list['count'] == 2) {
            URL = "/chatRoom/" + room_number + "/" + username;
            URL = "http://" + location.host + URL;
            location.href = URL;
            clearInterval(intervalId); // Stop the interval from calling this function
        }
    }

    intervalId = setInterval(chatwaiting, 1000);
  
    } else {
      
      URL = "/chatRoom/" + room_number + "/" + username;
 
      URL = "http://" + location.host + URL;
  
      location.href = URL;
    }
 
    
 }