<?php
// public/api/update_balance.php
require_once 'db.php';

$accountName = 'Salario Mensal';
$newBalance = 10000.00; // Valor de exemplo, deve ser passado via GET ou editado aqui

if (isset($_GET['balance'])) {
    $newBalance = (float)$_GET['balance'];
}

try {
    $stmt = $pdo->prepare("UPDATE accounts SET balance = ? WHERE name = ?");
    $stmt->execute([$newBalance, $accountName]);
    
    echo json_encode([
        'status' => 'success',
        'message' => "Saldo da conta '$accountName' atualizado para R$ " . number_format($newBalance, 2, ',', '.'),
        'new_balance' => $newBalance
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
