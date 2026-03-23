<?php
// public/api/transfers.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$organizationId = $_GET['organizationId'] ?? 'default_org';

if ($method === 'POST') {
    $data = getJsonInput();
    
    // Convert amount safely
    $amountInput = abs((float)str_replace(',', '.', $data['amount']));
    if ($amountInput <= 0) {
        echo json_encode(['error' => 'Valor deve ser maior que zero']);
        exit;
    }
    
    $originAccountId = $data['originAccountId'];
    $destinationAccountId = $data['destinationAccountId'];
    $date = $data['date'];
    $description = $data['description'] ?? 'Transferência';
    
    // We use a generic category for transfers, or leave it empty if db allows. Assume 16272b... or null.
    // Fetch a default category if needed, or just insert. Our Prisma schema allows categoryId to be used.
    // Wait, Transactions in schema MUST have a categoryId: `categoryId String`
    // Let's find the first generic category if not provided
    $categoryId = $data['categoryId'] ?? '16272b2fbb47d1feb74e94cfeed9032a';

    $transferReferenceId = bin2hex(random_bytes(16));
    $txOutId = bin2hex(random_bytes(16));
    $txInId = bin2hex(random_bytes(16));
    
    try {
        $pdo->beginTransaction();
        
        // 1. Withdrawal (Transfer Out)
        $stmtOut = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, categoryId, organizationId, status, transferReferenceId, createdAt, updatedAt) 
                               VALUES (?, ?, ?, ?, 'transfer out', ?, ?, ?, 'paid', ?, NOW(), NOW())");
        $stmtOut->execute([
            $txOutId,
            $amountInput,
            $description . " (Para destino)",
            $date,
            $originAccountId,
            $categoryId,
            $organizationId,
            $transferReferenceId
        ]);

        // 2. Deposit (Transfer In)
        $stmtIn = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, categoryId, organizationId, status, transferReferenceId, createdAt, updatedAt) 
                               VALUES (?, ?, ?, ?, 'transfer in', ?, ?, ?, 'paid', ?, NOW(), NOW())");
        $stmtIn->execute([
            $txInId,
            $amountInput,
            $description . " (De origem)",
            $date,
            $destinationAccountId,
            $categoryId,
            $organizationId,
            $transferReferenceId
        ]);

        $pdo->commit();
        
        // Recalculate balances
        recalculateAccountBalance($pdo, $originAccountId);
        recalculateAccountBalance($pdo, $destinationAccountId);

        echo json_encode(['success' => true, 'transferReferenceId' => $transferReferenceId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Falha na transferência', 'details' => $e->getMessage()]);
    }
}
?>
