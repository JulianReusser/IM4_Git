// register.js
const form = document.getElementById("registerForm");
const messageEl = document.getElementById("registerMessage");

function showMessage(text, type = "info") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

if (form) form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();

  if (password !== confirm) {
    showMessage("Passwörter stimmen nicht überein.", "error");
    return;
  }

  showMessage("Registering...", "info");

  try {
    const response = await fetch("api/register.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.status === "success") {
      showMessage("Registration successful! You will be redirected to the login page.", "success");
      // Redirect after a short delay so user sees the message
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showMessage(result.message || "Registration failed.", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage("Something went wrong. Please try again.", "error");
  }
});
