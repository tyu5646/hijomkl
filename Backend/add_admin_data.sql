-- ================================
-- คำสั่ง SQL เพิ่มข้อมูลแอดมิน
-- รหัสผ่าน: 123456pp
-- แก้ไข Foreign Key constraint ด้วยการเพิ่ม roles ก่อน
-- ================================

-- 1. สร้างตาราง roles ก่อน (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. เพิ่มข้อมูล roles
INSERT INTO roles (id, role_name, description, permissions) VALUES
(1, 'Super Admin', 'ผู้ดูแลระบบสูงสุด มีสิทธิ์เต็มทุกอย่าง', '["all"]'),
(2, 'Admin', 'ผู้ดูแลระบบทั่วไป', '["manage_dorms", "approve_dorms", "manage_users"]'),
(3, 'Moderator', 'ผู้ช่วยดูแลระบบ', '["view_dorms", "support_users"]'),
(4, 'Support', 'ทีมสนับสนุน', '["view_dorms", "customer_support"]')
ON DUPLICATE KEY UPDATE
role_name = VALUES(role_name),
description = VALUES(description),
permissions = VALUES(permissions);

-- 3. สร้างตาราง admins (ถ้ายังไม่มี) ตามโครงสร้างที่กำหนด
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    age INT,
    dob DATE,
    houseNo VARCHAR(20),
    moo VARCHAR(10),
    soi VARCHAR(50),
    road VARCHAR(100),
    subdistrict VARCHAR(50),
    district VARCHAR(50),
    province VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role_id INT DEFAULT 2,
    zip_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 4. เพิ่มข้อมูลแอดมินหลัก (Super Admin)
INSERT INTO admins (
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, password, phone, role_id, zip_code
) VALUES
(
    'ผู้ดูแล', 'ระบบสูงสุด', 35, '1989-01-15', '123', '5', 'สายไหม', 'ถนนพหลโยธิน',
    'สายไหม', 'บางเขน', 'กรุงเทพมหานคร', 'superadmin@smartdorm.com', 
    '$2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW', 
    '02-123-4567', 1, '10220'
);

-- 5. เพิ่มแอดมินหลัก
INSERT INTO admins (
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, password, phone, role_id, zip_code
) VALUES
(
    'ผู้ดูแล', 'ระบบหลัก', 32, '1992-03-20', '456', '8', 'ลาดพร้าว', 'ถนนลาดพร้าว',
    'ลาดพร้าว', 'จตุจักร', 'กรุงเทพมหานคร', 'admin@smartdorm.com',
    '$2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW',
    '02-234-5678', 2, '10900'
);

-- 6. เพิ่มแอดมินสำหรับการอนุมัติ
INSERT INTO admins (
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, password, phone, role_id, zip_code
) VALUES
(
    'สมชาย', 'อนุมัติดี', 29, '1995-07-10', '789', '12', 'รามคำแหง', 'ถนนรามคำแหง',
    'หัวหมาก', 'บางกะปิ', 'กรุงเทพมหานคร', 'approve@smartdorm.com',
    '$2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW',
    '02-345-6789', 2, '10240'
);

-- 7. เพิ่มแอดมินสำหรับสนับสนุน
INSERT INTO admins (
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, password, phone, role_id, zip_code
) VALUES
(
    'สมหญิง', 'ช่วยเหลือ', 27, '1997-11-25', '321', '3', 'อ่อนนุช', 'ถนนสุขุมวิท',
    'ประเวศ', 'ประเวศ', 'กรุงเทพมหานคร', 'support@smartdorm.com',
    '$2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW',
    '02-456-7890', 4, '10250'
);

-- 8. เพิ่มแอดมินภูมิภาค - เชียงใหม่
INSERT INTO admins (
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, password, phone, role_id, zip_code
) VALUES
(
    'สมศรี', 'เหนือดี', 31, '1993-05-18', '88', '7', 'นิมมานเหมินท์', 'ถนนนิมมานเหมินท์',
    'สุเทพ', 'เมืองเชียงใหม่', 'เชียงใหม่', 'north@smartdorm.com',
    '$2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW',
    '053-567-8901', 2, '50200'
);

-- 9. เพิ่มแอดมินภูมิภาค - ภูเก็ต
INSERT INTO admins (
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, password, phone, role_id, zip_code
) VALUES
(
    'สมปอง', 'ใต้สุด', 28, '1996-12-08', '555', '15', 'ป่าตอง', 'ถนนทวีวงศ์',
    'ป่าตอง', 'กะทู้', 'ภูเก็ต', 'south@smartdorm.com',
    '$2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW',
    '076-678-9012', 2, '83150'
);

-- 10. เพิ่มแอดมินภูมิภาค - ขอนแก่น
INSERT INTO admins (
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, password, phone, role_id, zip_code
) VALUES
(
    'สมคิด', 'อีสานใจดี', 33, '1991-09-12', '777', '9', 'ศิลาทอง', 'ถนนมิตรภาพ',
    'ในเมือง', 'เมืองขอนแก่น', 'ขอนแก่น', 'northeast@smartdorm.com',
    '$2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW',
    '043-789-0123', 2, '40000'
);

-- ================================
-- ข้อมูลการเข้าสู่ระบบ
-- ================================
/*
1. Email: superadmin@smartdorm.com
   Password: 123456pp
   ชื่อ: ผู้ดูแล ระบบสูงสุด
   Role: Super Admin (ID: 1)

2. Email: admin@smartdorm.com
   Password: 123456pp
   ชื่อ: ผู้ดูแล ระบบหลัก
   Role: Admin (ID: 2)

3. Email: approve@smartdorm.com
   Password: 123456pp
   ชื่อ: สมชาย อนุมัติดี
   Role: Admin (ID: 2)

4. Email: support@smartdorm.com
   Password: 123456pp
   ชื่อ: สมหญิง ช่วยเหลือ
   Role: Support (ID: 4)

5. Email: north@smartdorm.com
   Password: 123456pp
   ชื่อ: สมศรี เหนือดี (เชียงใหม่)
   Role: Admin (ID: 2)

6. Email: south@smartdorm.com
   Password: 123456pp
   ชื่อ: สมปอง ใต้สุด (ภูเก็ต)
   Role: Admin (ID: 2)

7. Email: northeast@smartdorm.com
   Password: 123456pp
   ชื่อ: สมคิด อีสานใจดี (ขอนแก่น)
   Role: Admin (ID: 2)
*/

-- 11. ตรวจสอบข้อมูลที่เพิ่มแล้ว
SELECT 
    a.id, 
    CONCAT(a.firstName, ' ', a.lastName) as full_name,
    a.email, 
    a.phone,
    CONCAT(a.houseNo, ' หมู่ ', a.moo, ' ', a.soi, ' ', a.road) as address,
    CONCAT(a.subdistrict, ' ', a.district, ' ', a.province, ' ', a.zip_code) as location,
    r.role_name,
    a.created_at 
FROM admins a
LEFT JOIN roles r ON a.role_id = r.id
ORDER BY a.id ASC;

-- 12. ตรวจสอบข้อมูล roles
SELECT * FROM roles ORDER BY id;

-- 13. สร้าง Index เพื่อประสิทธิภาพ
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role_id ON admins(role_id);
CREATE INDEX idx_admins_province ON admins(province);

-- 14. ตรวจสอบจำนวนแอดมินแต่ละ role
SELECT r.role_name, COUNT(a.id) as admin_count 
FROM roles r
LEFT JOIN admins a ON r.id = a.role_id
GROUP BY r.id, r.role_name;

-- 15. ตรวจสอบการกระจายตามจังหวัด
SELECT province, COUNT(*) as admin_count 
FROM admins 
GROUP BY province;

-- ================================
-- คำสั่ง Troubleshooting
-- ================================

-- หากยังมีปัญหา Foreign Key ให้ลองคำสั่งนี้:
-- SET FOREIGN_KEY_CHECKS = 0;
-- (รันคำสั่ง INSERT ข้างบน)
-- SET FOREIGN_KEY_CHECKS = 1;

-- หรือตรวจสอบข้อมูลใน roles table ก่อน:
-- SELECT * FROM roles;

-- ตรวจสอบ constraint ที่มีอยู่:
-- SHOW CREATE TABLE admins;

-- ================================
-- หมายเหตุสำคัญ
-- ================================
-- 🔐 รหัสผ่าน hash: $2b$10$Y9GkQe8Tv8kJr.S6vWm4R.UVB6zLxNH5tY2uX3.p7s9G1K8M4Q2vW
-- 🗝️ รหัสผ่านจริง: 123456pp
-- 🚨 ควรเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก
-- 📧 ใช้ email เป็นชื่อผู้ใช้ในการ login
-- 📱 ข้อมูลที่อยู่และเบอร์โทรเป็นตัวอย่าง สามารถแก้ไขได้
-- 🏠 Role IDs: 1=Super Admin, 2=Admin, 3=Moderator, 4=Support
-- 🔗 แก้ไข Foreign Key constraint โดยสร้าง roles table ก่อน
