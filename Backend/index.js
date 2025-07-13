const express = require('express');
const AWS = require('aws-sdk');//
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();


const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// เสิร์ฟไฟล์รูปภาพจากโฟลเดอร์ uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    chatbot: 'ready'
  });
});

// ตั้งค่า AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

const upload = multer({ dest: 'uploads/' });

// สำหรับอัปโหลดรูปโปรไฟล์ลูกค้า
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // เก็บในโฟลเดอร์ uploads
  },
  filename: function (req, file, cb) {
    // ดึงข้อมูลลูกค้าจากฐานข้อมูลเพื่อใช้ชื่อจริง
    pool.query('SELECT firstName, lastName FROM customers WHERE id = ?', [req.user.id], (err, results) => {
      if (err || results.length === 0) {
        // หากเกิดข้อผิดพลาด ใช้ id และ timestamp
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `customer_${req.user.id}_${timestamp}${ext}`);
      } else {
        const customer = results[0];
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        // ใช้ชื่อจริงของลูกค้า
        const filename = `${customer.firstName}_${customer.lastName}_${timestamp}${ext}`;
        cb(null, filename);
      }
    });
  }
});

const uploadProfile = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ 5MB
  },
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'), false);
    }
  }
});

// เชื่อมต่อฐาน efllll
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ตรวจสอบและเพิ่มคอลัมน์ที่จำเป็นถ้ายังไม่มี
function initializeDatabase() {
  // ตรวจสอบ avatar_url ใน customers
  const checkAvatarColumnSql = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'customers' 
    AND COLUMN_NAME = 'avatar_url' 
    AND TABLE_SCHEMA = ?
  `;
  
  pool.query(checkAvatarColumnSql, [process.env.DB_DATABASE], (err, results) => {
    if (err) {
      console.error('Error checking avatar_url column:', err);
      return;
    }
    
    if (results.length === 0) {
      const addColumnSql = `ALTER TABLE customers ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL`;
      
      pool.query(addColumnSql, (err) => {
        if (err) {
          console.error('Error adding avatar_url column:', err);
        } else {
          console.log('✅ Added avatar_url column to customers table');
        }
      });
    } else {
      console.log('✅ avatar_url column already exists');
    }
  });

  // ตรวจสอบ status และ reject_reason ใน dorms
  const checkDormColumnsSql = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'dorms' 
    AND COLUMN_NAME IN ('status', 'reject_reason', 'created_at', 'updated_at')
    AND TABLE_SCHEMA = ?
  `;
  
  pool.query(checkDormColumnsSql, [process.env.DB_DATABASE], (err, results) => {
    if (err) {
      console.error('Error checking dorms columns:', err);
      return;
    }
    
    const existingColumns = results.map(row => row.COLUMN_NAME);
    
    // เพิ่ม status column
    if (!existingColumns.includes('status')) {
      const addStatusSql = `ALTER TABLE dorms ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`;
      pool.query(addStatusSql, (err) => {
        if (err) {
          console.error('Error adding status column:', err);
        } else {
          console.log('✅ Added status column to dorms table');
        }
      });
    } else {
      console.log('✅ status column already exists');
    }

    // เพิ่ม reject_reason column
    if (!existingColumns.includes('reject_reason')) {
      const addRejectReasonSql = `ALTER TABLE dorms ADD COLUMN reject_reason TEXT DEFAULT NULL`;
      pool.query(addRejectReasonSql, (err) => {
        if (err) {
          console.error('Error adding reject_reason column:', err);
        } else {
          console.log('✅ Added reject_reason column to dorms table');
        }
      });
    } else {
      console.log('✅ reject_reason column already exists');
    }

    // เพิ่ม created_at column
    if (!existingColumns.includes('created_at')) {
      const addCreatedAtSql = `ALTER TABLE dorms ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      pool.query(addCreatedAtSql, (err) => {
        if (err) {
          console.error('Error adding created_at column:', err);
        } else {
          console.log('✅ Added created_at column to dorms table');
        }
      });
    } else {
      console.log('✅ created_at column already exists');
    }

    // เพิ่ม updated_at column
    if (!existingColumns.includes('updated_at')) {
      const addUpdatedAtSql = `ALTER TABLE dorms ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`;
      pool.query(addUpdatedAtSql, (err) => {
        if (err) {
          console.error('Error adding updated_at column:', err);
        } else {
          console.log('✅ Added updated_at column to dorms table');
        }
      });
    } else {
      console.log('✅ updated_at column already exists');
    }
  });
}

// เริ่มต้นฐานข้อมูล
initializeDatabase();

// Authentication Middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin Token Verification Middleware
function verifyAdminToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// สมัครสมาชิก
app.post('/register', async (req, res) => {
  const { role, password, ...data } = req.body;
  if (!password) return res.status(400).json({ error: 'กรุณากรอกรหัสผ่าน' });

  const hash = await bcrypt.hash(password, 10);

  let sql = '';
  let values = [];

  if (role === 'customer') {
    sql = `INSERT INTO customers 
      (firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values = [
      data.firstName, data.lastName, data.age, data.dob, data.houseNo, data.moo, data.soi, data.road,
      data.subdistrict, data.district, data.province, data.email, hash, data.phone
    ];
  } else if (role === 'owner') {
    sql = `INSERT INTO owners 
      (dormName, firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values = [
      data.dormName, data.firstName, data.lastName, data.age, data.dob, data.houseNo, data.moo, data.soi, data.road,
      data.subdistrict, data.district, data.province, data.email, hash, data.phone
    ];
  } else if (role === 'admin') {
    sql = `INSERT INTO admins 
      (firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values = [
      data.firstName, data.lastName, data.age, data.dob, data.houseNo, data.moo, data.soi, data.road,
      data.subdistrict, data.district, data.province, data.email, hash, data.phone
    ];
  } else {
    return res.status(400).json({ error: 'Invalid role' });
  }

  pool.query(sql, values, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// ดึงข้อมูลหอพักพร้อม group รูปเป็น array
app.get('/dorms', (req, res) => {
  pool.query(
    `SELECT dorms.*, dorm_images.image_path
     FROM dorms
     LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
     WHERE dorms.status = 'approved'`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const dormMap = {};
      results.forEach(row => {
        if (!dormMap[row.id]) {
          dormMap[row.id] = { ...row, images: [] };
        }
        if (row.image_path) dormMap[row.id].images.push(row.image_path);
      });
      const dorms = Object.values(dormMap).map(d => {
        delete d.image_path;
        return d;
      });
      res.json(dorms);
    }
  );
});

// สำหรับผู้ประกอบการ
app.get('/owner/dorms', authOwner, (req, res) => {
  const owner_id = req.user.id;
  pool.query(
    `SELECT dorms.*, dorm_images.image_path
     FROM dorms
     LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
     WHERE dorms.owner_id = ?`,
    [owner_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const dormMap = {};
      results.forEach(row => {
        if (!dormMap[row.id]) {
          dormMap[row.id] = { ...row, images: [] };
        }
        if (row.image_path) dormMap[row.id].images.push(row.image_path);
      });
      const dorms = Object.values(dormMap).map(d => {
        delete d.image_path;
        return d;
      });
      res.json(dorms);
    }
  );
});

// สำหรับผู้ดูแลระบบ - ดูรายการหอพักสำหรับอนุมัติ
app.get('/admin/dorms', (req, res) => {
  const { status } = req.query;
  
  let statusCondition = '';
  const params = [];
  
  if (status && status !== 'all') {
    statusCondition = ` WHERE dorms.status = ?`;
    params.push(status);
  }

  const query = `
    SELECT 
      dorms.*,
      COALESCE(owners.firstName, 'ไม่ระบุเจ้าของ') as owner_name,
      COALESCE(owners.email, 'ไม่ระบุอีเมล') as owner_email,
      COALESCE(owners.phone, 'ไม่ระบุเบอร์โทร') as owner_phone,
      GROUP_CONCAT(dorm_images.image_path) as images
    FROM dorms
    LEFT JOIN owners ON dorms.owner_id = owners.id
    LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
    ${statusCondition}
    GROUP BY dorms.id
    ORDER BY dorms.created_at DESC
  `;

  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching dorms for admin:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message,
        success: false 
      });
    }
    
    // ตรวจสอบว่า results เป็น array
    const dormsArray = Array.isArray(results) ? results : [];
    res.json(dormsArray);
  });
});

