// ไฟล์สำหรับสร้าง hash รหัสผ่าน
const bcrypt = require('bcrypt');

async function generatePasswordHash() {
    const password = '123456pp';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('=================================');
        console.log('🔐 Password Hash Generator');
        console.log('=================================');
        console.log('Original Password:', password);
        console.log('Generated Hash:', hash);
        console.log('=================================');
        
        // ทดสอบการ verify
        const isValid = await bcrypt.compare(password, hash);
        console.log('Hash Verification:', isValid ? '✅ Valid' : '❌ Invalid');
        
        // สร้าง SQL statement
        console.log('\n📝 SQL Statement:');
        console.log(`INSERT INTO admins (username, email, password, full_name, role, status) VALUES`);
        console.log(`('admin', 'admin@smartdorm.com', '${hash}', 'ผู้ดูแลระบบหลัก', 'admin', 'active');`);
        
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

generatePasswordHash();
