const form = document.getElementById("dataForm");

if (form) form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Neuladen der Seite verhindern

  // Daten aus dem Formular holen
  const formData = new FormData(event.target);
  const dataObject = {
    wert: formData.get("wert"),
  };

  // Daten als JSON string formattieren
  const jsonString = JSON.stringify(dataObject);

  // debug
  console.log("JSON Output:", jsonString);
  const messageEl = document.querySelector("#message");
  if (messageEl) messageEl.innerText = "Daten gesendet: " + jsonString;

  // HTTP POST Request an load.php schicken
  try {
    const response = await fetch("api/load.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
    });
  } catch (error) {
    console.error("Fehler beim Senden der Daten:", error);
    if (messageEl) messageEl.innerText =
      "Fehler beim Senden der Daten: " + error.message;
  }
});
