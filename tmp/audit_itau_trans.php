<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$itauIds = ['4367595d9589777b6a83d1c3b0b4b66f', '79ae214c32f6e383e424ecc716076ff6'];

foreach ($itauIds as $id) {
    echo "--- ANALISANDO ITAU ID: $id ---\n";
    $stmt = $pdo->prepare("SELECT a.name as acc_name, o.name as org_name, u.email as user_email 
                          FROM accounts a 
                          JOIN organizations o ON a.organizationId = o.id 
                          LEFT JOIN organization_members om ON o.id = om.organizationId 
                          LEFT JOIN users u ON om.userId = u.id 
                          WHERE a.id = ?");
    $stmt->execute([$id]);
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo "Últimas 5 transações:\n";
    $stmtT = $pdo->prepare("SELECT description, amount, date FROM transactions WHERE accountId = ? ORDER BY date DESC LIMIT 5");
    $stmtT->execute([$id]);
    print_r($stmtT->fetchAll(PDO::FETCH_ASSOC));
    echo "\n";
}
?>
