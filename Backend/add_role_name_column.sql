-- เพิ่มคอลัมน์ role_name ใน admins table
-- แก้ไขปัญหา 400 Bad Request เมื่อส่งบทบาทเป็น text

-- 1. เพิ่มคอลัมน์ role_name
ALTER TABLE admins ADD COLUMN role_name VARCHAR(100) DEFAULT 'Admin';

-- 2. อัพเดทข้อมูลเดิมให้มี role_name
UPDATE admins a
LEFT JOIN roles r ON a.role_id = r.id
SET a.role_name = COALESCE(r.role_name, 'Admin')
WHERE a.role_name IS NULL OR a.role_name = '';

-- 3. อัพเดทข้อมูลที่ไม่มี role_id ให้เป็น 'Admin'
UPDATE admins SET role_name = 'Admin' WHERE role_name IS NULL OR role_name = '';

-- 4. แสดงข้อมูลที่อัพเดทแล้ว
SELECT id, firstName, lastName, email, role_id, role_name FROM admins ORDER BY id;
