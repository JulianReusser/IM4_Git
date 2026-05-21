<?php
// api/cookies.php
// Simple daily cookie counter: starts at 3 per day, decrement when loud event occurs.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../system/config.php'; // defines $pdo

try {
    // Ensure cookies table exists (id, date, count)
    $pdo->exec("CREATE TABLE IF NOT EXISTS cookies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `day` DATE NOT NULL,
        `count` INT NOT NULL,
        UNIQUE KEY day_unique (`day`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $method = $_SERVER['REQUEST_METHOD'];
    $today = date('Y-m-d');

    if ($method === 'GET') {
        // return today's count, initialize if missing
        $stmt = $pdo->prepare("SELECT count FROM cookies WHERE `day` = :day LIMIT 1");
        $stmt->execute([':day' => $today]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $init = $pdo->prepare("INSERT INTO cookies (`day`,`count`) VALUES (:day, 3)");
            $init->execute([':day' => $today]);
            echo json_encode(['success' => true, 'count' => 3]);
            exit;
        }
        echo json_encode(['success' => true, 'count' => (int)$row['count']]);
        exit;
    }

    if ($method === 'POST') {
        // decrement cookie by 1 if >0
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT count FROM cookies WHERE `day` = :day FOR UPDATE");
        $stmt->execute([':day' => $today]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            // initialize and do not decrement below 0
            $init = $pdo->prepare("INSERT INTO cookies (`day`,`count`) VALUES (:day, 2)");
            $init->execute([':day' => $today]);
            $pdo->commit();
            echo json_encode(['success' => true, 'count' => 2]);
            exit;
        }
        $count = (int)$row['count'];
        if ($count <= 0) {
            $pdo->commit();
            echo json_encode(['success' => true, 'count' => 0]);
            exit;
        }
        $new = $count - 1;
        $upd = $pdo->prepare("UPDATE cookies SET count = :new WHERE `day` = :day");
        $upd->execute([':new' => $new, ':day' => $today]);
        $pdo->commit();
        echo json_encode(['success' => true, 'count' => $new]);
        exit;
    }

    // method not allowed
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
