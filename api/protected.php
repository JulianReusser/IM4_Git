<?php
/* Prüft, ob ein Nutzer eingeloggt ist, und gibt die geschützten Sitzungsdaten als JSON zurück.
    Damit kann das Frontend entscheiden, ob private Inhalte angezeigt werden dürfen. */
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "user_id" => $_SESSION['user_id'],
    "email" => $_SESSION['email'] ?? null
]);
?>
