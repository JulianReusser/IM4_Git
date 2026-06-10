<?php
/* Speichert einen neuen Messwert aus dem Sender- oder Sensorfluss in der Datenbank.
    Die Datei bildet den Eingangspunkt für frisch gesendete Messdaten. */
require_once("../system/config.php");

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if (!isset($input["wert"])) {
    http_response_code(400);
    echo "Fehler: Kein Wert empfangen.";
    exit;
}

$dezibel = $input["wert"];

$sql = "INSERT INTO messungen (gemessen_am, dezibel) VALUES (NOW(), ?)";
$stmt = $pdo->prepare($sql);
$stmt->execute([$dezibel]);

echo "Messung gespeichert: " . $dezibel . " dB";
?>