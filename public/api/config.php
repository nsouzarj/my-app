<?php
// public/api/config.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$organizationId = $_GET['organizationId'] ?? 'default_org';

// GET: Fetch organization details
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT name FROM organizations WHERE id = ?");
        $stmt->execute([$organizationId]);
        $org = $stmt->fetch();

        echo json_encode([
            'orgName' => $org ? $org['name'] : 'Finanças',
            'status' => 'online'
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'orgName' => 'Finanças',
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

// POST: Update organization name
if ($method === 'POST') {
    try {
        $data = getJsonInput();
        $name = $data['name'] ?? '';
        $orgId = $data['organizationId'] ?? $organizationId;

        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => 'Nome não pode ser vazio.']);
            exit;
        }

        // Check if org exists
        $stmt = $pdo->prepare("SELECT id FROM organizations WHERE id = ?");
        $stmt->execute([$orgId]);
        $exists = $stmt->fetch();

        if ($exists) {
            $stmt = $pdo->prepare("UPDATE organizations SET name = ?, updatedAt = NOW() WHERE id = ?");
            $stmt->execute([$name, $orgId]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO organizations (id, name, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())");
            $stmt->execute([$orgId, $name]);
        }

        echo json_encode(['success' => true, 'message' => 'Configurações salvas com sucesso.']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
