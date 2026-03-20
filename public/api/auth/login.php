<?php
// public/api/auth/login.php
require_once '../db.php';

$data = getJsonInput();

if (!$data['email'] || !$data['password']) {
    echo json_encode(['error' => 'Email e senha são obrigatórios']);
    exit;
}

try {
    // 1. Fetch user
    $stmt = $pdo->prepare("SELECT id, email, password, fullName FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    $verifyResult = $user ? verifyUserPassword($data['password'], $user['password']) : false;

    if (!$user || !$verifyResult) {
        echo json_encode(['error' => 'Credenciais inválidas']);
        exit;
    }

    // Upgrade automático de hash (Migração transparente para Pepper + Argon2id)
    if ($verifyResult === 'needs_rehash') {
        $newHash = hashUserPassword($data['password']);
        $stmtUpdate = $pdo->prepare("UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?");
        $stmtUpdate->execute([$newHash, $user['id']]);
    }

    // 2. Fetch primary organization (for simplicity, first one found)
    $stmt = $pdo->prepare("SELECT om.organizationId, o.name FROM organization_members om 
                           JOIN organizations o ON o.id = om.organizationId 
                           WHERE om.userId = ? LIMIT 1");
    $stmt->execute([$user['id']]);
    $org = $stmt->fetch();

    unset($user['password']); // Safety

    echo json_encode([
        'success' => true, 
        'user' => $user, 
        'organization' => $org
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
