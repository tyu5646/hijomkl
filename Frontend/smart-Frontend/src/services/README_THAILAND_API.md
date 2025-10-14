# 🇹🇭 Thailand Geography API Service

บริการดึงข้อมูลจังหวัด อำเภอ ตำบล ของประเทศไทยจาก External API

## 📦 ข้อมูลที่ได้

- ✅ **77 จังหวัด** (Provinces)
- ✅ **928 อำเภอ/เขต** (Amphures/Districts) 
- ✅ **7,255 ตำบล/แขวง** (Tambons/Sub-districts)
- ✅ **รหัสไปรษณีย์** (ZIP Codes)

## 🌐 แหล่งข้อมูล

**Thailand Geography JSON** (GitHub)
- 🔗 Repository: https://github.com/thailand-geography-data/thailand-geography-json
- ✅ ข้อมูลอัพเดตล่าสุด
- ✅ ใช้งานฟรี ไม่ต้อง API Key
- ✅ มี Cache เพื่อลดการ fetch

## 📖 วิธีใช้งาน

### 1. Import Service

```javascript
import {
  getProvinces,
  getAmphures,
  getTambons,
  searchProvinces,
  searchAmphures,
  searchTambons,
  clearCache
} from '../services/thailandGeography';
```

### 2. ดึงข้อมูลจังหวัดทั้งหมด

```javascript
const loadProvinces = async () => {
  try {
    const provinces = await getProvinces();
    console.log('จำนวนจังหวัด:', provinces.length); // 77
    setProvinces(provinces);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**ผลลัพธ์:**
```javascript
[
  {
    id: 1,
    name_th: 'กรุงเทพมหานคร',
    name_en: 'Bangkok',
    code: '10',
    geography_id: 2
  },
  {
    id: 32,
    name_th: 'มหาสารคาม',
    name_en: 'Maha Sarakham',
    code: '44',
    geography_id: 3
  },
  // ... 75 จังหวัดอื่นๆ
]
```

### 3. ดึงข้อมูลอำเภอ

```javascript
// ดึงอำเภอทั้งหมด (928 อำเภอ)
const allAmphures = await getAmphures();

// ดึงเฉพาะอำเภอในจังหวัดมหาสารคาม (province_id = 32)
const mahasarakhamAmphures = await getAmphures(32);
console.log('อำเภอในมหาสารคาม:', mahasarakhamAmphures.length); // 13
```

**ผลลัพธ์:**
```javascript
[
  {
    id: 3201,
    name_th: 'เมืองมหาสารคาม',
    name_en: 'Mueang Maha Sarakham',
    province_id: 32,
    code: '4401'
  },
  {
    id: 3202,
    name_th: 'กันทรวิชัย',
    name_en: 'Kantharawichai',
    province_id: 32,
    code: '4402'
  },
  // ... อำเภออื่นๆ
]
```

### 4. ดึงข้อมูลตำบล

```javascript
// ดึงตำบลทั้งหมด (7,255 ตำบล)
const allTambons = await getTambons();

// ดึงเฉพาะตำบลในอำเภอเมืองมหาสารคาม (amphure_id = 3201)
const mueanTambons = await getTambons(3201);
console.log('ตำบลในอำเภอเมือง:', mueanTambons.length); // 20
```

**ผลลัพธ์:**
```javascript
[
  {
    id: 320101,
    name_th: 'ตลาด',
    name_en: 'Talat',
    amphure_id: 3201,
    zip_code: '44000'
  },
  {
    id: 320102,
    name_th: 'เขวา',
    name_en: 'Khwao',
    amphure_id: 3201,
    zip_code: '44000'
  },
  // ... ตำบลอื่นๆ
]
```

### 5. ค้นหาข้อมูล

```javascript
// ค้นหาจังหวัด
const searchResults = await searchProvinces('มหา');
// ผลลัพธ์: มหาสารคาม, นครศรีธรรมราช (มหาสารคาม)

// ค้นหาอำเภอในจังหวัดมหาสารคาม
const amphureResults = await searchAmphures('กัน', 32);
// ผลลัพธ์: กันทรวิชัย

// ค้นหาตำบล
const tambonResults = await searchTambons('ตลาด');
// ผลลัพธ์: ตลาด (ทุกจังหวัด), ตลาดไก่, ตลาดหลวง, etc.
```

### 6. ล้าง Cache

```javascript
// ล้าง cache เมื่อต้องการ refresh ข้อมูล
clearCache();

// จากนั้นเรียกใช้ใหม่จะไป fetch API อีกครั้ง
const freshData = await getProvinces();
```

## 🎯 ตัวอย่างการใช้งานใน Component

### ตัวอย่างที่ 1: Dropdown จังหวัด-อำเภอ-ตำบล

```javascript
import React, { useState, useEffect } from 'react';
import { getProvinces, getAmphures, getTambons } from '../services/thailandGeography';

