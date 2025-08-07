const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testMorePasswords() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'efllll'
    });

    const morePasswords = [
        '1234567890', 'qwerty', 'abc123', '1111', '2222', '3333', '4444', '5555',
        'asdfgh', 'zxcvbn', 'llllll', 'LLLLLL', 'rrrrrr', 'RRRRRR', 
        'password123', 'letmein', 'welcome', 'user123', 'test', 'demo',
        'admin', 'root', 'guest', '000000', '111111', '222222',
        'iloveyou', 'princess', 'rockyou', 'superman'
    ];

    try {
        console.log('🔍 Testing more password combinations...\n');
        
        // ทดสอบ customers
        const [customers] = await connection.execute('SELECT id, email, password FROM customers');
        
        for (const customer of customers) {
            console.log(`👥 Testing Customer: ${customer.email}`);
            let found = false;
            for (const testPass of morePasswords) {
                const match = await bcrypt.compare(testPass, customer.password);
                if (match) {
                    console.log(`✅ FOUND! Email: ${customer.email}, Password: ${testPass}`);
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log('❌ No matching password found from test list');
            }
            console.log('---');
        }

        // ทดสอบ owners
        const [owners] = await connection.execute('SELECT id, email, password FROM owners');
        
        for (const owner of owners) {
            console.log(`🏠 Testing Owner: ${owner.email}`);
            let found = false;
            for (const testPass of morePasswords) {
                const match = await bcrypt.compare(testPass, owner.password);
                if (match) {
                    console.log(`✅ FOUND! Email: ${owner.email}, Password: ${testPass}`);
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log('❌ No matching password found from test list');
            }
            console.log('---');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

testMorePasswords();
