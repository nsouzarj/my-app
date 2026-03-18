<?php
$org = 'default_org'; // adjust if needed
$url1 = "http://localhost:8000/dashboard.php?organizationId=$org&month=02&year=2026";
$url2 = "http://localhost:8000/dashboard.php?organizationId=$org&month=03&year=2026";

$resp1 = file_get_contents($url1);
$resp2 = file_get_contents($url2);

$d1 = json_decode($resp1, true);
$d2 = json_decode($resp2, true);

echo "Feb Income: " . ($d1['income'] ?? 'N/A') . "\n";
echo "Mar Income: " . ($d2['income'] ?? 'N/A') . "\n";
echo "Feb Expenses: " . ($d1['expenses'] ?? 'N/A') . "\n";
echo "Mar Expenses: " . ($d2['expenses'] ?? 'N/A') . "\n";

if ($resp1 === $resp2) {
    echo "NO DIFFERENCE. THE API RETURNS THE SAME RESULT.";
} else {
    echo "API RETURNS DIFFERENT RESULTS. IT MUST BE CACHE OR DATA IDENTICALITY.";
}
