<?php
require_once 'public/api/db.php';

try {
    $stmt = $pdo->query("SELECT * FROM user_credentials LIMIT 10");
    $creds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "CREDENCIAIS NO BANCO:\n";
    print_r($creds);
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
