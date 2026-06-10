<?php
/* Liefert Stundenstatistiken für Snoozy und ermittelt die lauteste Stunde des Tages.
    Die Auswertung wird aus den gespeicherten Messwerten aufgebaut und als JSON ausgegeben. */
// api/hour_stats.php
// Computes average dB per hour for today and returns the loudest hour and its average.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../system/config.php';

try {
    $stmt = $pdo->query("SELECT * FROM messungen LIMIT 1");
    $sample = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$sample) {
        echo json_encode(['success' => true, 'hour' => null, 'avg' => null]);
        exit;
    }

    $candidates = ['dezibel','dezibelwert','db','value','wert','pegel','laut','lautstaerke','lautstärke','sound'];
    $dbCol = null;
    foreach ($candidates as $col) {
        if (array_key_exists($col, $sample)) { $dbCol = $col; break; }
    }
    if ($dbCol === null) {
        foreach ($sample as $k => $v) { if (is_numeric($v)) { $dbCol = $k; break; } }
    }
    if ($dbCol === null) {
        echo json_encode(['success' => false, 'error' => 'No numeric dB column found']);
        exit;
    }

    // detect time column by common names first, then by sample value heuristics
    $timeCols = ['timestamp','date','created_at','time','messung_time','ts','zeit','zeitpunkt','created'];
    $timeCol = null;
    foreach ($timeCols as $tc) { if (array_key_exists($tc, $sample)) { $timeCol = $tc; break; } }

    if (!$timeCol) {
        // try to detect a column that contains parseable datetime values
        foreach ($sample as $k => $v) {
            if ($v === null) continue;
            // if value looks like a date/time string (YYYY- or ISO) or strtotime can parse it
            $s = trim((string)$v);
            if ($s === '') continue;
            // quick pattern check for YYYY-MM-DD or YYYY-MM-DDTHH:MM
            if (preg_match('/^\d{4}-\d{2}-\d{2}/', $s) || preg_match('/^\d{4}-\d{2}-\d{2}T/', $s) || strtotime($s) !== false) {
                $timeCol = $k;
                break;
            }
        }
    }

    if (!$timeCol) {
        // can't compute per-hour without time column
        echo json_encode(['success' => true, 'loud' => ['hour' => null, 'avg' => null], 'quiet' => ['hour' => null, 'avg' => null]]);
        exit;
    }

    // Compute averages per hour for today
    // Fetch per-hour averages for today so we can return a 24-entry series
    $sqlSeries = "SELECT HOUR($timeCol) AS hr, AVG($dbCol) AS avg_db
        FROM messungen
        WHERE DATE($timeCol) = CURDATE()
        GROUP BY hr";
    $rows = $pdo->query($sqlSeries)->fetchAll(PDO::FETCH_ASSOC);

    // initialize series with nulls for 0..23
    $series = array_fill(0, 24, null);
    foreach ($rows as $r) {
        if (isset($r['hr'])) {
            $h = (int)$r['hr'];
            $series[$h] = isset($r['avg_db']) ? round($r['avg_db'], 0) : null;
        }
    }

    // loudest hour (highest avg)
    $sqlMax = "SELECT HOUR($timeCol) AS hr, AVG($dbCol) AS avg_db
        FROM messungen
        WHERE DATE($timeCol) = CURDATE()
        GROUP BY hr
        ORDER BY avg_db DESC
        LIMIT 1";
    $rowMax = $pdo->query($sqlMax)->fetch(PDO::FETCH_ASSOC);

    // quietest hour (lowest avg)
    $sqlMin = "SELECT HOUR($timeCol) AS hr, AVG($dbCol) AS avg_db
        FROM messungen
        WHERE DATE($timeCol) = CURDATE()
        GROUP BY hr
        ORDER BY avg_db ASC
        LIMIT 1";
    $rowMin = $pdo->query($sqlMin)->fetch(PDO::FETCH_ASSOC);

    $hourMax = $rowMax ? (int)$rowMax['hr'] : null;
    $avgMax = $rowMax && isset($rowMax['avg_db']) ? round($rowMax['avg_db'],0) : null;

    $hourMin = $rowMin ? (int)$rowMin['hr'] : null;
    $avgMin = $rowMin && isset($rowMin['avg_db']) ? round($rowMin['avg_db'],0) : null;

    echo json_encode(['success' => true, 'series' => $series, 'loud' => ['hour' => $hourMax, 'avg' => $avgMax], 'quiet' => ['hour' => $hourMin, 'avg' => $avgMin]]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