// อนุมัติหอพัก
app.put('/admin/dorms/:id/approve', (req, res) => {
  const dormId = req.params.id;
  
  pool.query(
    'UPDATE dorms SET status = ?, updated_at = NOW() WHERE id = ?',
    ['approved', dormId],
    (err, result) => {
      if (err) {
        console.error('Error approving dorm:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ไม่พบหอพัก' });
      }
      
      res.json({ 
        success: true, 
        message: 'อนุมัติหอพักเรียบร้อยแล้ว',
        dormId: dormId 
      });
    }
  );
});

// ไม่อนุมัติหอพัก
app.put('/admin/dorms/:id/reject', (req, res) => {
  const dormId = req.params.id;
  const { reason } = req.body;
  
  pool.query(
    'UPDATE dorms SET status = ?, reject_reason = ?, updated_at = NOW() WHERE id = ?',
    ['rejected', reason || 'ไม่ระบุเหตุผล', dormId],
    (err, result) => {
      if (err) {
        console.error('Error rejecting dorm:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ไม่พบหอพัก' });
      }
      
      res.json({ 
        success: true, 
        message: 'ไม่อนุมัติหอพักเรียบร้อยแล้ว',
        dormId: dormId,
        reason: reason 
      });
    }
  );
});

// ตัวอย่าง secret สำหรับ JWT
// const JWT_SECRET = 'your_secret_key';

