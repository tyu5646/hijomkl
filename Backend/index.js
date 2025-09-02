/*
===============================================================================
                            SMART DORM BACKEND SERVER
===============================================================================
Description: Backend API server for Smart Dorm management system
Author: Smart Dorm Development Team
Version: 1.0.0
Created: 2025
===============================================================================
*/

// ==================== DEPENDENCIES & IMPORTS ====================
const express = require('express');
const AWS = require('aws-sdk');
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

// ฟังก์ชันคำนวณระยะทางระหว่างสองจุด (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลกในหน่วยกิโลเมตร
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // ปัดเศษเป็น 2 ตำแหน่ง
}

// ฟังก์ชันเชื่อมโยงสถานที่ใกล้เคียงและคำนวณระยะทาง
function linkNearbyPlaces(dormId, dormLat, dormLon, nearPlacesString) {
  if (!nearPlacesString) return;
  
  const nearPlaces = nearPlacesString.split(',').map(place => place.trim()).filter(place => place);
  
  nearPlaces.forEach(placeName => {
    // หาพิกัดของสถานที่ใกล้เคียงจากฐานข้อมูล
    const findPlaceSql = `
      SELECT id, latitude, longitude, location_type, location_name 
      FROM location_coordinates 
      WHERE location_name LIKE ? AND dorm_id IS NULL
      LIMIT 1
    `;
    
    pool.query(findPlaceSql, [`%${placeName}%`], (err, results) => {
      if (err) {
        console.error('Error finding place:', err);
        return;
      }
      
      if (results.length > 0) {
        const place = results[0];
        const distance = calculateDistance(dormLat, dormLon, place.latitude, place.longitude);
        
        // เพิ่มข้อมูลสถานที่ใกล้เคียงพร้อมระยะทาง
        const insertNearPlaceSql = `
          INSERT INTO location_coordinates 
          (dorm_id, location_type, location_name, latitude, longitude, distance_km, description) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        pool.query(insertNearPlaceSql, [
          dormId, 
          place.location_type, 
          place.location_name, 
          place.latitude, 
          place.longitude, 
          distance,
          `ห่างจากหอพัก ${distance} กิโลเมตร`
        ], (insertErr) => {
          if (insertErr) {
            console.error('Error inserting nearby place:', insertErr);
          } else {
            console.log(`✅ Linked ${place.location_name} to dorm ${dormId}, distance: ${distance} km`);
          }
        });
      } else {
        console.log(`⚠️ Place not found: ${placeName}`);
      }
    });
  });
}

// ==================== SERVER INITIALIZATION ====================
const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

// ==================== MIDDLEWARE CONFIGURATION ====================
app.use(cors());
app.use(express.json());

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== HEALTH CHECK ENDPOINT ====================
/**
 * Health check endpoint to verify server status
 * @route GET /health
 * @returns {Object} Server status and timestamp
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    chatbot: 'ready'
  });
});

// ================================================================================================
// 4. DATABASE CONFIGURATION
// ================================================================================================

/**
 * MySQL Connection Pool Configuration
 * จัดการการเชื่อมต่อฐานข้อมูล MySQL แบบ Connection Pool เพื่อประสิทธิภาพที่ดี
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'efllll',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Test Database Connection
 * ทดสอบการเชื่อมต่อฐานข้อมูลเมื่อเริ่มต้นระบบ
 */
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
  connection.release();
});

// ==================== FILE UPLOAD CONFIGURATION ====================
/**
 * Multer storage configuration for customer profile pictures
 * Handles file uploads to the uploads directory
 */
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store in uploads folder
  },
  filename: function (req, file, cb) {
    // Generate filename using customer info from database
    pool.query('SELECT firstName, lastName FROM customers WHERE id = ?', [req.user.id], (err, results) => {
      if (err || results.length === 0) {
        // If error occurs, use id and timestamp
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `customer_${req.user.id}_${timestamp}${ext}`);
      } else {
        const customer = results[0];
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        // Use customer's real name
        const filename = `${customer.firstName}_${customer.lastName}_${timestamp}${ext}`;
        cb(null, filename);
      }
    });
  }
});

/**
 * Multer upload middleware for customer profile pictures
 * Includes file size and type validation
 */
const uploadProfile = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'), false);
    }
  }
});

/**
 * Multer storage configuration for dorm images
 * Uses timestamp-based filename generation
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

/**
 * Multer upload middleware for dorm images
 * Includes file size and type validation
 */
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'), false);
    }
  }
});

// ==================== DATABASE INITIALIZATION ====================
/**
 * Initialize database with required columns and tables
 * Checks and adds missing columns to existing tables
 */
function initializeDatabase() {
  // Check for avatar_url column in customers table
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

  // ตรวจสอบและเพิ่ม zip_code column ใน owners table
  const checkOwnerZipCodeSql = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'owners' 
    AND COLUMN_NAME = 'zip_code'
    AND TABLE_SCHEMA = ?
  `;
  
  pool.query(checkOwnerZipCodeSql, [process.env.DB_DATABASE], (err, results) => {
    if (err) {
      console.error('Error checking zip_code column in owners:', err);
      return;
    }
    
    if (results.length === 0) {
      const addZipCodeSql = `ALTER TABLE owners ADD COLUMN zip_code VARCHAR(10) DEFAULT NULL`;
      
      pool.query(addZipCodeSql, (err) => {
        if (err) {
          console.error('Error adding zip_code column to owners:', err);
        } else {
          console.log('✅ Added zip_code column to owners table');
        }
      });
    } else {
      console.log('✅ zip_code column already exists in owners table');
    }
  });

  // ตรวจสอบและสร้างตาราง reviews
  const checkReviewsTableSql = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = 'reviews' 
    AND TABLE_SCHEMA = ?
  `;
  
  pool.query(checkReviewsTableSql, [process.env.DB_DATABASE], (err, results) => {
    if (err) {
      console.error('Error checking reviews table:', err);
      return;
    }
    
    if (results.length === 0) {
      // สร้างตาราง reviews
      const createReviewsTableSql = `
        CREATE TABLE reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_id INT NOT NULL,
          dorm_id INT NOT NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
          location_rating INT CHECK (location_rating >= 1 AND location_rating <= 5),
          value_rating INT CHECK (value_rating >= 1 AND value_rating <= 5),
          service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
          UNIQUE KEY unique_customer_dorm (customer_id, dorm_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      
      pool.query(createReviewsTableSql, (err) => {
        if (err) {
          console.error('Error creating reviews table:', err);
        } else {
          console.log('✅ Created reviews table successfully');
        }
      });
    } else {
      console.log('✅ reviews table already exists');
    }
  });
}

// Initialize database schema on server startup
initializeDatabase();

// ================================================================================================
// 5. AUTHENTICATION MIDDLEWARE
// ================================================================================================

/**
 * JWT Token Verification Middleware
 * ตรวจสอบความถูกต้องของ JWT token ที่ส่งมากับ request header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Token verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Admin Token Verification Middleware
 * ตรวจสอบความถูกต้องของ JWT token และสิทธิ์ admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifyAdminToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    console.log('✅ Token decoded:', decoded);
    
    if (decoded.role !== 'admin') {
      console.log('❌ Not admin role:', decoded.role);
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ================================================================================================
// 6. API ENDPOINTS - AUTHENTICATION & REGISTRATION
// ================================================================================================

/**
 * User Registration Endpoint
 * รองรับการสมัครสมาชิกสำหรับ customer, owner, และ admin
 * @route POST /register
 * @param {string} role - บทบาทของผู้ใช้ (customer/owner/admin)
 * @param {string} password - รหัสผ่าน
 * @param {Object} data - ข้อมูลส่วนบุคคล
 */
app.post('/register', async (req, res) => {
  const { role, password, ...data } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่าน' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    let sql = '';
    let values = [];

    // Customer registration
    if (role === 'customer') {
      sql = `INSERT INTO customers 
        (firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      values = [
        data.firstName, data.lastName, data.age, data.dob, data.houseNo, data.moo, data.soi, data.road,
        data.subdistrict, data.district, data.province, data.email, hash, data.phone
      ];
    } 
    // Owner registration
    else if (role === 'owner') {
      sql = `INSERT INTO owners 
        (dormName, firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      values = [
        data.dormName, data.firstName, data.lastName, data.age, data.dob, data.houseNo, data.moo, data.soi, data.road,
        data.subdistrict, data.district, data.province, data.email, hash, data.phone
      ];
    } 
    // Admin registration
    else if (role === 'admin') {
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
      res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// ================================================================================================
// 7. API ENDPOINTS - DORM MANAGEMENT
// ================================================================================================

/**
 * Get All Approved Dorms with Images
 * ดึงข้อมูลหอพักทั้งหมดที่ผ่านการอนุมัติพร้อมรูปภาพ
 * @route GET /dorms
 * @returns {Array} รายการหอพักที่ได้รับการอนุมัติพร้อมรูปภาพ
 */
app.get('/dorms', (req, res) => {
  const sql = `
    SELECT 
      dorms.*, 
      dorm_images.image_path,
      GROUP_CONCAT(
        CONCAT(lc.location_type, ':', lc.location_name, ':', lc.latitude, ':', lc.longitude, ':', IFNULL(lc.distance_km, '0'))
        ORDER BY lc.location_type, lc.distance_km SEPARATOR ';'
      ) AS location_coordinates
    FROM dorms
    LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
    LEFT JOIN location_coordinates lc ON dorms.id = lc.dorm_id
    WHERE dorms.status = 'approved'
    GROUP BY dorms.id, dorm_images.image_path
  `;
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching dorms:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Group images and coordinates by dorm ID
    const dormMap = {};
    results.forEach(row => {
      if (!dormMap[row.id]) {
        dormMap[row.id] = { 
          ...row, 
          images: [],
          coordinates: []
        };
        
        // Parse location coordinates
        if (row.location_coordinates) {
          const coords = row.location_coordinates.split(';');
          dormMap[row.id].coordinates = coords.map(coord => {
            const [type, name, lat, lng, distance] = coord.split(':');
            return {
              location_type: type,
              location_name: name,
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              distance_km: parseFloat(distance) || 0
            };
          });
        }
      }
      if (row.image_path) {
        dormMap[row.id].images.push(row.image_path);
      }
    });
    
    // Convert to array and remove image_path field
    const dorms = Object.values(dormMap).map(dorm => {
      delete dorm.image_path;
      return dorm;
    });
    
    res.json(dorms);
  });
});

/**
 * Get Single Dorm by ID
 * ดึงข้อมูลหอพักเดี่ยวด้วย ID
 * @route GET /dorms/:id
 * @returns {Object} ข้อมูลหอพักพร้อมรูปภาพ
 */
app.get('/dorms/:id', (req, res) => {
  const dormId = req.params.id;
  const sql = `
    SELECT 
      dorms.*, 
      GROUP_CONCAT(dorm_images.image_path) AS images,
      GROUP_CONCAT(
        CONCAT(lc.location_type, ':', lc.location_name, ':', lc.latitude, ':', lc.longitude, ':', IFNULL(lc.distance_km, '0'))
        ORDER BY lc.location_type, lc.distance_km SEPARATOR ';'
      ) AS location_coordinates
    FROM dorms
    LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
    LEFT JOIN location_coordinates lc ON dorms.id = lc.dorm_id
    WHERE dorms.id = ?
    GROUP BY dorms.id
  `;
  
  pool.query(sql, [dormId], (err, results) => {
    if (err) {
      console.error('Error fetching dorm:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหอพัก' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลหอพัก' });
    }
    
    const dorm = results[0];
    
    // แปลงรูปภาพเป็น array
    if (dorm.images) {
      dorm.images = dorm.images.split(',').filter(img => img);
    } else {
      dorm.images = [];
    }
    
    // แปลงพิกัดสถานที่ใกล้เคียง
    if (dorm.location_coordinates) {
      dorm.coordinates = dorm.location_coordinates.split(';')
        .filter(coord => coord)
        .map(coord => {
          const [type, name, lat, lng, distance] = coord.split(':');
          return { type, name, latitude: parseFloat(lat), longitude: parseFloat(lng), distance: parseFloat(distance) || 0 };
        });
    } else {
      dorm.coordinates = [];
    }
    
    delete dorm.location_coordinates;
    res.json(dorm);
  });
});

/**
 * Delete Dorm
 * ลบหอพัก (เฉพาะเจ้าของหรือ Admin)
 * @route DELETE /dorms/:id
 */
app.delete('/dorms/:id', authOwner, (req, res) => {
  const dormId = req.params.id;
  const userId = req.user.id;
  
  // ตรวจสอบว่าหอพักนี้เป็นของเจ้าของคนนี้หรือไม่
  const checkOwnerSql = 'SELECT id FROM dorms WHERE id = ? AND owner_id = ?';
  
  pool.query(checkOwnerSql, [dormId, userId], (err, results) => {
    if (err) {
      console.error('Error checking dorm ownership:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
    }
    
    if (results.length === 0) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบหอพักนี้' });
    }
    
    // ลบรูปภาพก่อน
    const deleteImagesSql = 'DELETE FROM dorm_images WHERE dorm_id = ?';
    pool.query(deleteImagesSql, [dormId], (err) => {
      if (err) {
        console.error('Error deleting dorm images:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรูปภาพ' });
      }
      
      // ลบพิกัดสถานที่ใกล้เคียง
      const deleteCoordsSql = 'DELETE FROM location_coordinates WHERE dorm_id = ?';
      pool.query(deleteCoordsSql, [dormId], (err) => {
        if (err) {
          console.error('Error deleting coordinates:', err);
        }
        
        // ลบหอพัก
        const deleteDormSql = 'DELETE FROM dorms WHERE id = ?';
        pool.query(deleteDormSql, [dormId], (err, result) => {
          if (err) {
            console.error('Error deleting dorm:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบหอพัก' });
          }
          
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบหอพักที่ต้องการลบ' });
          }
          
          broadcastDormsUpdate();
          res.json({ success: true, message: 'ลบหอพักสำเร็จ' });
        });
      });
    });
  });
});

/**
 * Get Owner's Dorms
 * ดึงข้อมูลหอพักของเจ้าของหอพักคนนั้นๆ
 * @route GET /owner/dorms
 * @access Private (Owner only)
 * @returns {Array} รายการหอพักของเจ้าของ
 */
app.get('/owner/dorms', authOwner, (req, res) => {
  const owner_id = req.user.id;
  const sql = `
    SELECT 
      dorms.*, 
      dorm_images.image_path,
      GROUP_CONCAT(
        CONCAT(lc.location_type, ':', lc.location_name, ':', lc.latitude, ':', lc.longitude, ':', IFNULL(lc.distance_km, '0'))
        ORDER BY lc.location_type, lc.distance_km SEPARATOR ';'
      ) AS location_coordinates
    FROM dorms
    LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
    LEFT JOIN location_coordinates lc ON dorms.id = lc.dorm_id
    WHERE dorms.owner_id = ?
    GROUP BY dorms.id, dorm_images.image_path
  `;
  
  pool.query(sql, [owner_id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching owner dorms:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Group images and coordinates by dorm ID
    const dormMap = {};
    results.forEach(row => {
      if (!dormMap[row.id]) {
        dormMap[row.id] = { 
          ...row, 
          images: [],
          coordinates: []
        };
        
        // Parse location coordinates
        if (row.location_coordinates) {
          const coords = row.location_coordinates.split(';');
          dormMap[row.id].coordinates = coords.map(coord => {
            const [type, name, lat, lng, distance] = coord.split(':');
            return {
              location_type: type,
              location_name: name,
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              distance_km: parseFloat(distance) || 0
            };
          });
        }
      }
      if (row.image_path) {
        dormMap[row.id].images.push(row.image_path);
      }
    });
    
    // Convert to array and remove temporary fields
    const dorms = Object.values(dormMap).map(dorm => {
      // ดึงพิกัดของหอพักจาก coordinates array
      const dormLocation = dorm.coordinates.find(coord => coord.location_type === 'dorm_location');
      if (dormLocation) {
        dorm.latitude = dormLocation.latitude;
        dorm.longitude = dormLocation.longitude;
      }
      
      delete dorm.image_path;
      delete dorm.location_coordinates;
      return dorm;
    });
    
    res.json(dorms);
  });
});

// ================================================================================================
// 8. API ENDPOINTS - USER AUTHENTICATION
// ================================================================================================

/**
 * User Login Endpoint
 * ตรวจสอบข้อมูลเข้าสู่ระบบและส่ง JWT token กลับ
 * @route POST /login
 * @param {string} email - อีเมลผู้ใช้
 * @param {string} password - รหัสผ่าน
 * @returns {Object} JWT token และข้อมูลผู้ใช้
 */
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
      const token = jwt.sign({ id: user.id, role: 'customer' }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1d' });
      console.log('Customer login successful:', { id: user.id, role: 'customer' });
      return res.json({ token, role: 'customer' });
    }

    user = await findUser('owners', 'owner');
    if (user) {
      const token = jwt.sign({ id: user.id, role: 'owner' }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1d' });
      console.log('Owner login successful:', { id: user.id, role: 'owner' });
      return res.json({ token, role: 'owner' });
    }

    user = await findUser('admins', 'admin');
    if (user) {
      const token = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1d' });
      console.log('Admin login successful:', { id: user.id, role: 'admin', email: user.email });
      return res.json({ token, role: 'admin' });
    }

    // If no user is found in any table
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Broadcast event เมื่อมีการเปลี่ยนแปลงข้อมูลหอพัก
function broadcastDormsUpdate() {
  io.emit('dorms-updated');
}

// เพิ่มหอพักใหม่ (สำหรับผู้ประกอบการหรือผู้ดูแลระบบ) รองรับหลายรูป
app.post('/dorms', upload.array('images', 10), (req, res) => {
  const { name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, latitude, longitude, owner_id } = req.body;
  const dormSql = 'INSERT INTO dorms (name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  pool.query(dormSql, [name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id || null, 'pending'], (err, dormResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const dormId = dormResult.insertId;
    
    // เพิ่มพิกัดหอพักถ้ามี
    if (latitude && longitude) {
      const coordinateSql = 'INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?)';
      pool.query(coordinateSql, [dormId, 'dorm_location', name, latitude, longitude], (coordErr) => {
        if (coordErr) console.error('Error inserting dorm coordinates:', coordErr);
        
        // หาสถานที่ใกล้เคียงและคำนวณระยะทาง
        linkNearbyPlaces(dormId, parseFloat(latitude), parseFloat(longitude), near_places);
      });
    }
    
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

app.post('/owner/dorms', authOwner, upload.array('images', 10), (req, res) => {
  const { name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, latitude, longitude } = req.body;
  const owner_id = req.user.id;
  const dormSql = 'INSERT INTO dorms (name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  pool.query(dormSql, [name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, 'pending'], (err, dormResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const dormId = dormResult.insertId;
    
    // เพิ่มพิกัดหอพักถ้ามี
    if (latitude && longitude) {
      const coordinateSql = 'INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?)';
      pool.query(coordinateSql, [dormId, 'dorm_location', name, latitude, longitude], (coordErr) => {
        if (coordErr) console.error('Error inserting dorm coordinates:', coordErr);
      });
    }
    
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

// อัปเดตข้อมูลหอพัก (สำหรับเจ้าของหอพัก)
app.put('/owner/dorms/:id', authOwner, upload.array('images', 10), (req, res) => {
  const dormId = req.params.id;
  const owner_id = req.user.id;
  const { 
    name, price_daily, price_monthly, price_term, floor_count, room_count, 
    address_detail, water_cost, electricity_cost, deposit, contact_phone, 
    facilities, near_places, latitude, longitude, delete_images 
  } = req.body;

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query('SELECT * FROM dorms WHERE id = ? AND owner_id = ?', [dormId, owner_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'ไม่พบหอพักหรือไม่มีสิทธิ์แก้ไข' });

    // อัปเดตข้อมูลหอพัก
    const updateSql = `
      UPDATE dorms SET 
        name = ?, price_daily = ?, price_monthly = ?, price_term = ?, 
        floor_count = ?, room_count = ?, address_detail = ?, water_cost = ?, 
        electricity_cost = ?, deposit = ?, contact_phone = ?, facilities = ?, 
        near_places = ?
      WHERE id = ? AND owner_id = ?
    `;

    const updateValues = [
      name, price_daily, price_monthly, price_term, floor_count, room_count,
      address_detail, water_cost, electricity_cost, deposit, contact_phone,
      facilities, near_places, dormId, owner_id
    ];

    pool.query(updateSql, updateValues, (updateErr) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });

      // อัปเดตหรือเพิ่มพิกัดหอพัก
      if (latitude && longitude) {
        const checkCoordSql = 'SELECT id FROM location_coordinates WHERE dorm_id = ? AND location_type = "dorm_location"';
        pool.query(checkCoordSql, [dormId], (checkErr, coordResults) => {
          if (checkErr) {
            console.error('Error checking coordinates:', checkErr);
          } else if (coordResults.length > 0) {
            // อัปเดตพิกัดเดิม
            const updateCoordSql = 'UPDATE location_coordinates SET latitude = ?, longitude = ?, location_name = ? WHERE dorm_id = ? AND location_type = "dorm_location"';
            pool.query(updateCoordSql, [latitude, longitude, name || 'หอพัก', dormId], (coordUpdateErr) => {
              if (coordUpdateErr) {
                console.error('Error updating coordinates:', coordUpdateErr);
              } else {
                console.log('✅ Updated dorm coordinates successfully');
                // ลบสถานที่ใกล้เคียงเดิมและคำนวณใหม่
                const deleteOldPlacesSql = 'DELETE FROM location_coordinates WHERE dorm_id = ? AND location_type = "nearby_place"';
                pool.query(deleteOldPlacesSql, [dormId], (deleteErr) => {
                  if (deleteErr) {
                    console.error('Error deleting old nearby places:', deleteErr);
                  } else {
                    // เชื่อมโยงสถานที่ใกล้เคียงใหม่
                    linkNearbyPlaces(dormId, parseFloat(latitude), parseFloat(longitude), near_places);
                  }
                });
              }
            });
          } else {
            // เพิ่มพิกัดใหม่
            const insertCoordSql = 'INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude) VALUES (?, "dorm_location", ?, ?, ?)';
            pool.query(insertCoordSql, [dormId, name || 'หอพัก', latitude, longitude], (coordInsertErr) => {
              if (coordInsertErr) {
                console.error('Error inserting coordinates:', coordInsertErr);
              } else {
                console.log('✅ Inserted new dorm coordinates successfully');
                // เชื่อมโยงสถานที่ใกล้เคียง
                linkNearbyPlaces(dormId, parseFloat(latitude), parseFloat(longitude), near_places);
              }
            });
          }
        });
      } else {
        // ถ้าไม่มีการส่งพิกัดมาใหม่ ให้คงค่าเดิมไว้
        console.log('🔄 No new coordinates provided, keeping existing coordinates');
        // ยังคงต้องอัปเดตสถานที่ใกล้เคียงถ้ามีการเปลี่ยนแปลง
        if (near_places) {
          // หาพิกัดเดิมของหอพัก
          const getExistingCoordSql = 'SELECT latitude, longitude FROM location_coordinates WHERE dorm_id = ? AND location_type = "dorm_location"';
          pool.query(getExistingCoordSql, [dormId], (getErr, existingCoords) => {
            if (!getErr && existingCoords.length > 0) {
              const existingLat = existingCoords[0].latitude;
              const existingLng = existingCoords[0].longitude;
              // ลบสถานที่ใกล้เคียงเดิม
              const deleteOldPlacesSql = 'DELETE FROM location_coordinates WHERE dorm_id = ? AND location_type = "nearby_place"';
              pool.query(deleteOldPlacesSql, [dormId], (deleteErr) => {
                if (!deleteErr) {
                  // เชื่อมโยงสถานที่ใกล้เคียงใหม่ด้วยพิกัดเดิม
                  linkNearbyPlaces(dormId, parseFloat(existingLat), parseFloat(existingLng), near_places);
                }
              });
            }
          });
        }
      }

      // ลบรูปภาพที่เลือกลบ
      if (delete_images && delete_images.length > 0) {
        const deleteImageSql = 'DELETE FROM dorm_images WHERE id IN (?) AND dorm_id = ?';
        pool.query(deleteImageSql, [delete_images, dormId], (delErr) => {
          if (delErr) console.error('Error deleting images:', delErr);
        });
      }

      // เพิ่มรูปภาพใหม่
      if (req.files && req.files.length > 0) {
        const imageValues = req.files.map(f => [dormId, '/uploads/' + f.filename]);
        pool.query('INSERT INTO dorm_images (dorm_id, image_path) VALUES ?', [imageValues], (imgErr) => {
          if (imgErr) return res.status(500).json({ error: imgErr.message });
          res.json({ success: true, message: 'อัปเดตข้อมูลหอพักสำเร็จ' });
        });
      } else {
        res.json({ success: true, message: 'อัปเดตข้อมูลหอพักสำเร็จ' });
      }
    });
  });
});

// Owner middleware
function authOwner(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    if (decoded.role !== 'owner') return res.status(403).json({ error: 'Access denied' });
    req.user = decoded;
    next();
  });
}

// Customer middleware
function authCustomer(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    if (decoded.role !== 'customer') return res.status(403).json({ error: 'Access denied' });
    req.user = decoded;
    next();
  });
}

