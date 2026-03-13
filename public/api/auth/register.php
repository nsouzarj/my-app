<?php
// public/api/auth/register.php
require_once '../db.php';

$data = getJsonInput();

if (!$data['email'] || !$data['password'] || !$data['orgName']) {
    echo json_encode(['error' => 'Dados incompletos']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        echo json_encode(['error' => 'E-mail já cadastrado']);
        exit;
    }

    // 2. Create User
    $userId = bin2hex(random_bytes(16));
    $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (id, email, password, fullName, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute([$userId, $data['email'], $hashedPassword, $data['fullName'] ?? '']);

    // 3. Create Organization
    $orgId = bin2hex(random_bytes(16));
    $stmt = $pdo->prepare("INSERT INTO organizations (id, name, type, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute([$orgId, $data['orgName'], $data['orgType'] ?? 'Pessoal', $userId]);

    // 4. Create Organization Member
    $stmt = $pdo->prepare("INSERT INTO organization_members (organizationId, userId, role) VALUES (?, ?, 'Admin')");
    $stmt->execute([$orgId, $userId]);

    $pdo->commit();
    echo json_encode(['success' => true, 'userId' => $userId, 'orgId' => $orgId]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}
?>
