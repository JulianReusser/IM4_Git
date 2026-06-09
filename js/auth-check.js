(async function () {
  try {
    const res = await fetch('api/protected.php', { credentials: 'include' });
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      console.warn('Auth check returned non-ok status', res.status);
    }
  } catch (err) {
    console.error('Auth check failed', err);
    window.location.href = 'login.html';
  }
})();
