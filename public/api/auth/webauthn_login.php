<?php
// my-app/public/api/auth/webauthn_login.php
require_once '../db.php';
require_once 'webauthn_handler.php';

session_start();

$data = getJsonInput();
$credentialId = $data['id'];

try {
    $credential = WebAuthnHandler::getCredential($pdo, $credentialId);
    
    if (!$credential) {
        echo json_encode(['success' => false, 'error' => 'Dispositivo não reconhecido']);
        exit;
    }

    // Buscar o usuário dono da credencial
    $stmt = $pdo->prepare("SELECT id, email, fullName FROM users WHERE id = ?");
    $stmt->execute([$credential['userId']]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Usuário não encontrado']);
        exit;
    }

    // Buscar organização primária
    $stmt = $pdo->prepare("SELECT om.organizationId, o.name FROM organization_members om 
                           JOIN organizations o ON o.id = om.organizationId 
                           WHERE om.userId = ? LIMIT 1");
    $stmt->execute([$user['id']]);
    $org = $stmt->fetch();

    // Iniciar sessão
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['fullName'];

    echo json_encode([
        'success' => true,
        'user' => $user,
        'organization' => $org
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
