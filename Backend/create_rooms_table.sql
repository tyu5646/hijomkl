-- Create rooms table for Smart Dorm system
USE smartdorm;

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dorm_id INT NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  floor INT NOT NULL,
  price_daily DECIMAL(10,2) NULL,
  price_monthly DECIMAL(10,2) NULL,
  price_term DECIMAL(10,2) NULL,
  room_type ENUM('air_conditioner', 'fan') DEFAULT 'air_conditioner',
  is_occupied BOOLEAN DEFAULT FALSE,
  tenant_name VARCHAR(255) NULL,
  tenant_phone VARCHAR(20) NULL,
  move_in_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_per_dorm (dorm_id, room_number)
);

-- Show table structure
DESCRIBE rooms;
