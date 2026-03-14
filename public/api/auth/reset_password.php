<?php
// public/api/auth/reset_password.php
require_once __DIR__ . '/../db.php';

$data = getJsonInput();
$token = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (empty($token) || empty($newPassword)) {
    echo json_encode(['error' => 'Token e nova senha são obrigatórios']);
    exit;
}

try {
    // 1. Validar Token e Expiração
    $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_expiry > NOW()");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['error' => 'Token inválido ou expirado']);
        exit;
    }

    // 2. Atualizar Senha e Limpar Token
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?");
    $stmt->execute([$hashedPassword, $user['id']]);

    echo json_encode(['success' => true, 'message' => 'Senha redefinida com sucesso! Redirecionando para login...']);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