// === CUSTOMER PROFILE ENDPOINTS ===

// ดึงข้อมูลโปรไฟล์ลูกค้า
app.get('/customer/profile', authCustomer, (req, res) => {
  const customerId = req.user.id;
  
  const sql = `SELECT * FROM customers WHERE id = ?`;
  
  pool.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error('Error fetching customer profile:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    const customer = results[0];
    // ไม่ส่งรหัสผ่านกลับไป
    delete customer.password;
    
    res.json(customer);
  });
});

// อัปเดทข้อมูลโปรไฟล์ลูกค้า
app.put('/customer/profile', authCustomer, (req, res) => {
  const customerId = req.user.id;
  const { 
    firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, phone, zip_code 
  } = req.body;
  
  const sql = `
    UPDATE customers 
    SET firstName = ?, lastName = ?, age = ?, dob = ?, 
        houseNo = ?, moo = ?, soi = ?, road = ?, subdistrict = ?, 
        district = ?, province = ?, email = ?, phone = ?, zip_code = ?
    WHERE id = ?
  `;
  
  pool.query(sql, [
    firstName, lastName, age, dob, houseNo, moo, soi, road,
    subdistrict, district, province, email, phone, zip_code, customerId
  ], (err, result) => {
    if (err) {
      console.error('Error updating customer profile:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
      }
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดทข้อมูล' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ต้องการอัปเดท' });
    }
    
    res.json({ success: true, message: 'อัปเดทข้อมูลสำเร็จ' });
  });
});

