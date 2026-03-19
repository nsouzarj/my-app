<?php
require_once 'db.php';
$id = '16272b2fbb47d1feb74e94cfeed9032a';
$stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
$stmt->execute([$id]);
$cat = $stmt->fetch();
if ($cat) {
    echo "Category found: " . json_encode($cat) . "\n";
} else {
    echo "Category NOT found.\n";
}
?>
