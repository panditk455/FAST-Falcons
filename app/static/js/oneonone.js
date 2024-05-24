// When the button is clicked,
// this function asks the server for the number of a room that isn't full
// This function then calls redirectRoom to join the given room number

 function join_oneonone_chat() {
    const joinBtn = document.getElementById("joinRoomBtn");
    joinBtn.disabled = true;

    URL = "/oneononechat/" + username;
    fetch(URL).then( response => response.json()).then( the_json => redirectRoom(the_json) );
 }
 function redirectRoom(the_json){
     chat_list = the_json;
     room_number = chat_list['chatroom']
 
     if (chat_list['count'] == 1) {
      document.getElementById("waitingMessage").style.display = "block";

      function chatwaiting() {
        URL = "/getchat"; 
        fetch(URL)
            .then(response => response.json())
            .then(updated_json => {
                chat_list = updated_json; })
        if (chat_list['count'] == 2) {
            URL = "/gameRoom/" + room_number + "/" + username;
            URL = "http://" + location.host + URL;
            location.href = URL;
            clearInterval(intervalId); // Stop the interval from calling this function
        }
    }

    intervalId = setInterval(chatwaiting, 1000);
  
    } else {
      
      URL = "/gameRoom/" + room_number + "/" + username;
 
      URL = "http://" + location.host + URL;
  
      location.href = URL;
    }
 
    
 }
 
 