<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Database connection
    $db = new PDO('mysql:host=localhost;dbname=geminierp;charset=utf8', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create table if it doesn't exist
    $db->exec("
        CREATE TABLE IF NOT EXISTS business_settings (
            id INT PRIMARY KEY DEFAULT 1,
            business_name VARCHAR(255) NOT NULL DEFAULT 'Designer Tailors',
            business_phone VARCHAR(20),
            business_whatsapp VARCHAR(20),
            business_address TEXT,
            logo_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Save business settings
        $businessName = $_POST['businessName'] ?? 'Designer Tailors';
        $businessPhone = $_POST['businessPhone'] ?? '';
        $businessWhatsApp = $_POST['businessWhatsApp'] ?? '';
        $businessAddress = $_POST['businessAddress'] ?? '';
        $logoPath = null;

        // Handle logo upload
        if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/business/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = 'logo_' . time() . '.' . pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION);
            $filePath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['logo']['tmp_name'], $filePath)) {
                $logoPath = 'uploads/business/' . $fileName;
            } else {
                throw new Exception('Failed to upload logo file');
            }
        }

        // Check if settings exist
        $check = $db->query("SELECT id FROM business_settings LIMIT 1");
        
        if ($check->rowCount() > 0) {
            // Update existing settings
            if ($logoPath) {
                $stmt = $db->prepare("
                    UPDATE business_settings 
                    SET business_name = ?, 
                        business_phone = ?, 
                        business_whatsapp = ?, 
                        business_address = ?,
                        logo_path = ?
                    WHERE id = 1
                ");
                $stmt->execute([$businessName, $businessPhone, $businessWhatsApp, $businessAddress, $logoPath]);
            } else {
                $stmt = $db->prepare("
                    UPDATE business_settings 
                    SET business_name = ?, 
                        business_phone = ?, 
                        business_whatsapp = ?, 
                        business_address = ?
                    WHERE id = 1
                ");
                $stmt->execute([$businessName, $businessPhone, $businessWhatsApp, $businessAddress]);
            }
        } else {
            // Insert new settings
            $stmt = $db->prepare("
                INSERT INTO business_settings 
                (id, business_name, business_phone, business_whatsapp, business_address, logo_path) 
                VALUES (1, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$businessName, $businessPhone, $businessWhatsApp, $businessAddress, $logoPath]);
        }

        echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
    } 
    else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Ensure at least one record exists
        $check = $db->query("SELECT COUNT(*) as cnt FROM business_settings");
        $row = $check->fetch(PDO::FETCH_ASSOC);
        if ($row['cnt'] === 0) {
            $db->exec("INSERT INTO business_settings (id) VALUES (1)");
        }

        // Get business settings
        $stmt = $db->query("SELECT * FROM business_settings WHERE id = 1 LIMIT 1");
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            echo json_encode([
                'businessName' => $settings['business_name'] ?? 'Designer Tailors',
                'businessPhone' => $settings['business_phone'] ?? '',
                'businessWhatsApp' => $settings['business_whatsapp'] ?? '',
                'businessAddress' => $settings['business_address'] ?? '',
                'businessLogo' => $settings['logo_path'] ?? null
            ]);
        } else {
            echo json_encode([
                'businessName' => 'Designer Tailors',
                'businessPhone' => '',
                'businessWhatsApp' => '',
                'businessAddress' => '',
                'businessLogo' => null
            ]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
