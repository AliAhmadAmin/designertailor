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

function fetch_collection(PDO $pdo, string $table): array {
    $stmt = $pdo->query("SELECT id, data FROM {$table}");
    $items = [];
    while ($row = $stmt->fetch()) {
        $data = json_decode($row['data'], true);
        if (!is_array($data)) {
            $data = [];
        }
        if (!isset($data['id'])) {
            $data['id'] = $row['id'];
        }
        $items[] = $data;
    }
    return $items;
}

function save_collection(PDO $pdo, string $table, array $items): void {
    $pdo->exec("DELETE FROM {$table}");
    if (count($items) === 0) {
        return;
    }
    $stmt = $pdo->prepare("INSERT INTO {$table} (id, data) VALUES (:id, :data)");
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }
        $id = $item['id'] ?? null;
        if ($id === null) {
            continue;
        }
        $stmt->execute([
            ':id' => (string)$id,
            ':data' => json_encode($item)
        ]);
    }
}

function fetch_users(PDO $pdo): array {
    $stmt = $pdo->query('SELECT id, username, name, role, permissions, active, last_login, data FROM users');
    $users = [];
    while ($row = $stmt->fetch()) {
        $extra = json_decode($row['data'] ?? '', true);
        if (!is_array($extra)) {
            $extra = [];
        }
        $permissions = json_decode($row['permissions'] ?? '', true);
        if (!is_array($permissions)) {
            $permissions = [];
        }
        $user = array_merge($extra, [
            'id' => $row['id'],
            'username' => $row['username'],
            'name' => $row['name'],
            'role' => $row['role'],
            'permissions' => $permissions,
            'active' => (bool)$row['active'],
            'lastLogin' => $row['last_login'] ? date('c', strtotime($row['last_login'])) : null
        ]);
        $users[] = $user;
    }
    return $users;
}

function save_users(PDO $pdo, array $users): void {
    $existing = [];
    $stmt = $pdo->query('SELECT id, password FROM users');
    while ($row = $stmt->fetch()) {
        $existing[$row['id']] = $row['password'];
    }

    $pdo->exec('DELETE FROM users');
    if (count($users) === 0) {
        return;
    }
    $stmt = $pdo->prepare(
        'INSERT INTO users (id, username, password, name, role, permissions, active, last_login, data) '
        . 'VALUES (:id, :username, :password, :name, :role, :permissions, :active, :last_login, :data)'
    );
    foreach ($users as $user) {
        if (!is_array($user)) {
            continue;
        }
        if (!isset($user['id'], $user['username'], $user['name'], $user['role'])) {
            continue;
        }
        $password = $user['password'] ?? '';
        if ($password === '' && isset($existing[$user['id']])) {
            $password = $existing[$user['id']];
        }
        if ($password === '') {
            continue;
        }
        $info = password_get_info($password);
        if (empty($info['algo'])) {
            $password = password_hash($password, PASSWORD_DEFAULT);
        }
        $extra = $user;
        unset(
            $extra['id'],
            $extra['username'],
            $extra['password'],
            $extra['name'],
            $extra['role'],
            $extra['permissions'],
            $extra['active'],
            $extra['lastLogin']
        );
        $permissions = $user['permissions'] ?? [];
        if (!is_array($permissions)) {
            $permissions = [];
        }
        $stmt->execute([
            ':id' => (string)$user['id'],
            ':username' => (string)$user['username'],
            ':password' => (string)$password,
            ':name' => (string)$user['name'],
            ':role' => (string)$user['role'],
            ':permissions' => json_encode($permissions),
            ':active' => !empty($user['active']) ? 1 : 0,
            ':last_login' => !empty($user['lastLogin']) ? date('Y-m-d H:i:s', strtotime($user['lastLogin'])) : null,
            ':data' => json_encode($extra)
        ]);
    }
}

function require_auth(PDO $pdo): void {
    if (empty($_SESSION['user_id'])) {
        json_response(401, ['message' => 'Unauthorized']);
    }
    $stmt = $pdo->prepare('SELECT id, active FROM users WHERE id = :id');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(401, ['message' => 'Unauthorized']);
    }
    if ((int)$row['active'] !== 1) {
        json_response(403, ['message' => 'Account is deactivated']);
    }
}

try {
    $pdo = get_pdo();
    ensure_schema($pdo);
    ensure_default_admin($pdo);
    require_auth($pdo);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $users = fetch_users($pdo);
        $response = [
            'users' => $users,
            'customers' => fetch_collection($pdo, 'customers'),
            'orders' => fetch_collection($pdo, 'orders'),
            'expenses' => fetch_collection($pdo, 'expenses'),
            'workers' => fetch_collection($pdo, 'workers'),
            'workerPayments' => fetch_collection($pdo, 'worker_payments'),
            'accounts' => fetch_collection($pdo, 'accounts')
        ];
        json_response(200, $response);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = file_get_contents('php://input');
        $payload = json_decode($body, true);
        if (!is_array($payload)) {
            json_response(400, ['message' => 'Invalid JSON payload']);
        }

        $pdo->beginTransaction();
        save_users($pdo, $payload['users'] ?? []);
        save_collection($pdo, 'customers', $payload['customers'] ?? []);
        save_collection($pdo, 'orders', $payload['orders'] ?? []);
        save_collection($pdo, 'expenses', $payload['expenses'] ?? []);
        save_collection($pdo, 'workers', $payload['workers'] ?? []);
        save_collection($pdo, 'worker_payments', $payload['workerPayments'] ?? []);
        save_collection($pdo, 'accounts', $payload['accounts'] ?? []);
        $pdo->commit();

        json_response(200, ['status' => 'ok']);
    }

    json_response(405, ['message' => 'Method not allowed']);
} catch (Throwable $e) {
    json_response(500, ['message' => 'Server error', 'error' => $e->getMessage()]);
}
