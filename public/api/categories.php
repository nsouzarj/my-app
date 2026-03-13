<?php
// public/api/categories.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$organizationId = $_GET['organizationId'] ?? 'default_org';

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE organizationId = ? ORDER BY name ASC");
    $stmt->execute([$organizationId]);
    echo json_encode($stmt->fetchAll());
}

if ($method === 'POST') {
    $data = getJsonInput();
    $id = bin2hex(random_bytes(16));
    
    $stmt = $pdo->prepare("INSERT INTO categories (id, name, type, color, organizationId, createdAt, updatedAt) 
                           VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
    
    $stmt->execute([
        $id,
        $data['name'],
        $data['type'],
        $data['color'] ?? '#3b82f6',
        $data['organizationId']
    ]);
    
    echo json_encode(['success' => true, 'id' => $id]);
}

if ($method === 'PUT') {
    $data = getJsonInput();
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare("UPDATE categories SET name = ?, type = ?, color = ?, updatedAt = NOW() WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['type'],
        $data['color'] ?? '#3b82f6',
        $id
    ]);
    
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>
