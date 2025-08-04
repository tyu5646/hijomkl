-- ตัวอย่างข้อมูลสำหรับทดสอบระบบพิกัดสถานที่ใกล้เคียง

-- เพิ่มข้อมูลพิกัดสำหรับหอพักที่มีอยู่แล้ว (สมมติว่ามี dorm_id = 1, 2, 3)
-- แทรกข้อมูลพิกัดของหอพักก่อน
INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES 
-- พิกัดหอพักหลัก
(1, 'dorm', 'หอพักมหาสารคาม 1', 16.246825, 103.255025, 'ตัวหอพักหลัก', 0),
(2, 'dorm', 'หอพักใกล้มหาลัย', 16.247500, 103.254500, 'หอพักสำหรับนักศึกษา', 0),
(3, 'dorm', 'หอพักเซ็นทรัล', 16.248000, 103.252000, 'หอพักใกล้ศูนย์การค้า', 0);

-- เพิ่มสถานที่ใกล้เคียงสำหรับหอพัก ID = 1
INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES 
(1, 'university', 'มหาวิทยาลัยมหาสารคาม', 16.247123, 103.254876, 'มหาวิทยาลัยหลักของจังหวัด', 0.5),
(1, 'shopping', 'เสริมไทยคอมเพล็กซ์', 16.248456, 103.252341, 'ศูนย์การค้าใหญ่ที่สุดในจังหวัด', 1.2),
(1, 'hospital', 'โรงพยาบาลมหาสารคาม', 16.245678, 103.256789, 'โรงพยาบาลประจำจังหวัด', 0.8),
(1, 'market', 'ตลาดเช้ามหาสารคาม', 16.246234, 103.253456, 'ตลาดสดใหญ่ เปิด 5.00-11.00 น.', 0.6),
(1, 'transport', 'สถานีขนส่งมหาสารคาม', 16.244567, 103.257890, 'สถานีขนส่งหลักของจังหวัด', 1.5);

-- เพิ่มสถานที่ใกล้เคียงสำหรับหอพัก ID = 2
INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES 
(2, 'university', 'มหาวิทยาลัยมหาสารคาม', 16.247123, 103.254876, 'มหาวิทยาลัยหลัก', 0.3),
(2, 'school', 'โรงเรียนมหาสารคามวิทยาลัย', 16.246800, 103.254200, 'โรงเรียนมัธยมชั้นนำ', 0.4),
(2, 'market', 'ตลาดโต้รุ่งมหาสารคาม', 16.247800, 103.254100, 'ตลาดโต้รุ่ง เปิด 17.00-22.00 น.', 0.7),
(2, 'shopping', 'ห้างสรรพสินค้ามหาสารคาม', 16.248200, 103.253800, 'ห้างสรรพสินค้าชุมชน', 0.9);

-- เพิ่มสถานที่ใกล้เคียงสำหรับหอพัก ID = 3
INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES 
(3, 'shopping', 'เสริมไทยคอมเพล็กซ์', 16.248456, 103.252341, 'ศูนย์การค้าหลัก', 0.2),
(3, 'hospital', 'คลินิกเอกชน ABC', 16.248300, 103.252100, 'คลินิกเอกชนคุณภาพ', 0.1),
(3, 'transport', 'ป้ายรถเมล์สาย 1', 16.248100, 103.252050, 'ป้ายรถเมล์หลัก', 0.05),
(3, 'other', 'ธนาคารกสิกรไทย', 16.248200, 103.252200, 'สาขาหลักในตัวเมือง', 0.1),
(3, 'other', '7-Eleven', 16.248050, 103.252080, 'ร้านสะดวกซื้อ 24 ชม.', 0.03);

-- คำสั่งตรวจสอบข้อมูลที่เพิ่มเข้าไป
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
WHERE d.id IN (1, 2, 3)
ORDER BY d.id, lc.location_type, lc.distance_km;

-- ตรวจสอบจำนวนสถานที่ใกล้เคียงของแต่ละหอพัก
SELECT 
    d.id,
    d.name,
    COUNT(lc.id) AS total_locations,
    COUNT(CASE WHEN lc.location_type != 'dorm' THEN 1 END) AS nearby_locations
FROM dorms d
LEFT JOIN location_coordinates lc ON d.id = lc.dorm_id
WHERE d.id IN (1, 2, 3)
GROUP BY d.id, d.name
ORDER BY d.id;