// /login: ตรวจสอบ email+password และส่ง token + role กลับ
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  try {
    const poolPromise = pool.promise();

    // Function to check a table for a user
    const findUser = async (table, role) => {
      const [results] = await poolPromise.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
      if (results.length > 0) {
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          return user;
        }
      }
      return null;
    };

    // Check tables sequentially
    let user = await findUser('customers', 'customer');
    if (user) {
      const token = jwt.sign({ id: user.id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, role: 'customer' });
    }

    user = await findUser('owners', 'owner');
    if (user) {
      const token = jwt.sign({ id: user.id, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, role: 'owner' });
    }

    user = await findUser('admins', 'admin');
    if (user) {
      const token = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, role: 'admin' });
    }

    // If no user is found in any table
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/upload', upload.single('image'), (req, res) => {
  const { dorm_id } = req.body;
  const imagePath = '/uploads/' + req.file.filename;
  pool.query(
    'INSERT INTO dorm_images (dorm_id, image_path) VALUES (?, ?)',
    [dorm_id, imagePath],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, imagePath });
    }
  );
});

// Broadcast event เมื่อมีการเปลี่ยนแปลงข้อมูลหอพัก
function broadcastDormsUpdate() {
  io.emit('dorms-updated');
}

// เพิ่มหอพักใหม่ (สำหรับผู้ประกอบการหรือผู้ดูแลระบบ) รองรับหลายรูป
app.post('/dorms', upload.array('images', 10), (req, res) => {
  const { name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id } = req.body;
  const dormSql = 'INSERT INTO dorms (name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  pool.query(dormSql, [name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id || null, 'pending'], (err, dormResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const dormId = dormResult.insertId;
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(f => [dormId, '/uploads/' + f.filename]);
      pool.query('INSERT INTO dorm_images (dorm_id, image_path) VALUES ?', [imageValues], (imgErr) => {
        if (imgErr) return res.status(500).json({ error: imgErr.message });
        broadcastDormsUpdate();
        res.json({ success: true });
      });
    } else {
      broadcastDormsUpdate();
      res.json({ success: true });
    }
  });
});

