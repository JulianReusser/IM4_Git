// js/auth-check.js
// Simple client-side check: call api/protected.php and redirect to login if not authenticated.
(async function () {
  try {
    const res = await fetch('api/protected.php', { credentials: 'include' });
    if (res.status === 401) {
      // Not logged in -> redirect to login
      window.location.href = 'login.html';
      return;
    }

    // If server returns other non-ok status, log for debugging but allow page to continue.
    if (!res.ok) {
      console.warn('Auth check returned non-ok status', res.status);
    }
  } catch (err) {
    console.error('Auth check failed', err);
    // Network or server error: redirect to login to be safe
    window.location.href = 'login.html';
  }
})();
