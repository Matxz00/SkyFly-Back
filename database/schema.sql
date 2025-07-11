CREATE DATABASE IF NOT EXISTS skyflydb;

USE skyflydb;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Almacenará el hash de la contraseña
    reset_password_token VARCHAR(255) NULL,
    reset_password_expires DATETIME NULL,
    two_factor_secret VARCHAR(255) NULL, -- Secreto para 2FA
    two_factor_enabled BOOLEAN DEFAULT FALSE, -- Indica si 2FA está activo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


show tables;

describe users;

select * from users;

ALTER TABLE users
ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL,
ADD COLUMN two_factor_secret_expires DATETIME DEFAULT NULL;