# Location Coordinates API Documentation

## ภาพรวม
API สำหรับจัดการข้อมูลพิกัดของหอพักและสถานที่ใกล้เคียง รองรับการเก็บข้อมูลตำแหน่งของมหาวิทยาลัย โรงพยาบาล ตลาด ศูนย์การค้า สถานีขนส่ง และสถานที่อื่นๆ

## โครงสร้างฐานข้อมูล

### ตาราง location_coordinates
```sql
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
    FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE
);
```

## API Endpoints

### 1. เพิ่มสถานที่ใกล้เคียงสำหรับหอพัก
```http
POST /dorms/:dormId/nearby-locations
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "location_type": "university",
  "location_name": "มหาวิทยาลัยมหาสารคาม",
  "latitude": 16.247123,
  "longitude": 103.254876,
  "description": "มหาวิทยาลัยหลัก",
  "distance_km": 0.5
}
```

**Response (Success):**
```json
{
  "success": true,
  "location_id": 1,
  "message": "เพิ่มสถานที่ใกล้เคียงสำเร็จ"
}
```

### 2. ดูสถานที่ใกล้เคียงของหอพัก
```http
GET /dorms/:dormId/nearby-locations
```

**Query Parameters:**
- `location_type` (optional): กรองตามประเภทสถานที่

**Response:**
```json
[
  {
    "id": 1,
    "dorm_id": 1,
    "location_type": "dorm",
    "location_name": "หอพักมหาสารคาม 1",
    "latitude": 16.246825,
    "longitude": 103.255025,
    "description": "ตัวหอพักหลัก",
    "distance_km": 0,
    "dorm_name": "หอพักมหาสารคาม 1",
    "created_at": "2025-01-21T10:00:00Z",
    "updated_at": "2025-01-21T10:00:00Z"
  },
  {
    "id": 2,
    "dorm_id": 1,
    "location_type": "university",
    "location_name": "มหาวิทยาลัยมหาสารคาม",
    "latitude": 16.247123,
    "longitude": 103.254876,
    "description": "มหาวิทยาลัยหลัก",
    "distance_km": 0.5,
    "dorm_name": "หอพักมหาสารคาม 1",
    "created_at": "2025-01-21T10:05:00Z",
    "updated_at": "2025-01-21T10:05:00Z"
  }
]
```

### 3. แก้ไขสถานที่ใกล้เคียง
```http
PUT /nearby-locations/:locationId
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "location_type": "university",
  "location_name": "มหาวิทยาลัยมหาสารคาม (อัปเดต)",
  "latitude": 16.247200,
  "longitude": 103.254900,
  "description": "มหาวิทยาลัยหลัก - อัปเดตข้อมูล",
  "distance_km": 0.6
}
```

**Response:**
```json
{
  "success": true,
  "message": "แก้ไขสถานที่ใกล้เคียงสำเร็จ"
}
```

### 4. ลบสถานที่ใกล้เคียง
```http
DELETE /nearby-locations/:locationId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "ลบสถานที่ใกล้เคียงสำเร็จ"
}
```

### 5. ค้นหาหอพักตามสถานที่ใกล้เคียง
```http
GET /search/dorms-by-location
```

**Query Parameters:**
- `location_type` (optional): ประเภทสถานที่ เช่น "university", "hospital"
- `max_distance` (optional): ระยะทางสูงสุด (กิโลเมตร)

**Response:**
```json
[
  {
    "id": 1,
    "name": "หอพักมหาสารคาม 1",
    "price_monthly": 3000,
    "address_detail": "123 ถนนกันตรลักษ์",
    "nearby_locations": "university:มหาวิทยาลัยมหาสารคาม:0.5;hospital:โรงพยาบาลมหาสารคาม:0.8",
    "location_count": 3
  }
]
```

### 6. ค้นหาสถานที่ทั้งหมดตามประเภท
```http
GET /locations/by-type/:locationType
```

**Parameters:**
- `locationType`: ประเภทสถานที่ (university, hospital, market, shopping, transport, other)

