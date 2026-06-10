<?php
/* Gibt die zuletzt gespeicherte Messung für Snoozy zurück und dient als schneller Statusabruf.
    So kann die Oberfläche den aktuellen Messwert ohne zusätzliche Verarbeitung anzeigen. */
// api/latest_measure.php
// Returns the most recent decibel measurement from the `messungen` table.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../system/config.php'; // defines $pdo

try {
    // Try to fetch the latest row from messungen
    $stmt = $pdo->query("SELECT * FROM messungen ORDER BY id DESC LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['success' => true, 'db' => null]);
        exit;
    }

    // Look for a numeric value in common column names first
    $candidates = ['dezibel','dezibelwert','db','value','wert','pegel','laut','lautstaerke','lautstärke','sound'];
    $found = null;
    foreach ($candidates as $col) {
        if (isset($row[$col]) && is_numeric($row[$col])) {
            $found = (int) $row[$col];
            break;
        }
    }

    // If none of the common names matched, scan all columns for a numeric value
    if ($found === null) {
        foreach ($row as $k => $v) {
            if (is_numeric($v)) {
                $n = (int) $v;
                // Heuristic: accept numbers in 1..120
                if ($n >= 1 && $n <= 120) {
                    $found = $n;
                    break;
                }
            }
        }
    }

    // Return result (do not modify the actual db value; client will clamp/display)
    if ($found !== null) {
        echo json_encode(['success' => true, 'db' => $found]);
    } else {
        echo json_encode(['success' => true, 'db' => null]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
