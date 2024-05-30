function joinLibrary() {
  const URL = `/requestLibrary/${username}`;
  fetch(URL)
    .then((response) => response.json())
    .then((the_json) => redirectRoom(the_json));
}

function redirectRoom(the_json) {
  const room_number = the_json["num"];
  const URL = `/libraryRoom/${room_number}/${username}`;
  location.href = URL;
}

document.addEventListener("DOMContentLoaded", function () {
  joinLibrary();
});
