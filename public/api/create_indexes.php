<?php
// public/api/create_indexes.php
require 'db.php';

try {
    // MySQL 5.7+ / 8.0 support CREATE INDEX IF NOT EXISTS... wait, actually it doesn't officially support IF NOT EXISTS for CREATE INDEX until 8.0 partly.
    // The safest idempotent way in PHP + PDO is trying to create it and catching the Duplicate Key Name exception (1061).
    
    $indexes = [
        "idx_org_date_type" => "CREATE INDEX idx_org_date_type ON transactions (organizationId, date, type)",
        "idx_org_type_status" => "CREATE INDEX idx_org_type_status ON transactions (organizationId, type, status)",
        "idx_org_account_date" => "CREATE INDEX idx_org_account_date ON transactions (organizationId, accountId, date)"
    ];

    echo "Aplicando Índices de Performance...\n";
    
    foreach ($indexes as $name => $sql) {
        try {
            $pdo->exec($sql);
            echo "✅ Índice '$name' criado com sucesso.\n";
        } catch (PDOException $e) {
            if ($e->getCode() == '42000' || strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "⏭️ Índice '$name' já existe, pulando.\n";
            } else {
                echo "❌ Erro ao criar '$name': " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "Concluído!\n";

} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}
?>
