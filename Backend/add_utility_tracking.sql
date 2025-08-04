-- เพิ่มฟิลด์การติดตามการใช้ไฟฟ้าและน้ำในตาราง rooms
USE smartdorm;

-- เพิ่มคอลัมน์สำหรับการใช้ไฟฟ้าและน้ำ
ALTER TABLE rooms 
ADD COLUMN electricity_usage DECIMAL(10,2) DEFAULT 0 COMMENT 'การใช้ไฟฟ้า (หน่วย)',
ADD COLUMN water_usage DECIMAL(10,2) DEFAULT 0 COMMENT 'การใช้น้ำ (ลบ.ม.)',
ADD COLUMN electricity_previous_month DECIMAL(10,2) DEFAULT 0 COMMENT 'การใช้ไฟฟ้าเดือนที่แล้ว',
ADD COLUMN water_previous_month DECIMAL(10,2) DEFAULT 0 COMMENT 'การใช้น้ำเดือนที่แล้ว',
ADD COLUMN meter_reading_date DATE NULL COMMENT 'วันที่อ่านมิเตอร์ล่าสุด',
ADD COLUMN electricity_notes TEXT NULL COMMENT 'หมายเหตุการใช้ไฟ',
ADD COLUMN water_notes TEXT NULL COMMENT 'หมายเหตุการใช้น้ำ';

-- สร้างตารางสำหรับเก็บประวัติการอ่านมิเตอร์
CREATE TABLE IF NOT EXISTS meter_readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  reading_date DATE NOT NULL,
  electricity_reading DECIMAL(10,2) NOT NULL DEFAULT 0,
  water_reading DECIMAL(10,2) NOT NULL DEFAULT 0,
  electricity_usage DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'การใช้ไฟในช่วงนี้',
  water_usage DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'การใช้น้ำในช่วงนี้',
  notes TEXT NULL,
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_room_date (room_id, reading_date),
  INDEX idx_reading_date (reading_date)
);

-- แสดงโครงสร้างตารางที่อัปเดต
DESCRIBE rooms;
DESCRIBE meter_readings;

SELECT 'Tables updated successfully for utility tracking!' as status;
