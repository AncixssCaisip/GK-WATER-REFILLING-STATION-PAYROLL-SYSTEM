-- ============================================================
--  GK Water Refilling Station — Database Setup
--  Import this file in phpMyAdmin:
--    1. Open phpMyAdmin (http://localhost/phpmyadmin)
--    2. Click "Import" tab
--    3. Choose this file and click "Go"
-- ============================================================

CREATE DATABASE IF NOT EXISTS gk_water
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gk_water;

-- ------------------------------------------------------------
--  CUSTOMERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id       INT          AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  phone    VARCHAR(20)  NOT NULL,
  address  TEXT         NOT NULL,
  username VARCHAR(50)  NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  status   VARCHAR(20)  NOT NULL DEFAULT 'Active',
  since    DATE         NOT NULL,
  photo    LONGTEXT
);

-- Default customer (password is plain text — hash it with bcrypt in production)
INSERT INTO customers (name, phone, address, username, password, status, since, photo)
VALUES ('Ana Reyes', '0917 123 4567', 'Brgy. 3, Balayan, Batangas', 'ana', 'password1', 'Active', '2026-01-05', NULL);

-- ------------------------------------------------------------
--  ORDERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id       INT          AUTO_INCREMENT PRIMARY KEY,
  date     DATE         NOT NULL,
  driver   VARCHAR(100) NOT NULL,
  pickup   TEXT         NOT NULL,
  delivery TEXT         NOT NULL,
  landmark VARCHAR(150) NOT NULL DEFAULT '',
  qty      INT          NOT NULL,
  amount   DECIMAL(10,2),
  status   VARCHAR(20)  NOT NULL DEFAULT 'Pending'
);

-- Sample orders
-- (none — add orders through the app)
x