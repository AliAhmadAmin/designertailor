<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json');

function json_response(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['message' => 'Method not allowed']);
}

session_unset();
session_destroy();

json_response(200, ['status' => 'ok']);