// API สำหรับแก้ไขข้อมูลหอพัก (รองรับแก้ไข/เพิ่มรูปใหม่หลายรูป)
app.put('/dorms/:id', upload.array('images', 10), (req, res) => {
  const dormId = req.params.id;
  const { name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, existingImages } = req.body;
  const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];

  pool.query(
    'UPDATE dorms SET name=?, price_daily=?, price_monthly=?, price_term=?, floor_count=?, room_count=?, address_detail=?, water_cost=?, electricity_cost=?, deposit=?, contact_phone=?, facilities=?, near_places=? WHERE id=?',
    [name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, dormId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Logic to delete removed images
      pool.query('SELECT image_path FROM dorm_images WHERE dorm_id = ?', [dormId], (selectErr, currentImages) => {
        if (selectErr) return res.status(500).json({ error: selectErr.message });

        const imagesToDelete = currentImages
          .map(img => img.image_path)
          .filter(path => !parsedExistingImages.includes(path));

        if (imagesToDelete.length > 0) {
          pool.query('DELETE FROM dorm_images WHERE dorm_id = ? AND image_path IN (?)', [dormId, imagesToDelete], (deleteErr) => {
            if (deleteErr) console.error("Error deleting images:", deleteErr); // Log error but continue
          });
        }
      });

      // Logic to add new images
      if (req.files && req.files.length > 0) {
        const imageValues = req.files.map(f => [dormId, '/uploads/' + f.filename]);
        pool.query('INSERT INTO dorm_images (dorm_id, image_path) VALUES ?', [imageValues], (imgErr) => {
          if (imgErr) return res.status(500).json({ error: imgErr.message });
          broadcastDormsUpdate();
          res.json({ success: true });
        });
      } else {
        broadcastDormsUpdate();
        res.json({ success: true });
      }
    }
  );
});

// แก้ไขรูปหอพัก (เปลี่ยนรูปใหม่)
app.put('/dorms/:id/image', upload.single('image'), (req, res) => {
  const dormId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const imagePath = '/uploads/' + req.file.filename;

  // ลบรูปเก่า (optional: ถ้าต้องการ)
  // db.query('SELECT image_path FROM dorm_images WHERE dorm_id=?', [dormId], (err, results) => { ... });

  // อัปเดตรูปใหม่
  pool.query(
    'REPLACE INTO dorm_images (dorm_id, image_path) VALUES (?, ?)',

    [dormId, imagePath],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      broadcastDormsUpdate(); // <--- เพิ่ม emit หลังแก้ไขรูป
      res.json({ success: true });
    }
  );
});

// ลบหอพัก (ลบทั้ง dorm_images และ dorms)
app.delete('/dorms/:id', (req, res) => {
  const dormId = req.params.id;
  // ลบรูปก่อน
  pool.query('DELETE FROM dorm_images WHERE dorm_id = ?', [dormId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    // ลบข้อมูลหอพัก
    pool.query('DELETE FROM dorms WHERE id = ?', [dormId], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      // หลัง delete สำเร็จ
      broadcastDormsUpdate();
      res.json({ success: true });
    });
  });
});

