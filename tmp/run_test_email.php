<?php
require_once 'public/api/db.php';

try {
    // 1. Pegar a primeira org e garantir que as notificações estão ligadas
    $stmt = $pdo->query("SELECT id, name, reminderDays FROM organizations LIMIT 1");
    $org = $stmt->fetch();
    $orgId = $org['id'];
    
    $pdo->prepare("UPDATE organizations SET emailNotifications = 1 WHERE id = ?")->execute([$orgId]);
    
    // 2. Criar uma transação planejada que vence no dia do aviso
    // Se reminderDays é 7, então vence daqui a 7 dias.
    $days = (int)$org['reminderDays'];
    $targetDate = date('Y-m-d', strtotime("+$days days"));
    
    $txId = 'TEST-' . bin2hex(random_bytes(4));
    
    // Pegar uma conta e categoria existentes
    $accId = $pdo->query("SELECT id FROM accounts WHERE organizationId = '$orgId' LIMIT 1")->fetchColumn();
    $catId = $pdo->query("SELECT id FROM categories WHERE organizationId = '$orgId' LIMIT 1")->fetchColumn();
    
    $stmt = $pdo->prepare("INSERT INTO transactions (id, description, amount, date, due_date, type, accountId, categoryId, organizationId, status, reminderDays, createdAt, updatedAt) 
                           VALUES (?, 'TESTE DE NOTIFICAÇÃO', 123.45, CURDATE(), ?, 'expense', ?, ?, ?, 'planned', ?, NOW(), NOW())");
    $stmt->execute([$txId, $targetDate, $accId, $catId, $orgId, $days]);
    
    echo "DADOS DE TESTE CRIADOS:\n";
    echo "Org: {$org['name']}\n";
    echo "Transação: TESTE DE NOTIFICAÇÃO\n";
    echo "Vencimento: $targetDate (daqui a $days dias)\n";
    echo "\nRODANDO CRON AGORA...\n\n";
    
    // 3. Rodar o Cron
    require_once 'public/api/cron/notify_planned.php';

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
