const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'efllll',
  connectionLimit: 10
});

async function createTestCustomer() {
  try {
    console.log('🔄 Creating test customer...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const sql = `
      INSERT IGNORE INTO customers (firstName, lastName, phone, email, address, password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    pool.query(sql, [
      'ทดสอบ',
      'ลูกค้า',
      '0812345678',
      'test@customer.com',
      'ที่อยู่ทดสอบ',
      hashedPassword,
      'approved'
    ], (err, result) => {
      if (err) {
        console.error('❌ Error:', err);
      } else {
        console.log('✅ Test customer created successfully!');
        console.log('📧 Email: test@customer.com');
        console.log('🔑 Password: password123');
        console.log('📊 Result:', result);
      }
      pool.end();
    });
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
    pool.end();
  }
}

createTestCustomer();
