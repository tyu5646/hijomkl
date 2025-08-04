-- สร้างตารางใหม่สำหรับเก็บข้อมูลพิกัดของหอพักและสถานที่ใกล้เคียง
CREATE TABLE location_coordinates (
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
CREATE INDEX idx_location_coordinates ON location_coordinates(latitude, longitude, location_type);
CREATE INDEX idx_dorm_locations ON location_coordinates(dorm_id, location_type);

-- ตัวอย่างการเพิ่มข้อมูลพิกัดสำหรับหอพักและสถานที่ใกล้เคียง
-- INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES 
-- -- พิกัดหอพัก
-- (1, 'dorm', 'หอพักมหาสารคาม 1', 16.246825, 103.255025, 'ตัวหอพักหลัก', 0),
-- -- สถานที่ใกล้เคียง
-- (1, 'university', 'มหาวิทยาลัยมหาสารคาม', 16.247123, 103.254876, 'มหาวิทยาลัยหลัก', 0.5),
-- (1, 'shopping', 'เสริมไทยคอมเพล็กซ์', 16.248456, 103.252341, 'ศูนย์การค้าใหญ่', 1.2),
-- (1, 'hospital', 'โรงพยาบาลมหาสารคาม', 16.245678, 103.256789, 'โรงพยาบาลประจำจังหวัด', 0.8),
-- (1, 'market', 'ตลาดเช้ามหาสารคาม', 16.246234, 103.253456, 'ตลาดสดใหญ่', 0.6),
-- (1, 'transport', 'สถานีขนส่งมหาสารคาม', 16.244567, 103.257890, 'สถานีขนส่งหลัก', 1.5);

-- คำสั่งตรวจสอบโครงสร้างตารางใหม่
DESCRIBE location_coordinates;

-- คำสั่งแสดงข้อมูลพิกัดของหอพักและสถานที่ใกล้เคียง
SELECT 
    d.id AS dorm_id,
    d.name AS dorm_name,
    lc.location_type,
    lc.location_name,
    lc.latitude,
    lc.longitude,
    lc.description,
    lc.distance_km,
    d.address_detail
FROM dorms d
LEFT JOIN location_coordinates lc ON d.id = lc.dorm_id
ORDER BY d.id, lc.location_type;

-- ค้นหาสถานที่ใกล้เคียงของหอพักเฉพาะ
-- SELECT * FROM location_coordinates WHERE dorm_id = 1 AND location_type != 'dorm';

-- ค้นหาหอพักใกล้มหาวิทยาลัย
-- SELECT DISTINCT d.*, lc.location_name, lc.distance_km 
-- FROM dorms d 
-- JOIN location_coordinates lc ON d.id = lc.dorm_id 
-- WHERE lc.location_type = 'university' AND lc.distance_km <= 2;
