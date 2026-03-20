-- ============================================================
-- TRIVENI MALL OPERATIONS — Role-Based Ticketing Upgrade
-- Run this script ONCE against triveni_mall_operations DB
-- ============================================================

-- 1. Add new roles to users table
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','staff','customer','tenant','security','helpdesk') NOT NULL DEFAULT 'customer';

-- 2. Add store_id (for tenant users) and specialty (for staff auto-assignment)
ALTER TABLE users
  ADD COLUMN store_id INT NULL DEFAULT NULL AFTER mobile,
  ADD COLUMN specialty VARCHAR(100) NULL DEFAULT NULL AFTER store_id;

-- store_id FK (soft — stores table already exists)
ALTER TABLE users
  ADD CONSTRAINT fk_user_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL;

-- 3. Expand tickets.category to cover mall operations
ALTER TABLE tickets
  MODIFY COLUMN category ENUM(
    'Maintenance','Accounts','Operations','IT','Parking','Security','Others',
    'Plumbing','Electrical','Civil','Lift','Housekeeping','Water Supply','Other'
  ) DEFAULT NULL;

-- 4. Add new ticket fields
ALTER TABLE tickets
  ADD COLUMN source ENUM('web','webhook','helpdesk') NOT NULL DEFAULT 'web' AFTER category,
  ADD COLUMN requester_name VARCHAR(100) NULL DEFAULT NULL AFTER source,
  ADD COLUMN requester_phone VARCHAR(20) NULL DEFAULT NULL AFTER requester_name,
  ADD COLUMN sla_deadline DATETIME NULL DEFAULT NULL AFTER requester_phone;

-- 5. Drop flat_id FK and column (mall has no flats)
--    Wrapped in a procedure to avoid error if already removed
SET @fk := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets'
    AND COLUMN_NAME = 'flat_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE tickets DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop flat_id column if it exists
ALTER TABLE tickets
  MODIFY COLUMN flat_id INT NULL DEFAULT NULL;
-- (Keep the column nullable — set to NULL for all rows; can drop later when confirmed clean)
UPDATE tickets SET flat_id = NULL;

-- 6. Add an index on sla_deadline for dashboard queries
CREATE INDEX IF NOT EXISTS idx_tickets_sla ON tickets(sla_deadline);

-- 7. Extend notifications type to include sla_breach
ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'ticket_created','ticket_assigned','ticket_updated','ticket_resolved','sla_breach','system'
  ) NOT NULL DEFAULT 'system';

-- ============================================================
-- DONE — restart backend after running this script
-- ============================================================
