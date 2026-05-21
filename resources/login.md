# Authentication

Hier befindet sich Zusatzmaterial zu den Slides mit dem Thema "Authentication".

## Code zur Authentifizierung

### Folie 1) Login Request

login.js

```js
fetch("api/login.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ email, password }),
});
```

### Folie 2) Setzen der Session-Cookies

login.php

```php
if ($user && password_verify($password, $user['password'])) {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['email'] = $email;
}
```

### Folie 3) Zugriff auf geschützte Inhalte (Serverseitige Prüfung)

Die Prüfung erfolgt über die API `api/protected.php`.

Server-seitig (kurz):

```php
// api/protected.php
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "user_id" => $_SESSION['user_id'],
    "email" => $_SESSION['email']
]);
```

Frontend-seitig ruft JavaScript diese API mit `credentials: 'include'` auf. Bei `401` leitet der Client zum Login, bei Erfolg zeigt er die Daten an.

### Folie 4) Logout

```php
// logout.php
session_start();
$_SESSION = [];
session_destroy();

exit;
```

### Folie 5) Logout Button

```php
session_start();
$_SESSION = [];
session_destroy();

// Return a success response instead of redirecting
header('Content-Type: application/json');
echo json_encode(["status" => "success"]);
exit;
```
