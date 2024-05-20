
document.addEventListener("DOMContentLoaded", function () {

  let audioElement = document.getElementById("mysound");
  let playPauseIcon = document.getElementById("icon");
  let songSelector = document.getElementById("songSelector");

  updateIcon(); 



  playPauseIcon.onclick = function () {
      if (audioElement.paused) {
          audioElement.play();
      } else {
          audioElement.pause();
      }
      updateIcon();
  };


  function updateIcon() {
      if (audioElement.paused) {
          playPauseIcon.src = "../static/asset/Play.png";
      } else {
          playPauseIcon.src = "../static/asset/Pause.png";
      }
    }

  songSelector.addEventListener("change", function () {

      let selectedSong = songSelector.value;
      audioElement.src = "../static/" + selectedSong;
      
      audioElement.pause();
      audioElement.load();
      updateIcon();
  });


});


// #each floor clickable
document.addEventListener("DOMContentLoaded", function () {
    let sections = document.querySelectorAll(".section");
  
    sections.forEach(section => {
      section.addEventListener("click", function () {
        sections.forEach(s => s.classList.remove("clicked"));
        section.classList.add("clicked");
        // how to handle specific actions for each section?? songs lists and stuff
      });
    });
  });
  