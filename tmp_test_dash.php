<?php
$url = "http://localhost:8000/dashboard.php?organizationId=default_org&month=02&year=2026";
$resp = file_get_contents($url);
echo json_encode(json_decode($resp), JSON_PRETTY_PRINT);
