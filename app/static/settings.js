document.getElementById('settings').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevents closing when clicking within the dropdown
});

document.addEventListener('click', function() {
    // Closes dropdown when clicking outside of it
    let dropdownContent = document.querySelector('.dropdown-content');
    if (dropdownContent.style.display === 'block') {
        dropdownContent.style.display = 'none';
    }
});