app.get('/users', (req, res) => {
  const sql = `
    SELECT id, firstName, lastName, email, phone, 'customer' as role FROM customers
    UNION ALL
    SELECT id, firstName, lastName, email, phone, 'owner' as role FROM owners
  `;
  pool.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// เพิ่มสมาชิก (ลูกค้า/ผู้ประกอบการ)
app.post('/users', async (req, res) => {
  const { role, ...data } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });

  // เตรียมฟิลด์และค่า
  let fields = Object.keys(data);
  let values = Object.values(data);

  // ถ้ามี password ให้ hash ก่อน
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
    fields = Object.keys(data);
    values = Object.values(data);
  }

  const table = role === 'customer' ? 'customers' : role === 'owner' ? 'owners' : null;
  if (!table) return res.status(400).json({ error: 'Invalid role' });

  const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`;
  pool.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// แก้ไขสมาชิก (ลูกค้า/ผู้ประกอบการ)
app.put('/users/:id', async (req, res) => {
  const { role, ...data } = req.body;
  const userId = req.params.id;
  if (!role) return res.status(400).json({ error: 'Role is required' });

  // ถ้ามี password ให้ hash ก่อน
  if (data.password && data.password !== '') {
    data.password = await bcrypt.hash(data.password, 10);
  } else {
    delete data.password;
  }

  const table = role === 'customer' ? 'customers' : role === 'owner' ? 'owners' : null;
  if (!table) return res.status(400).json({ error: 'Invalid role' });

  const fields = Object.keys(data);
  const values = Object.values(data);

  if (fields.length === 0) return res.status(400).json({ error: 'No data to update' });

  const setClause = fields.map(f => `${f}=?`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause} WHERE id=?`;
  pool.query(sql, [...values, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ลบสมาชิก
app.delete('/users/:id', (req, res) => {
  const { role } = req.query; // รับ role จาก query string
  const userId = req.params.id;

  let sql = '';
  if (role === 'customer') {
    sql = 'DELETE FROM customers WHERE id=?';
  } else if (role === 'owner') {
    sql = 'DELETE FROM owners WHERE id=?';
  } else {
    return res.status(400).json({ error: 'Invalid role' });
  }

  pool.query(sql, [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// สมมติใช้ middleware ตรวจสอบ token แล้ว set req.user.id = owner_id
function authOwner(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // <-- แก้ไขที่นี่
    if (decoded.role !== 'owner') return res.status(403).json({ error: 'Forbidden' });
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/owner/dorms', authOwner, (req, res) => {
  const owner_id = req.user.id;
  pool.query(
    `SELECT dorms.*, dorm_images.image_path
     FROM dorms
     LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
     WHERE dorms.owner_id = ?`,
    [owner_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const dormMap = {};
      results.forEach(row => {
        if (!dormMap[row.id]) {
          dormMap[row.id] = { ...row, images: [] };
        }
        if (row.image_path) dormMap[row.id].images.push(row.image_path);
      });
      const dorms = Object.values(dormMap).map(d => {
        delete d.image_path;
        return d;
      });
      res.json(dorms);
    }
  );
});

app.post('/owner/dorms', authOwner, upload.array('images', 10), (req, res) => {
  const { name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places } = req.body;
  const owner_id = req.user.id;
  const dormSql = 'INSERT INTO dorms (name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  pool.query(dormSql, [name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, 'pending'], (err, dormResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const dormId = dormResult.insertId;
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(f => [dormId, '/uploads/' + f.filename]);
      pool.query('INSERT INTO dorm_images (dorm_id, image_path) VALUES ?', [imageValues], (imgErr) => {
        if (imgErr) return res.status(500).json({ error: imgErr.message });
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });
});

// สำหรับผู้ประกอบการ แก้ไขหอพัก (multiple images)
app.put('/owner/dorms/:id', authOwner, upload.array('images', 10), (req, res) => {
  const dormId = req.params.id;
  const { name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, existingImages } = req.body;
  const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];

  pool.query(
    'UPDATE dorms SET name=?, price_daily=?, price_monthly=?, price_term=?, floor_count=?, room_count=?, address_detail=?, water_cost=?, electricity_cost=?, deposit=?, contact_phone=?, facilities=?, near_places=? WHERE id=?',
    [name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, dormId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Logic to delete removed images
      pool.query('SELECT image_path FROM dorm_images WHERE dorm_id = ?', [dormId], (selectErr, currentImages) => {
        if (selectErr) return res.status(500).json({ error: selectErr.message });

        const imagesToDelete = currentImages
          .map(img => img.image_path)
          .filter(path => !parsedExistingImages.includes(path));

        if (imagesToDelete.length > 0) {
          pool.query('DELETE FROM dorm_images WHERE dorm_id = ? AND image_path IN (?)', [dormId, imagesToDelete], (deleteErr) => {
            if (deleteErr) console.error("Error deleting images:", deleteErr); // Log error but continue
          });
        }
      });

      // Logic to add new images
      if (req.files && req.files.length > 0) {
        const imageValues = req.files.map(f => [dormId, '/uploads/' + f.filename]);
        pool.query('INSERT INTO dorm_images (dorm_id, image_path) VALUES ?', [imageValues], (imgErr) => {
          if (imgErr) return res.status(500).json({ error: imgErr.message });
          res.json({ success: true });
        });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// ====== OpenAI Chatbot Integration ======
// ลบ OpenAI ออก ใช้ Groq API เท่านั้น

// Endpoint สำหรับแชทบอตอัจฉริยะ
app.post('/chatbot', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'ข้อความไม่ถูกต้อง' });
    }
    
    const safeContext = Array.isArray(context)
      ? context.filter(m => m && typeof m.content === 'string' && m.content.trim() && (m.role === 'user' || m.role === 'assistant'))
      : [];
      
    let dormsData = [];
    
    // ดึงข้อมูลหอพักทั้งหมดจากฐานข้อมูล
    try {
      const [results] = await new Promise((resolve, reject) => {
        pool.query('SELECT name, price_daily, price_monthly, price_term, address_detail, facilities FROM dorms', (err, results) => {
          if (err) reject(err);
          else resolve([results]);
        });
      });
      dormsData = results;
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      return res.status(500).json({ error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' });
    }
    
    let systemPrompt = 'คุณคือผู้ช่วยแนะนำหอพักที่ฉลาดและใจดี ตอบเป็นภาษาไทยที่สุภาพ วิเคราะห์และเปรียบเทียบข้อมูลหอพักจากข้อมูลที่ให้มา ให้คำแนะนำที่เป็นประโยชน์และตรงประเด็น';
    
    if (dormsData.length > 0) {
      systemPrompt += `\n\nข้อมูลหอพักทั้งหมดในระบบ: ` + JSON.stringify(dormsData, null, 2);
    }
    
    // ตรวจสอบ API Key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return res.status(500).json({ error: 'ระบบ AI ยังไม่พร้อมใช้งาน' });
    }
    
    // เรียก Groq API
    const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...safeContext,
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    if (!groqRes.data || !groqRes.data.choices || !groqRes.data.choices[0]) {
      throw new Error('Invalid response from AI service');
    }
    
    const reply = groqRes.data.choices[0].message.content;
    
    if (!reply || reply.trim().length === 0) {
      throw new Error('Empty response from AI service');
    }
    
    res.json({ reply: reply.trim() });
    
  } catch (err) {
    console.error('Chatbot API error:', err);
    
    // Send appropriate error message based on error type
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      res.status(503).json({ error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ AI ได้' });
    } else if (err.code === 'ETIMEDOUT') {
      res.status(504).json({ error: 'การตอบสนองจากระบบ AI ใช้เวลานานเกินไป' });
    } else if (err.response && err.response.status === 401) {
      res.status(500).json({ error: 'ปัญหาการยืนยันตัวตนกับระบบ AI' });
    } else if (err.response && err.response.status === 429) {
      res.status(429).json({ error: 'ระบบ AI กำลังมีคนใช้งานมาก กรุณาลองใหม่ในอีกสักครู่' });
    } else {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ AI' });
    }
  }
});

// Middleware to authenticate JWT token for any role
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
}

// Get customer profile
app.get('/customer/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Forbidden: Access is allowed for customers only.' });
  }

  const customerId = req.user.id;
  pool.query('SELECT * FROM customers WHERE id = ?', [customerId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const userProfile = results[0];
    delete userProfile.password; // Do not send the password hash
    res.json(userProfile);
  });
});

// Update customer profile
app.put('/customer/profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'customer') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const customerId = req.user.id;
    const data = req.body;

    // Prevent changing critical fields
    delete data.id;
    delete data.role_id;
    delete data.email; 
    
    // Hash password if it's being changed
    if (data.password && data.password !== '') {
        data.password = await bcrypt.hash(data.password, 10);
    } else {
        delete data.password; // Do not update password if it's empty
    }

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No data to update' });
    }

    const fields = Object.keys(data);
    const values = Object.values(data);

    const setClause = fields.map(f => `${f}=?`).join(', ');
    const sql = `UPDATE customers SET ${setClause} WHERE id=?`;

    pool.query(sql, [...values, customerId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// อัปโหลดรูปโปรไฟล์ลูกค้า
app.post('/customer/upload-avatar', authenticateToken, (req, res) => {
    if (req.user.role !== 'customer') {
        return res.status(403).json({ error: 'Forbidden: Access is allowed for customers only.' });
    }

    // ใช้ multer middleware แบบ manual เพื่อจัดการข้อผิดพลาดได้ดีขึ้น
    uploadProfile.single('avatar')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            if (err.message === 'อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น') {
                return res.status(400).json({ error: err.message });
            }
            return res.status(400).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'กรุณาเลือกไฟล์รูปภาพ' });
        }

        const customerId = req.user.id;
        const avatarUrl = `/uploads/${req.file.filename}`;

        // อัปเดต URL รูปโปรไฟล์ในฐานข้อมูล
        pool.query(
            'UPDATE customers SET avatar_url = ? WHERE id = ?',
            [avatarUrl, customerId],
            (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    
                    // ลบไฟล์ที่อัปโหลดแล้วเมื่อเกิดข้อผิดพลาดในฐานข้อมูล
                    const filePath = path.join(__dirname, 'uploads', req.file.filename);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                    });
                    
                    return res.status(500).json({ 
                        error: 'เกิดข้อผิดพลาดในการอัปเดตฐานข้อมูล',
                        details: err.message 
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้า' });
                }

                res.json({ 
                    success: true, 
                    message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
                    avatarUrl: avatarUrl,
                    filename: req.file.filename
                });
            }
        );
    });
});