// อัปโหลดรูปโปรไฟล์ลูกค้า
app.post('/customer/upload-avatar', authCustomer, uploadProfile.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'กรุณาเลือกไฟล์รูปภาพ' });
  }

  const customerId = req.user.id;
  const avatarUrl = `/uploads/${req.file.filename}`;

  // อัปเดท URL ของรูปโปรไฟล์ในฐานข้อมูล
  const sql = `UPDATE customers SET avatar_url = ? WHERE id = ?`;
  
  pool.query(sql, [avatarUrl, customerId], (err, result) => {
    if (err) {
      console.error('Error updating avatar URL:', err);
      // ลบไฟล์ที่อัปโหลดเมื่อเกิดข้อผิดพลาด
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกรูปโปรไฟล์' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    res.json({ 
      success: true, 
      message: 'อัปโหลดรูปโปรไฟล์สำเร็จ', 
      avatarUrl: avatarUrl 
    });
  });
});

// === ADMIN ENDPOINTS ===

// ทดสอบ Admin endpoint
app.get('/admin/test', verifyAdminToken, (req, res) => {
  res.json({ message: 'Admin API working', user: req.user, timestamp: new Date().toISOString() });
});

// ทดสอบ token โดยไม่ต้องเป็น admin
app.get('/admin/auth-test', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    res.json({ 
      message: 'Token valid', 
      decoded, 
      isAdmin: decoded.role === 'admin',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(401).json({ 
      error: 'Invalid token', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ดึงข้อมูลผู้ใช้ทั้งหมด (Admin) - แบบง่าย
app.get('/admin/users', verifyAdminToken, (req, res) => {
  // ดึงข้อมูล customers ก่อน
  pool.query('SELECT id, firstName, lastName, email, phone FROM customers', (err1, customers) => {
    if (err1) {
      console.error('Error fetching customers:', err1);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า', details: err1.message });
    }

    // ดึงข้อมูล owners
    pool.query('SELECT id, firstName, lastName, email, phone FROM owners', (err2, owners) => {
      if (err2) {
        console.error('Error fetching owners:', err2);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเจ้าของ', details: err2.message });
      }

      // รวมข้อมูลทั้งหมด
      const allUsers = [
        ...customers.map(user => ({ ...user, type: 'customer' })),
        ...owners.map(user => ({ ...user, type: 'owner' }))
      ];

      res.json(allUsers);
    });
  });
});

// ดึงข้อมูลหอพักทั้งหมดสำหรับ Admin - แบบง่าย
app.get('/admin/dorms', verifyAdminToken, (req, res) => {
  const status = req.query.status;
  
  let sql = 'SELECT * FROM dorms';
  let params = [];
  
  if (status && status !== 'all') {
    sql += ' WHERE status = ?';
    params = [status];
  }
  
  sql += ' ORDER BY created_at DESC';
  
  pool.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching dorms for admin:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหอพัก', details: err.message });
    }
    
    res.json(results);
  });
});

// อนุมัติหอพัก (Admin)
app.put('/admin/dorms/:id/approve', verifyAdminToken, (req, res) => {
  const dormId = req.params.id;
  
  const sql = 'UPDATE dorms SET status = ? WHERE id = ?';
  
  pool.query(sql, ['approved', dormId], (err, result) => {
    if (err) {
      console.error('Error approving dorm:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอนุมัติหอพัก' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบหอพักที่ต้องการอนุมัติ' });
    }
    
    res.json({ success: true, message: 'อนุมัติหอพักสำเร็จ' });
  });
});

// ปฏิเสธหอพัก (Admin)
app.put('/admin/dorms/:id/reject', verifyAdminToken, (req, res) => {
  const dormId = req.params.id;
  const { reason } = req.body;
  
  const sql = 'UPDATE dorms SET status = ?, reject_reason = ? WHERE id = ?';
  
  pool.query(sql, ['rejected', reason || null, dormId], (err, result) => {
    if (err) {
      console.error('Error rejecting dorm:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการปฏิเสธหอพัก' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบหอพักที่ต้องการปฏิเสธ' });
    }
    
    res.json({ success: true, message: 'ปฏิเสธหอพักสำเร็จ' });
  });
});

// ลบหอพัก (Admin)
app.delete('/admin/dorms/:id', verifyAdminToken, (req, res) => {
  const dormId = req.params.id;
  
  // ลบรูปภาพก่อน
  pool.query('DELETE FROM dorm_images WHERE dorm_id = ?', [dormId], (err) => {
    if (err) {
      console.error('Error deleting dorm images:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรูปภาพ' });
    }
    
    // ลบหอพัก
    pool.query('DELETE FROM dorms WHERE id = ?', [dormId], (err, result) => {
      if (err) {
        console.error('Error deleting dorm:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบหอพัก' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ไม่พบหอพักที่ต้องการลบ' });
      }
      
      res.json({ success: true, message: 'ลบหอพักสำเร็จ' });
    });
  });
});

// ลบผู้ใช้ (Admin)
app.delete('/admin/users/:type/:id', verifyAdminToken, (req, res) => {
  const { type, id } = req.params;
  
  // ตรวจสอบประเภทผู้ใช้
  const allowedTypes = ['customer', 'owner'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'ประเภทผู้ใช้ไม่ถูกต้อง' });
  }
  
  const tableName = type === 'customer' ? 'customers' : 'owners';
  const sql = `DELETE FROM ${tableName} WHERE id = ?`;
  
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(`Error deleting ${type}:`, err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ต้องการลบ' });
    }
    
    res.json({ success: true, message: 'ลบผู้ใช้สำเร็จ' });
  });
});

