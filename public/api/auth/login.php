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
    $stmt = $pdo->prepare("SELECT id, email, password, fullName, phone, reminderDays FROM users WHERE email = ?");
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
    $stmt = $pdo->prepare("SELECT om.organizationId, o.name, o.reminderDays, o.emailNotifications, o.whatsappNotifications FROM organization_members om 
                           JOIN organizations o ON o.id = om.organizationId 
                           WHERE om.userId = ? LIMIT 1");
    $stmt->execute([$user['id']]);
    $org = $stmt->fetch();

    unset($user['password']); // Safety

    // 3. Gerar JWT Token
    require_once __DIR__ . '/jwt_helper.php';
    
    // Payload (o que fica visível, mas protegido de adulteração)
    $payload = [
        'userId' => $user['id'],
        'organizationId' => $org ? $org['organizationId'] : 'default_org',
        'iat' => time(), // Issued at
        'exp' => time() + (86400 * 7) // Expirar em 7 dias (em segundos)
    ];
    
    // A secret vem do db.php
    $token = jwt_encode($payload, AUTH_PEPPER);

    echo json_encode([
        'success' => true, 
        'user' => $user, 
        'organization' => $org,
        'token' => $token // Retorna o token para o Frontend armazenar
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
