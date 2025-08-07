const mysql = require('mysql2/promise');

async function checkDormsTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'efllll'
    });

    try {
        const [result] = await connection.execute('DESCRIBE dorms');
        console.log('📋 ตาราง dorms columns:');
        result.forEach(col => {
            console.log(`  ${col.Field} (${col.Type}) - ${col.Null} - ${col.Default}`);
        });

        // ตรวจสอบว่ามี rejection_reason หรือไม่
        const hasRejectionReason = result.some(col => col.Field === 'rejection_reason');
        console.log(`\n🔍 มี rejection_reason column หรือไม่: ${hasRejectionReason ? '✅ มี' : '❌ ไม่มี'}`);
        
        const hasRejectReason = result.some(col => col.Field === 'reject_reason');
        console.log(`🔍 มี reject_reason column หรือไม่: ${hasRejectReason ? '✅ มี' : '❌ ไม่มี'}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkDormsTable();