**Response:**
```json
[
  {
    "id": 2,
    "dorm_id": 1,
    "location_type": "university",
    "location_name": "มหาวิทยาลัยมหาสารคาม",
    "latitude": 16.247123,
    "longitude": 103.254876,
    "description": "มหาวิทยาลัยหลัก",
    "distance_km": 0.5,
    "dorm_name": "หอพักมหาสารคาม 1",
    "dorm_address": "123 ถนนกันตรลักษ์",
    "created_at": "2025-01-21T10:05:00Z",
    "updated_at": "2025-01-21T10:05:00Z"
  }
]
```

### 7. ดูข้อมูลหอพักพร้อมสถานที่ใกล้เคียง (อัปเดต GET /dorms)
```http
GET /dorms
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "หอพักมหาสารคาม 1",
    "price_monthly": 3000,
    "address_detail": "123 ถนนกันตรลักษ์",
    "images": ["/uploads/image1.jpg"],
    "coordinates": [
      {
        "location_type": "dorm",
        "location_name": "หอพักมหาสารคาม 1",
        "latitude": 16.246825,
        "longitude": 103.255025,
        "distance_km": 0
      },
      {
        "location_type": "university",
        "location_name": "มหาวิทยาลัยมหาสารคาม",
        "latitude": 16.247123,
        "longitude": 103.254876,
        "distance_km": 0.5
      }
    ]
  }
]
```

## ประเภทสถานที่ (Location Types)

| Type | Label | คำอธิบาย |
|------|-------|----------|
| `dorm` | หอพัก | ตำแหน่งของหอพักเอง |
| `university` | มหาวิทยาลัย | สถาบันการศึกษาระดับอุดมศึกษา |
| `school` | โรงเรียน | สถาบันการศึกษาระดับพื้นฐาน |
| `hospital` | โรงพยาบาล | สถานพยาบาล |
| `market` | ตลาด | ตลาดสด/ตลาดนัด |
| `shopping` | ศูนย์การค้า | ห้างสรรพสินค้า/ศูนย์การค้า |
| `transport` | สถานีขนส่ง | สถานีรถเมล์/รถไฟ/ท่าอากาศยาน |
| `other` | อื่นๆ | สถานที่อื่นๆ |

## ตัวอย่างการใช้งาน Frontend

```javascript
// เพิ่มสถานที่ใกล้เคียง
const addNearbyLocation = async (dormId, locationData) => {
  const response = await fetch(`/dorms/${dormId}/nearby-locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(locationData)
  });
  return response.json();
};

// ดูสถานที่ใกล้เคียง
const getNearbyLocations = async (dormId, locationType = null) => {
  const params = locationType ? `?location_type=${locationType}` : '';
  const response = await fetch(`/dorms/${dormId}/nearby-locations${params}`);
  return response.json();
};

// ค้นหาหอพักใกล้มหาวิทยาลัย
const findDormsNearUniversity = async (maxDistance = 2) => {
  const response = await fetch(`/search/dorms-by-location?location_type=university&max_distance=${maxDistance}`);
  return response.json();
};
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง"
}
```

### 401 Unauthorized
```json
{
  "error": "ไม่มีสิทธิ์เข้าถึง"
}
```

### 404 Not Found
```json
{
  "error": "ไม่พบสถานที่ที่ต้องการแก้ไข"
}
```

### 500 Internal Server Error
```json
{
  "error": "เกิดข้อผิดพลาดในระบบ"
}
```

## การคำนวณระยะทาง

สามารถใช้ Haversine formula สำหรับคำนวณระยะทางระหว่างพิกัด:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลกในหน่วยกิโลเมตร
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // ระยะทางในกิโลเมตร
}
```

## การติดตั้งและใช้งาน

1. รันคำสั่ง SQL ในไฟล์ `add_coordinates.sql` เพื่อสร้างตาราง
2. รีสตาร์ท Backend server
3. ใช้งาน API endpoints ตามเอกสารนี้
4. Frontend มี NearbyLocationManager component สำหรับจัดการสถานที่ใกล้เคียง
