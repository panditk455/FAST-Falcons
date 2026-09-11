'use strict';
// Pointer events support mice and touch. Positions stay inside the café scene.
document.querySelectorAll('.draggable').forEach(item => {
  let start = null;
  item.draggable = false;
  const move = (x, y) => {
    const scene = item.parentElement;
    item.style.left = `${Math.max(0, Math.min(scene.clientWidth - item.offsetWidth, x))}px`;
    item.style.top = `${Math.max(0, Math.min(scene.clientHeight - item.offsetHeight, y))}px`;
    item.style.right = 'auto'; item.style.bottom = 'auto';
  };
  item.onpointerdown = event => { start = { x: event.clientX - item.offsetLeft, y: event.clientY - item.offsetTop }; item.setPointerCapture(event.pointerId); };
  item.onpointermove = event => { if (start) move(event.clientX - start.x, event.clientY - start.y); };
  item.onpointerup = item.onpointercancel = () => { start = null; };
  item.onkeydown = event => {
    const steps = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
    if (steps[event.key]) { event.preventDefault(); move(item.offsetLeft + steps[event.key][0], item.offsetTop + steps[event.key][1]); }
  };
  window.addEventListener('resize', () => { if (item.style.left) move(item.offsetLeft, item.offsetTop); });
});
