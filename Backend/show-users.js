// แสดงข้อมูลผู้ใช้แต่ละประเภท
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'efllll',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('👥 รายละเอียดผู้ใช้งานในระบบ\n');

// ดูข้อมูล Customers
pool.query('SELECT id, firstName, lastName, email FROM customers', (err, results) => {
  if (!err && results.length > 0) {
    console.log('👤 CUSTOMERS:');
    results.forEach(user => {
      console.log(`   ID: ${user.id} | ${user.firstName} ${user.lastName} | ${user.email}`);
    });
    console.log('');
  }
});

// ดูข้อมูล Owners  
pool.query('SELECT id, firstName, lastName, email, dormName FROM owners', (err, results) => {
  if (!err && results.length > 0) {
    console.log('🏠 OWNERS:');
    results.forEach(user => {
      console.log(`   ID: ${user.id} | ${user.firstName} ${user.lastName} | ${user.email} | หอพัก: ${user.dormName || 'ไม่ระบุ'}`);
    });
    console.log('');
  }
});

// ดูข้อมูล Admins
pool.query('SELECT id, firstName, lastName, email, role_id FROM admins', (err, results) => {
  if (!err && results.length > 0) {
    console.log('👑 ADMINS:');
    results.forEach(user => {
      console.log(`   ID: ${user.id} | ${user.firstName} ${user.lastName} | ${user.email} | Role: ${user.role_id || 'ไม่ระบุ'}`);
    });
    console.log('');
  }
});

// ดูข้อมูล Dorms
pool.query('SELECT id, name, owner_id, status FROM dorms', (err, results) => {
  if (!err && results.length > 0) {
    console.log('🏢 DORMS:');
    results.forEach(dorm => {
      console.log(`   ID: ${dorm.id} | ${dorm.name} | Owner: ${dorm.owner_id} | Status: ${dorm.status}`);
    });
    console.log('');
  }
});

setTimeout(() => {
  console.log('✅ การตรวจสอบเสร็จสิ้น');
  process.exit(0);
}, 1500);
