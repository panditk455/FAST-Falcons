// Get the popup container and image element
const popupContainer = document.getElementById("popupContainer");
const popupImage = document.getElementById("popupImage");

// Function to show the popup with the specified image source
function showPopup(imageSrc) {
  popupImage.src = imageSrc;
  popupContainer.style.display = "block";
}

// Function to hide the popup
function hidePopup() {
  popupContainer.style.display = "none";
}

// Add click event listeners to each area in the image map
const areas = document.querySelectorAll('map[name="clickmenu"] area');
areas.forEach((area) => {
  area.addEventListener("click", () => {
    const altText = area.alt.toLowerCase();
    let imageName = "";

    // Set the image name based on the clicked area
    switch (altText) {
      case "cupcakes":
        imageName = "Sayles_cupcake.png";
        break;
      case "coffee":
        imageName = "Sayles_coffee.png";
        break;
      case "crossaint":
        imageName = "Sayles_crossaint.png";
        break;
      case "fries":
        imageName = "Sayles_fries.png";
        break;
      case "bread":
        imageName = "Sayles_bread.png";
        break;
      case "tea":
        imageName = "Sayles_tea.png";
        break;
      default:
        imageName = ""; // No specific image for other areas
    }

    if (imageName !== "") {
      const imagePath = `../static/asset/${imageName}`; // Adjust the path as needed
      showPopup(imagePath);
    } else {
      hidePopup(); // Hide the popup if no specific image is found
    }
  });
});

// Hide the popup by default
popupContainer.style.display = "none";
