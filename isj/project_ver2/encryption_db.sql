CREATE DATABASE IF NOT EXISTS encryption_db;
USE encryption_db;

CREATE TABLE encrypted_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_plain VARCHAR(255),
    encrypted TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
