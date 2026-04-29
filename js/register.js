console.log("register.js wurde geladen");

document.getElementById("registerForm")
.addEventListener("submit", async (e) => {

e.preventDefault();
console.log("Formular wurde abgeschickt");


const email = document.getElementById("email").
value.trim();

const password = document.getElementById("password").
value.trim();

console.log(email + " " + password);


try {
    const response = await fetch("api/register.php", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password }),
    });


    const result = await response.json();
    console.log("Result ist:", result);
} catch (error) {
    console.error("Error:", error);
    alert("Error: " + error);
}   

});

