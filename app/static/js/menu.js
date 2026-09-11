'use strict';
const chosenSnack = document.getElementById('chosen-snack');
document.querySelectorAll('.snack').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.snack').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    chosenSnack.src = `/static/asset/Sayles_${button.dataset.snack}.png`;
    chosenSnack.alt = button.textContent.trim(); chosenSnack.hidden = false;
    document.getElementById('snack-status').textContent = `${button.textContent.trim()} it is. Make yourself at home.`;
  };
});
