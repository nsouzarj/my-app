<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';

// 1. Encontrar o Usuário
$stmtU = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmtU->execute([$email]);
$userId = $stmtU->fetchColumn();

if (!$userId) {
    echo "Usuário $email não encontrado.\n";
    exit;
}

// 2. Restaurar acesso do Nelson a TODAS as organizações do sistema
// (Assumindo que ele quer ver tudo como antes, e ele era o administrador de fato)
$orgs = $pdo->query("SELECT id, name FROM organizations")->fetchAll();

echo "Restaurando acessos para $email (ID: $userId):\n";

foreach ($orgs as $org) {
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM organization_members WHERE userId = ? AND organizationId = ?");
    $stmtCheck->execute([$userId, $org['id']]);
    if ($stmtCheck->fetchColumn() == 0) {
        $stmtIns = $pdo->prepare("INSERT INTO organization_members (id, userId, organizationId, role, createdAt, updatedAt) 
                                 VALUES (?, ?, ?, 'admin', NOW(), NOW())");
        $stmtIns->execute([bin2hex(random_bytes(16)), $userId, $org['id']]);
        echo " -> Vinculado à Org: {$org['name']}\n";
    } else {
        echo " -> Já era membro da Org: {$org['name']}\n";
    }
}

echo "\n--- ACESSOS RESTAURADOS ---\n";
?>
