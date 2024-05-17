// ../static/js/drag.js

document.addEventListener("DOMContentLoaded", function () {
  // Get all draggable elements
  var draggables = document.querySelectorAll(".draggable");

  // Load saved positions from localStorage
  draggables.forEach(function (draggable) {
    var savedPosition = localStorage.getItem(draggable.id);
    if (savedPosition) {
      var position = JSON.parse(savedPosition);
      draggable.style.left = position.left;
      draggable.style.top = position.top;
      draggable.style.position = "absolute";
      draggable.style.zIndex = 1000;
    }

    // Set event listeners for drag events
    draggable.addEventListener("dragstart", dragStart);
    draggable.addEventListener("dragend", dragEnd);
  });

  function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
    e.target.style.opacity = "0.4"; // visual feedback

    // Make the element position absolute if it isn't already
    e.target.style.position = "absolute";
    e.target.style.zIndex = 1000;
  }

  function dragEnd(e) {
    e.target.style.opacity = "1"; // reset the visual feedback

    // Update position of the dragged element
    var x = e.clientX - e.target.offsetWidth / 2;
    var y = e.clientY - e.target.offsetHeight / 2;
    e.target.style.left = x + "px";
    e.target.style.top = y + "px";

    // Save the new position to localStorage
    var position = {
      left: e.target.style.left,
      top: e.target.style.top,
    };
    localStorage.setItem(e.target.id, JSON.stringify(position));
  }

  // Enable dropping everywhere on the page
  document.addEventListener("dragover", function (e) {
    e.preventDefault(); // Necessary. Allows us to drop.
  });

  document.addEventListener("drop", function (e) {
    e.preventDefault();
    var id = e.dataTransfer.getData("text");
    var draggableElement = document.getElementById(id);
    var x = e.clientX - draggableElement.offsetWidth / 2;
    var y = e.clientY - draggableElement.offsetHeight / 2;
    draggableElement.style.left = x + "px";
    draggableElement.style.top = y + "px";

    // Save the new position to localStorage
    var position = {
      left: draggableElement.style.left,
      top: draggableElement.style.top,
    };
    localStorage.setItem(draggableElement.id, JSON.stringify(position));
  });
});
