# วิธีการขอ Google Maps API Key สำหรับ Distance Calculation

## 🚀 **ขั้นตอนการขอ API Key:**

### 1. **เข้าสู่ Google Cloud Console**
- ไปที่: https://console.cloud.google.com/
- Login ด้วย Google Account

### 2. **สร้าง Project ใหม่**
- คลิก "Create Project"
- ตั้งชื่อ project: เช่น "Smart Dorm Maps"
- คลิก "Create"

### 3. **เปิดใช้งาน APIs**
เปิดใช้งาน APIs ที่จำเป็น:
- **Directions API** (สำหรับคำนวณระยะทาง)
- **Maps JavaScript API** (สำหรับแผนที่)
- **Geocoding API** (สำหรับแปลงที่อยู่เป็นพิกัด)

วิธีเปิด:
1. ไปที่ "APIs & Services" > "Library"
2. ค้นหา "Directions API" และคลิก "Enable"
3. ทำซ้ำกับ API อื่นๆ

### 4. **สร้าง API Key**
1. ไปที่ "APIs & Services" > "Credentials"
2. คลิก "Create Credentials" > "API Key"
3. Copy API Key ที่ได้

### 5. **ตั้งค่า API Key Restrictions (แนะนำ)**
1. คลิก "Edit" ที่ API Key
2. เลือก "HTTP referrers (web sites)"
3. เพิ่ม URLs:
   - `http://localhost:5173/*` (สำหรับ dev)
   - `https://yourdomain.com/*` (สำหรับ production)

### 6. **ใส่ API Key ในโปรเจค**
เปิดไฟล์ `.env.local` และใส่:
```
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

## 💳 **ข้อมูลการเรียกเก็บเงิน:**

Google Maps API มี **Free Tier** ที่ให้ใช้งานฟรี:
- **Directions API**: 2,500 คำขอ/วัน ฟรี
- **Maps JavaScript API**: 28,000 โหลด/เดือน ฟรี

## 🔒 **การรักษาความปลอดภัย:**

1. **ไม่เผยแพร่ API Key** ในโค้ดที่ public
2. **ตั้งค่า Restrictions** ให้เข้มงวด
3. **Monitor การใช้งาน** ใน Google Cloud Console
4. **Rotate API Key** เป็นระยะ

## 🧪 **ทดสอบ API Key:**

รัน command นี้ใน terminal:
```bash
curl "https://maps.googleapis.com/maps/api/directions/json?origin=16.19726537,103.28489034&destination=16.1967,103.3003&key=YOUR_API_KEY"
```

ถ้าได้ผลลัพธ์ JSON แปลว่า API Key ใช้งานได้!

## 🔄 **Fallback System:**

ระบบมี fallback automatic:
- ถ้า Google API ใช้งานไม่ได้ → ใช้ Haversine Formula
- ถ้าไม่มี API Key → ใช้การประมาณการ
- ระบบจะไม่ crash แม้ API มีปัญหา

## 📈 **ผลลัพธ์ที่คาดหวัง:**

เมื่อตั้งค่าเสร็จ จะเห็น:
```
🗺️ ม.ราชภัฏมหาสารคาม [GPS]
🚗 2.1 กม. (5 นาที)      ← จาก Google API
🚶 1.8 กม. (20 นาที)     ← จาก Google API
```

แทนที่จะเป็น:
```
🗺️ ม.ราชภัฏมหาสารคาม [GPS]
📏 1.6 กม. (เส้นตรง)     ← Haversine fallback
```
