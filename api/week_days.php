<?php
/* Liefert die Wochentagsstatistik für Snoozy und berechnet die Werte von Montag bis Freitag.
    So kann die Wochenansicht die Messungen pro Tag darstellen. */
// api/week_days.php
// Returns average dB per weekday (Monday=0 .. Sunday=6) for the current week, focusing on Monday..Friday.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../system/config.php'; // defines $pdo

try {
    // sample row for detection
    $stmt = $pdo->query("SELECT * FROM messungen LIMIT 1");
    $sample = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$sample) {
        echo json_encode(['success' => true, 'days' => [null,null,null,null,null]]);
        exit;
    }

    $candidates = ['dezibel','dezibelwert','db','value','wert','pegel','laut','lautstaerke','lautstärke','sound'];
    $dbCol = null;
    foreach ($candidates as $col) {
        if (array_key_exists($col, $sample)) { $dbCol = $col; break; }
    }
    if ($dbCol === null) {
        foreach ($sample as $k => $v) {
            if (is_numeric($v)) { $dbCol = $k; break; }
        }
    }
    if ($dbCol === null) {
        echo json_encode(['success' => false, 'error' => 'No numeric dB column found']);
        exit;
    }

    // detect time column by common names first, then by sample value heuristics
    $timeCols = ['date','timestamp','created_at','time','messung_time','ts','zeit','zeitpunkt','created'];
    $timeCol = null;
    foreach ($timeCols as $tc) { if (array_key_exists($tc, $sample)) { $timeCol = $tc; break; } }

    if (!$timeCol) {
        foreach ($sample as $k => $v) {
            if ($v === null) continue;
            $s = trim((string)$v);
            if ($s === '') continue;
            if (preg_match('/^\d{4}-\d{2}-\d{2}/', $s) || preg_match('/^\d{4}-\d{2}-\d{2}T/', $s) || strtotime($s) !== false) {
                $timeCol = $k;
                break;
            }
        }
    }

    $weekStartStmt = $pdo->query("SELECT DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AS week_start");
    $weekStart = $weekStartStmt->fetchColumn();

    $resultDays = [null, null, null, null, null]; // Monday..Friday

    if ($timeCol) {
        $sql = "SELECT WEEKDAY($timeCol) AS wd, AVG($dbCol) AS avg_db, MIN($dbCol) AS min_db, MAX($dbCol) AS max_db
                FROM messungen
                WHERE DATE($timeCol) >= :weekStart
                GROUP BY wd";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':weekStart' => $weekStart]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            $wd = (int)$r['wd']; // 0 = Monday
            if ($wd >=0 && $wd <=4) {
                $resultDays[$wd] = [
                    'avg' => isset($r['avg_db']) ? round($r['avg_db'],0) : null,
                    'min' => isset($r['min_db']) ? round($r['min_db'],0) : null,
                    'max' => isset($r['max_db']) ? round($r['max_db'],0) : null,
                ];
            }
        }
        echo json_encode(['success' => true, 'days' => $resultDays]);
        exit;
    }

    // fallback: no time column — return nulls (can't compute per-weekday)
    echo json_encode(['success' => true, 'days' => $resultDays]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
