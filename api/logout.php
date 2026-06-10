<?php
/* Beendet die aktuelle Snoozy-Session sauber und entfernt die gespeicherten Sitzungsdaten.
	Die Antwort bleibt im JSON-Format, damit das Frontend damit direkt arbeiten kann. */
session_start();
$_SESSION = [];
if (session_status() === PHP_SESSION_ACTIVE) {
	session_destroy();
}

header('Content-Type: application/json');
echo json_encode(["status" => "success"]);
exit;
?>