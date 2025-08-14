# 🔐 Environment Variables Setup Guide

## อะไรคือ Environment Variables?

**Environment Variables** คือตัวแปรที่เก็บข้อมูลสำคัญแยกออกจากโค้ด เพื่อ:
- 🔒 **ความปลอดภัย** - ซ่อนรหัสผ่านและข้อมูลสำคัญ
- 🔄 **ความยืดหยุ่น** - เปลี่ยนการตั้งค่าได้โดยไม่แก้โค้ด
- 🌍 **Multi-Environment** - ใช้การตั้งค่าต่างกันในแต่ละสภาพแวดล้อม

## 🚨 ทำไมสำคัญ?

### ❌ **แบบเก่า (อันตราย)**
```javascript
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mypassword123',  // รหัสผ่านมองเห็นได้ใน GitHub!
  database: 'smart_dorm'
});
```

### ✅ **แบบใหม่ (ปลอดภัย)**
```javascript
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // รหัสผ่านซ่อนอยู่ใน .env
  database: process.env.DB_DATABASE
});
```

## 🛠️ วิธีติดตั้ง

### ขั้นตอนที่ 1: คัดลอกไฟล์ตัวอย่าง
```bash
# ใน Backend folder
cp .env.example .env
```

### ขั้นตอนที่ 2: แก้ไขไฟล์ .env
```bash
# เปิดไฟล์ .env และใส่ข้อมูลจริงของคุณ
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_real_password_here    # ใส่รหัสผ่าน MySQL จริง
DB_DATABASE=smart_dorm
JWT_SECRET=your_very_long_secret_key   # สร้างคีย์ยาวๆ สำหรับ JWT
```

### ขั้นตอนที่ 3: ตรวจสอบ .gitignore
ไฟล์ `.env` ต้องอยู่ใน `.gitignore` เพื่อไม่ให้ถูก commit ขึ้น git:
```gitignore
# Environment files
.env
.env.local
.env.production
Backend/.env
```

## 📝 ตัวแปรที่สำคัญ

### 🗄️ **ฐานข้อมูล**
- `DB_HOST` - ที่อยู่เซิร์ฟเวอร์ฐานข้อมูล
- `DB_USER` - ชื่อผู้ใช้ฐานข้อมูล
- `DB_PASSWORD` - รหัสผ่านฐานข้อมูล
- `DB_DATABASE` - ชื่อฐานข้อมูล

### 🔑 **ความปลอดภัย**
- `JWT_SECRET` - คีย์สำหรับเข้ารหัส JWT Token
- `BCRYPT_ROUNDS` - จำนวนรอบการเข้ารหัสรหัสผ่าน

### 🤖 **AI/External APIs**
- `GROQ_API_KEY` - สำหรับ Chatbot AI
- `AWS_ACCESS_KEY_ID` - สำหรับ AWS S3

## 🔍 วิธีตรวจสอบ

### ใน Code
```javascript
console.log('Database Host:', process.env.DB_HOST);
console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
```

### ใน Terminal
```bash
# Windows
echo %DB_HOST%

# macOS/Linux
echo $DB_HOST
```

## ⚠️ ข้อควรระวัง

1. **ไม่ควร commit ไฟล์ .env** ขึ้น git
2. **ใช้คีย์ที่แข็งแรง** สำหรับ JWT_SECRET (อย่างน้อย 32 ตัวอักษร)
3. **แยกไฟล์ .env** สำหรับแต่ละสภาพแวดล้อม (dev, staging, production)
4. **เปลี่ยนรหัสผ่าน** เป็นประจำ

## 🌍 Multi-Environment

```bash
# Development
.env.development

# Staging  
.env.staging

# Production
.env.production
```

## 🔧 Troubleshooting

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูล
```javascript
// ตรวจสอบว่า .env โหลดหรือไม่
console.log('ENV loaded:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE
});
```

### ปัญหา: JWT Error
```javascript
// ตรวจสอบ JWT Secret
console.log('JWT Secret length:', process.env.JWT_SECRET?.length);
```

## 📚 เพิ่มเติม

- [dotenv Documentation](https://www.npmjs.com/package/dotenv)
- [12-Factor App Methodology](https://12factor.net/config)
- [Environment Variables Security](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_environment_variables)