function AddressForm() {
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedAmphure, setSelectedAmphure] = useState('');
  const [selectedTambon, setSelectedTambon] = useState('');

  // โหลดจังหวัดตอน mount
  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    const data = await getProvinces();
    setProvinces(data);
  };

  const handleProvinceChange = async (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedAmphure('');
    setSelectedTambon('');
    setTambons([]);
    
    // ดึงอำเภอในจังหวัดที่เลือก
    const amphureData = await getAmphures(provinceId);
    setAmphures(amphureData);
  };

  const handleAmphureChange = async (amphureId) => {
    setSelectedAmphure(amphureId);
    setSelectedTambon('');
    
    // ดึงตำบลในอำเภอที่เลือก
    const tambonData = await getTambons(amphureId);
    setTambons(tambonData);
  };

  return (
    <div>
      {/* จังหวัด */}
      <select 
        value={selectedProvince} 
        onChange={(e) => handleProvinceChange(e.target.value)}
      >
        <option value="">เลือกจังหวัด</option>
        {provinces.map(province => (
          <option key={province.id} value={province.id}>
            {province.name_th}
          </option>
        ))}
      </select>

      {/* อำเภอ */}
      <select 
        value={selectedAmphure} 
        onChange={(e) => handleAmphureChange(e.target.value)}
        disabled={!selectedProvince}
      >
        <option value="">เลือกอำเภอ</option>
        {amphures.map(amphure => (
          <option key={amphure.id} value={amphure.id}>
            {amphure.name_th}
          </option>
        ))}
      </select>

      {/* ตำบล */}
      <select 
        value={selectedTambon} 
        onChange={(e) => setSelectedTambon(e.target.value)}
        disabled={!selectedAmphure}
      >
        <option value="">เลือกตำบล</option>
        {tambons.map(tambon => (
          <option key={tambon.id} value={tambon.id}>
            {tambon.name_th} (รหัสไปรษณีย์: {tambon.zip_code})
          </option>
        ))}
      </select>
    </div>
  );
}
```

### ตัวอย่างที่ 2: Autocomplete Search

```javascript
import React, { useState } from 'react';
import { searchProvinces } from '../services/thailandGeography';

function ProvinceAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (searchText) => {
    setQuery(searchText);
    
    if (searchText.length >= 2) {
      const searchResults = await searchProvinces(searchText);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="ค้นหาจังหวัด..."
      />
      
      {results.length > 0 && (
        <ul className="autocomplete-results">
          {results.map(province => (
            <li 
              key={province.id}
              onClick={() => {
                setQuery(province.name_th);
                setResults([]);
              }}
            >
              {province.name_th} ({province.name_en})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## ⚡ Performance Tips

### 1. ใช้ Cache
API มี built-in cache อัตโนมัติ ครั้งแรกจะดึงจาก GitHub, ครั้งถัดไปใช้ cache

### 2. กรองข้อมูล
```javascript
// ❌ ไม่ดี - ดึงทั้งหมดแล้วค่อยกรอง
const all = await getAmphures();
const filtered = all.filter(a => a.province_id === 32);

// ✅ ดี - กรองตอนดึง
const filtered = await getAmphures(32);
```

### 3. Preload ข้อมูล
```javascript
// โหลดข้อมูลล่วงหน้าตอน App.jsx mount
useEffect(() => {
  getProvinces(); // จะถูก cache ไว้
}, []);
```

## 🔧 Fallback Data

ถ้า API ไม่ตอบสนอง (network error, GitHub down):
- จะใช้ข้อมูล Fallback ที่มีในตัว
- ✅ 77 จังหวัด (ครบ)
- ⚠️ อำเภอและตำบลมีเฉพาะพื้นที่หลักๆ

## 🐛 Troubleshooting

### API ไม่ทำงาน?

1. **ตรวจสอบ Network**
```javascript
const provinces = await getProvinces();
console.log('จำนวน:', provinces.length);
// ถ้าได้ 77 จังหวัด = ใช้งานได้
```

2. **ล้าง Cache แล้วลองใหม่**
```javascript
clearCache();
const fresh = await getProvinces();
```

3. **ตรวจสอบ Console**
- เปิด DevTools → Console
- ดูว่ามี error จาก fetch หรือไม่

### ข้อมูลไม่ครบ?

```javascript
// ตรวจสอบจำนวนข้อมูล
const provinces = await getProvinces();
const amphures = await getAmphures();
const tambons = await getTambons();

console.log({
  provinces: provinces.length, // ควรได้ 77
  amphures: amphures.length,   // ควรได้ 928
  tambons: tambons.length      // ควรได้ 7,255
});
```

## 📝 License

ข้อมูลจาก **thailand-geography-data** (MIT License)
- https://github.com/thailand-geography-data/thailand-geography-json

## 🙏 Credits

- ข้อมูลจาก กรมการปกครอง กระทรวงมหาดไทย
- รวบรวมโดย thailand-geography-data team
- API Service โดย Smart Dormitory Team
