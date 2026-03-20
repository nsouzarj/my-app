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
    $hashedPassword = hashUserPassword($data['password']);
    $stmt = $pdo->prepare("INSERT INTO users (id, email, password, fullName, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute([$userId, $data['email'], $hashedPassword, $data['fullName'] ?? '']);

    // 3. Create Organization
    $orgId = bin2hex(random_bytes(16));
    $stmt = $pdo->prepare("INSERT INTO organizations (id, name, type, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute([$orgId, $data['orgName'], $data['orgType'] ?? 'Pessoal', $userId]);

    // 4. Create Organization Member
    $stmt = $pdo->prepare("INSERT INTO organization_members (organizationId, userId, role) VALUES (?, ?, 'Admin')");
    $stmt->execute([$orgId, $userId]);

    // 5. Create Default Account Types
    $defaults = [
        ['id' => 'CHECKING', 'name' => 'Conta Corrente'],
        ['id' => 'SAVINGS', 'name' => 'Poupança'],
        ['id' => 'INVESTMENT', 'name' => 'Investimento'],
        ['id' => 'CASH', 'name' => 'Dinheiro'],
    ];

    foreach ($defaults as $def) {
        $stmtTypes = $pdo->prepare("INSERT INTO account_types (id, name, organizationId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())");
        $stmtTypes->execute([$def['id'], $def['name'], $orgId]);
    }

    // 6. Create Default Categories
    $catDefaults = [
        ['name' => 'Alimentação', 'type' => 'Expense', 'color' => '#ef4444'],
        ['name' => 'Lazer', 'type' => 'Expense', 'color' => '#fbbf24'],
        ['name' => 'Saúde', 'type' => 'Expense', 'color' => '#ec4899'],
        ['name' => 'Transporte', 'type' => 'Expense', 'color' => '#3b82f6'],
        ['name' => 'Salário', 'type' => 'Income', 'color' => '#10b981'],
        ['name' => 'Outros', 'type' => 'Expense', 'color' => '#94a3b8'],
    ];

    foreach ($catDefaults as $cat) {
        $catId = bin2hex(random_bytes(16));
        $stmtCat = $pdo->prepare("INSERT INTO categories (id, name, type, color, organizationId, createdAt, updatedAt) 
                               VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
        $stmtCat->execute([$catId, $cat['name'], $cat['type'], $cat['color'], $orgId]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'userId' => $userId, 'orgId' => $orgId]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}
?>
