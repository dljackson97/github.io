const hamburger = document.querySelector('.hamburger');
const navLinks  = document.querySelector('.nav-links');

function openMenu() {
  hamburger.classList.add('is-open');
  navLinks.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  hamburger.setAttribute('aria-label', 'Close menu');
}

function closeMenu() {
  hamburger.classList.remove('is-open');
  navLinks.classList.remove('is-open');
  document.body.style.overflow = '';
  hamburger.setAttribute('aria-label', 'Open menu');
}

hamburger?.addEventListener('click', () => {
  navLinks.classList.contains('is-open') ? closeMenu() : openMenu();
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks?.classList.contains('is-open')) closeMenu();
});
