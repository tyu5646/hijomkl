const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testSpecificPassword() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'efllll'
    });

    const testPassword = 'tyty56tyty';

    try {
        console.log(`🔍 Testing password: "${testPassword}"\n`);
        
        // ทดสอบ customers
        const [customers] = await connection.execute('SELECT id, email, password FROM customers');
        
        for (const customer of customers) {
            console.log(`👥 Testing Customer: ${customer.email}`);
            const match = await bcrypt.compare(testPassword, customer.password);
            if (match) {
                console.log(`✅ SUCCESS! Email: ${customer.email}, Password: ${testPassword}`);
            } else {
                console.log(`❌ Password does not match`);
            }
            console.log('---');
        }

        // ทดสอบ owners
        const [owners] = await connection.execute('SELECT id, email, password FROM owners');
        
        for (const owner of owners) {
            console.log(`🏠 Testing Owner: ${owner.email}`);
            const match = await bcrypt.compare(testPassword, owner.password);
            if (match) {
                console.log(`✅ SUCCESS! Email: ${owner.email}, Password: ${testPassword}`);
            } else {
                console.log(`❌ Password does not match`);
            }
            console.log('---');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

testSpecificPassword();
