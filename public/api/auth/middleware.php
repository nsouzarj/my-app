<?php
// public/api/auth/middleware.php

require_once __DIR__ . '/jwt_helper.php';
// Assuming db.php is required BEFORE this file in the main script, so AUTH_PEPPER is available.

function getAuthorizationHeader(){
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    }
    else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        // Server-side fix for bug in old Android versions (a beautifully obscure bug)
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function getBearerToken() {
    $headers = getAuthorizationHeader();
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// 1. Get the token
$token = getBearerToken();

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized: Token not found']);
    exit;
}

// 2. Validate the token
$decoded = jwt_decode($token, AUTH_PEPPER);

if (!$decoded) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized: Invalid or expired token']);
    exit;
}

// 3. Extract verified data into safe variables for the rest of the script
// We use these variables INSTEAD of $_GET or $_POST for security.
$safeUserId = $decoded['userId'];
$safeOrganizationId = $decoded['organizationId'];

// Overwrite the globally used $organizationId with the safe one from the token.
// This prevents IDOR (Insecure Direct Object Reference).
$organizationId = $safeOrganizationId;

// If we need user info globally in the API
$currentUserId = $safeUserId;

?>
