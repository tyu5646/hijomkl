-- API Endpoints สำหรับจัดการพิกัดหอพัก

-- 1. ดึงพิกัดของหอพักทั้งหมด
GET /api/coordinates
SELECT 
  dc.id,
  dc.dorm_id,
  d.name as dorm_name,
  dc.latitude,
  dc.longitude,
  dc.address_name,
  dc.created_at,
  dc.updated_at
FROM dorm_coordinates dc
JOIN dorms d ON dc.dorm_id = d.id;

-- 2. ดึงพิกัดของหอพักเฉพาะ
GET /api/coordinates/:dormId
SELECT * FROM dorm_coordinates WHERE dorm_id = ?;

-- 3. เพิ่มพิกัดหอพัก
POST /api/coordinates
INSERT INTO dorm_coordinates (dorm_id, latitude, longitude, address_name) 
VALUES (?, ?, ?, ?);

-- 4. อัปเดตพิกัดหอพัก
PUT /api/coordinates/:dormId
UPDATE dorm_coordinates 
SET latitude = ?, longitude = ?, address_name = ?, updated_at = CURRENT_TIMESTAMP
WHERE dorm_id = ?;

-- 5. ลบพิกัดหอพัก
DELETE /api/coordinates/:dormId
DELETE FROM dorm_coordinates WHERE dorm_id = ?;

-- 6. ค้นหาหอพักใกล้เคียงตามระยะทาง (Haversine formula)
GET /api/coordinates/nearby?lat=&lng=&radius=
SELECT 
  dc.*,
  d.name,
  d.address_detail,
  (6371 * acos(cos(radians(?)) * cos(radians(dc.latitude)) * 
   cos(radians(dc.longitude) - radians(?)) + 
   sin(radians(?)) * sin(radians(dc.latitude)))) AS distance
FROM dorm_coordinates dc
JOIN dorms d ON dc.dorm_id = d.id
WHERE d.status = 'approved'
HAVING distance < ?
ORDER BY distance LIMIT 10;
