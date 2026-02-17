<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_response(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(405, ['message' => 'Method not allowed']);
    }

    $body = file_get_contents('php://input');
    $payload = json_decode($body, true);
    if (!is_array($payload)) {
        json_response(400, ['message' => 'Invalid JSON payload']);
    }

    $username = trim((string)($payload['username'] ?? ''));
    $password = (string)($payload['password'] ?? '');
    if ($username === '' || $password === '') {
        json_response(400, ['message' => 'Username and password are required']);
    }

    $pdo = get_pdo();
    ensure_schema($pdo);
    ensure_default_admin($pdo);

    $stmt = $pdo->prepare('SELECT id, username, password, name, role, active, last_login, data FROM users WHERE username = :username LIMIT 1');
    $stmt->execute([':username' => $username]);
    $row = $stmt->fetch();

    if (!$row) {
        json_response(401, ['message' => 'Invalid credentials']);
    }

    if ((int)$row['active'] !== 1) {
        json_response(403, ['message' => 'Account is deactivated']);
    }

    $stored = (string)$row['password'];
    $info = password_get_info($stored);
    $passwordOk = false;
    if (!empty($info['algo'])) {
        $passwordOk = password_verify($password, $stored);
    } else {
        $passwordOk = hash_equals($stored, $password);
    }

    if (!$passwordOk) {
        json_response(401, ['message' => 'Invalid credentials']);
    }

    $now = date('Y-m-d H:i:s');
    $update = $pdo->prepare('UPDATE users SET last_login = :last_login WHERE id = :id');
    $update->execute([':last_login' => $now, ':id' => $row['id']]);

    $_SESSION['user_id'] = $row['id'];

    $extra = json_decode($row['data'] ?? '', true);
    if (!is_array($extra)) {
        $extra = [];
    }

    $user = array_merge($extra, [
        'id' => $row['id'],
        'username' => $row['username'],
        'name' => $row['name'],
        'role' => $row['role'],
        'active' => (bool)$row['active'],
        'lastLogin' => date('c', strtotime($now))
    ]);

    json_response(200, ['user' => $user]);
} catch (Throwable $e) {
    json_response(500, ['message' => 'Server error', 'error' => $e->getMessage()]);
}
