<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';
$idFinPessoais = '3c2ecd8cc00085cf291369725a342f5d';

// Encontrar ID do Nelson
$stmtU = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmtU->execute([$email]);
$userId = $stmtU->fetchColumn();

if ($userId) {
    // Remover o Nelson de todas as Orgs EXCETO Finanças Pessoais
    $stmtDel = $pdo->prepare("DELETE FROM organization_members WHERE userId = ? AND organizationId != ?");
    $stmtDel->execute([$userId, $idFinPessoais]);
    echo "Filtro final aplicado. Nelson agora só pertence à sua organização original.\n";
}
?>