// === ADMIN MANAGEMENT ENDPOINTS ===

// ดึงข้อมูลแอดมินทั้งหมด
app.get('/admin/admins', verifyAdminToken, (req, res) => {
  const sql = `
    SELECT * FROM admins 
    ORDER BY id DESC
  `;
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching admins:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแอดมิน', details: err.message });
    }
    
    // ไม่ส่งรหัสผ่านกลับไป
    const admins = results.map(admin => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });
    
    res.json(admins);
  });
});

// ดึงข้อมูลบทบาททั้งหมด
app.get('/admin/roles', verifyAdminToken, (req, res) => {
  const sql = 'SELECT * FROM roles ORDER BY id';
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching roles:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทบาท', details: err.message });
    }
    
    res.json(results);
  });
});

// เพิ่มแอดมินใหม่
app.post('/admin/admins', verifyAdminToken, async (req, res) => {
  const {
    firstName, lastName, age, dob, houseNo, moo, soi, road,
    subdistrict, district, province, email, password, phone,
    role_id: role_name, zip_code
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!firstName || !lastName || !email || !password || !phone || !role_name) {
    return res.status(400).json({ 
      error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, รหัสผ่าน, เบอร์โทร, บทบาท)' 
    });
  }

  try {
    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO admins 
      (firstName, lastName, age, dob, houseNo, moo, soi, road, 
       subdistrict, district, province, email, password, phone, role_name, zip_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    pool.query(sql, [
      firstName, lastName, age, dob, houseNo, moo, soi, road,
      subdistrict, district, province, email, hashedPassword, phone,
      role_name, zip_code
    ], (err, result) => {
      if (err) {
        console.error('Error adding admin:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มแอดมิน', details: err.message });
      }

      res.status(201).json({ 
        success: true, 
        message: 'เพิ่มแอดมินสำเร็จ',
        adminId: result.insertId 
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน' });
  }
});

// อัพเดทข้อมูลแอดมิน
app.put('/admin/admins/:id', verifyAdminToken, async (req, res) => {
  const adminId = req.params.id;
  const {
    firstName, lastName, age, dob, houseNo, moo, soi, road,
    subdistrict, district, province, email, password, phone,
    role_id: role_name, zip_code
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!firstName || !lastName || !email || !phone || !role_name) {
    return res.status(400).json({ 
      error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, เบอร์โทร, บทบาท)' 
    });
  }

  try {
    let sql, params;

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = `
        UPDATE admins 
        SET firstName = ?, lastName = ?, age = ?, dob = ?, houseNo = ?, moo = ?, 
            soi = ?, road = ?, subdistrict = ?, district = ?, province = ?, 
            email = ?, password = ?, phone = ?, role_name = ?, zip_code = ?
        WHERE id = ?
      `;
      params = [
        firstName, lastName, age, dob, houseNo, moo, soi, road,
        subdistrict, district, province, email, hashedPassword, phone,
        role_name, zip_code, adminId
      ];
    } else {
      // ไม่เปลี่ยนรหัสผ่าน
      sql = `
        UPDATE admins 
        SET firstName = ?, lastName = ?, age = ?, dob = ?, houseNo = ?, moo = ?, 
            soi = ?, road = ?, subdistrict = ?, district = ?, province = ?, 
            email = ?, phone = ?, role_name = ?, zip_code = ?
        WHERE id = ?
      `;
      params = [
        firstName, lastName, age, dob, houseNo, moo, soi, road,
        subdistrict, district, province, email, phone,
        role_name, zip_code, adminId
      ];
    }

    pool.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error updating admin:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทแอดมิน', details: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ไม่พบแอดมินที่ต้องการอัพเดท' });
      }

      res.json({ success: true, message: 'อัพเดทข้อมูลแอดมินสำเร็จ' });
    });
  } catch (error) {
    console.error('Error processing admin update:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล' });
  }
});

// ลบแอดมิน
app.delete('/admin/admins/:id', verifyAdminToken, (req, res) => {
  const adminId = req.params.id;

  // ตรวจสอบว่าไม่ลบตัวเอง
  if (parseInt(adminId) === req.user.id) {
    return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
  }

  const sql = 'DELETE FROM admins WHERE id = ?';

  pool.query(sql, [adminId], (err, result) => {
    if (err) {
      console.error('Error deleting admin:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบแอดมิน', details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบแอดมินที่ต้องการลบ' });
    }

    res.json({ success: true, message: 'ลบแอดมินสำเร็จ' });
  });
});

// === OWNER PROFILE ENDPOINTS ===

// ดึงข้อมูลโปรไฟล์เจ้าของหอพัก
app.get('/owner/profile', authOwner, (req, res) => {
  const ownerId = req.user.id;
  
  const sql = `SELECT * FROM owners WHERE id = ?`;
  
  pool.query(sql, [ownerId], (err, results) => {
    if (err) {
      console.error('Error fetching owner profile:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    const owner = results[0];
    // ไม่ส่งรหัสผ่านกลับไป
    delete owner.password;
    
    res.json(owner);
  });
});

// อัพเดทข้อมูลโปรไฟล์เจ้าของหอพัก
app.put('/owner/profile', authOwner, (req, res) => {
  const ownerId = req.user.id;
  const { 
    dormName, firstName, lastName, age, dob, houseNo, moo, soi, road, 
    subdistrict, district, province, email, phone, zip_code 
  } = req.body;
  
  const sql = `
    UPDATE owners 
    SET dormName = ?, firstName = ?, lastName = ?, age = ?, dob = ?, 
        houseNo = ?, moo = ?, soi = ?, road = ?, subdistrict = ?, 
        district = ?, province = ?, email = ?, phone = ?, zip_code = ?
    WHERE id = ?
  `;
  
  pool.query(sql, [
    dormName, firstName, lastName, age, dob, houseNo, moo, soi, road,
    subdistrict, district, province, email, phone, zip_code, ownerId
  ], (err, result) => {
    if (err) {
      console.error('Error updating owner profile:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
      }
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ต้องการอัพเดท' });
    }
    
    res.json({ success: true, message: 'อัพเดทข้อมูลสำเร็จ' });
  });
});

// === REVIEWS API ENDPOINTS ===

// ดึงรีวิวทั้งหมดของหอพักเฉพาะ
app.get('/dorms/:id/reviews', (req, res) => {
  const dormId = req.params.id;
  
  const sql = `
    SELECT r.*, 
           c.firstName, c.lastName, c.avatar_url,
           d.name as dormName
    FROM reviews r
    LEFT JOIN customers c ON r.customer_id = c.id
    LEFT JOIN dorms d ON r.dorm_id = d.id
    WHERE r.dorm_id = ?
    ORDER BY r.created_at DESC
  `;
  
  pool.query(sql, [dormId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรีวิว' });
    }
    
    const reviews = results.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      cleanliness_rating: review.cleanliness_rating,
      location_rating: review.location_rating,
      value_rating: review.value_rating,
      service_rating: review.service_rating,
      customerName: `${review.firstName || ''} ${review.lastName || ''}`.trim() || 'ลูกค้า',
      customerAvatar: review.avatar_url,
      dormName: review.dormName,
      date: review.created_at,
      created_at: review.created_at
    }));
    
    res.json(reviews);
  });
});

