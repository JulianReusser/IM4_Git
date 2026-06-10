// Meldet den Nutzer ab, beendet die Sitzung und leitet wieder zur Login-Seite zurück.
// logout.js
const logoutBtn = document.getElementById("logoutBtn");

async function doLogout(e) {
  if (e) e.preventDefault();
  try {
    const response = await fetch("api/logout.php", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    if (result.status === "success") {
      // Redirect to login page after successful logout
      window.location.href = "login.html";
    } else {
      console.error("Logout failed");
      alert("Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("Something went wrong during logout!");
  }
}

if (logoutBtn) logoutBtn.addEventListener("click", doLogout);
