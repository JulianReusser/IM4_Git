<?php

session_start();
header("content-type: application/json");

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
 
//entpacke die Daten

    $data = json_decode(file_get_contents("php://input"), true);

    $email = $data['email'];
    $password = $data['password'];

    //ob user schon registriert ist
    $stmt = $pdo->prepare("SELECT email FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode([
            "status" => "error",
            "message" => "Email is already registered"
        ]);
        exit;
    }

     $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $insert = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :pass)");
    $insert->execute([
        ':email' => $email,
        ':pass' => $hashedPassword
    ]);



    //an json zurückschicken
    echo json_encode([
        "status" => "success",
        "email" => $email,
    ]);

}
?>