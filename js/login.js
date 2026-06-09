function showMessage(text, type = "info") {
  const el = document.getElementById("loginMessage");
  if (!el) return;
  el.textContent = text;
  el.className = `message ${type}`;
}

const loginForm = document.getElementById("loginForm");

if (loginForm) loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("api/login.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.status === "success") {
      showMessage("Login erfolgreich! Du wirst weitergeleitet...", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } else {
      showMessage(result.message || "Login fehlgeschlagen.", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage("Etwas ist schiefgelaufen!", "error");
  }
});
