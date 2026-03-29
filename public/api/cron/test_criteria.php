<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- TESTE DE CRITÉRIOS DE SELEÇÃO ---\n";

$stmtOrgs = $pdo->query("SELECT id, name, reminderDays, emailNotifications FROM organizations");
$organizations = $stmtOrgs->fetchAll();

foreach ($organizations as $org) {
    echo "\nOrg: {$org['name']} (ID: {$org['id']})\n";
    $defaultDays = (int)$org['reminderDays'];
    
    $sql = "SELECT id, description, due_date, reminderDays 
            FROM transactions 
            WHERE organizationId = ? 
            AND status = 'planned' 
            AND DATE(due_date) >= CURDATE()
            AND DATE(due_date) <= DATE_ADD(CURDATE(), INTERVAL COALESCE(reminderDays, ?) DAY)";
            
    $stmtT = $pdo->prepare($sql);
    $stmtT->execute([$org['id'], $defaultDays]);
    $upcoming = $stmtT->fetchAll();
    
    echo "  Critério: >= " . date('Y-m-d') . " AND <= " . date('Y-m-d', strtotime("+{$defaultDays} days")) . "\n";
    
    if (empty($upcoming)) {
        echo "  - Nenhuma conta encontrada.\n";
    } else {
        foreach ($upcoming as $tx) {
            echo "  - [MATCH] ID: {$tx['id']} | Desc: {$tx['description']} | Venc: {$tx['due_date']}\n";
        }
    }
}

echo "\n--- FIM ---\n";
?>
