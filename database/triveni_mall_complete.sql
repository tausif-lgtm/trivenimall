-- ============================================================
-- TRIVENI MALL OPERATIONS - Complete Database Schema
-- Database: triveni_mall_operations
-- ============================================================

CREATE DATABASE IF NOT EXISTS triveni_mall_operations
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE triveni_mall_operations;

-- ============================================================
-- 1. USERS (Admin / Staff / Brand-Tenant login)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mobile VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. STORES (Mall Tenants / Brands / Shops)
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
-- 3. TICKETS (Tenant Complaints / Maintenance)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  store_id INT DEFAULT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  category ENUM('Maintenance','Accounts','Operations','IT','Others') NOT NULL DEFAULT 'Others',
  subcategory VARCHAR(100),
  priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  status ENUM('Open','Assigned','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
  sla_hours INT DEFAULT NULL,
  assigned_staff INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_staff) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 4. TICKET UPDATES (Comments / Updates on tickets)
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  message TEXT NOT NULL,
  updated_by INT NOT NULL,
  attachment VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('ticket_created','ticket_assigned','ticket_updated','ticket_resolved','system') DEFAULT 'system',
  is_read TINYINT(1) DEFAULT 0,
  ticket_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. SALES (Daily Revenue per Store)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  sale_date DATE NOT NULL,
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes VARCHAR(300),
  entered_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_store_date (store_id, sale_date),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. FOOTFALL (Gate-wise, Hourly tracking)
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

-- ============================================================
-- 8. CUSTOMER FEEDBACK (QR-based, no login required)
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
-- 9. VISITORS (WiFi-style check-in)
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
-- 10. PARKING (Fast entry by security)
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
-- 11. PASSWORD RESETS (OTP)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Users (password = Admin@123 for all)
INSERT INTO users (id, name, email, mobile, password, role) VALUES
(1, 'Mall Admin', 'admin@portal.com', '9000000001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
(2, 'Operations Staff', 'staff@portal.com', '9000000002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'staff'),
(3, 'Brand Manager', 'customer@portal.com', '9000000003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer');

-- Stores (Triveni Mall tenants)
INSERT INTO stores (id, store_name, floor, unit_number, category, contact_person, mobile) VALUES
(1, 'Dominos Pizza', 'Ground Floor', 'GF-01', 'Food', 'Ravi Kumar', '9876500001'),
(2, 'H&M', '1st Floor', 'FF-12', 'Fashion', 'Pooja Singh', '9876500002'),
(3, 'Cinemax', '3rd Floor', 'TF-01', 'Entertainment', 'Anil Gupta', '9876500003'),
(4, 'Zara', '1st Floor', 'FF-08', 'Fashion', 'Meena Sharma', '9876500004'),
(5, 'Food Court', '2nd Floor', 'SF-FC', 'Food', 'Manager', '9876500005'),
(6, 'Samsung Store', 'Ground Floor', 'GF-10', 'Electronics', 'Suresh Rao', '9876500006'),
(7, 'Lifestyle', '1st Floor', 'FF-20', 'Fashion', 'Priya Mehta', '9876500007');

-- Sample Tickets
INSERT INTO tickets (ticket_number, user_id, store_id, title, description, category, priority, status, sla_hours, assigned_staff) VALUES
('TM-2026-0001', 3, 1, 'AC not working in store', 'Central AC unit in GF-01 stopped working since morning. Staff and customers are uncomfortable.', 'Maintenance', 'High', 'Assigned', 4, 2),
('TM-2026-0002', 3, 2, 'Electrical fault in trial room', 'Lights flickering in trial room area. Needs immediate attention.', 'Maintenance', 'Critical', 'Open', 2, NULL),
('TM-2026-0003', 3, 1, 'GST invoice correction needed', 'Last month invoice has wrong GSTIN. Please correct and reissue.', 'Accounts', 'Medium', 'In Progress', 24, 2);

-- Sample Footfall (today - hardcoded as recent date)
INSERT INTO footfall (footfall_date, count, source, gate_name, time_slot, entered_by) VALUES
(CURDATE(), 420, 'mall', 'Main Entrance', '10:00-10:59', 1),
(CURDATE(), 435, 'mall', 'Main Entrance', '13:00-13:59', 1),
(CURDATE(), 1000, 'mall', 'Main Entrance', '18:00-18:59', 1),
(CURDATE(), 80, 'mall', 'LGF Entrance', '11:00-11:59', 1),
(CURDATE(), 35, 'mall', 'LGF Entrance', '17:00-17:59', 1);

-- Sample Sales
INSERT INTO sales (store_id, sale_date, revenue, entered_by) VALUES
(1, CURDATE(), 45000, 1),
(2, CURDATE(), 120000, 1),
(3, CURDATE(), 200000, 1),
(4, CURDATE(), 95000, 1),
(5, CURDATE(), 80000, 1);

-- Sample Feedback
INSERT INTO feedback (mobile, visit_category, rating_overall, rating_cleanliness, rating_ac, rating_lighting, rating_ambience, brands_requested) VALUES
('9876543210', 'Shopping', 4, 4, 3, 5, 4, 'Zara, H&M, Nike'),
('9876543211', 'Food', 5, 5, 4, 5, 5, 'McDonald, Starbucks'),
('9876543212', 'Entertainment', 4, 3, 4, 4, 4, 'PVR, Timezone'),
(NULL, 'Shopping', 3, 3, 2, 4, 3, 'Adidas, Puma');

-- Sample Visitors
INSERT INTO visitors (name, mobile, age_group, visit_type, visit_date) VALUES
('Rahul Sharma', '9111111111', '26-35', 'Shopping', CURDATE()),
('Priya Verma', '9222222222', '18-25', 'Food', CURDATE()),
('Amit Singh', '9333333333', '36-50', 'Shopping', CURDATE()),
('Neha Gupta', '9444444444', '26-35', 'Timepass', CURDATE());

-- Sample Parking
INSERT INTO parking (vehicle_number, mobile, vehicle_type, entry_time) VALUES
('WB02AB1234', '9555555555', '4-Wheeler', NOW()),
('WB05CD5678', '9666666666', '2-Wheeler', NOW()),
(NULL, '9777777777', '4-Wheeler', NOW());

-- ============================================================
SELECT 'Triveni Mall Operations DB created successfully!' AS Status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_stores FROM stores;
SELECT COUNT(*) AS total_tickets FROM tickets;
-- ============================================================
