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

    // GET /api/orders.php?limit=50&offset=0&search=Ahmed&status=Pending&sort=date
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';
        $sort = $_GET['sort'] ?? 'date';

        // Limit safety
        $limit = min($limit, 300);
        if ($limit <= 0) $limit = 50;

        // Fetch orders
        $stmt = $pdo->query("SELECT id, data FROM orders");
        $all_orders = [];
        while ($row = $stmt->fetch()) {
            $data = json_decode($row['data'], true);
            if (!is_array($data)) $data = [];
            if (!isset($data['id'])) $data['id'] = $row['id'];
            $all_orders[] = $data;
        }

        // Filter by search and status
        $filtered = array_filter($all_orders, function($order) use ($search, $status) {
            $matchesSearch = empty($search) || 
                stripos($order['customerName'] ?? '', $search) !== false ||
                stripos($order['customerPhone'] ?? '', $search) !== false;
            
            $matchesStatus = empty($status) || ($order['status'] ?? '') === $status;
            
            return $matchesSearch && $matchesStatus;
        });

        // Sort by date descending by default
        usort($filtered, function($a, $b) {
            $dateA = strtotime($a['date'] ?? '0');
            $dateB = strtotime($b['date'] ?? '0');
            return $dateB - $dateA;
        });

        // Apply pagination
        $total = count($filtered);
        $paginated = array_slice($filtered, $offset, $limit);

        json_response(200, [
            'orders' => $paginated,
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
