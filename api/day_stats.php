<?php
// api/day_stats.php
// Returns average, min, max and latest dB values for today (from `messungen`).
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../system/config.php'; // defines $pdo

try {
    // Pull the latest row to detect the dB column if needed
    $stmt = $pdo->query("SELECT * FROM messungen LIMIT 1");
    $sample = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$sample) {
        echo json_encode(['success' => true, 'avg' => null, 'min' => null, 'max' => null, 'latest' => null]);
        exit;
    }

    $candidates = ['dezibel','dezibelwert','db','value','wert','pegel','laut','lautstaerke','lautstärke','sound'];
    $dbCol = null;
    foreach ($candidates as $col) {
        if (array_key_exists($col, $sample)) {
            $dbCol = $col;
            break;
        }
    }

    // fallback: pick first numeric-like column
    if ($dbCol === null) {
        foreach ($sample as $k => $v) {
            if (is_numeric($v)) {
                $dbCol = $k;
                break;
            }
        }
    }

    if ($dbCol === null) {
        echo json_encode(['success' => false, 'error' => 'No numeric dB column found']);
        exit;
    }

    // Try to detect a timestamp column to filter today's rows
    $timeCol = null;
    foreach (['ts','timestamp','created_at','time','date','messung_time'] as $tc) {
        if (array_key_exists($tc, $sample)) { $timeCol = $tc; break; }
    }

    // Build query to fetch today's stats
    if ($timeCol) {
        // Use DATE() to filter rows for today
        $sql = "SELECT AVG($dbCol) AS avg_db, MIN($dbCol) AS min_db, MAX($dbCol) AS max_db FROM messungen WHERE DATE($timeCol) = CURDATE()";
        $stmt = $pdo->query($sql);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // latest measurement today
        $stmt2 = $pdo->prepare("SELECT * FROM messungen WHERE DATE($timeCol) = CURDATE() ORDER BY id DESC LIMIT 1");
        $stmt2->execute();
        $latestRow = $stmt2->fetch(PDO::FETCH_ASSOC);
        // row with max value today (to get exact timestamp)
        $stmtMax = $pdo->prepare("SELECT $timeCol AS ts, $dbCol AS val FROM messungen WHERE DATE($timeCol) = CURDATE() ORDER BY $dbCol DESC LIMIT 1");
        $stmtMax->execute();
        $maxRow = $stmtMax->fetch(PDO::FETCH_ASSOC);
    } else {
        // No timestamp column: compute stats over all rows (best-effort)
        $sql = "SELECT AVG($dbCol) AS avg_db, MIN($dbCol) AS min_db, MAX($dbCol) AS max_db FROM messungen";
        $stmt = $pdo->query($sql);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt2 = $pdo->query("SELECT * FROM messungen ORDER BY id DESC LIMIT 1");
        $latestRow = $stmt2->fetch(PDO::FETCH_ASSOC);
    }

    $avg = isset($row['avg_db']) ? (float)$row['avg_db'] : null;
    $min = isset($row['min_db']) ? (float)$row['min_db'] : null;
    $max = isset($row['max_db']) ? (float)$row['max_db'] : null;

    $latest = null;
    if ($latestRow && isset($latestRow[$dbCol]) && is_numeric($latestRow[$dbCol])) {
        $latest = (float)$latestRow[$dbCol];
    }

    // Round and ensure range
    $response = [
        'success' => true,
        'avg' => $avg === null ? null : round($avg, 0),
        'min' => $min === null ? null : round($min, 0),
        'max' => $max === null ? null : round($max, 0),
        'latest' => $latest === null ? null : round($latest, 0),
        'max_value' => (isset($maxRow['val']) && is_numeric($maxRow['val'])) ? (int)round($maxRow['val']) : null,
        'max_time' => isset($maxRow['ts']) ? $maxRow['ts'] : null
    ];

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
