<?php
require_once 'public/api/db.php';

try {
    $stmt = $pdo->query("SELECT id, name, reminderDays, emailNotifications FROM organizations LIMIT 5");
    $orgs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "ORGANIZAÇÕES:\n";
    print_r($orgs);

    $stmt = $pdo->query("SELECT email, fullName, organizationId FROM users LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "\nUSUÁRIOS:\n";
    print_r($users);
    
    $stmt = $pdo->query("SELECT id, description, due_date, reminderDays, status FROM transactions WHERE status = 'planned' LIMIT 5");
    $txs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "\nTRANSAÇÕES PLANEJADAS:\n";
    print_r($txs);

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
