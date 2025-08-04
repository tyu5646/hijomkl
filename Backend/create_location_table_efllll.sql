-- สร้างตารางในฐานข้อมูล efllll สำหรับระบบ Smart Dorm

-- เปลี่ยนไปใช้ฐานข้อมูล efllll
USE efllll;

-- ตรวจสอบฐานข้อมูลปัจจุบัน
SELECT DATABASE() AS current_database;

-- สร้างตารางใหม่สำหรับเก็บข้อมูลพิกัดของหอพักและสถานที่ใกล้เคียง
CREATE TABLE IF NOT EXISTS location_coordinates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dorm_id INT NOT NULL,
    location_type ENUM('dorm', 'university', 'school', 'hospital', 'market', 'shopping', 'transport', 'other') NOT NULL DEFAULT 'dorm',
    location_name VARCHAR(255) NOT NULL COMMENT 'ชื่อสถานที่',
    latitude DECIMAL(10, 8) NOT NULL COMMENT 'ละติจูด (Latitude)',
    longitude DECIMAL(11, 8) NOT NULL COMMENT 'ลองติจูด (Longitude)',
    description TEXT NULL COMMENT 'รายละเอียดเพิ่มเติม',
    distance_km DECIMAL(5, 2) NULL COMMENT 'ระยะทางจากหอพัก (กิโลเมตร)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    INDEX idx_location_dorm (dorm_id),
    INDEX idx_location_type (location_type),
    INDEX idx_coordinates (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บพิกัดของหอพักและสถานที่ใกล้เคียง';

-- เพิ่ม index สำหรับการค้นหาตำแหน่งที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_location_coordinates ON location_coordinates(latitude, longitude, location_type);
CREATE INDEX IF NOT EXISTS idx_dorm_locations ON location_coordinates(dorm_id, location_type);

-- ตรวจสอบว่าตารางถูกสร้างแล้วหรือไม่
SHOW TABLES LIKE 'location_coordinates';

-- ตรวจสอบโครงสร้างตาราง
DESCRIBE location_coordinates;

-- ตรวจสอบว่ามีตาราง dorms อยู่หรือไม่ (สำหรับ Foreign Key)
SHOW TABLES LIKE 'dorms';

-- แสดงข้อมูลหอพักที่มีอยู่แล้ว
SELECT id, name FROM dorms LIMIT 5;

SELECT 'ตาราง location_coordinates ถูกสร้างในฐานข้อมูล efllll เรียบร้อยแล้ว!' as message;