// เพิ่มรีวิวใหม่ (สำหรับลูกค้า)
app.post('/dorms/:id/reviews', verifyToken, (req, res) => {
  const dormId = req.params.id;
  const customerId = req.user.id;
  const { rating, comment, cleanliness_rating, location_rating, value_rating, service_rating } = req.body;
  
  // ตรวจสอบ role
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'เฉพาะลูกค้าเท่านั้นที่สามารถเขียนรีวิวได้' });
  }
  
  // ตรวจสอบว่ามีรีวิวอยู่แล้วหรือไม่
  pool.query('SELECT id FROM reviews WHERE customer_id = ? AND dorm_id = ?', 
    [customerId, dormId], (err, existing) => {
    if (err) {
      console.error('Error checking existing review:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบรีวิว' });
    }
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'คุณได้เขียนรีวิวหอพักนี้แล้ว' });
    }
    
    const insertSql = `
      INSERT INTO reviews (customer_id, dorm_id, rating, comment, cleanliness_rating, location_rating, value_rating, service_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    pool.query(insertSql, [
      customerId, dormId, rating, comment || null,
      cleanliness_rating || null, location_rating || null, 
      value_rating || null, service_rating || null
    ], (err, result) => {
      if (err) {
        console.error('Error inserting review:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกรีวิว' });
      }
      
      res.json({ success: true, reviewId: result.insertId });
    });
  });
});

// ดึงรีวิวของเจ้าของหอพัก (สำหรับ Owner)
app.get('/owner/reviews', authOwner, (req, res) => {
  const ownerId = req.user.id;
  
  const sql = `
    SELECT r.*, 
           c.firstName, c.lastName, c.avatar_url,
           d.name as dormName
    FROM reviews r
    LEFT JOIN customers c ON r.customer_id = c.id
    LEFT JOIN dorms d ON r.dorm_id = d.id
    WHERE d.owner_id = ?
    ORDER BY r.created_at DESC
  `;
  
  pool.query(sql, [ownerId], (err, results) => {
    if (err) {
      console.error('Error fetching owner reviews:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรีวิว' });
    }
    
    const reviews = results.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      cleanliness_rating: review.cleanliness_rating,
      location_rating: review.location_rating,
      value_rating: review.value_rating,
      service_rating: review.service_rating,
      customerName: `${review.firstName || ''} ${review.lastName || ''}`.trim() || 'ลูกค้า',
      customerAvatar: review.avatar_url,
      dormName: review.dormName,
      date: review.created_at,
      created_at: review.created_at
    }));
    
    res.json(reviews);
  });
});

// ดึงสถิติรีวิวของหอพักเฉพาะ
app.get('/dorms/:id/reviews/stats', (req, res) => {
  const dormId = req.params.id;
  
  const sql = `
    SELECT 
      COUNT(*) as total_reviews,
      AVG(rating) as average_rating,
      AVG(cleanliness_rating) as avg_cleanliness,
      AVG(location_rating) as avg_location,
      AVG(value_rating) as avg_value,
      AVG(service_rating) as avg_service,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_stars
    FROM reviews 
    WHERE dorm_id = ?
  `;
  
  pool.query(sql, [dormId], (err, results) => {
    if (err) {
      console.error('Error fetching review stats:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติรีวิว' });
    }
    
    const stats = results[0] || {
      total_reviews: 0,
      average_rating: 0,
      avg_cleanliness: 0,
      avg_location: 0,
      avg_value: 0,
      avg_service: 0,
      five_stars: 0,
      four_stars: 0,
      three_stars: 0,
      two_stars: 0,
      one_stars: 0
    };
    
    res.json(stats);
  });
});

// ==================== UTILITY MANAGEMENT API ====================

/**
 * Sync room count for all dorms (Admin utility function)
 * @route POST /admin/sync-room-count
 * @returns {Object} Success message with updated count
 */
app.post('/admin/sync-room-count', authOwner, (req, res) => {
  // อัปเดตจำนวนห้องพักสำหรับทุกหอพัก
  pool.query(`
    UPDATE dorms 
    SET room_count = (
      SELECT COUNT(*) 
      FROM rooms 
      WHERE rooms.dorm_id = dorms.id
    )
  `, (err, result) => {
    if (err) {
      console.error('Error syncing room count:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตจำนวนห้อง' });
    }

    res.json({ 
      message: 'อัปเดตจำนวนห้องพักสำเร็จ',
      affectedRows: result.affectedRows
    });
  });
});

/**
 * Sync room count for specific dorm
 * @route POST /dorms/:dormId/sync-room-count
 * @param {string} dormId - ID of the dorm
 * @returns {Object} Success message
 */
app.post('/dorms/:dormId/sync-room-count', authOwner, (req, res) => {
  const { dormId } = req.params;
  const ownerId = req.user.id;

  // ตรวจสอบสิทธิ์เจ้าของ
  pool.query('SELECT id FROM dorms WHERE id = ? AND owner_id = ?', [dormId, ownerId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // อัปเดตจำนวนห้องพัก
    pool.query('UPDATE dorms SET room_count = (SELECT COUNT(*) FROM rooms WHERE dorm_id = ?) WHERE id = ?', 
      [dormId, dormId], (updateErr, result) => {
      if (updateErr) {
        console.error('Error updating room count:', updateErr);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตจำนวนห้อง' });
      }

      res.json({ message: 'อัปเดตจำนวนห้องพักสำเร็จ' });
    });
  });
});

// ==================== CHATBOT API ====================

// Helper: แปลงตัวเลขไทย -> อารบิก (หยาบๆ)
function normalizeThaiNumerals(str = '') {
  const map = { '๐':'0','๑':'1','๒':'2','๓':'3','๔':'4','๕':'5','๖':'6','๗':'7','๘':'8','๙':'9' };
  return str.replace(/[๐-๙]/g, d => map[d] || d);
}

// Helper: หา price (ตัวเลข) ในข้อความ
function extractBudget(message) {
  const norm = normalizeThaiNumerals(message).replace(/[, ]+/g,'');
  const m = norm.match(/(\d{3,6})/); // ค่าเช่ามักอยู่ช่วงนี้
  return m ? parseInt(m[1], 10) : null;
}

// Helper: กรองหอพักตามข้อความผู้ใช้ (อย่างง่าย ไม่ใช่เวกเตอร์)
function filterDormsForQuery(message, dorms) {
  const msg = message.toLowerCase();
  const budget = extractBudget(msg);
  let results = [...dorms];

  // กรองตามงบ ถ้าระบุ
  if (budget) {
    results = results.filter(d => {
      const prices = [d.price_monthly, d.price_daily, d.price_term]
        .filter(p => p && !isNaN(p))
        .map(Number);
      if (prices.length === 0) return false;
      return prices.some(p => p <= budget);
    });
  }

  // คำสำคัญเกี่ยวกับสิ่งอำนวยความสะดวก
  const facilityKeywords = ['wifi','ไวไฟ','internet','แอร์','air','เครื่องปรับอากาศ','เฟอร์นิเจอร์','ที่จอดรถ','parking','ลิฟต์','cctv'];
  const matchedFacilities = facilityKeywords.filter(k => msg.includes(k));
  if (matchedFacilities.length) {
    results = results.filter(d => (d.facilities||'').toLowerCase().includes(
      matchedFacilities[0] // ใช้อันแรกพอ
    ));
  }

  // คำสำคัญสถานที่ใกล้เคียง (ถ้าระบุคำว่า ใกล้ / near)
  if (/ใกล้|near|แถว|ละแวก/.test(msg)) {
    // ดึงคำหลัง "ใกล้" หรือ "แถว" อย่างหยาบ
    const placeMatch = msg.match(/(?:ใกล้|แถว|near)\s*([\u0E00-\u0E7Fa-zA-Z0-9]+)/);
    if (placeMatch) {
      const token = placeMatch[1];
      results = results.filter(d => (d.near_places||'').toLowerCase().includes(token));
    }
  }

  // จำกัดจำนวน context ไม่ให้ยาวเกิน (เช่น 15 แรก) เพื่อประหยัด token
  return results.slice(0, 15);
}

// Helper: สร้าง context (สั้นลง) สำหรับโมเดล
function buildDormContext(dorms) {
  return dorms.map(dorm => {
    const prices = [];
    if (dorm.price_monthly) prices.push(`รายเดือน ${dorm.price_monthly}`);
    if (dorm.price_daily) prices.push(`รายวัน ${dorm.price_daily}`);
    if (dorm.price_term) prices.push(`รายเทอม ${dorm.price_term}`);
    return `ชื่อ: ${dorm.name}\nราคา: ${prices.join(' | ') || 'ไม่ระบุ'}\nที่อยู่: ${dorm.address_detail || 'ไม่ระบุ'}\nใกล้: ${dorm.near_places || 'ไม่ระบุ'}\nสิ่งอำนวยความสะดวก: ${dorm.facilities || 'ไม่ระบุ'}\nน้ำ/ไฟ: ${dorm.water_cost || '-'} / ${dorm.electricity_cost || '-'}\nติดต่อ: ${dorm.contact_phone || 'ไม่ระบุ'}`;
  }).join('\n\n');
}

// Helper: ตอบแบบ rule-based ทันทีถ้าเป็นคำถามง่าย ลดภาระโมเดล
function answerSimpleQuery(message, dorms) {
  const msg = message.toLowerCase();
  // นับจำนวนทั้งหมด
  if (/ทั้งหมดกี่|กี่หอ|กี่แห่ง|ทั้งหมด/.test(msg) && /หอ/.test(msg)) {
    return `ตอนนี้มีหอพักที่เปิดอนุมัติทั้งหมด ${dorms.length} แห่งค่ะ 🏠`;
  }

  // คำถามทั่วไปไม่เกี่ยวกับหอพัก (บาง pattern) ปฏิเสธเบื้องต้น
  if (!/หอ|ดอร์ม|dorm|ราคา|เช่า|ใกล้|แอร์|wifi|ไวไฟ|ห้อง|เปรียบเทียบ|ระยะทาง/.test(msg)) {
    if (/สวัสดี|hello|hi|หวัดดี/.test(msg)) {
      return 'สวัสดีค่ะ 😊 มีเรื่องหอพักอะไรให้ช่วยไหมคะ?';
    }
    return 'ขออภัยค่ะ ฉันสามารถช่วยเรื่องหอพักเท่านั้น 🏠 มีอะไรเกี่ยวกับหอพักให้ช่วยไหมคะ?';
  }
  return null; // ให้ AI ตอบต่อ
}

// ฟังก์ชันเรียกใช้ Groq AI
async function callGroqAI(userMessage, dormContext) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    throw new Error('GROQ_API_KEY not found');
  }

  const systemPrompt = `คุณเป็นผู้ช่วยอัจฉริยะสำหรับระบบหอพัก Smart Dorm ที่ชื่อ "Smart Assistant" 🤖

