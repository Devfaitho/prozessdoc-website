// Mobile Navigation
document.addEventListener('click', function (e) {
  var t = e.target.closest('.nav-toggle');
  if (!t) return;
  var h = t.closest('.site-header');
  var open = h.classList.toggle('open');
  t.setAttribute('aria-expanded', open ? 'true' : 'false');
});

// Calendly erst nach Klick laden (keine Datenübertragung beim Seitenaufruf)
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-cal-load]');
  if (!b) return;
  var box = b.closest('.cal-box');
  var f = document.createElement('iframe');
  f.src = b.getAttribute('data-cal-load') + '?hide_gdpr_banner=1&primary_color=0b3a3f';
  f.title = 'Terminbuchung über Calendly';
  f.loading = 'lazy';
  box.innerHTML = '';
  box.classList.add('loaded');
  box.appendChild(f);
});
