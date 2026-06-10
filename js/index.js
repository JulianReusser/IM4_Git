// Lädt die Daten für die Startseite und steuert die Anzeige zwischen Login-Bereich und geschütztem Inhalt.
// index.js
// Prüft den Anmeldestatus und schaltet die Oberfläche entsprechend um.

async function checkAuthOnIndex() {
  try {
    const res = await fetch('api/protected.php', {
      credentials: 'include'
    });

    if (res.status === 401) {
      // nicht eingeloggt -> Login-Formular sichtbar lassen
      document.getElementById('protectedContent').style.display = 'none';
      document.getElementById('loginForm').style.display = '';
      return;
    }

    const data = await res.json();
    // geschützten Inhalt anzeigen
    document.getElementById('userEmail').textContent = data.email || '';
    document.getElementById('userId').textContent = data.user_id || '';
    document.getElementById('protectedContent').style.display = '';
    document.getElementById('loginForm').style.display = 'none';
  } catch (err) {
    console.error('Auth check failed on index:', err);
  }
}

window.addEventListener('load', checkAuthOnIndex);
