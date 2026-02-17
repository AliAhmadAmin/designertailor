<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

session_start();
header('Content-Type: application/json');

function require_auth(PDO $pdo): void {
    if (empty($_SESSION['user_id'])) {
        json_response(401, ['message' => 'Unauthorized']);
    }
    $stmt = $pdo->prepare('SELECT id, active FROM users WHERE id = :id');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $row = $stmt->fetch();
    if (!$row || (int)$row['active'] !== 1) {
        json_response(401, ['message' => 'Unauthorized']);
    }
}

function json_response(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

try {
    $pdo = get_pdo();
    ensure_schema($pdo);
    require_auth($pdo);

    // GET /api/customers.php?limit=50&offset=0&search=Ahmed&sort=name
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        $search = $_GET['search'] ?? '';
        $sort = $_GET['sort'] ?? 'name';

        // Limit safety
        $limit = min($limit, 300);
        if ($limit <= 0) $limit = 50;

        // Fetch customers
        $stmt = $pdo->query("SELECT id, data FROM customers");
        $all_customers = [];
        while ($row = $stmt->fetch()) {
            $data = json_decode($row['data'], true);
            if (!is_array($data)) $data = [];
            if (!isset($data['id'])) $data['id'] = $row['id'];
            $all_customers[] = $data;
        }

        // Filter by search
        $filtered = array_filter($all_customers, function($customer) use ($search) {
            return empty($search) || 
                stripos($customer['name'] ?? '', $search) !== false ||
                stripos($customer['phone'] ?? '', $search) !== false;
        });

        // Sort by name by default
        usort($filtered, function($a, $b) {
            $nameA = strtolower($a['name'] ?? '');
            $nameB = strtolower($b['name'] ?? '');
            return strcmp($nameA, $nameB);
        });

        // Apply pagination
        $total = count($filtered);
        $paginated = array_slice($filtered, $offset, $limit);

        json_response(200, [
            'customers' => $paginated,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    json_response(405, ['message' => 'Method not allowed']);
} catch (Throwable $e) {
    json_response(500, ['message' => 'Server error', 'error' => $e->getMessage()]);
}
?>
