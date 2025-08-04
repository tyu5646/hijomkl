-- เพิ่มข้อมูลตัวอย่างในตาราง location_coordinates ฐานข้อมูล efllll

USE efllll;

-- ตรวจสอบหอพักที่มีอยู่
SELECT id, name FROM dorms LIMIT 10;

-- เพิ่มข้อมูลพิกัดสำหรับหอพัก (สมมติว่า dorm_id = 1 มีอยู่)
-- ใส่พิกัดหอพักก่อน
INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES 
(1, 'dorm', 'หอพักหลัก', 16.246825, 103.255025, 'ตัวหอพักหลัก', 0);

-- เพิ่มสถานที่ใกล้เคียง
INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES 
(1, 'university', 'มหาวิทยาลัยมหาสารคาม', 16.247123, 103.254876, 'มหาวิทยาลัยหลัก', 0.5),
(1, 'shopping', 'เสริมไทยคอมเพล็กซ์', 16.248456, 103.252341, 'ศูนย์การค้าใหญ่', 1.2),
(1, 'hospital', 'โรงพยาบาลมหาสารคาม', 16.245678, 103.256789, 'โรงพยาบาลประจำจังหวัด', 0.8),
(1, 'market', 'ตลาดเช้า', 16.246234, 103.253456, 'ตลาดสดใหญ่', 0.6),
(1, 'transport', 'สถานีขนส่ง', 16.244567, 103.257890, 'สถานีขนส่งหลัก', 1.5);

-- ตรวจสอบข้อมูลที่เพิ่มเข้าไป
SELECT * FROM location_coordinates;

-- ทดสอบ Query แบบ JOIN
SELECT 
    d.id AS dorm_id,
    d.name AS dorm_name,
    lc.location_type,
    lc.location_name,
    lc.latitude,
    lc.longitude,
    lc.description,
    lc.distance_km
FROM dorms d
LEFT JOIN location_coordinates lc ON d.id = lc.dorm_id
WHERE d.id = 1
ORDER BY lc.location_type, lc.distance_km;
