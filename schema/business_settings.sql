-- Business Settings Table
CREATE TABLE IF NOT EXISTS business_settings (
    id INT PRIMARY KEY DEFAULT 1,
    business_name VARCHAR(255) NOT NULL DEFAULT 'Designer Tailors',
    business_phone VARCHAR(20),
    business_whatsapp VARCHAR(20),
    business_address TEXT,
    logo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
