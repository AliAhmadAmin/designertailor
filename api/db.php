<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function get_pdo(): PDO {
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function ensure_schema(PDO $pdo): void {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS users (\n"
        . "  id VARCHAR(64) PRIMARY KEY,\n"
        . "  username VARCHAR(64) UNIQUE NOT NULL,\n"
        . "  password VARCHAR(255) NOT NULL,\n"
        . "  name VARCHAR(255) NOT NULL,\n"
        . "  role VARCHAR(32) NOT NULL,\n"
        . "  permissions LONGTEXT NULL,\n"
        . "  active TINYINT(1) NOT NULL DEFAULT 1,\n"
        . "  last_login DATETIME NULL,\n"
        . "  data LONGTEXT NULL\n"
        . ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    );
    
    // Add permissions column if it doesn't exist (for existing databases)
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN permissions LONGTEXT NULL AFTER role");
    } catch (PDOException $e) {
        // Column already exists, ignore error
    }

    $tables = [
        'customers',
        'orders',
        'expenses',
        'workers',
        'worker_payments',
        'accounts'
    ];

    foreach ($tables as $table) {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS {$table} (\n"
            . "  id VARCHAR(64) PRIMARY KEY,\n"
            . "  data LONGTEXT NOT NULL\n"
            . ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
        );
    }
}

function ensure_default_admin(PDO $pdo): void {
    $stmt = $pdo->query('SELECT COUNT(*) AS count FROM users');
    $row = $stmt->fetch();
    $count = $row ? (int)$row['count'] : 0;
    if ($count > 0) {
        return;
    }

    $hash = password_hash('admin123', PASSWORD_DEFAULT);
    
    // Admin gets all permissions by default
    $allPermissions = [
        'view_dashboard',
        'view_own_orders', 'view_all_orders', 'create_orders', 'edit_orders', 'delete_orders', 'edit_order_measurements',
        'view_own_customers', 'view_all_customers', 'create_customers', 'edit_customers', 'delete_customers', 'edit_customer_measurements',
        'view_workers', 'create_workers', 'edit_workers', 'delete_workers', 'pay_workers',
        'view_accounts',
        'view_own_expenses', 'view_all_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses',
        'view_own_reports', 'view_all_reports',
        'manage_users'
    ];
    
    $insert = $pdo->prepare(
        'INSERT INTO users (id, username, password, name, role, permissions, active, last_login, data) '
        . 'VALUES (:id, :username, :password, :name, :role, :permissions, :active, :last_login, :data)'
    );
    $insert->execute([
        ':id' => 'u1',
        ':username' => 'admin',
        ':password' => $hash,
        ':name' => 'Administrator',
        ':role' => 'Admin',
        ':permissions' => json_encode($allPermissions),
        ':active' => 1,
        ':last_login' => null,
        ':data' => json_encode([])
    ]);
}
