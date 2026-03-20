-- ============================================================
-- TRIVENI MALL - Schema Additions
-- Run this AFTER existing schema.sql
-- ============================================================

USE customer_portal;

-- ============================================================
-- 1. STORES (Mall Tenants / Shops)
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_name VARCHAR(200) NOT NULL,
  floor VARCHAR(50),
  unit_number VARCHAR(50),
  category ENUM('Food','Fashion','Electronics','Entertainment','Services','Others') DEFAULT 'Others',
  contact_person VARCHAR(100),
  mobile VARCHAR(20),
  email VARCHAR(150),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. SALES (Daily Revenue Entry per Store)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  sale_date DATE NOT NULL,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes VARCHAR(300),
  entered_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_store_date (store_id, sale_date),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. FOOTFALL (Mall / Store / Parking counts per day)
-- ============================================================
CREATE TABLE IF NOT EXISTS footfall (
  id INT AUTO_INCREMENT PRIMARY KEY,
  footfall_date DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  source ENUM('mall','store','parking') NOT NULL DEFAULT 'mall',
  gate_name VARCHAR(100) DEFAULT NULL,
  time_slot VARCHAR(20) DEFAULT NULL,
  store_id INT DEFAULT NULL,
  notes VARCHAR(300),
  entered_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- If table already exists, add columns:
ALTER TABLE footfall ADD COLUMN IF NOT EXISTS gate_name VARCHAR(100) DEFAULT NULL AFTER source;
ALTER TABLE footfall ADD COLUMN IF NOT EXISTS time_slot VARCHAR(20) DEFAULT NULL AFTER gate_name;

-- ============================================================
-- 4. CUSTOMER FEEDBACK (QR-based, public form - no login)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile VARCHAR(20) DEFAULT NULL,
  visit_category ENUM('Food','Shopping','Entertainment') DEFAULT 'Shopping',
  rating_overall TINYINT NOT NULL DEFAULT 3,
  rating_cleanliness TINYINT NOT NULL DEFAULT 3,
  rating_ac TINYINT NOT NULL DEFAULT 3,
  rating_lighting TINYINT NOT NULL DEFAULT 3,
  rating_ambience TINYINT NOT NULL DEFAULT 3,
  brands_requested TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. VISITORS (WiFi-style capture form)
-- ============================================================
CREATE TABLE IF NOT EXISTS visitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  age_group ENUM('Under 18','18-25','26-35','36-50','50+') DEFAULT '26-35',
  visit_type ENUM('Shopping','Food','Timepass','Work') DEFAULT 'Shopping',
  is_qualified TINYINT(1) DEFAULT 0,
  visit_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. PARKING (Fast entry by security staff)
-- ============================================================
CREATE TABLE IF NOT EXISTS parking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(20) DEFAULT NULL,
  mobile VARCHAR(20) NOT NULL,
  vehicle_type ENUM('2-Wheeler','4-Wheeler','Others') DEFAULT '4-Wheeler',
  entry_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exit_time DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. EXTEND TICKETS TABLE
-- Add SLA hours + Assigned status
-- ============================================================

-- Add sla_hours column (run separately if table exists)
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS sla_hours INT DEFAULT NULL AFTER category,
  ADD COLUMN IF NOT EXISTS store_id INT DEFAULT NULL AFTER flat_id,
  MODIFY COLUMN status ENUM('Open','Assigned','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
  ADD FOREIGN KEY IF NOT EXISTS fk_ticket_store (store_id) REFERENCES stores(id) ON DELETE SET NULL;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed Stores
INSERT INTO stores (store_name, floor, unit_number, category, contact_person, mobile) VALUES
('Dominos Pizza', 'Ground Floor', 'GF-01', 'Food', 'Ravi Kumar', '9876500001'),
('H&M', '1st Floor', 'FF-12', 'Fashion', 'Pooja Singh', '9876500002'),
('Cinemax', '3rd Floor', 'TF-01', 'Entertainment', 'Anil Gupta', '9876500003'),
('Zara', '1st Floor', 'FF-08', 'Fashion', 'Meena Sharma', '9876500004'),
('Food Court - General', '2nd Floor', 'SF-FC', 'Food', 'Manager', '9876500005');