**หน้าที่ของคุณ:**
- ตอบคำถามเฉพาะเรื่องหอพักเท่านั้น โดยใช้ข้อมูลจากฐานข้อมูลที่ให้มา
- แนะนำหอพักที่เหมาะสมตามความต้องการ พร้อมเหตุผลชัดเจน
- ให้ข้อมูลราคา สิ่งอำนวยความสะดวก ที่อยู่ เบอร์ติดต่อ อย่างครบถ้วน
- เปรียบเทียบระยะทางและแนะนำตามสถานที่ที่ผู้ใช้สนใจ
- ตอบเป็นภาษาไทยอย่างเป็นกันเองและเป็นมิตร ใช้ emoji ให้เหมาะสม

**สถานที่สำคัญในมหาสารคาม:**
- มหาวิทยาลัยมหาสารคาม (ม.มหาสารคาม) - มหาวิทยาลัยหลัก
- มหาวิทยาลัยราชภัฏมหาสารคาม - สถาบันการศึกษา
- เสริมไทย คอมเพล็กซ์, เสริมไทย พลาซ่า - ห้างสรรพสินค้า
- วิทยาลัยเทคนิคมหาสารคาม, วิทยาลัยพยาบาลศรีมหาสารคาม - สถาบันการศึกษา
- แม็คโครมหาสารคาม - ห้างสรรพสินค้า
- สถานีขนส่งมหาสารคาม - ขนส่งสาธารณะ
- โรงพยาบาลมหาสารคาม (รพ.มหาสารคาม) - บริการสุขภาพ

**ข้อมูลหอพักปัจจุบัน:**
${dormContext}

**การตอบคำถาม:**
- หากถามเรื่องราคา: แสดงราคาทุกประเภทที่มี (รายเดือน รายวัน รายเทอม) พร้อมค่าน้ำ ค่าไฟ
- หากถามเรื่องสถานที่/ระยะทาง: วิเคราะห์ near_places และจัดอันดับความใกล้ พร้อมแนะนำ
- หากถามเรื่องสิ่งอำนวยความสะดวก: อธิบายรายละเอียดจาก facilities
- หากถามเปรียบเทียบ: แสดงตารางเปรียบเทียบหลายหอพัก
- หากถามเรื่องที่ไม่เกี่ยวกับหอพัก: ตอบว่า "ขออภัยค่ะ ฉันสามารถช่วยเรื่องหอพักเท่านั้น 🏠 มีอะไรเกี่ยวกับหอพักให้ช่วยไหมคะ?"

**รูปแบบการตอบ:**
- ใช้ emoji และจัดรูปแบบให้อ่านง่าย
- แสดงราคาพร้อมสกุลเงิน เช่น "฿3,500/เดือน"
- ระบุเหตุผลการแนะนำ เช่น "ใกล้มหาวิทยาลัย" "ราคาเหมาะสม"
- ถ้ามีหลายตัวเลือก ให้จัดอันดับ 1-3 พร้อมเหตุผล

ตอบอย่างละเอียดและมีประโยชน์ จากข้อมูลที่มีเท่านั้น`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      const errorText = await response.text();
      console.error('Groq API Error:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('Groq API Network Error:', error);
    return null;
  }
}

// Chatbot API endpoint
app.post('/chatbot', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'กรุณาส่งข้อความมา' });
    }

    // ดึงข้อมูลหอพักทั้งหมดจากฐานข้อมูล
    const dormQuery = `
      SELECT id, name, price_daily, price_monthly, price_term, 
             address_detail, facilities, near_places, 
             water_cost, electricity_cost, contact_phone
      FROM dorms WHERE status = 'approved' ORDER BY name
    `;

    const dorms = await new Promise((resolve, reject) => {
      pool.query(dormQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // ตอบแบบ simple rule-based ถ้าเข้าเงื่อนไข
    const simple = answerSimpleQuery(message, dorms);
    if (simple) {
      return res.json({
        message: simple,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: 'rule'
      });
    }

    // กรองเฉพาะหอที่เกี่ยวข้องกับคำถามเพื่อย่อ context
    const filteredDorms = filterDormsForQuery(message, dorms);
    const dormContext = buildDormContext(filteredDorms);

    // เรียกใช้ Groq AI พร้อม context ที่ย่อแล้ว
    const aiResponse = await callGroqAI(message.trim(), dormContext);

    if (aiResponse) {
      // ใช้คำตอบจาก AI
      res.json({
        message: aiResponse,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: 'groq-ai'
      });
    } else {
      // Fallback ถ้า AI ไม่สามารถตอบได้
      const fallbackMessage = `🤖 ขออภัยค่ะ ระบบ AI มีปัญหาชั่วคราว

แต่ฉันยังช่วยคุณได้! มีหอพักทั้งหมด ${dorms.length} แห่ง

💡 **ลองถามแบบนี้ดูค่ะ:**
• "หอพักราคาถูกที่สุด"
• "หอพักใกล้มหาวิทยาลัย" 
• "หอพักที่มี WiFi"
• "แนะนำหอพักดีๆ"

