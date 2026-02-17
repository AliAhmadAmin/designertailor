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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(405, ['message' => 'Method not allowed']);
    }

    if (empty($_SESSION['user_id'])) {
        json_response(401, ['message' => 'Unauthorized']);
    }

    $body = file_get_contents('php://input');
    $payload = json_decode($body, true);
    if (!is_array($payload)) {
        json_response(400, ['message' => 'Invalid JSON payload']);
    }

    $newPassword = (string)($payload['newPassword'] ?? '');
    $currentPassword = (string)($payload['currentPassword'] ?? '');
    $targetUserId = (string)($payload['userId'] ?? $_SESSION['user_id']);

    if (strlen($newPassword) < 6) {
        json_response(400, ['message' => 'Password must be at least 6 characters long']);
    }

    $pdo = get_pdo();
    ensure_schema($pdo);
    ensure_default_admin($pdo);

    $stmt = $pdo->prepare('SELECT id, password, role, active FROM users WHERE id = :id');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $sessionUser = $stmt->fetch();
    if (!$sessionUser) {
        json_response(401, ['message' => 'Unauthorized']);
    }
    if ((int)$sessionUser['active'] !== 1) {
        json_response(403, ['message' => 'Account is deactivated']);
    }

    $isSelf = $targetUserId === $sessionUser['id'];
    if (!$isSelf) {
        if ($sessionUser['role'] !== 'Admin') {
            json_response(403, ['message' => 'Insufficient permissions']);
        }
    } else {
        if ($currentPassword === '') {
            json_response(400, ['message' => 'Current password is required']);
        }
        $stored = (string)$sessionUser['password'];
        $info = password_get_info($stored);
        $valid = false;
        if (!empty($info['algo'])) {
            $valid = password_verify($currentPassword, $stored);
        } else {
            $valid = hash_equals($stored, $currentPassword);
        }
        if (!$valid) {
            json_response(401, ['message' => 'Current password is incorrect']);
        }
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE id = :id');
    $stmt->execute([':id' => $targetUserId]);
    $target = $stmt->fetch();
    if (!$target) {
        json_response(404, ['message' => 'User not found']);
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $update = $pdo->prepare('UPDATE users SET password = :password WHERE id = :id');
    $update->execute([':password' => $hash, ':id' => $targetUserId]);

    json_response(200, ['status' => 'ok']);
} catch (Throwable $e) {
    json_response(500, ['message' => 'Server error', 'error' => $e->getMessage()]);
}
