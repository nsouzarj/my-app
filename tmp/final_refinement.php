<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';

// 1. Ajustar reminderDays da Org principal para 15 (se estiver baixo)
echo "Ajustando configurações de Finanças Pessoais...\n";
$stmtUpd = $pdo->prepare("UPDATE organizations SET reminderDays = 15 WHERE name = 'Finanças Pessoais' AND (reminderDays < 15 OR reminderDays IS NULL)");
$stmtUpd->execute();
echo "  Rows updated: " . $stmtUpd->rowCount() . "\n";

// 2. Verificar memberships restantes
$stmtU = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmtU->execute([$email]);
$userId = $stmtU->fetchColumn();

if ($userId) {
    echo "\nEmpresas vinculadas a Nelson (ID: $userId):\n";
    $stmtM = $pdo->prepare("SELECT o.name, o.id FROM organizations o JOIN organization_members om ON o.id = om.organizationId WHERE om.userId = ?");
    $stmtM->execute([$userId]);
    foreach ($stmtM->fetchAll() as $row) {
        echo " - {$row['name']} (ID: {$row['id']})\n";
    }
}

// 3. Verificar Contas na Org principal
$stmtA = $pdo->prepare("SELECT name FROM accounts WHERE organizationId = (SELECT id FROM organizations WHERE name = 'Finanças Pessoais' LIMIT 1)");
$stmtA->execute();
echo "\nContas totais em Finanças Pessoais:\n";
foreach ($stmtA->fetchAll() as $row) {
    echo " - {$row['name']}\n";
}
?>
