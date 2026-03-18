<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$organizationId = $_GET['organizationId'] ?? 'default_org';

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM account_types WHERE organizationId = ? ORDER BY name ASC");
    $stmt->execute([$organizationId]);
    $types = $stmt->fetchAll();
    
    if (count($types) === 0) {
        $defaults = [
            ['id' => 'CHECKING', 'name' => 'Conta Corrente'],
            ['id' => 'SAVINGS', 'name' => 'Poupança'],
            ['id' => 'INVESTMENT', 'name' => 'Investimento'],
            ['id' => 'CASH', 'name' => 'Dinheiro'],
        ];
        
        foreach ($defaults as $def) {
            $stmtInsert = $pdo->prepare("INSERT INTO account_types (id, name, organizationId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())");
            $stmtInsert->execute([$def['id'], $def['name'], $organizationId]);
            $def['organizationId'] = $organizationId;
            $types[] = $def;
        }
        
        usort($types, function($a, $b) { return strcmp($a['name'], $b['name']); });
    }
    
    echo json_encode($types);
}

if ($method === 'POST') {
    $data = getJsonInput();
    $id = bin2hex(random_bytes(16));
    
    $orgId = $data['organizationId'] ?? $organizationId;
    
    $stmt = $pdo->prepare("INSERT INTO account_types (id, name, organizationId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())");
    $stmt->execute([
        $id,
        $data['name'],
        $orgId
    ]);
    
    echo json_encode(['success' => true, 'id' => $id, 'name' => $data['name']]);
}

if ($method === 'PUT') {
    $data = getJsonInput();
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare("UPDATE account_types SET name = ?, updatedAt = NOW() WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $id
    ]);
    
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM account_types WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>
