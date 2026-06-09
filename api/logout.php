<?php
session_start();
$_SESSION = [];
if (session_status() === PHP_SESSION_ACTIVE) {
	session_destroy();
}

header('Content-Type: application/json');
echo json_encode(["status" => "success"]);
exit;
?>