🏠 หรือดูรายการหอพักทั้งหมดในหน้าหลักได้เลยค่ะ!`;

      res.json({
        message: fallbackMessage,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({ 
      error: 'ขออภัย เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง',
      message: '🤖 ขออภัยค่ะ ระบบมีปัญหาชั่วคราว กรุณาลองถามใหม่อีกครั้งหรือใช้ฟอร์มค้นหาด้านบนแทนค่ะ 😊'
    });
  }
});

// ==================== ROOM MANAGEMENT ENDPOINTS ====================

/**
 * Get all rooms for a specific dorm
 * @route GET /dorms/:dormId/rooms
 * @param {string} dormId - ID of the dorm
 * @returns {Array} List of rooms
 */
app.get('/dorms/:dormId/rooms', authOwner, (req, res) => {
  const { dormId } = req.params;
  const ownerId = req.user.id;

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query('SELECT id FROM dorms WHERE id = ? AND owner_id = ?', [dormId, ownerId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // ดึงข้อมูลห้องพัก
    pool.query('SELECT * FROM rooms WHERE dorm_id = ? ORDER BY floor, room_number', [dormId], (err, rooms) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก' });
      }

      res.json(rooms);
    });
  });
});

/**
 * Add new room to a dorm
 * @route POST /dorms/:dormId/rooms
 * @param {string} dormId - ID of the dorm
 * @param {Object} roomData - Room information
 * @returns {Object} Success message and room ID
 */
app.post('/dorms/:dormId/rooms', authOwner, (req, res) => {
  const { dormId } = req.params;
  const ownerId = req.user.id;
  const {
    room_number,
    floor,
    price_daily,
    price_monthly,
    price_term,
    room_type,
    is_occupied,
    tenant_name,
    tenant_phone,
    move_in_date,
    notes
  } = req.body;

  // ตรวจสอบข้อมูลจำเป็น
  if (!room_number || !floor) {
    return res.status(400).json({ error: 'กรุณาระบุหมายเลขห้องและชั้น' });
  }

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query('SELECT id FROM dorms WHERE id = ? AND owner_id = ?', [dormId, ownerId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // ตรวจสอบว่าหมายเลขห้องซ้ำหรือไม่
    pool.query('SELECT id FROM rooms WHERE dorm_id = ? AND room_number = ?', [dormId, room_number], (err, existingRooms) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
      }

      if (existingRooms.length > 0) {
        return res.status(400).json({ error: 'หมายเลขห้องนี้มีอยู่แล้วในหอพัก' });
      }

      // เพิ่มห้องพักใหม่
      const roomData = {
        dorm_id: dormId,
        room_number,
        floor: parseInt(floor),
        price_daily: price_daily ? parseFloat(price_daily) : null,
        price_monthly: price_monthly ? parseFloat(price_monthly) : null,
        price_term: price_term ? parseFloat(price_term) : null,
        room_type: room_type || 'air_conditioner',
        is_occupied: is_occupied || false,
        tenant_name: tenant_name || null,
        tenant_phone: tenant_phone || null,
        move_in_date: move_in_date || null,
        notes: notes || null,
        created_at: new Date()
      };

      pool.query('INSERT INTO rooms SET ?', roomData, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มห้องพัก' });
        }

        // อัปเดตจำนวนห้องในตารางหอพัก
        pool.query('UPDATE dorms SET room_count = (SELECT COUNT(*) FROM rooms WHERE dorm_id = ?) WHERE id = ?', 
          [dormId, dormId], (updateErr) => {
          if (updateErr) {
            console.error('Error updating room count:', updateErr);
            // ไม่ return error เพราะห้องเพิ่มสำเร็จแล้ว แค่ไม่อัปเดต count
          }
        });

        res.json({ 
          message: 'เพิ่มห้องพักสำเร็จ',
          roomId: result.insertId
        });
      });
    });
  });
});

/**
 * Update room information
 * @route PUT /dorms/:dormId/rooms/:roomId
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @param {Object} roomData - Updated room information
 * @returns {Object} Success message
 */
app.put('/dorms/:dormId/rooms/:roomId', authOwner, (req, res) => {
  const { dormId, roomId } = req.params;
  const ownerId = req.user.id;
  const {
    room_number,
    floor,
    price_daily,
    price_monthly,
    price_term,
    room_type,
    is_occupied,
    tenant_name,
    tenant_phone,
    move_in_date,
    notes
  } = req.body;

  // ตรวจสอบข้อมูลจำเป็น
  if (!room_number || !floor) {
    return res.status(400).json({ error: 'กรุณาระบุหมายเลขห้องและชั้น' });
  }

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query('SELECT id FROM dorms WHERE id = ? AND owner_id = ?', [dormId, ownerId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // ตรวจสอบว่าห้องพักมีอยู่หรือไม่
    pool.query('SELECT id FROM rooms WHERE id = ? AND dorm_id = ?', [roomId, dormId], (err, roomResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
      }

      if (roomResults.length === 0) {
        return res.status(404).json({ error: 'ไม่พบห้องพัก' });
      }

      // ตรวจสอบว่าหมายเลขห้องซ้ำหรือไม่ (ยกเว้นห้องปัจจุบัน)
      pool.query('SELECT id FROM rooms WHERE dorm_id = ? AND room_number = ? AND id != ?', [dormId, room_number, roomId], (err, existingRooms) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
        }

        if (existingRooms.length > 0) {
          return res.status(400).json({ error: 'หมายเลขห้องนี้มีอยู่แล้วในหอพัก' });
        }

        // อัปเดตข้อมูลห้องพัก
        const roomData = {
          room_number,
          floor: parseInt(floor),
          price_daily: price_daily ? parseFloat(price_daily) : null,
          price_monthly: price_monthly ? parseFloat(price_monthly) : null,
          price_term: price_term ? parseFloat(price_term) : null,
          room_type: room_type || 'air_conditioner',
          is_occupied: is_occupied || false,
          tenant_name: tenant_name || null,
          tenant_phone: tenant_phone || null,
          move_in_date: move_in_date || null,
          notes: notes || null,
          updated_at: new Date()
        };

        pool.query('UPDATE rooms SET ? WHERE id = ?', [roomData, roomId], (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตห้องพัก' });
          }

          res.json({ message: 'อัปเดตข้อมูลห้องพักสำเร็จ' });
        });
      });
    });
  });
});

/**
 * Delete room
 * @route DELETE /dorms/:dormId/rooms/:roomId
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @returns {Object} Success message
 */
app.delete('/dorms/:dormId/rooms/:roomId', authOwner, (req, res) => {
  const { dormId, roomId } = req.params;
  const ownerId = req.user.id;

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query('SELECT id FROM dorms WHERE id = ? AND owner_id = ?', [dormId, ownerId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    // ตรวจสอบว่าห้องพักมีอยู่หรือไม่
    pool.query('SELECT id FROM rooms WHERE id = ? AND dorm_id = ?', [roomId, dormId], (err, roomResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
      }

      if (roomResults.length === 0) {
        return res.status(404).json({ error: 'ไม่พบห้องพัก' });
      }

      // ลบห้องพัก
      pool.query('DELETE FROM rooms WHERE id = ?', [roomId], (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบห้องพัก' });
        }

        // อัปเดตจำนวนห้องในตารางหอพัก
        pool.query('UPDATE dorms SET room_count = (SELECT COUNT(*) FROM rooms WHERE dorm_id = ?) WHERE id = ?', 
          [dormId, dormId], (updateErr) => {
          if (updateErr) {
            console.error('Error updating room count:', updateErr);
            // ไม่ return error เพราะห้องลบสำเร็จแล้ว แค่ไม่อัปเดต count
          }
        });

        res.json({ message: 'ลบห้องพักสำเร็จ' });
      });
    });
  });
});

/**
 * Update room utility usage (electricity and water)
 * @route PUT /dorms/:dormId/rooms/:roomId/utilities
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @returns {Object} Success message
 */
app.put('/dorms/:dormId/rooms/:roomId/utilities', authOwner, (req, res) => {
  const { dormId, roomId } = req.params;
  const ownerId = req.user.id;
  const {
    electricity_meter_old,
    electricity_meter_new,
    water_meter_old,
    water_meter_new,
    electricity_rate,
    water_rate,
    electricity_notes,
    water_notes,
    meter_reading_date
  } = req.body;

  console.log('=== UTILITIES UPDATE REQUEST ===');
  console.log('User ID:', ownerId);
  console.log('Dorm ID:', dormId);
  console.log('Room ID:', roomId);
  console.log('Request body:', req.body);

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่ และดึงข้อมูลหอพัก
  pool.query('SELECT * FROM dorms WHERE id = ? AND owner_id = ?', [dormId, ownerId], (err, dormResults) => {
    if (err) {
      console.error('Database error in dorms query:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
    }

    if (dormResults.length === 0) {
      console.log('Dorm not found or access denied:', { dormId, ownerId });
      return res.status(404).json({ error: 'ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    const dorm = dormResults[0];
    console.log('Found dorm:', { id: dorm.id, name: dorm.name });
    const dormElectricityRate = dorm.electricity_cost || 0;
    const dormWaterRate = dorm.water_cost || 0;

    // ตรวจสอบว่าห้องพักมีอยู่หรือไม่
    pool.query('SELECT * FROM rooms WHERE id = ? AND dorm_id = ?', [roomId, dormId], (err, roomResults) => {
      if (err) {
        console.error('Database error in rooms query:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
      }

      if (roomResults.length === 0) {
        console.log('Room not found:', { roomId, dormId });
        return res.status(404).json({ error: 'ไม่พบห้องพัก' });
      }

      const currentRoom = roomResults[0];
      console.log('Found room:', { id: currentRoom.id, room_number: currentRoom.room_number });

      // คำนวณการใช้งานจากค่ามิเตอร์เก่า-ใหม่
      const electricityUsage = electricity_meter_new && electricity_meter_old ? 
        parseFloat(electricity_meter_new) - parseFloat(electricity_meter_old) : 0;
      const waterUsage = water_meter_new && water_meter_old ? 
        parseFloat(water_meter_new) - parseFloat(water_meter_old) : 0;

      // เก็บประวัติการอ่านมิเตอร์
      if (electricity_meter_new || water_meter_new) {
        pool.query(
          `INSERT INTO meter_readings (
            room_id, reading_date, 
            electricity_meter_old, electricity_meter_new, electricity_rate, electricity_usage,
            water_meter_old, water_meter_new, water_rate, water_usage,
            electricity_notes, water_notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            roomId,
            meter_reading_date || new Date().toISOString().split('T')[0],
            electricity_meter_old || 0,
            electricity_meter_new || 0,
            dormElectricityRate,
            electricityUsage,
            water_meter_old || 0,
            water_meter_new || 0,
            dormWaterRate,
            waterUsage,
            electricity_notes || '',
            water_notes || '',
            req.user.firstName || 'เจ้าของหอพัก'
          ],
          (err) => {
            if (err) {
              console.error('Error saving meter reading history:', err);
            }
          }
        );
      }

      // อัปเดตข้อมูลการใช้สาธารณูปโภค (ไม่รวม rate ที่ควรมาจากการตั้งค่าหอพัก)
      const utilityData = {};
      if (electricity_meter_old !== undefined) utilityData.electricity_meter_old = parseFloat(electricity_meter_old) || 0;
      if (electricity_meter_new !== undefined) utilityData.electricity_meter_new = parseFloat(electricity_meter_new) || 0;
      if (water_meter_old !== undefined) utilityData.water_meter_old = parseFloat(water_meter_old) || 0;
      if (water_meter_new !== undefined) utilityData.water_meter_new = parseFloat(water_meter_new) || 0;
      // หมายเหตุ: electricity_rate และ water_rate จะไม่ถูกอัปเดตที่นี่ ใช้ค่าจากการตั้งค่าหอพัก
      if (electricity_notes !== undefined) utilityData.electricity_notes = electricity_notes;
      if (water_notes !== undefined) utilityData.water_notes = water_notes;
      if (meter_reading_date !== undefined) utilityData.meter_reading_date = meter_reading_date;

      if (Object.keys(utilityData).length > 0) {
        utilityData.updated_at = new Date();

        pool.query('UPDATE rooms SET ? WHERE id = ?', [utilityData, roomId], (err) => {
          if (err) {
            console.error('Database error in UPDATE rooms:', err);
            console.error('Query data:', utilityData);
            console.error('Room ID:', roomId);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลสาธารณูปโภค' });
          }

          console.log('Successfully updated utilities for room:', roomId);
          res.json({ message: 'อัปเดตข้อมูลการใช้สาธารณูปโภคสำเร็จ' });
        });
      } else {
        res.json({ message: 'ไม่มีข้อมูลที่ต้องอัปเดต' });
      }
    });
  });
});

/**
 * Get room utility usage history
 * @route GET /dorms/:dormId/rooms/:roomId/utilities/history
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @returns {Array} Utility usage history
 */
app.get('/dorms/:dormId/rooms/:roomId/utilities/history', authOwner, (req, res) => {
  const { dormId, roomId } = req.params;
  const ownerId = req.user.id;

  console.log('=== UTILITIES HISTORY REQUEST ===');
  console.log('User ID:', ownerId);
  console.log('Dorm ID:', dormId);
  console.log('Room ID:', roomId);

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query('SELECT id FROM dorms WHERE id = ? AND owner_id = ?', [dormId, ownerId], (err, results) => {
    if (err) {
      console.error('Database error in dorm check:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' });
    }

    console.log('Dorm check results:', results);

    if (results.length === 0) {
      console.log('Dorm not found or access denied');
      return res.status(404).json({ error: 'ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง' });
    }

    console.log('Fetching meter readings for room:', roomId);

    // ดึงประวัติการอ่านมิเตอร์
    pool.query(
      `SELECT 
        reading_date,
        electricity_meter_old,
        electricity_meter_new,
        electricity_rate,
        electricity_usage,
        water_meter_old,
        water_meter_new,
        water_rate,
        water_usage,
        electricity_notes,
        water_notes,
        created_by,
        created_at
      FROM meter_readings 
      WHERE room_id = ? 
      ORDER BY reading_date DESC, created_at DESC`,
      [roomId],
      (err, historyResults) => {
        if (err) {
          console.error('Database error in meter readings query:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติ' });
        }

        console.log('History results:', historyResults);
        console.log('Results count:', historyResults.length);
        res.json(historyResults);
      }
    );
  });
});

// ==================== REVIEWS API ENDPOINTS ====================

/**
 * Get reviews for a specific dorm
 * @route GET /dorms/:dormId/reviews
 */
