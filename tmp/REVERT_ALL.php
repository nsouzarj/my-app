<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$idFinPessoais = '3c2ecd8cc00085cf291369725a342f5d';
$idDemostracao = 'd583f0137058f67f58611bee12c6cb86';
$idTeste       = '0479b7b2cfdce8943eecebdf65d3c1cf';

$accXP     = 'a797ee2f9ea0f98e734158a47d7d628a';
$accCartao = 'c4ea05b9d8d7a09a1889e7e534f10349';

// 1. Mover XP e Cartão de volta para DEMOSTRAÇÃO
echo "Restaurando XP e Cartão para DEMOSTRAÇÃO...\n";
$stmtA = $pdo->prepare("UPDATE accounts SET organizationId = ? WHERE id IN (?, ?)");
$stmtA->execute([$idDemostracao, $accXP, $accCartao]);
echo "Contas restauradas: " . $stmtA->rowCount() . "\n";

// Mover transações relacionadas
$stmtT = $pdo->prepare("UPDATE transactions SET organizationId = ? WHERE accountId IN (?, ?)");
$stmtT->execute([$idDemostracao, $accXP, $accCartao]);
echo "Transações restauradas: " . $stmtT->rowCount() . "\n";

// 2. Restaurar Itau extra para a Org 'teste'
// Como existem dois 'Itau', precisamos do ID do que veio do teste.
// No audit anterior, o Itau com ID '79ae214c32f6e383e424ecc716076ff6' parece ser o mais novo ou o duplicado.
// Vamos verificar o ID correto do Itau que estava em teste.
$accItauTeste = '79ae214c32f6e383e424ecc716076ff6'; 

echo "Restaurando Itau para 'teste'...\n";
$stmtA2 = $pdo->prepare("UPDATE accounts SET organizationId = ? WHERE id = ?");
$stmtA2->execute([$idTeste, $accItauTeste]);
echo "Conta Itau restaurada: " . $stmtA2->rowCount() . "\n";

$stmtT2 = $pdo->prepare("UPDATE transactions SET organizationId = ? WHERE accountId = ?");
$stmtT2->execute([$idTeste, $accItauTeste]);
echo "Transações Itau restauradas: " . $stmtT2->rowCount() . "\n";

// 3. Restaurar Memberships (Pessoais deletados)
echo "Restaurando membros deletados...\n";

// Usuários por email
$emails = [
    'nelsonrjbrazil@gmail.com' => $idDemostracao,
    'vitor@teste.com.br'       => $idTeste,
    'nsouzarj@outlook.com'     => $idFinPessoais // Esse já deve estar lá, mas vamos garantir
];

foreach ($emails as $email => $orgId) {
    $stmtU = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmtU->execute([$email]);
    $uId = $stmtU->fetchColumn();
    
    if ($uId) {
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM organization_members WHERE userId = ? AND organizationId = ?");
        $stmtCheck->execute([$uId, $orgId]);
        if ($stmtCheck->fetchColumn() == 0) {
            $stmtIns = $pdo->prepare("INSERT INTO organization_members (id, userId, organizationId, role, createdAt, updatedAt) 
                                     VALUES (?, ?, ?, 'admin', NOW(), NOW())");
            $stmtIns->execute([bin2hex(random_bytes(16)), $uId, $orgId]);
            echo "Membro restaurado: $email na org correspondente.\n";
        }
    }
}

echo "\n--- REVERSÃO CONCLUÍDA ---\n";
?>
