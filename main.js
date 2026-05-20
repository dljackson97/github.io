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

document.querySelector('.nav-close')?.addEventListener('click', closeMenu);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks?.classList.contains('is-open')) closeMenu();
});

// Scroll-reveal — fade cards and sections up as they enter the viewport
(function () {
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll([
    '.who-card', '.testimonial', '.card',
    '.why-point', '.value-card', '.faq-item',
    '.what-text', '.what-media', '.why-text',
    '.bio-photo', '.bio-text',
    '.section-header-centered', '.section-header',
    '.contact-info-block', '.cta-band-inner',
  ].join(','));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

  targets.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}());

// Auto-update copyright year
document.querySelectorAll('.footer-copy').forEach(el => {
  el.textContent = `© ${new Date().getFullYear()} Clementine Speech Therapy`;
});

// Contact form — Formspree AJAX submission with success state
(function () {
  const form = document.getElementById('consultation-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.hidden = true;
        const success = document.getElementById('form-success');
        if (success) success.hidden = false;
      } else {
        btn.disabled = false;
        btn.textContent = 'Send my request';
        alert('Something went wrong. Please try emailing us directly at aemelia@clementinespeech.com');
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send my request';
      alert('Something went wrong. Please try emailing us directly at aemelia@clementinespeech.com');
    }
  });
}());

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
