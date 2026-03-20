-- Customer Portal & Ticket Management System
-- Database Schema for Real Estate Flat Owners

CREATE DATABASE IF NOT EXISTS customer_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE customer_portal;

-- Users Table
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

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    location VARCHAR(300),
    builder_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flats Table
CREATE TABLE IF NOT EXISTS flats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    tower VARCHAR(50),
    floor VARCHAR(20),
    flat_number VARCHAR(50) NOT NULL,
    area DECIMAL(10, 2),
    owner_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    flat_id INT DEFAULT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
    assigned_staff INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_staff) REFERENCES users(id) ON DELETE SET NULL
);

-- Ticket Updates Table
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
-- SEED DATA
-- ============================================================

-- Seed Users
-- Password for all: Admin@123
-- Hash generated with bcrypt, salt rounds 10
-- To regenerate: node backend/scripts/seed.js
INSERT INTO users (id, name, email, mobile, password, role) VALUES
(1, 'Super Admin', 'admin@portal.com', '9000000001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
(2, 'Rahul Sharma', 'staff@portal.com', '9000000002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'staff'),
(3, 'Amit Verma', 'customer@portal.com', '9000000003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer');

-- Seed Projects
INSERT INTO projects (id, project_name, location, builder_name) VALUES
(1, 'Sunrise Heights', 'Sector 62, Noida, UP', 'Sunrise Builders Pvt. Ltd.'),
(2, 'Green Valley Residences', 'Whitefield, Bangalore, KA', 'GreenTech Constructions');

-- Seed Flats
INSERT INTO flats (id, project_id, tower, floor, flat_number, area, owner_id) VALUES
(1, 1, 'Tower A', '5', 'A-501', 1250.00, 3),
(2, 1, 'Tower B', '3', 'B-302', 980.50, NULL),
(3, 2, 'Tower C', '8', 'C-801', 1450.00, NULL);

-- Seed Tickets
INSERT INTO tickets (id, ticket_number, user_id, flat_id, title, description, category, priority, status, assigned_staff) VALUES
(1, 'TKT-2024-0001', 3, 1, 'Water leakage in bathroom', 'There is a significant water leakage from the ceiling in the master bathroom. The issue started 3 days ago and is getting worse.', 'Plumbing', 'High', 'In Progress', 2),
(2, 'TKT-2024-0002', 3, 1, 'Lift not working', 'The lift in Tower A has been non-functional since yesterday morning. Residents are facing difficulty, especially elderly people.', 'Lift/Elevator', 'Critical', 'Open', NULL),
(3, 'TKT-2024-0003', 3, 1, 'Parking slot issue', 'My designated parking slot P-45 is being occupied by another vehicle regularly. Need resolution.', 'Parking', 'Medium', 'Resolved', 2);

-- Seed Ticket Updates
INSERT INTO ticket_updates (ticket_id, message, updated_by, attachment) VALUES
(1, 'Ticket received. Our plumbing team will visit tomorrow between 10 AM - 12 PM.', 2, NULL),
(1, 'Plumber visited and identified the source. Repair work scheduled for next day.', 2, NULL),
(3, 'We have spoken to the vehicle owner and the issue has been resolved. Please confirm.', 2, NULL),
(3, 'Issue confirmed resolved. Thank you for the quick action.', 3, NULL);


-- Notifications Table
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

-- Amenities Table
CREATE TABLE IF NOT EXISTS amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INT DEFAULT 0,
  location VARCHAR(200),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Amenity Bookings Table
CREATE TABLE IF NOT EXISTS amenity_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amenity_id INT NOT NULL,
  user_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose VARCHAR(300),
  status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Construction Updates Table
CREATE TABLE IF NOT EXISTS construction_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  update_type ENUM('general','milestone','delay','handover') DEFAULT 'general',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Construction Photos Table
CREATE TABLE IF NOT EXISTS construction_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  update_id INT DEFAULT NULL,
  photo_path VARCHAR(500) NOT NULL,
  caption VARCHAR(300),
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (update_id) REFERENCES construction_updates(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Possession Timeline Table
CREATE TABLE IF NOT EXISTS possession_timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  milestone_title VARCHAR(200) NOT NULL,
  description TEXT,
  planned_date DATE,
  actual_date DATE,
  status ENUM('pending','in_progress','completed','delayed') DEFAULT 'pending',
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Call Logs Table
CREATE TABLE IF NOT EXISTS call_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  staff_id INT NOT NULL,
  call_date DATETIME NOT NULL,
  call_type ENUM('inbound','outbound') DEFAULT 'outbound',
  duration_minutes INT DEFAULT 0,
  notes TEXT,
  ticket_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- Extend notifications type enum (run manually if DB already exists)
-- ALTER TABLE notifications MODIFY COLUMN type ENUM('ticket_created','ticket_assigned','ticket_updated','ticket_resolved','system','project_update','payment_reminder','maintenance_notice','event_announcement') DEFAULT 'system';

-- Seed Amenities
INSERT INTO amenities (name, description, capacity, location) VALUES
('Clubhouse', 'Fully equipped clubhouse with indoor games, lounge, and meeting rooms', 100, 'Ground Floor, Tower A'),
('Banquet Hall', 'Spacious hall for events and celebrations', 200, 'Level 1, Main Block'),
('Swimming Pool', 'Olympic size swimming pool with changing rooms', 50, 'Garden Area'),
('Gym', 'State-of-the-art fitness center', 30, 'Ground Floor, Tower B'),
('Kids Play Area', 'Safe outdoor play zone for children', 40, 'Central Garden');

-- Password Reset OTPs
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
