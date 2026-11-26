const track = document.querySelector('.quotes');
const previous = document.querySelector('#anterior');
const next = document.querySelector('#proximo');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function syncButtons() {
  previous.disabled = track.scrollLeft < 2;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
}

function moveQuote(direction) {
  const [first, second] = track.children;
  const step = second.offsetLeft - first.offsetLeft;
  const current = Math.round(track.scrollLeft / step);
  track.scrollTo({ left: (current + direction) * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}

previous.addEventListener('click', () => moveQuote(-1));
next.addEventListener('click', () => moveQuote(1));
track.addEventListener('scroll', syncButtons, { passive: true });
new ResizeObserver(syncButtons).observe(track);
syncButtons();
