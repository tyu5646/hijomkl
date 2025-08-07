const mysql = require('mysql2/promise');

async function checkPasswords() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'efllll'
    });

    try {
        console.log('🔍 Checking stored passwords in database...\n');
        
        // ตรวจสอบ customers
        const [customers] = await connection.execute('SELECT id, email, password FROM customers LIMIT 5');
        console.log('👥 CUSTOMERS:');
        customers.forEach(customer => {
            console.log(`ID: ${customer.id}, Email: ${customer.email}`);
            console.log(`Password: ${customer.password.substring(0, 20)}...`);
            console.log(`Is bcrypt hash: ${customer.password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
            console.log('---');
        });

        // ตรวจสอบ owners
        const [owners] = await connection.execute('SELECT id, email, password FROM owners LIMIT 5');
        console.log('\n🏠 OWNERS:');
        owners.forEach(owner => {
            console.log(`ID: ${owner.id}, Email: ${owner.email}`);
            console.log(`Password: ${owner.password.substring(0, 20)}...`);
            console.log(`Is bcrypt hash: ${owner.password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
            console.log('---');
        });

        // ตรวจสอบ admins
        const [admins] = await connection.execute('SELECT id, email, password FROM admins LIMIT 5');
        console.log('\n👑 ADMINS:');
        admins.forEach(admin => {
            console.log(`ID: ${admin.id}, Email: ${admin.email}`);
            console.log(`Password: ${admin.password.substring(0, 20)}...`);
            console.log(`Is bcrypt hash: ${admin.password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
            console.log('---');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkPasswords();
