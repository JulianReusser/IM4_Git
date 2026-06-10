// Baut die Navigation für die Snoozy-Seiten auf und markiert den passenden Menüpunkt.
// nav.js
// Hebt den passenden Navigationspunkt je nach aktueller Seite hervor.
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;
  const links = Array.from(nav.querySelectorAll('a'));
  const current = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach((a) => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (!href) return a.classList.remove('active');
    if (href === current) a.classList.add('active');
    else a.classList.remove('active');
  });
});
