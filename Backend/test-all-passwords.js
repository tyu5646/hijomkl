const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testPasswords() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'efllll'
    });

    const testPasswords = ['123456', 'password', 'admin123', '123456789', 'test123', 'owner123', 'customer123'];

    try {
        console.log('🔍 Testing password combinations...\n');
        
        // ทดสอบ customers
        const [customers] = await connection.execute('SELECT id, email, password FROM customers');
        
        for (const customer of customers) {
            console.log(`👥 Testing Customer: ${customer.email}`);
            for (const testPass of testPasswords) {
                const match = await bcrypt.compare(testPass, customer.password);
                if (match) {
                    console.log(`✅ FOUND! Email: ${customer.email}, Password: ${testPass}`);
                    break;
                }
            }
            console.log('---');
        }

        // ทดสอบ owners
        const [owners] = await connection.execute('SELECT id, email, password FROM owners');
        
        for (const owner of owners) {
            console.log(`🏠 Testing Owner: ${owner.email}`);
            for (const testPass of testPasswords) {
                const match = await bcrypt.compare(testPass, owner.password);
                if (match) {
                    console.log(`✅ FOUND! Email: ${owner.email}, Password: ${testPass}`);
                    break;
                }
            }
            console.log('---');
        }

        // ทดสอบ admins
        const [admins] = await connection.execute('SELECT id, email, password FROM admins');
        
        for (const admin of admins) {
            console.log(`👑 Testing Admin: ${admin.email}`);
            for (const testPass of testPasswords) {
                const match = await bcrypt.compare(testPass, admin.password);
                if (match) {
                    console.log(`✅ FOUND! Email: ${admin.email}, Password: ${testPass}`);
                    break;
                }
            }
            console.log('---');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

testPasswords();