app.get('/dorms/:dormId/reviews', async (req, res) => {
  const { dormId } = req.params;
  
  try {
    pool.query(
      `SELECT r.*, c.name as customer_name 
       FROM reviews r 
       LEFT JOIN customers c ON r.customer_id = c.id 
       WHERE r.dorm_id = ? 
       ORDER BY r.created_at DESC`,
      [dormId],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว' });
        }
        res.json(results);
      }
    );
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว' });
  }
});

/**
 * Get review statistics for a specific dorm
 * @route GET /dorms/:dormId/reviews/stats
 */
app.get('/dorms/:dormId/reviews/stats', async (req, res) => {
  const { dormId } = req.params;
  
  try {
    pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        AVG(cleanliness_rating) as avg_cleanliness,
        AVG(location_rating) as avg_location,
        AVG(value_rating) as avg_value,
        AVG(service_rating) as avg_service
       FROM reviews 
       WHERE dorm_id = ?`,
      [dormId],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติรีวิว' });
        }
        
        const stats = results[0];
        // Convert averages to 2 decimal places
        if (stats.average_rating) {
          stats.average_rating = parseFloat(stats.average_rating).toFixed(1);
        }
        if (stats.avg_cleanliness) {
          stats.avg_cleanliness = parseFloat(stats.avg_cleanliness).toFixed(1);
        }
        if (stats.avg_location) {
          stats.avg_location = parseFloat(stats.avg_location).toFixed(1);
        }
        if (stats.avg_value) {
          stats.avg_value = parseFloat(stats.avg_value).toFixed(1);
        }
        if (stats.avg_service) {
          stats.avg_service = parseFloat(stats.avg_service).toFixed(1);
        }
        
        res.json(stats);
      }
    );
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติรีวิว' });
  }
});

/**
 * Create a new review for a dorm
 * @route POST /dorms/:dormId/reviews
 */
app.post('/dorms/:dormId/reviews', verifyToken, async (req, res) => {
  const { dormId } = req.params;
  const { rating, comment, cleanliness_rating, location_rating, value_rating, service_rating } = req.body;
  const customerId = req.user.id;
  
  // Validation
  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'กรุณาให้คะแนนและเขียนความคิดเห็น' });
  }
  
  if (!cleanliness_rating || !location_rating || !value_rating || !service_rating) {
    return res.status(400).json({ error: 'กรุณาให้คะแนนในทุกหมวดหมู่' });
  }
  
  try {
    // Check if user already reviewed this dorm
    pool.query(
      'SELECT id FROM reviews WHERE dorm_id = ? AND customer_id = ?',
      [dormId, customerId],
      (err, existing) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบรีวิว' });
        }
        
        if (existing.length > 0) {
          return res.status(400).json({ error: 'คุณได้รีวิวหอพักนี้แล้ว' });
        }
        
        // Insert new review
        pool.query(
          `INSERT INTO reviews (dorm_id, customer_id, rating, comment, cleanliness_rating, location_rating, value_rating, service_rating, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [dormId, customerId, rating, comment, cleanliness_rating, location_rating, value_rating, service_rating],
          (err, result) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกรีวิว' });
            }
            
            res.status(201).json({ 
              message: 'บันทึกรีวิวสำเร็จ',
              reviewId: result.insertId 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกรีวิว' });
  }
});

/**
 * Update an existing review
 * @route PUT /reviews/:reviewId
 */
app.put('/reviews/:reviewId', verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment, cleanliness_rating, location_rating, value_rating, service_rating } = req.body;
  const customerId = req.user.id;
  
  // Validation
  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'กรุณาให้คะแนนและเขียนความคิดเห็น' });
  }
  
  try {
    // Check if review belongs to the user
    pool.query(
      'SELECT customer_id FROM reviews WHERE id = ?',
      [reviewId],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบรีวิว' });
        }
        
        if (result.length === 0) {
          return res.status(404).json({ error: 'ไม่พบรีวิวที่ต้องการแก้ไข' });
        }
        
        if (result[0].customer_id !== customerId) {
          return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขรีวิวนี้' });
        }
        
        // Update review
        pool.query(
          `UPDATE reviews 
           SET rating = ?, comment = ?, cleanliness_rating = ?, location_rating = ?, value_rating = ?, service_rating = ?, updated_at = NOW()
           WHERE id = ?`,
          [rating, comment, cleanliness_rating, location_rating, value_rating, service_rating, reviewId],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตรีวิว' });
            }
            
            res.json({ message: 'อัปเดตรีวิวสำเร็จ' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตรีวิว' });
  }
});

/**
 * Delete a review
 * @route DELETE /reviews/:reviewId
 */
app.delete('/reviews/:reviewId', verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const customerId = req.user.id;
  
  try {
    // Check if review belongs to the user
    pool.query(
      'SELECT customer_id FROM reviews WHERE id = ?',
      [reviewId],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบรีวิว' });
        }
        
        if (result.length === 0) {
          return res.status(404).json({ error: 'ไม่พบรีวิวที่ต้องการลบ' });
        }
        
        if (result[0].customer_id !== customerId) {
          return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบรีวิวนี้' });
        }
        
        // Delete review
        pool.query(
          'DELETE FROM reviews WHERE id = ?',
          [reviewId],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรีวิว' });
            }
            
            res.json({ message: 'ลบรีวิวสำเร็จ' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรีวิว' });
  }
});

// ==================== METER READING MANAGEMENT ====================

// มาตรวัดน้ำและไฟ - ส่วนของผู้จัดการ
app.get('/meter-readings/:roomId', (req, res) => {
    const { roomId } = req.params;

    // ดึงประวัติการอ่านมิเตอร์
    pool.query(
      'SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC, created_at DESC LIMIT 50',
      [roomId],
      (err, readings) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ' });
        }

        res.json(readings);
      }
    );
});

// ==================== LOCATION COORDINATES API ENDPOINTS ====================
/**
 * เพิ่มสถานที่ใกล้เคียงสำหรับหอพัก
 * @route POST /dorms/:dormId/nearby-locations
 */
app.post('/dorms/:dormId/nearby-locations', authOwner, (req, res) => {
  const { dormId } = req.params;
  const { location_type, location_name, latitude, longitude, description, distance_km } = req.body;
  
  const sql = 'INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  pool.query(sql, [dormId, location_type, location_name, latitude, longitude, description, distance_km], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      success: true, 
      location_id: result.insertId,
      message: 'เพิ่มสถานที่ใกล้เคียงสำเร็จ'
    });
  });
});

/**
 * ดูสถานที่ใกล้เคียงของหอพัก
 * @route GET /dorms/:dormId/nearby-locations
 */
app.get('/dorms/:dormId/nearby-locations', (req, res) => {
  const { dormId } = req.params;
  const { location_type } = req.query;
  
  let sql = `
    SELECT 
      lc.*,
      d.name AS dorm_name
    FROM location_coordinates lc
    LEFT JOIN dorms d ON lc.dorm_id = d.id
    WHERE lc.dorm_id = ?
  `;
  
  const params = [dormId];
  
  if (location_type) {
    sql += ' AND lc.location_type = ?';
    params.push(location_type);
  }
  
  sql += ' ORDER BY lc.location_type, lc.distance_km';
  
  pool.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * แก้ไขสถานที่ใกล้เคียง
 * @route PUT /nearby-locations/:locationId
 */
app.put('/nearby-locations/:locationId', authOwner, (req, res) => {
  const { locationId } = req.params;
  const { location_type, location_name, latitude, longitude, description, distance_km } = req.body;
  
  const sql = 'UPDATE location_coordinates SET location_type = ?, location_name = ?, latitude = ?, longitude = ?, description = ?, distance_km = ? WHERE id = ?';
  
  pool.query(sql, [location_type, location_name, latitude, longitude, description, distance_km, locationId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบสถานที่ที่ต้องการแก้ไข' });
    res.json({ success: true, message: 'แก้ไขสถานที่ใกล้เคียงสำเร็จ' });
  });
});

/**
 * ลบสถานที่ใกล้เคียง
 * @route DELETE /nearby-locations/:locationId
 */
app.delete('/nearby-locations/:locationId', authOwner, (req, res) => {
  const { locationId } = req.params;
  
  const sql = 'DELETE FROM location_coordinates WHERE id = ?';
  
  pool.query(sql, [locationId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบสถานที่ที่ต้องการลบ' });
    res.json({ success: true, message: 'ลบสถานที่ใกล้เคียงสำเร็จ' });
  });
});

/**
 * ค้นหาหอพักตามสถานที่ใกล้เคียง
 * @route GET /search/dorms-by-location
 */
app.get('/search/dorms-by-location', (req, res) => {
  const { location_type, max_distance, latitude, longitude } = req.query;
  
  let sql = `
    SELECT DISTINCT 
      d.*,
      GROUP_CONCAT(
        CONCAT(lc.location_type, ':', lc.location_name, ':', lc.distance_km) 
        ORDER BY lc.distance_km SEPARATOR ';'
      ) AS nearby_locations,
      COUNT(DISTINCT lc.id) AS location_count
    FROM dorms d
    LEFT JOIN location_coordinates lc ON d.id = lc.dorm_id
    WHERE d.status = 'approved'
  `;
  
  const params = [];
  
  if (location_type) {
    sql += ' AND lc.location_type = ?';
    params.push(location_type);
  }
  
  if (max_distance) {
    sql += ' AND lc.distance_km <= ?';
    params.push(max_distance);
  }
  
  sql += ' GROUP BY d.id ORDER BY location_count DESC, d.name';
  
  pool.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * ค้นหาสถานที่ทั้งหมดตามประเภท
 * @route GET /locations/by-type/:locationType
 */
app.get('/locations/by-type/:locationType', (req, res) => {
  const { locationType } = req.params;
  
  const sql = `
    SELECT 
      lc.*,
      d.name AS dorm_name,
      d.address_detail AS dorm_address
    FROM location_coordinates lc
    LEFT JOIN dorms d ON lc.dorm_id = d.id
    WHERE lc.location_type = ?
    ORDER BY lc.location_name, lc.distance_km
  `;
  
  pool.query(sql, [locationType], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🗄️  Database: MySQL`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
});