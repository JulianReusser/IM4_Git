// nav.js
// Highlight the correct bottom navigation link based on the current page
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
