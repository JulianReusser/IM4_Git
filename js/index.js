// index.js
// Checks authentication state and toggles UI between login form and protected content

async function checkAuthOnIndex() {
  try {
    const res = await fetch('api/protected.php', {
      credentials: 'include'
    });

    if (res.status === 401) {
      // not logged in -> keep login form visible
      document.getElementById('protectedContent').style.display = 'none';
      document.getElementById('loginForm').style.display = '';
      return;
    }

    const data = await res.json();
    // show protected content
    document.getElementById('userEmail').textContent = data.email || '';
    document.getElementById('userId').textContent = data.user_id || '';
    document.getElementById('protectedContent').style.display = '';
    document.getElementById('loginForm').style.display = 'none';
  } catch (err) {
    console.error('Auth check failed on index:', err);
  }
}

window.addEventListener('load', checkAuthOnIndex);
