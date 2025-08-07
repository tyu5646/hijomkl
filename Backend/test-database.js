// Database Test Script
// ทดสอบการเชื่อมต่อฐานข้อมูลสำหรับทุกประเภทผู้ใช้

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

console.log('🔍 ทดสอบการเชื่อมต่อฐานข้อมูล...\n');

// ทดสอบ Customers
pool.query('SELECT COUNT(*) as count, email FROM customers LIMIT 5', (err, results) => {
  if (err) {
    console.log('❌ Customers table error:', err.message);
  } else {
    console.log('✅ Customers table connected');
    console.log(`   จำนวนลูกค้า: ${results[0]?.count || 0} คน`);
    if (results.length > 1) {
      console.log('   ตัวอย่างข้อมูล:', results.slice(0, 3).map(r => r.email));
    }
  }
});

// ทดสอบ Owners
pool.query('SELECT COUNT(*) as count, email FROM owners LIMIT 5', (err, results) => {
  if (err) {
    console.log('❌ Owners table error:', err.message);
  } else {
    console.log('✅ Owners table connected');
    console.log(`   จำนวนเจ้าของ: ${results[0]?.count || 0} คน`);
    if (results.length > 1) {
      console.log('   ตัวอย่างข้อมูล:', results.slice(0, 3).map(r => r.email));
    }
  }
});

// ทดสอบ Admins
pool.query('SELECT COUNT(*) as count, email FROM admins LIMIT 5', (err, results) => {
  if (err) {
    console.log('❌ Admins table error:', err.message);
  } else {
    console.log('✅ Admins table connected');
    console.log(`   จำนวนแอดมิน: ${results[0]?.count || 0} คน`);
    if (results.length > 1) {
      console.log('   ตัวอย่างข้อมูล:', results.slice(0, 3).map(r => r.email));
    }
  }
});

// ทดสอบ Dorms
pool.query('SELECT COUNT(*) as count, name, status FROM dorms GROUP BY status', (err, results) => {
  if (err) {
    console.log('❌ Dorms table error:', err.message);
  } else {
    console.log('✅ Dorms table connected');
    results.forEach(result => {
      console.log(`   หอพัก (${result.status}): ${result.count} แห่ง`);
    });
  }
});

// ทดสอบ Roles (ถ้ามี)
pool.query('SELECT COUNT(*) as count, role_name FROM roles GROUP BY role_name', (err, results) => {
  if (err) {
    console.log('❌ Roles table error:', err.message);
  } else {
    console.log('✅ Roles table connected');
    results.forEach(result => {
      console.log(`   บทบาท ${result.role_name}: ${result.count} รายการ`);
    });
  }
});

// ทดสอบ Reviews
pool.query('SELECT COUNT(*) as count FROM reviews', (err, results) => {
  if (err) {
    console.log('❌ Reviews table error:', err.message);
  } else {
    console.log('✅ Reviews table connected');
    console.log(`   จำนวนรีวิว: ${results[0]?.count || 0} รีวิว`);
  }
});

// ทดสอบ Rooms
pool.query('SELECT COUNT(*) as count FROM rooms', (err, results) => {
  if (err) {
    console.log('❌ Rooms table error:', err.message);
  } else {
    console.log('✅ Rooms table connected');
    console.log(`   จำนวนห้องพัก: ${results[0]?.count || 0} ห้อง`);
  }
});

setTimeout(() => {
  console.log('\n🏁 การทดสอบเสร็จสิ้น');
  process.exit(0);
}, 2000);
