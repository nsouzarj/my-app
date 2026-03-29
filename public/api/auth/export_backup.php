<?php
// public/api/auth/export_backup.php
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

if ($method === 'POST') {
    try {
        $data = getJsonInput();
        $userId = $data['userId'] ?? '';

        if (empty($userId)) {
            http_response_code(400);
            echo json_encode(['error' => 'UserId is required']);
            exit;
        }

        // 1. Get User
        $stmtU = $pdo->prepare("SELECT id, email, fullName, phone, reminderDays FROM users WHERE id = ?");
        $stmtU->execute([$userId]);
        $user = $stmtU->fetch();

        if (!$user) {
             http_response_code(404);
             echo json_encode(['error' => 'User not found']);
             exit;
        }

        // 2. Get Orgs
        $stmtO = $pdo->prepare("SELECT o.* FROM organizations o JOIN organization_members om ON o.id = om.organizationId WHERE om.userId = ?");
        $stmtO->execute([$userId]);
        $orgs = $stmtO->fetchAll();

        // 3. Get Accounts, Categories, Transactions
        $orgIds = array_column($orgs, 'id');
        $accounts = [];
        $categories = [];
        $transactions = [];

        if (!empty($orgIds)) {
            $inQuery = implode(',', array_fill(0, count($orgIds), '?'));
            
            $stmtA = $pdo->prepare("SELECT * FROM accounts WHERE organizationId IN ($inQuery)");
            $stmtA->execute($orgIds);
            $accounts = $stmtA->fetchAll();

            $stmtC = $pdo->prepare("SELECT * FROM categories WHERE organizationId IN ($inQuery)");
            $stmtC->execute($orgIds);
            $categories = $stmtC->fetchAll();

            $accIds = array_column($accounts, 'id');
            if (!empty($accIds)) {
                $inQueryA = implode(',', array_fill(0, count($accIds), '?'));
                $stmtT = $pdo->prepare("SELECT * FROM transactions WHERE accountId IN ($inQueryA)");
                $stmtT->execute($accIds);
                $transactions = $stmtT->fetchAll();
            }
        }

        $exportData = [
            'version' => '1.0',
            'exportedAt' => date('c'),
            'user' => $user,
            'organizations' => $orgs,
            'categories' => $categories,
            'accounts' => $accounts,
            'transactions' => $transactions
        ];

        // Ensure we send out clean JSON
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="financas_backup_' . date('Ymd_His') . '.json"');
        echo json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
