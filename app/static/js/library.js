function joinLibrary() {
  URL = "/requestLibrary/" + username;
  fetch(URL)
    .then((response) => response.json())
    .then((the_json) => redirectRoom(the_json));
}

function redirectRoom(the_json) {
  room_number = the_json["num"];

  URL = "/libraryRoom/" + room_number + "/" + username;

  URL = "http://" + location.host + URL;

  location.href = URL;
}
