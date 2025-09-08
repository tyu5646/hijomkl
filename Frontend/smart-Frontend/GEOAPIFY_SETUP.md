# 🗺️ Geoapify Static Map Integration

## 📋 Overview
ระบบแผนที่แบบ Static Map ใช้ Geoapify API เพื่อแสดงแผนที่ในการ์ดหอพักและหน้ารายละเอียด

## 🚀 Features Implemented

### ✅ Static Map API
- แสดงแผนที่ในการ์ดหอพัก (300x96px)
- แสดงแผนที่ในหน้ารายละเอียด (400x250px)
- Marker แสดงตำแหน่งหอพัก
- Hover effects และ navigation buttons
- Fallback UI เมื่อไม่สามารถโหลดแผนที่ได้

### 🎯 Benefits
- **Performance**: รูปแผนที่โหลดเร็วกว่า Interactive Map
- **Bandwidth**: ใช้ data น้อยกว่า
- **SEO**: รูปภาพแผนที่ช่วย SEO
- **Mobile**: เหมาะกับ mobile device

## 🔑 API Key Setup

### 1. สมัคร Geoapify Account
```bash
# เข้าไปที่ https://www.geoapify.com/
# สมัครสมาชิกฟรี
# รับ API Key
```

### 2. เพิ่ม API Key ในไฟล์ .env
```bash
# Frontend/.env
VITE_GEOAPIFY_API_KEY=your_actual_api_key_here
```

### 3. Restart Development Server
```bash
npm run dev
```

## 📊 Free Tier Limits
- **3,000 requests/day**
- **5 requests/second**
- **Static Map API** ✅
- **Geocoding API** ✅
- **Places API** ✅
- **Routing API** ✅

## 🛠️ Technical Implementation

### StaticMapComponent Props
```jsx
<StaticMapComponent
  latitude="16.4418"          // พิกัด latitude
  longitude="102.8160"        // พิกัด longitude  
  dormName="หอพักตัวอย่าง"     // ชื่อหอพัก
  width={300}                 // ความกว้างรูป (px)
  height={200}                // ความสูงรูป (px)
  zoom={15}                   // ระดับ zoom (1-20)
/>
```

### Generated URL Example
```
https://maps.geoapify.com/v1/staticmap
?style=osm-bright
&width=300
&height=200
&center=lonlat:102.8160,16.4418
&zoom=15
&marker=lonlat:102.8160,16.4418;type:material;color:%23ff0000;size:large
&apiKey=your_api_key
```

## 🎨 UI/UX Features

### Card View (300x96px)
- Mini แผนที่ในการ์ดหอพัก
- แสดงตำแหน่งคร่าวๆ
- Click เพื่อดูรายละเอียด

### Detail View (400x250px)
- แผนที่ขนาดใหญ่
- Navigation buttons
- Google Maps integration
- Directions link

### Fallback UI
- แสดงเมื่อไม่มีพิกัด
- ข้อมูลพื้นฐาน
- External map links

## 🚀 Next Phase Features

### Phase 2: Interactive Features
```jsx
// Places API - หาสถานที่ใกล้เคียง
const nearbyPlaces = await fetch(`
  https://api.geoapify.com/v2/places
  ?categories=catering.restaurant
  &filter=circle:${lng},${lat},1000
  &apiKey=${API_KEY}
`);

// Route Planner API - คำนวณเส้นทาง
const route = await fetch(`
  https://api.geoapify.com/v1/routing
  ?waypoints=${dormLat},${dormLng}|${uniLat},${uniLng}
  &mode=walk
  &apiKey=${API_KEY}
`);

// Geocoding API - แปลงที่อยู่เป็นพิกัด
const geocode = await fetch(`
  https://api.geoapify.com/v1/geocode/search
  ?text=${address}
  &apiKey=${API_KEY}
`);
```

## 📈 Performance Monitoring

### Monitor Usage
```javascript
// ตรวจสอบ daily usage
console.log('Map requests today:', dailyCount);

// Optimize requests
if (dailyCount > 2500) {
  // Switch to fallback mode
  setUseStaticMap(false);
}
```

### Best Practices
- Cache รูปแผนที่
- Lazy loading
- Optimize image sizes
- Use appropriate zoom levels

## 🔧 Troubleshooting

### Common Issues
1. **API Key not working**
   - ตรวจสอบ .env file
   - Restart dev server
   - ตรวจสอบ domain restrictions

2. **Maps not loading**
   - ตรวจสอบ network
   - ตรวจสอบ daily limits
   - ดู browser console

3. **Invalid coordinates**
   - ตรวจสอบ latitude/longitude format
   - ต้องเป็น number format
   - ช่วง lat: -90 to 90, lng: -180 to 180

## 📞 Support
- [Geoapify Documentation](https://apidocs.geoapify.com/)
- [Community Forum](https://www.geoapify.com/community)
- [Support Email](mailto:support@geoapify.com)

---
*Updated: September 2025*
*Smart Dorm Platform v1.0*
