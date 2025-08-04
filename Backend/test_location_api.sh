#!/bin/bash

# ไฟล์ทดสอบ API สำหรับระบบจัดการสถานที่ใกล้เคียง
# วิธีใช้: bash test_location_api.sh
# หรือรันทีละคำสั่งใน PowerShell/CMD

echo "=== ทดสอบระบบจัดการสถานที่ใกล้เคียง ==="
echo "URL Base: http://localhost:3001"
echo ""

# ตัวแปรสำหรับ token (ต้องเปลี่ยนตาม token จริง)
TOKEN="YOUR_OWNER_TOKEN_HERE"

echo "1. ทดสอบดูสถานที่ใกล้เคียงของหอพัก ID=1"
curl -X GET "http://localhost:3001/dorms/1/nearby-locations" \
  -H "Content-Type: application/json"

echo -e "\n\n2. ทดสอบดูสถานที่ใกล้เคียงประเภทมหาวิทยาลัย"
curl -X GET "http://localhost:3001/dorms/1/nearby-locations?location_type=university" \
  -H "Content-Type: application/json"

echo -e "\n\n3. ทดสอบเพิ่มสถานที่ใหม่ (ต้องมี token)"
curl -X POST "http://localhost:3001/dorms/1/nearby-locations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location_type": "other",
    "location_name": "ร้านกาแฟดีๆ",
    "latitude": 16.246900,
    "longitude": 103.255100,
    "description": "ร้านกาแฟบรรยากาศดี เปิด 7.00-20.00",
    "distance_km": 0.2
  }'

echo -e "\n\n4. ทดสอบค้นหาหอพักตามสถานที่ใกล้เคียง"
curl -X GET "http://localhost:3001/search/dorms-by-location?location_type=university&max_distance=1" \
  -H "Content-Type: application/json"

echo -e "\n\n5. ทดสอบดูสถานที่ประเภทมหาวิทยาลัยทั้งหมด"
curl -X GET "http://localhost:3001/locations/by-type/university" \
  -H "Content-Type: application/json"

echo -e "\n\n6. ทดสอบดูข้อมูลหอพักพร้อมพิกัด (GET /dorms)"
curl -X GET "http://localhost:3001/dorms" \
  -H "Content-Type: application/json"

echo -e "\n\n=== เสร็จสิ้นการทดสอบ ==="
