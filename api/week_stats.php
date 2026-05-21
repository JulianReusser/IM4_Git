<?php
// api/week_stats.php
// Returns the average dB for the current week (Mon-Sun or since Monday).
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../system/config.php'; // defines $pdo

try {
    // Detect dB column similarly to other endpoints
    $stmt = $pdo->query("SELECT * FROM messungen LIMIT 1");
    $sample = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$sample) {
        echo json_encode(['success' => true, 'avg_week' => null]);
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

    // Compute start of current week (Monday)
    $stmtWeek = $pdo->query("SELECT DATE_SUB(CURDATE(), INTERVAL (WEEKDAY(CURDATE())) DAY) AS week_start");
    $weekStart = $stmtWeek->fetchColumn();

    // avg for rows since week_start
    $sql = "SELECT AVG($dbCol) AS avg_week FROM messungen WHERE DATE(`date`) >= :weekStart OR DATE(`timestamp`) >= :weekStart";
    // We will attempt to run a robust query with placeholders; some columns may not exist, so try a safer approach below

    // Safer approach: try to use a plausible timestamp column if exists
    $timeCols = ['date','timestamp','created_at','time','messung_time'];
    $timeCol = null;
    foreach ($timeCols as $tc) {
        if (array_key_exists($tc, $sample)) { $timeCol = $tc; break; }
    }

    if ($timeCol) {
        $sql = "SELECT AVG($dbCol) AS avg_week FROM messungen WHERE DATE($timeCol) >= :weekStart";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':weekStart' => $weekStart]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $avg = isset($row['avg_week']) ? (float)$row['avg_week'] : null;
        echo json_encode(['success' => true, 'avg_week' => $avg === null ? null : round($avg,0)]);
        exit;
    }

    // No time column: compute avg over all rows as fallback
    $stmt = $pdo->query("SELECT AVG($dbCol) AS avg_week FROM messungen");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $avg = isset($row['avg_week']) ? (float)$row['avg_week'] : null;
    echo json_encode(['success' => true, 'avg_week' => $avg === null ? null : round($avg,0)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
