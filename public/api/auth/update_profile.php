<?php
// public/api/auth/update_profile.php
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

if ($method === 'POST') {
    try {
        $data = getJsonInput();
        $userId = $data['userId'] ?? '';
        $fullName = $data['fullName'] ?? '';
        $phone = $data['phone'] ?? '';
        $reminderDays = $data['reminderDays'] ?? 7;

        if (empty($userId)) {
            echo json_encode(['success' => false, 'message' => 'ID do usuário obrigatório.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE users SET fullName = ?, phone = ?, reminderDays = ?, updatedAt = NOW() WHERE id = ?");
        $stmt->execute([$fullName, $phone, $reminderDays, $userId]);

        echo json_encode(['success' => true, 'message' => 'Perfil atualizado com sucesso.']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método não suportado.']);
}
?>