// Get owner profile
app.get('/owner/profile', authOwner, (req, res) => {
  const owner_id = req.user.id;
  pool.query(
    'SELECT id, firstName, lastName, email, phone, age, dob, houseNo, moo, soi, road, subdistrict, district, province, zip_code FROM owners WHERE id = ?',
    [owner_id],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
      }
      res.json(results[0]);
    }
  );
});

// Get owner reviews
app.get('/owner/reviews', authOwner, (req, res) => {
  const owner_id = req.user.id;
  pool.query(
    `SELECT r.id, r.rating, r.comment, r.date, 
            d.name as dormName, 
            c.firstName as customerName
     FROM reviews r
     LEFT JOIN dorms d ON r.dorm_id = d.id
     LEFT JOIN customers c ON r.customer_id = c.id
     WHERE d.owner_id = ?
     ORDER BY r.date DESC`,
    [owner_id],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว' });
      }
      res.json(results);
    }
  );
});

// Admin User Management endpoints
app.get('/admin/users', verifyAdminToken, (req, res) => {
  const sql = `
    SELECT id, firstName, lastName, email, phone, age, dob, 
           houseNo, moo, soi, road, subdistrict, district, province,
           'customer' as role, NULL as dormName
    FROM customers
    UNION ALL
    SELECT id, firstName, lastName, email, phone, age, dob,
           houseNo, moo, soi, road, subdistrict, district, province,
           'owner' as role, dormName
    FROM owners
    ORDER BY firstName, lastName
  `;
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.post('/admin/users', verifyAdminToken, async (req, res) => {
  const { role, password, ...data } = req.body;
  
  if (!role || !password) {
    return res.status(400).json({ error: 'Role and password are required' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    data.password = hashedPassword;

    const table = role === 'customer' ? 'customers' : role === 'owner' ? 'owners' : null;
    if (!table) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // เตรียมฟิลด์และค่า
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`;
    
    pool.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error adding user:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: result.insertId });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/admin/users/:id', verifyAdminToken, async (req, res) => {
  const { role, password, ...data } = req.body;
  const userId = req.params.id;

  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  try {
    // ถ้ามี password ให้ hash ก่อน
    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password, 10);
    }

    const table = role === 'customer' ? 'customers' : role === 'owner' ? 'owners' : null;
    if (!table) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const fields = Object.keys(data);
    const values = Object.values(data);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No data to update' });
    }

    const setClause = fields.map(f => `${f}=?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE id=?`;
    
    pool.query(sql, [...values, userId], (err) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/admin/users/:id', verifyAdminToken, (req, res) => {
  const { role } = req.query;
  const userId = req.params.id;

  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  const table = role === 'customer' ? 'customers' : role === 'owner' ? 'owners' : null;
  if (!table) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const sql = `DELETE FROM ${table} WHERE id=?`;
  
  pool.query(sql, [userId], (err) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Test endpoint สำหรับตรวจสอบตาราง dorms
app.get('/test/dorms', (req, res) => {
  pool.query('SELECT * FROM dorms LIMIT 5', (err, results) => {
    if (err) {
      console.error('Error testing dorms table:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message,
        table: 'dorms'
      });
    }
    
    res.json({
      success: true,
      count: results.length,
      data: results,
      message: 'Dorms table accessible'
    });
  });
});

// Test endpoint สำหรับตรวจสอบ schema ตาราง dorms
app.get('/test/dorms/schema', (req, res) => {
  pool.query('DESCRIBE dorms', (err, results) => {
    if (err) {
      console.error('Error describing dorms table:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message
      });
    }
    
    res.json({
      success: true,
      schema: results,
      message: 'Dorms table schema'
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

