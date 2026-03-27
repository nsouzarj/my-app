<?php
// public/api/config.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$organizationId = $_GET['organizationId'] ?? 'default_org';

// GET: Fetch organization details
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT name, reminderDays, emailNotifications, whatsappNotifications FROM organizations WHERE id = ?");
        $stmt->execute([$organizationId]);
        $org = $stmt->fetch();

        echo json_encode([
            'orgName' => $org ? $org['name'] : 'Finanças',
            'reminderDays' => $org ? (int)$org['reminderDays'] : 7,
            'emailNotifications' => $org ? (bool)$org['emailNotifications'] : false,
            'whatsappNotifications' => $org ? (bool)$org['whatsappNotifications'] : false,
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
        $reminderDays = (int)($data['reminderDays'] ?? 7);
        $emailNotifications = (int)($data['emailNotifications'] ?? 0);
        $whatsappNotifications = (int)($data['whatsappNotifications'] ?? 0);
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
            $stmt = $pdo->prepare("UPDATE organizations SET name = ?, reminderDays = ?, emailNotifications = ?, whatsappNotifications = ?, updatedAt = NOW() WHERE id = ?");
            $stmt->execute([$name, $reminderDays, $emailNotifications, $whatsappNotifications, $orgId]);
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
