<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

session_start();

header('Content-Type: application/json');

function json_response(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

try {
    $pdo = get_pdo();
    ensure_schema($pdo);
    ensure_default_admin($pdo);

    if (empty($_SESSION['user_id'])) {
        json_response(200, ['user' => null]);
    }

    $stmt = $pdo->prepare('SELECT id, username, name, role, active, last_login, data FROM users WHERE id = :id');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $row = $stmt->fetch();
    if (!$row) {
        session_unset();
        session_destroy();
        json_response(200, ['user' => null]);
    }
    if ((int)$row['active'] !== 1) {
        session_unset();
        session_destroy();
        json_response(403, ['message' => 'Account is deactivated']);
    }

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
        'lastLogin' => $row['last_login'] ? date('c', strtotime($row['last_login'])) : null
    ]);

    json_response(200, ['user' => $user]);
} catch (Throwable $e) {
    json_response(500, ['message' => 'Server error', 'error' => $e->getMessage()]);
}
