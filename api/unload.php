<?php
/* Liefert die gespeicherten Messdaten für den geschützten Bereich und prüft dafür die Session.
    Die Datei dient als Datenquelle für den Abruf der Messhistorie. */
// api/unload.php - protected endpoint to fetch measurement data
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Require the main DB config (defines $pdo)
require_once __DIR__ . '/../system/config.php';

// Check session authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT id, name, email, geraet_id FROM messungen ORDER BY id DESC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $data]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

