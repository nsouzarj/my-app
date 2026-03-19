<?php
// public/api/auth/delete_account.php
require_once '../db.php';

$data = getJsonInput();
$userId = $data['userId'] ?? null;
$organizationId = $data['organizationId'] ?? null;

if (!$userId || !$organizationId) {
    echo json_encode(['error' => 'Identificação do usuário ou organização ausente']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Identificar todas as organizações onde o usuário é o criador/dono
    $stmt = $pdo->prepare("SELECT id FROM organizations WHERE createdBy = ?");
    $stmt->execute([$userId]);
    $ownedOrgs = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 2. Para cada organização de propriedade do usuário, limpar dados
    foreach ($ownedOrgs as $orgId) {
        // Deletar Transações
        $stmt = $pdo->prepare("DELETE FROM transactions WHERE organizationId = ?");
        $stmt->execute([$orgId]);

        // Deletar Categorias
        $stmt = $pdo->prepare("DELETE FROM categories WHERE organizationId = ?");
        $stmt->execute([$orgId]);

        // Deletar Contas
        $stmt = $pdo->prepare("DELETE FROM accounts WHERE organizationId = ?");
        $stmt->execute([$orgId]);

        // Deletar Tipos de Conta
        $stmt = $pdo->prepare("DELETE FROM account_types WHERE organizationId = ?");
        $stmt->execute([$orgId]);

        // Deletar Membros
        $stmt = $pdo->prepare("DELETE FROM organization_members WHERE organizationId = ?");
        $stmt->execute([$orgId]);

        // Deletar a Organização em si
        $stmt = $pdo->prepare("DELETE FROM organizations WHERE id = ?");
        $stmt->execute([$orgId]);
    }

    // 3. Remover o usuário de organizações onde ele era apenas membro
    $stmt = $pdo->prepare("DELETE FROM organization_members WHERE userId = ?");
    $stmt->execute([$userId]);

    // 4. Deletar o registro do Usuário finalmente
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Conta e todos os dados foram excluídos com sucesso.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['error' => 'Falha ao excluir conta: ' . $e->getMessage()]);
}
?>
