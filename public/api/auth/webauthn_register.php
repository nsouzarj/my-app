<?php
// my-app/public/api/auth/webauthn_register.php
require_once '../db.php';
require_once 'webauthn_handler.php';

session_start();

$data = getJsonInput();
$userId = $data['userId'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'Usuário não identificado']);
    exit;
}

// Em uma implementação real, validaríamos o challenge da session aqui
$credentialId = $data['id'];
$publicKey = $data['publicKey']; // Base64 da chave pública enviada pelo front
$userAgent = $_SERVER['HTTP_USER_AGENT'];

try {
    $success = WebAuthnHandler::createCredential($pdo, $userId, $credentialId, $publicKey, $userAgent);
    echo json_encode(['success' => $success]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
