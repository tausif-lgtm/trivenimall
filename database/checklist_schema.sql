-- Checklist Management System for Triveni Mall Operations

CREATE TABLE IF NOT EXISTS checklist_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  frequency ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
  frequency_day TINYINT NULL,
  assign_type ENUM('staff','role') NOT NULL DEFAULT 'staff',
  assigned_staff_id INT NULL,
  assigned_role VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS checklist_template_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  item_text VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checklist_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  assigned_to INT NULL,
  scheduled_date DATE NOT NULL,
  status ENUM('pending','in_progress','completed','missed') DEFAULT 'pending',
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  submitted_by INT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS checklist_schedule_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  template_item_id INT NOT NULL,
  item_text VARCHAR(500) NOT NULL,
  is_completed TINYINT(1) DEFAULT 0,
  completed_at DATETIME NULL,
  remark TEXT NULL,
  photo_url VARCHAR(500) NULL,
  FOREIGN KEY (schedule_id) REFERENCES checklist_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (template_item_id) REFERENCES checklist_template_items(id) ON DELETE CASCADE
);
