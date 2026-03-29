<?php
// public/api/auth/import_backup.php
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

if ($method === 'POST') {
    try {
        $userId = $_POST['userId'] ?? '';
        
        if (empty($userId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'UserId is required']);
            exit;
        }
        
        if (!isset($_FILES['backup']) || $_FILES['backup']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Arquivo de backup ausente ou inválido.']);
            exit;
        }
        
        $jsonContent = file_get_contents($_FILES['backup']['tmp_name']);
        $backupData = json_decode($jsonContent, true);
        
        if (!$backupData || !isset($backupData['version'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Formato de arquivo JSON inválido.']);
            exit;
        }
        
        // Validation: Ensure the user is only restoring their own valid organizations
        $stmtO = $pdo->prepare("SELECT organizationId FROM organization_members WHERE userId = ?");
        $stmtO->execute([$userId]);
        $validOrgIds = $stmtO->fetchAll(PDO::FETCH_COLUMN);

        if (empty($validOrgIds)) {
             http_response_code(403);
             echo json_encode(['success' => false, 'message' => 'Você não pertence a nenhuma organização.']);
             exit;
        }

        $pdo->beginTransaction();

        // 1. Restore Categories
        if (!empty($backupData['categories'])) {
            $stmtC = $pdo->prepare("INSERT INTO categories (id, name, type, color, icon, organizationId) 
                                    VALUES (?, ?, ?, ?, ?, ?) 
                                    ON DUPLICATE KEY UPDATE name=VALUES(name), type=VALUES(type), color=VALUES(color), icon=VALUES(icon)");
            foreach ($backupData['categories'] as $cat) {
                 if (in_array($cat['organizationId'], $validOrgIds)) {
                     $stmtC->execute([$cat['id'], $cat['name'], $cat['type'], $cat['color'] ?? null, $cat['icon'] ?? null, $cat['organizationId']]);
                 }
            }
        }
        
        // 2. Restore Accounts
        $validAccIds = [];
        if (!empty($backupData['accounts'])) {
            $stmtA = $pdo->prepare("INSERT INTO accounts (id, name, type, balance, organizationId, includeInDashboard) 
                                    VALUES (?, ?, ?, ?, ?, ?) 
                                    ON DUPLICATE KEY UPDATE name=VALUES(name), type=VALUES(type), balance=VALUES(balance), includeInDashboard=VALUES(includeInDashboard)");
            foreach ($backupData['accounts'] as $acc) {
                 if (in_array($acc['organizationId'], $validOrgIds)) {
                     $include = isset($acc['includeInDashboard']) ? (int)$acc['includeInDashboard'] : 1;
                     $stmtA->execute([$acc['id'], $acc['name'], $acc['type'], $acc['balance'], $acc['organizationId'], $include]);
                     $validAccIds[] = $acc['id'];
                 }
            }
        }

        $stmtExistA = $pdo->query("SELECT id FROM accounts WHERE organizationId IN ('" . implode("','", $validOrgIds) . "')");
        $dbAccs = $stmtExistA->fetchAll(PDO::FETCH_COLUMN);
        $validAccIds = array_unique(array_merge($validAccIds, $dbAccs));

        // 3. Restore Transactions
        if (!empty($backupData['transactions']) && !empty($validAccIds)) {
            $stmtT = $pdo->prepare("INSERT INTO transactions (id, description, amount, date, type, accountId, categoryId, organizationId, isPlanned, installments, currentInstallment) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                                    ON DUPLICATE KEY UPDATE description=VALUES(description), amount=VALUES(amount), date=VALUES(date), type=VALUES(type), categoryId=VALUES(categoryId), isPlanned=VALUES(isPlanned)");
            foreach ($backupData['transactions'] as $tx) {
                 if (in_array($tx['accountId'], $validAccIds) && in_array($tx['organizationId'], $validOrgIds)) {
                     $isPlanned = isset($tx['isPlanned']) ? (int)$tx['isPlanned'] : 0;
                     $installments = isset($tx['installments']) ? (int)$tx['installments'] : null;
                     $currentInst = isset($tx['currentInstallment']) ? (int)$tx['currentInstallment'] : null;
                     
                     $stmtT->execute([
                         $tx['id'], $tx['description'], $tx['amount'], $tx['date'], 
                         $tx['type'], $tx['accountId'], $tx['categoryId'] ?? null, 
                         $tx['organizationId'], $isPlanned, $installments, $currentInst
                     ]);
                 }
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Backup restaurado com sucesso!']);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
