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

// Welcome popup — slides up after 3.5 s, dismissed for the session
(function () {
  const popup = document.getElementById('welcome-popup');
  if (!popup) return;
  if (sessionStorage.getItem('popup-dismissed')) return;

  const showPopup = () => popup.classList.add('is-visible');
  const hidePopup = () => {
    popup.classList.remove('is-visible');
    sessionStorage.setItem('popup-dismissed', '1');
  };

  setTimeout(showPopup, 3500);

  document.getElementById('popup-close')?.addEventListener('click', hidePopup);
  document.getElementById('popup-cta')?.addEventListener('click', hidePopup);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && popup.classList.contains('is-visible')) hidePopup();
  });
}());
