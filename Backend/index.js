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
const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { answerCheapestDormQuery } = require("./cheapest-dorm-helper");
const {
  calculateDistanceBetweenDorms,
  calculateRoadDistance,
} = require("./distance-service");

// โหลด .env file ด้วย absolute path เพื่อให้แน่ใจ
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

// ==================== GOOGLE GEMINI AI SETUP ====================
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { log } = require("console");
const genAI = new GoogleGenerativeAI("AIzaSyDyI1BbUfIF3QjUJ5g6PR2mhr_xB9ejhEA");

console.log("🤖 Google Gemini Pro AI initialized ✅");

// ฟังก์ชันคำนวณระยะทางระหว่างสองจุด (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลกในหน่วยกิโลเมตร
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // ปัดเศษเป็น 2 ตำแหน่ง
}

// ฟังก์ชันเชื่อมโยงสถานที่ใกล้เคียงและคำนวณระยะทาง
function linkNearbyPlaces(dormId, dormLat, dormLon, nearPlacesString) {
  if (!nearPlacesString) return;

  const nearPlaces = nearPlacesString
    .split(",")
    .map((place) => place.trim())
    .filter((place) => place);

  nearPlaces.forEach((placeName) => {
    // หาพิกัดของสถานที่ใกล้เคียงจากฐานข้อมูล
    const findPlaceSql = `
      SELECT id, latitude, longitude, location_type, location_name 
      FROM location_coordinates 
      WHERE location_name LIKE ? AND dorm_id IS NULL
      LIMIT 1
    `;

    pool.query(findPlaceSql, [`%${placeName}%`], (err, results) => {
      if (err) {
        console.error("Error finding place:", err);
        return;
      }

      if (results.length > 0) {
        const place = results[0];
        const distance = calculateDistance(
          dormLat,
          dormLon,
          place.latitude,
          place.longitude
        );

        // เพิ่มข้อมูลสถานที่ใกล้เคียงพร้อมระยะทาง
        const insertNearPlaceSql = `
          INSERT INTO location_coordinates 
          (dorm_id, location_type, location_name, latitude, longitude, distance_km, description) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        pool.query(
          insertNearPlaceSql,
          [
            dormId,
            place.location_type,
            place.location_name,
            place.latitude,
            place.longitude,
            distance,
            `ห่างจากหอพัก ${distance} กิโลเมตร`,
          ],
          (insertErr) => {
            if (insertErr) {
              console.error("Error inserting nearby place:", insertErr);
            } else {
              console.log(
                `✅ Linked ${place.location_name} to dorm ${dormId}, distance: ${distance} km`
              );
            }
          }
        );
      } else {
        console.log(`⚠️ Place not found: ${placeName}`);
      }
    });
  });
}

// ==================== SERVER INITIALIZATION ====================
const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

// ==================== MIDDLEWARE CONFIGURATION ====================
app.use(cors());
app.use(express.json());

// Static file serving for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== HEALTH CHECK ENDPOINT ====================
/**
 * Health check endpoint to verify server status
 * @route GET /health
 * @returns {Object} Server status and timestamp
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    chatbot: "ready",
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
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "efllll",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Test Database Connection
 * ทดสอบการเชื่อมต่อฐานข้อมูลเมื่อเริ่มต้นระบบ
 */
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to database:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
  connection.release();
});

// ==================== FILE UPLOAD CONFIGURATION ====================
/**
 * Multer storage configuration for customer profile pictures
 * Handles file uploads to the uploads directory
 */
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Store in uploads folder
  },
  filename: function (req, file, cb) {
    // Generate filename using customer info from database
    pool.query(
      "SELECT firstName, lastName FROM customers WHERE id = ?",
      [req.user.id],
      (err, results) => {
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
      }
    );
  },
});

/**
 * Multer upload middleware for customer profile pictures
 * Includes file size and type validation
 */
const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น"), false);
    }
  },
});

/**
 * Multer storage configuration for owner profile pictures
 * Handles file uploads to the uploads directory
 */
const ownerProfileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Store in uploads folder
  },
  filename: function (req, file, cb) {
    // Generate filename using owner info from database
    pool.query(
      "SELECT firstName, lastName FROM owners WHERE id = ?",
      [req.user.id],
      (err, results) => {
        if (err || results.length === 0) {
          // If error occurs, use id and timestamp
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          cb(null, `owner_${req.user.id}_${timestamp}${ext}`);
        } else {
          const owner = results[0];
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          // Use owner's real name
          const filename = `${owner.firstName}_${owner.lastName}_${timestamp}${ext}`;
          cb(null, filename);
        }
      }
    );
  },
});

/**
 * Multer upload middleware for owner profile pictures
 * Includes file size and type validation
 */
const uploadOwnerProfile = multer({
  storage: ownerProfileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น"), false);
    }
  },
});

/**
 * Multer storage configuration for dorm images
 * Uses timestamp-based filename generation
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

/**
 * Multer upload middleware for dorm images
 * Includes file size and type validation
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น"), false);
    }
  },
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

  pool.query(
    checkAvatarColumnSql,
    [process.env.DB_DATABASE],
    (err, results) => {
      if (err) {
        console.error("Error checking avatar_url column:", err);
        return;
      }

      if (results.length === 0) {
        const addColumnSql = `ALTER TABLE customers ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL`;

        pool.query(addColumnSql, (err) => {
          if (err) {
            console.error("Error adding avatar_url column:", err);
          } else {
            console.log("✅ Added avatar_url column to customers table");
          }
        });
      } else {
        console.log("✅ avatar_url column already exists");
      }
    }
  );

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
      console.error("Error checking dorms columns:", err);
      return;
    }

    const existingColumns = results.map((row) => row.COLUMN_NAME);

    // เพิ่ม status column
    if (!existingColumns.includes("status")) {
      const addStatusSql = `ALTER TABLE dorms ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`;
      pool.query(addStatusSql, (err) => {
        if (err) {
          console.error("Error adding status column:", err);
        } else {
          console.log("✅ Added status column to dorms table");
        }
      });
    } else {
      console.log("✅ status column already exists");
    }

    // เพิ่ม reject_reason column
    if (!existingColumns.includes("reject_reason")) {
      const addRejectReasonSql = `ALTER TABLE dorms ADD COLUMN reject_reason TEXT DEFAULT NULL`;
      pool.query(addRejectReasonSql, (err) => {
        if (err) {
          console.error("Error adding reject_reason column:", err);
        } else {
          console.log("✅ Added reject_reason column to dorms table");
        }
      });
    } else {
      console.log("✅ reject_reason column already exists");
    }

    // เพิ่ม created_at column
    if (!existingColumns.includes("created_at")) {
      const addCreatedAtSql = `ALTER TABLE dorms ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      pool.query(addCreatedAtSql, (err) => {
        if (err) {
          console.error("Error adding created_at column:", err);
        } else {
          console.log("✅ Added created_at column to dorms table");
        }
      });
    } else {
      console.log("✅ created_at column already exists");
    }

    // เพิ่ม updated_at column
    if (!existingColumns.includes("updated_at")) {
      const addUpdatedAtSql = `ALTER TABLE dorms ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`;
      pool.query(addUpdatedAtSql, (err) => {
        if (err) {
          console.error("Error adding updated_at column:", err);
        } else {
          console.log("✅ Added updated_at column to dorms table");
        }
      });
    } else {
      console.log("✅ updated_at column already exists");
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

  pool.query(
    checkOwnerZipCodeSql,
    [process.env.DB_DATABASE],
    (err, results) => {
      if (err) {
        console.error("Error checking zip_code column in owners:", err);
        return;
      }

      if (results.length === 0) {
        const addZipCodeSql = `ALTER TABLE owners ADD COLUMN zip_code VARCHAR(10) DEFAULT NULL`;

        pool.query(addZipCodeSql, (err) => {
          if (err) {
            console.error("Error adding zip_code column to owners:", err);
          } else {
            console.log("✅ Added zip_code column to owners table");
          }
        });
      } else {
        console.log("✅ zip_code column already exists in owners table");
      }
    }
  );

  // ตรวจสอบและเพิ่ม profile_image column ใน owners table
  const checkOwnerProfileImageSql = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'owners' 
    AND COLUMN_NAME = 'profile_image'
    AND TABLE_SCHEMA = ?
  `;

  pool.query(
    checkOwnerProfileImageSql,
    [process.env.DB_DATABASE],
    (err, results) => {
      if (err) {
        console.error("Error checking profile_image column in owners:", err);
        return;
      }

      if (results.length === 0) {
        const addProfileImageSql = `ALTER TABLE owners ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL`;

        pool.query(addProfileImageSql, (err) => {
          if (err) {
            console.error("Error adding profile_image column to owners:", err);
          } else {
            console.log("✅ Added profile_image column to owners table");
          }
        });
      } else {
        console.log("✅ profile_image column already exists in owners table");
      }
    }
  );

  // ตรวจสอบและสร้างตาราง reviews
  const checkReviewsTableSql = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = 'reviews' 
    AND TABLE_SCHEMA = ?
  `;

  pool.query(
    checkReviewsTableSql,
    [process.env.DB_DATABASE],
    (err, results) => {
      if (err) {
        console.error("Error checking reviews table:", err);
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
            console.error("Error creating reviews table:", err);
          } else {
            console.log("✅ Created reviews table successfully");
          }
        });
      } else {
        console.log("✅ reviews table already exists");
      }
    }
  );
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
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Token verification error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
        message: "Please login again",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
        message: "Token is malformed",
      });
    }

    return res.status(401).json({
      error: "Token verification failed",
      code: "VERIFICATION_FAILED",
    });
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
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );
    console.log("✅ Token decoded:", decoded);

    if (decoded.role !== "admin") {
      console.log("❌ Not admin role:", decoded.role);
      return res
        .status(403)
        .json({ error: "Forbidden - Admin access required" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Admin token verification error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Admin token expired",
        code: "TOKEN_EXPIRED",
        message: "Please login again as admin",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid admin token",
        code: "INVALID_TOKEN",
        message: "Token is malformed",
      });
    }

    return res.status(401).json({
      error: "Admin token verification failed",
      code: "VERIFICATION_FAILED",
    });
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
app.post("/register", async (req, res) => {
  const { role, password, ...data } = req.body;

  if (!password) {
    return res.status(400).json({ error: "กรุณากรอกรหัสผ่าน" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    let sql = "";
    let values = [];

    // Customer registration
    if (role === "customer") {
      sql = `INSERT INTO customers 
        (firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      values = [
        data.firstName,
        data.lastName,
        data.age,
        data.dob,
        data.houseNo,
        data.moo,
        data.soi,
        data.road,
        data.subdistrict,
        data.district,
        data.province,
        data.email,
        hash,
        data.phone,
      ];
    }
    // Owner registration
    else if (role === "owner") {
      sql = `INSERT INTO owners 
        (dormName, firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      values = [
        data.dormName,
        data.firstName,
        data.lastName,
        data.age,
        data.dob,
        data.houseNo,
        data.moo,
        data.soi,
        data.road,
        data.subdistrict,
        data.district,
        data.province,
        data.email,
        hash,
        data.phone,
      ];
    }
    // Admin registration
    else if (role === "admin") {
      sql = `INSERT INTO admins 
        (firstName, lastName, age, dob, houseNo, moo, soi, road, subdistrict, district, province, email, password, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      values = [
        data.firstName,
        data.lastName,
        data.age,
        data.dob,
        data.houseNo,
        data.moo,
        data.soi,
        data.road,
        data.subdistrict,
        data.district,
        data.province,
        data.email,
        hash,
        data.phone,
      ];
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    pool.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "อีเมลนี้ถูกใช้แล้ว" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: "สมัครสมาชิกสำเร็จ" });
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
// app.get("/dorms", (req, res) => {
//   const sql = `
//     SELECT
//       dorms.*,
//       dorm_images.image_path,
//       GROUP_CONCAT(
//         CONCAT(lc.location_type, ':', lc.location_name, ':', lc.latitude, ':', lc.longitude, ':', IFNULL(lc.distance_km, '0'))
//         ORDER BY lc.location_type, lc.distance_km SEPARATOR ';'
//       ) AS location_coordinates
//     FROM dorms
//     LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
//     LEFT JOIN location_coordinates lc ON dorms.id = lc.dorm_id
//     WHERE dorms.status = 'approved'
//     GROUP BY dorms.id, dorm_images.image_path
//   `;

//   pool.query(sql, (err, results) => {
//     if (err) {
//       console.error("❌ Error fetching dorms:", err);
//       return res.status(500).json({ error: err.message });
//     }

//     // Group images and coordinates by dorm ID
//     const dormMap = {};
//     results.forEach((row) => {
//       if (!dormMap[row.id]) {
//         dormMap[row.id] = {
//           ...row,
//           images: [],
//           coordinates: [],
//         };

//         // Parse location coordinates
//         if (row.location_coordinates) {
//           const coords = row.location_coordinates.split(";");
//           dormMap[row.id].coordinates = coords.map((coord) => {
//             const [type, name, lat, lng, distance] = coord.split(":");
//             return {
//               location_type: type,
//               location_name: name,
//               latitude: parseFloat(lat),
//               longitude: parseFloat(lng),
//               distance_km: parseFloat(distance) || 0,
//             };
//           });
//         }
//       }
//       if (row.image_path) {
//         dormMap[row.id].images.push(row.image_path);
//       }
//     });

//     // Convert to array and remove image_path field
//     const dorms = Object.values(dormMap).map((dorm) => {
//       delete dorm.image_path;
//       return dorm;
//     });

//     res.json(dorms);
//   });
// });

/**
 * Get Single Dorm by ID
 * ดึงข้อมูลหอพักเดี่ยวด้วย ID
 * @route GET /dorms/:id
 * @returns {Object} ข้อมูลหอพักพร้อมรูปภาพ
 */
app.get("/dorms/:id", (req, res) => {
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
      console.error("Error fetching dorm:", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลหอพัก" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลหอพัก" });
    }

    const dorm = results[0];

    // แปลงรูปภาพเป็น array
    if (dorm.images) {
      dorm.images = dorm.images.split(",").filter((img) => img);
    } else {
      dorm.images = [];
    }

    // แปลงพิกัดสถานที่ใกล้เคียง
    if (dorm.location_coordinates) {
      dorm.coordinates = dorm.location_coordinates
        .split(";")
        .filter((coord) => coord)
        .map((coord) => {
          const [type, name, lat, lng, distance] = coord.split(":");
          return {
            type,
            name,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            distance: parseFloat(distance) || 0,
          };
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
app.delete("/dorms/:id", authOwner, (req, res) => {
  const dormId = req.params.id;
  const userId = req.user.id;

  // ตรวจสอบว่าหอพักนี้เป็นของเจ้าของคนนี้หรือไม่
  const checkOwnerSql = "SELECT id FROM dorms WHERE id = ? AND owner_id = ?";

  pool.query(checkOwnerSql, [dormId, userId], (err, results) => {
    if (err) {
      console.error("Error checking dorm ownership:", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์" });
    }

    if (results.length === 0) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบหอพักนี้" });
    }

    // ลบรูปภาพก่อน
    const deleteImagesSql = "DELETE FROM dorm_images WHERE dorm_id = ?";
    pool.query(deleteImagesSql, [dormId], (err) => {
      if (err) {
        console.error("Error deleting dorm images:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบรูปภาพ" });
      }

      // ลบพิกัดสถานที่ใกล้เคียง
      const deleteCoordsSql =
        "DELETE FROM location_coordinates WHERE dorm_id = ?";
      pool.query(deleteCoordsSql, [dormId], (err) => {
        if (err) {
          console.error("Error deleting coordinates:", err);
        }

        // ลบหอพัก
        const deleteDormSql = "DELETE FROM dorms WHERE id = ?";
        pool.query(deleteDormSql, [dormId], (err, result) => {
          if (err) {
            console.error("Error deleting dorm:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในการลบหอพัก" });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบหอพักที่ต้องการลบ" });
          }

          broadcastDormsUpdate();
          res.json({ success: true, message: "ลบหอพักสำเร็จ" });
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
app.get("/owner/dorms", authOwner, (req, res) => {
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
      console.error("❌ Error fetching owner dorms:", err);
      return res.status(500).json({ error: err.message });
    }

    // Group images and coordinates by dorm ID
    const dormMap = {};
    results.forEach((row) => {
      if (!dormMap[row.id]) {
        dormMap[row.id] = {
          ...row,
          images: [],
          coordinates: [],
        };

        // Parse location coordinates
        if (row.location_coordinates) {
          const coords = row.location_coordinates.split(";");
          dormMap[row.id].coordinates = coords.map((coord) => {
            const [type, name, lat, lng, distance] = coord.split(":");
            return {
              location_type: type,
              location_name: name,
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              distance_km: parseFloat(distance) || 0,
            };
          });
        }
      }
      if (row.image_path) {
        dormMap[row.id].images.push(row.image_path);
      }
    });

    // Convert to array and remove temporary fields
    const dorms = Object.values(dormMap).map((dorm) => {
      // ดึงพิกัดของหอพักจาก coordinates array
      const dormLocation = dorm.coordinates.find(
        (coord) => coord.location_type === "dorm_location"
      );
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

app.get("/dorms", async (req, res) => {
  try {
    const sql = "SELECT * FROM dorms";
    const [rows] = await pool.query(sql); 

    if (rows.length === 0) {
      res.json({
        status: 404, 
        data: [],
        mes: "nodata",
        total: 0,
      });
    } else {
      res.json({
        status: 200,
        data: rows,
        mes: "มีข้อมูล",
        total: rows.length,
      });
    }
  } catch (err) {
    console.error("Dorms fetch error:", err);
    res.json({
      status: 500,
      data: [],
      mes: err.stack,
      total: 0,
    });
  }
});


// app.("/owners", (req, res) => {
//   const sql = "SELECT * FROM owners";

//   pool.query(sql, (err, resulte) => {
//     if (err) return res.status(500).json({ errror });
//     res.json(resulte); // ส่งข้อมูลกลับ
//   })
// })

// app.get("/test", (req, res) => {
//   res.json({ message: "API ทำงานแล้ว!" });
// });

// app.post("/users", (req, res) => {
//   const { name, email } = req.body;
//   res.json({ success: true, name, email });
// });

app.post("/newlogin", async (req, res) => {
  log("New login endpoint hit");
  const {
    name,
    price_daily,
    price_monthly,
    price_term,
    floor_count,
    room_count,
    address_detail,
    water_cost,
    electricity_cost,
    deposit,
    contact_phone,
    facilities,
    near_places,
    latitude,
    longitude,
    owner_id,
  } = req.body;

  return res.status(200).json();
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
  }
  console.log("Received login request:", email, password);

  try {
    const poolPromise = pool.promise();

    // Function to check a table for a user
    const findUser = async (table, role) => {
      const [results] = await poolPromise.query(
        `SELECT * FROM ${table} WHERE email = ?`,
        [email]
      );
      // console.log(`Checking ${role} table:`, results);
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
    let user = await findUser("customers", "customer");
    log("Customer check result:", user);
    if (user) {
      const token = jwt.sign(
        { id: user.id, role: "customer" },
        process.env.JWT_SECRET || "your_secret_key",
        { expiresIn: "7d" }
      );
      console.log("Customer login successful:", {
        id: user.id,
        role: "customer",
      });
      return res.json({ token, role: "customer" });
    }

    user = await findUser("owners", "owner");
    if (user) {
      const token = jwt.sign(
        { id: user.id, role: "owner" },
        process.env.JWT_SECRET || "your_secret_key",
        { expiresIn: "7d" }
      );
      console.log("Owner login successful:", { id: user.id, role: "owner" });
      return res.json({ token, role: "owner" });
    }

    user = await findUser("admins", "admin");
    if (user) {
      const token = jwt.sign(
        { id: user.id, role: "admin" },
        process.env.JWT_SECRET || "your_secret_key",
        { expiresIn: "7d" }
      );
      console.log("Admin login successful:", {
        id: user.id,
        role: "admin",
        email: user.email,
      });
      return res.json({ token, role: "admin" });
    }

    // If no user is found in any table
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

/**
 * Token Refresh Endpoint
 * ต่ออายุ JWT token เมื่อใกล้หมดอายุ
 * @route POST /refresh-token
 */
app.post("/refresh-token", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // ตรวจสอบ token แม้จะหมดอายุแล้ว
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key",
      {
        ignoreExpiration: true,
      }
    );

    // ตรวจสอบว่า token หมดอายุหรือไม่
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.log(
        "🔄 Refreshing expired token for user:",
        decoded.id,
        "role:",
        decoded.role
      );
    }

    // สร้าง token ใหม่
    const newToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" }
    );

    res.json({
      token: newToken,
      role: decoded.role,
      message: "Token refreshed successfully",
    });
  } catch (err) {
    console.error("❌ Token refresh error:", err.message);
    return res.status(401).json({
      error: "Cannot refresh token",
      code: "REFRESH_FAILED",
      message: "Please login again",
    });
  }
});

// Broadcast event เมื่อมีการเปลี่ยนแปลงข้อมูลหอพัก
function broadcastDormsUpdate() {
  io.emit("dorms-updated");
}

// ฟังก์ชันสร้างห้องพักเปล่าๆ ตามจำนวนที่กำหนด
function createEmptyRooms(dormId, roomCount) {
  if (!roomCount || roomCount <= 0) return;

  const roomInserts = [];
  for (let i = 1; i <= parseInt(roomCount); i++) {
    roomInserts.push([
      dormId,
      `ห้อง ${i.toString().padStart(3, "0")}`, // ชื่อห้อง เช่น "ห้อง 001", "ห้อง 002"
      "available", // สถานะห้อง
      null, // ราคาห้องยังไม่กำหนด
      null, // รายละเอียดห้องยังไม่กำหนด
      1, // ชั้น default เป็น 1 (สามารถแก้ไขได้ภายหลัง)
    ]);
  }

  const roomSql =
    "INSERT INTO rooms (dorm_id, room_number, status, price, description, floor) VALUES ?";

  pool.query(roomSql, [roomInserts], (err, result) => {
    if (err) {
      console.error("❌ Error creating empty rooms:", err);
    } else {
      console.log(`✅ Created ${roomCount} empty rooms for dorm ${dormId}`);
    }
  });
}

// ฟังก์ชันจัดการจำนวนห้องเมื่อแก้ไขหอพัก
function updateRoomCount(dormId, newRoomCount, currentRoomCount) {
  const newCount = parseInt(newRoomCount) || 0;
  const currentCount = parseInt(currentRoomCount) || 0;

  console.log(
    `🏠 Room count update: ${currentCount} -> ${newCount} for dorm ${dormId}`
  );

  if (newCount === currentCount) {
    console.log("📊 Room count unchanged");
    return;
  }

  if (newCount > currentCount) {
    // เพิ่มห้องใหม่
    const roomsToAdd = newCount - currentCount;
    const roomInserts = [];

    for (let i = currentCount + 1; i <= newCount; i++) {
      roomInserts.push([
        dormId,
        `ห้อง ${i.toString().padStart(3, "0")}`,
        "available",
        null,
        null,
        1,
      ]);
    }

    const roomSql =
      "INSERT INTO rooms (dorm_id, room_number, status, price, description, floor) VALUES ?";
    pool.query(roomSql, [roomInserts], (err, result) => {
      if (err) {
        console.error("❌ Error adding new rooms:", err);
      } else {
        console.log(`✅ Added ${roomsToAdd} new rooms for dorm ${dormId}`);
      }
    });
  } else if (newCount < currentCount) {
    // ลบห้องส่วนเกิน (เฉพาะห้องที่ว่าง)
    const roomsToDelete = currentCount - newCount;

    // ลบห้องที่มี room_number มากที่สุดและสถานะเป็น available
    const deleteSql = `
      DELETE FROM rooms 
      WHERE dorm_id = ? 
      AND status = 'available' 
      AND id IN (
        SELECT id FROM (
          SELECT id FROM rooms 
          WHERE dorm_id = ? 
          AND status = 'available'
          ORDER BY CAST(SUBSTRING(room_number, 5) AS UNSIGNED) DESC 
          LIMIT ?
        ) as temp
      )
    `;

    pool.query(deleteSql, [dormId, dormId, roomsToDelete], (err, result) => {
      if (err) {
        console.error("❌ Error deleting excess rooms:", err);
      } else {
        const deletedCount = result.affectedRows;
        console.log(
          `✅ Deleted ${deletedCount} empty rooms for dorm ${dormId}`
        );

        if (deletedCount < roomsToDelete) {
          console.log(
            `⚠️ Could only delete ${deletedCount}/${roomsToDelete} rooms (some may be occupied)`
          );
        }
      }
    });
  }
}

// เพิ่มหอพักใหม่ (สำหรับผู้ประกอบการหรือผู้ดูแลระบบ) รองรับหลายรูป
app.post("/dorms", upload.array("images", 10), (req, res) => {
  const {
    name,
    price_daily,
    price_monthly,
    price_term,
    floor_count,
    room_count,
    address_detail,
    water_cost,
    electricity_cost,
    deposit,
    contact_phone,
    facilities,
    near_places,
    latitude,
    longitude,
    owner_id,
  } = req.body;
  const dormSql =
    "INSERT INTO dorms (name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  pool.query(
    dormSql,
    [
      name,
      price_daily,
      price_monthly,
      price_term,
      floor_count,
      room_count,
      address_detail,
      water_cost,
      electricity_cost,
      deposit,
      contact_phone,
      facilities,
      near_places,
      owner_id || null,
      "pending",
    ],
    (err, dormResult) => {
      if (err) return res.status(500).json({ error: err.message });
      const dormId = dormResult.insertId;

      // เพิ่มพิกัดหอพักถ้ามี
      if (latitude && longitude) {
        const coordinateSql =
          "INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?)";
        pool.query(
          coordinateSql,
          [dormId, "dorm_location", name, latitude, longitude],
          (coordErr) => {
            if (coordErr)
              console.error("Error inserting dorm coordinates:", coordErr);

            // หาสถานที่ใกล้เคียงและคำนวณระยะทาง
            linkNearbyPlaces(
              dormId,
              parseFloat(latitude),
              parseFloat(longitude),
              near_places
            );
          }
        );
      }

      // สร้างห้องพักเปล่าๆ ตามจำนวนที่ระบุ
      if (room_count && parseInt(room_count) > 0) {
        createEmptyRooms(dormId, parseInt(room_count));
      }

      // สร้างห้องพักเปล่าๆ ตามจำนวนที่ระบุ
      if (room_count && parseInt(room_count) > 0) {
        createEmptyRooms(dormId, parseInt(room_count));
      }

      if (req.files && req.files.length > 0) {
        const imageValues = req.files.map((f) => [
          dormId,
          "/uploads/" + f.filename,
        ]);
        pool.query(
          "INSERT INTO dorm_images (dorm_id, image_path) VALUES ?",
          [imageValues],
          (imgErr) => {
            if (imgErr) return res.status(500).json({ error: imgErr.message });
            broadcastDormsUpdate();
            res.json({ success: true });
          }
        );
      } else {
        broadcastDormsUpdate();
        res.json({ success: true });
      }
    }
  );
});

app.post("/owner/dorms", authOwner, upload.array("images", 10), (req, res) => {
  const {
    name,
    price_daily,
    price_monthly,
    price_term,
    floor_count,
    room_count,
    address_detail,
    water_cost,
    electricity_cost,
    deposit,
    contact_phone,
    facilities,
    near_places,
    latitude,
    longitude,
  } = req.body;
  const owner_id = req.user.id;
  const dormSql =
    "INSERT INTO dorms (name, price_daily, price_monthly, price_term, floor_count, room_count, address_detail, water_cost, electricity_cost, deposit, contact_phone, facilities, near_places, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  pool.query(
    dormSql,
    [
      name,
      price_daily,
      price_monthly,
      price_term,
      floor_count,
      room_count,
      address_detail,
      water_cost,
      electricity_cost,
      deposit,
      contact_phone,
      facilities,
      near_places,
      owner_id,
      "pending",
    ],
    (err, dormResult) => {
      if (err) return res.status(500).json({ error: err.message });
      const dormId = dormResult.insertId;

      // เพิ่มพิกัดหอพักถ้ามี
      if (latitude && longitude) {
        const coordinateSql =
          "INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?)";
        pool.query(
          coordinateSql,
          [dormId, "dorm_location", name, latitude, longitude],
          (coordErr) => {
            if (coordErr)
              console.error("Error inserting dorm coordinates:", coordErr);
          }
        );
      }

      if (req.files && req.files.length > 0) {
        const imageValues = req.files.map((f) => [
          dormId,
          "/uploads/" + f.filename,
        ]);
        pool.query(
          "INSERT INTO dorm_images (dorm_id, image_path) VALUES ?",
          [imageValues],
          (imgErr) => {
            if (imgErr) return res.status(500).json({ error: imgErr.message });
            res.json({ success: true });
          }
        );
      } else {
        res.json({ success: true });
      }
    }
  );
});

// อัปเดตข้อมูลหอพัก (สำหรับเจ้าของหอพัก)
app.put(
  "/owner/dorms/:id",
  authOwner,
  upload.array("images", 10),
  (req, res) => {
    const dormId = req.params.id;
    const owner_id = req.user.id;
    const {
      name,
      price_daily,
      price_monthly,
      price_term,
      floor_count,
      room_count,
      address_detail,
      water_cost,
      electricity_cost,
      deposit,
      contact_phone,
      facilities,
      near_places,
      latitude,
      longitude,
      delete_images,
    } = req.body;

    console.log("🔧 Debug - Update dorm request:", {
      dormId,
      delete_images,
      has_new_images: req.files?.length || 0,
    });

    // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่และเก็บข้อมูลเดิม
    pool.query(
      "SELECT * FROM dorms WHERE id = ? AND owner_id = ?",
      [dormId, owner_id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0)
          return res
            .status(404)
            .json({ error: "ไม่พบหอพักหรือไม่มีสิทธิ์แก้ไข" });

        const currentDorm = results[0];
        const currentRoomCount = currentDorm.room_count;

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
          name,
          price_daily,
          price_monthly,
          price_term,
          floor_count,
          room_count,
          address_detail,
          water_cost,
          electricity_cost,
          deposit,
          contact_phone,
          facilities,
          near_places,
          dormId,
          owner_id,
        ];

        pool.query(updateSql, updateValues, (updateErr) => {
          if (updateErr)
            return res.status(500).json({ error: updateErr.message });

          // จัดการจำนวนห้องถ้ามีการเปลี่ยนแปลง
          if (room_count && room_count !== currentRoomCount) {
            updateRoomCount(dormId, room_count, currentRoomCount);
          }

          // อัปเดตหรือเพิ่มพิกัดหอพัก
          if (latitude && longitude) {
            const checkCoordSql =
              'SELECT id FROM location_coordinates WHERE dorm_id = ? AND location_type = "dorm_location"';
            pool.query(checkCoordSql, [dormId], (checkErr, coordResults) => {
              if (checkErr) {
                console.error("Error checking coordinates:", checkErr);
              } else if (coordResults.length > 0) {
                // อัปเดตพิกัดเดิม
                const updateCoordSql =
                  'UPDATE location_coordinates SET latitude = ?, longitude = ?, location_name = ? WHERE dorm_id = ? AND location_type = "dorm_location"';
                pool.query(
                  updateCoordSql,
                  [latitude, longitude, name || "หอพัก", dormId],
                  (coordUpdateErr) => {
                    if (coordUpdateErr) {
                      console.error(
                        "Error updating coordinates:",
                        coordUpdateErr
                      );
                    } else {
                      console.log("✅ Updated dorm coordinates successfully");
                      // ลบสถานที่ใกล้เคียงเดิมและคำนวณใหม่
                      const deleteOldPlacesSql =
                        'DELETE FROM location_coordinates WHERE dorm_id = ? AND location_type = "nearby_place"';
                      pool.query(deleteOldPlacesSql, [dormId], (deleteErr) => {
                        if (deleteErr) {
                          console.error(
                            "Error deleting old nearby places:",
                            deleteErr
                          );
                        } else {
                          // เชื่อมโยงสถานที่ใกล้เคียงใหม่
                          linkNearbyPlaces(
                            dormId,
                            parseFloat(latitude),
                            parseFloat(longitude),
                            near_places
                          );
                        }
                      });
                    }
                  }
                );
              } else {
                // เพิ่มพิกัดใหม่
                const insertCoordSql =
                  'INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude) VALUES (?, "dorm_location", ?, ?, ?)';
                pool.query(
                  insertCoordSql,
                  [dormId, name || "หอพัก", latitude, longitude],
                  (coordInsertErr) => {
                    if (coordInsertErr) {
                      console.error(
                        "Error inserting coordinates:",
                        coordInsertErr
                      );
                    } else {
                      console.log(
                        "✅ Inserted new dorm coordinates successfully"
                      );
                      // เชื่อมโยงสถานที่ใกล้เคียง
                      linkNearbyPlaces(
                        dormId,
                        parseFloat(latitude),
                        parseFloat(longitude),
                        near_places
                      );
                    }
                  }
                );
              }
            });
          } else {
            // ถ้าไม่มีการส่งพิกัดมาใหม่ ให้คงค่าเดิมไว้
            console.log(
              "🔄 No new coordinates provided, keeping existing coordinates"
            );
            // ยังคงต้องอัปเดตสถานที่ใกล้เคียงถ้ามีการเปลี่ยนแปลง
            if (near_places) {
              // หาพิกัดเดิมของหอพัก
              const getExistingCoordSql =
                'SELECT latitude, longitude FROM location_coordinates WHERE dorm_id = ? AND location_type = "dorm_location"';
              pool.query(
                getExistingCoordSql,
                [dormId],
                (getErr, existingCoords) => {
                  if (!getErr && existingCoords.length > 0) {
                    const existingLat = existingCoords[0].latitude;
                    const existingLng = existingCoords[0].longitude;
                    // ลบสถานที่ใกล้เคียงเดิม
                    const deleteOldPlacesSql =
                      'DELETE FROM location_coordinates WHERE dorm_id = ? AND location_type = "nearby_place"';
                    pool.query(deleteOldPlacesSql, [dormId], (deleteErr) => {
                      if (!deleteErr) {
                        // เชื่อมโยงสถานที่ใกล้เคียงใหม่ด้วยพิกัดเดิม
                        linkNearbyPlaces(
                          dormId,
                          parseFloat(existingLat),
                          parseFloat(existingLng),
                          near_places
                        );
                      }
                    });
                  }
                }
              );
            }
          }

          // ลบรูปภาพที่เลือกลบ
          if (delete_images && delete_images.length > 0) {
            const imagesToDelete = JSON.parse(delete_images);
            const deleteImageSql =
              "DELETE FROM dorm_images WHERE image_path IN (?) AND dorm_id = ?";
            pool.query(deleteImageSql, [imagesToDelete, dormId], (delErr) => {
              if (delErr) console.error("Error deleting images:", delErr);
              else console.log("✅ Deleted images:", imagesToDelete);
            });
          }

          // เพิ่มรูปภาพใหม่
          if (req.files && req.files.length > 0) {
            const imageValues = req.files.map((f) => [
              dormId,
              "/uploads/" + f.filename,
            ]);
            pool.query(
              "INSERT INTO dorm_images (dorm_id, image_path) VALUES ?",
              [imageValues],
              (imgErr) => {
                if (imgErr)
                  return res.status(500).json({ error: imgErr.message });
                res.json({ success: true, message: "อัปเดตข้อมูลหอพักสำเร็จ" });
              }
            );
          } else {
            res.json({ success: true, message: "อัปเดตข้อมูลหอพักสำเร็จ" });
          }
        });
      }
    );
  }
);

// Owner middleware
function authOwner(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_secret_key",
    (err, decoded) => {
      if (err) return res.status(401).json({ error: "Invalid token" });
      if (decoded.role !== "owner")
        return res.status(403).json({ error: "Access denied" });
      req.user = decoded;
      next();
    }
  );
}

// Customer middleware
function authCustomer(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_secret_key",
    (err, decoded) => {
      if (err) return res.status(401).json({ error: "Invalid token" });
      if (decoded.role !== "customer")
        return res.status(403).json({ error: "Access denied" });
      req.user = decoded;
      next();
    }
  );
}

// === CUSTOMER PROFILE ENDPOINTS ===

// ดึงข้อมูลโปรไฟล์ลูกค้า
app.get("/customer/profile", authCustomer, (req, res) => {
  const customerId = req.user.id;

  const sql = `SELECT * FROM customers WHERE id = ?`;

  pool.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error("Error fetching customer profile:", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }

    const customer = results[0];
    // ไม่ส่งรหัสผ่านกลับไป
    delete customer.password;

    res.json(customer);
  });
});

// อัปเดทข้อมูลโปรไฟล์ลูกค้า
app.put("/customer/profile", authCustomer, (req, res) => {
  const customerId = req.user.id;
  const {
    firstName,
    lastName,
    age,
    dob,
    houseNo,
    moo,
    soi,
    road,
    subdistrict,
    district,
    province,
    email,
    phone,
    zip_code,
  } = req.body;

  const sql = `
    UPDATE customers 
    SET firstName = ?, lastName = ?, age = ?, dob = ?, 
        houseNo = ?, moo = ?, soi = ?, road = ?, subdistrict = ?, 
        district = ?, province = ?, email = ?, phone = ?, zip_code = ?
    WHERE id = ?
  `;

  pool.query(
    sql,
    [
      firstName,
      lastName,
      age,
      dob,
      houseNo,
      moo,
      soi,
      road,
      subdistrict,
      district,
      province,
      email,
      phone,
      zip_code,
      customerId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating customer profile:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
        }
        return res
          .status(500)
          .json({ error: "เกิดข้อผิดพลาดในการอัปเดทข้อมูล" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการอัปเดท" });
      }

      res.json({ success: true, message: "อัปเดทข้อมูลสำเร็จ" });
    }
  );
});

// อัปโหลดรูปโปรไฟล์ลูกค้า
app.post(
  "/customer/upload-avatar",
  authCustomer,
  uploadProfile.single("avatar"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "กรุณาเลือกไฟล์รูปภาพ" });
    }

    const customerId = req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;

    // อัปเดท URL ของรูปโปรไฟล์ในฐานข้อมูล
    const sql = `UPDATE customers SET avatar_url = ? WHERE id = ?`;

    pool.query(sql, [avatarUrl, customerId], (err, result) => {
      if (err) {
        console.error("Error updating avatar URL:", err);
        // ลบไฟล์ที่อัปโหลดเมื่อเกิดข้อผิดพลาด
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr)
            console.error("Error deleting uploaded file:", unlinkErr);
        });
        return res
          .status(500)
          .json({ error: "เกิดข้อผิดพลาดในการบันทึกรูปโปรไฟล์" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "ไม่พบผู้ใช้" });
      }

      res.json({
        success: true,
        message: "อัปโหลดรูปโปรไฟล์สำเร็จ",
        avatarUrl: avatarUrl,
      });
    });
  }
);

// === ADMIN ENDPOINTS ===

// ทดสอบ Admin endpoint
app.get("/admin/test", verifyAdminToken, (req, res) => {
  res.json({
    message: "Admin API working",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// ทดสอบ token โดยไม่ต้องเป็น admin
app.get("/admin/auth-test", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );
    res.json({
      message: "Token valid",
      decoded,
      isAdmin: decoded.role === "admin",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(401).json({
      error: "Invalid token",
      details: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ดึงข้อมูลผู้ใช้ทั้งหมด (Admin) - แบบง่าย
app.get("/admin/users", verifyAdminToken, (req, res) => {
  // ดึงข้อมูล customers ก่อน
  pool.query(
    "SELECT id, firstName, lastName, email, phone FROM customers",
    (err1, customers) => {
      if (err1) {
        console.error("Error fetching customers:", err1);
        return res.status(500).json({
          error: "เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า",
          details: err1.message,
        });
      }

      // ดึงข้อมูล owners
      pool.query(
        "SELECT id, firstName, lastName, email, phone FROM owners",
        (err2, owners) => {
          if (err2) {
            console.error("Error fetching owners:", err2);
            return res.status(500).json({
              error: "เกิดข้อผิดพลาดในการดึงข้อมูลเจ้าของ",
              details: err2.message,
            });
          }

          // ดึงข้อมูล admins
          pool.query(
            "SELECT id, firstName, lastName, email, phone FROM admins",
            (err3, admins) => {
              if (err3) {
                console.error("Error fetching admins:", err3);
                return res.status(500).json({
                  error: "เกิดข้อผิดพลาดในการดึงข้อมูลแอดมิน",
                  details: err3.message,
                });
              }

              // รวมข้อมูลทั้งหมด
              const allUsers = [
                ...customers.map((user) => ({ ...user, role: "customer" })),
                ...owners.map((user) => ({ ...user, role: "owner" })),
                ...admins.map((user) => ({ ...user, role: "admin" })),
              ];

              res.json(allUsers);
            }
          );
        }
      );
    }
  );
});

/**
 * Add new user (Admin only)
 * @route POST /admin/users
 */
app.post("/admin/users", verifyAdminToken, async (req, res) => {
  const {
    role,
    firstName,
    lastName,
    email,
    password,
    phone,
    age,
    dob,
    houseNo,
    moo,
    soi,
    road,
    subdistrict,
    district,
    province,
    dormName,
  } = req.body;

  try {
    // ตรวจสอบว่า email ซ้ำไหม
    const emailCheckPromises = [
      new Promise((resolve, reject) => {
        pool.query(
          "SELECT id FROM customers WHERE email = ?",
          [email],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      }),
      new Promise((resolve, reject) => {
        pool.query(
          "SELECT id FROM owners WHERE email = ?",
          [email],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      }),
      new Promise((resolve, reject) => {
        pool.query(
          "SELECT id FROM admins WHERE email = ?",
          [email],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      }),
    ];

    const emailExists = await Promise.all(emailCheckPromises);
    if (emailExists.some((exists) => exists)) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // เลือกตารางตาม role
    let tableName, insertData;
    if (role === "customer") {
      tableName = "customers";
      insertData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        age,
        dob,
        houseNo,
        moo,
        soi,
        road,
        subdistrict,
        district,
        province,
      };
    } else if (role === "owner") {
      tableName = "owners";
      insertData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        age,
        dob,
        houseNo,
        moo,
        soi,
        road,
        subdistrict,
        district,
        province,
        dormName,
      };
    } else if (role === "admin") {
      tableName = "admins";
      insertData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
      };
    } else {
      return res.status(400).json({ error: "ประเภทผู้ใช้ไม่ถูกต้อง" });
    }

    // Insert ข้อมูล
    const columns = Object.keys(insertData).join(", ");
    const values = Object.values(insertData);
    const placeholders = values.map(() => "?").join(", ");

    pool.query(
      `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
      values,
      (err, result) => {
        if (err) {
          console.error(`Error inserting ${role}:`, err);
          return res
            .status(500)
            .json({ error: "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้" });
        }

        res.status(201).json({
          success: true,
          message: "เพิ่มผู้ใช้สำเร็จ",
          userId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้" });
  }
});

/**
 * Update user (Admin only)
 * @route PUT /admin/users/:id
 */
app.put("/admin/users/:id", verifyAdminToken, async (req, res) => {
  const userId = req.params.id;
  const userRole = req.query.role;
  const {
    role,
    firstName,
    lastName,
    email,
    password,
    phone,
    age,
    dob,
    houseNo,
    moo,
    soi,
    road,
    subdistrict,
    district,
    province,
    dormName,
  } = req.body;

  try {
    // ตรวจสอบว่า email ซ้ำไหม (ยกเว้นผู้ใช้ปัจจุบัน)
    const currentTableName =
      userRole === "customer"
        ? "customers"
        : userRole === "owner"
        ? "owners"
        : "admins";

    const emailCheckPromises = [
      new Promise((resolve, reject) => {
        pool.query(
          "SELECT id FROM customers WHERE email = ? AND id != ?",
          [email, userRole === "customer" ? userId : 0],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      }),
      new Promise((resolve, reject) => {
        pool.query(
          "SELECT id FROM owners WHERE email = ? AND id != ?",
          [email, userRole === "owner" ? userId : 0],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      }),
      new Promise((resolve, reject) => {
        pool.query(
          "SELECT id FROM admins WHERE email = ? AND id != ?",
          [email, userRole === "admin" ? userId : 0],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      }),
    ];

    const emailExists = await Promise.all(emailCheckPromises);
    if (emailExists.some((exists) => exists)) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    let updateData;
    if (role === "customer") {
      updateData = {
        firstName,
        lastName,
        email,
        phone,
        age,
        dob,
        houseNo,
        moo,
        soi,
        road,
        subdistrict,
        district,
        province,
      };
    } else if (role === "owner") {
      updateData = {
        firstName,
        lastName,
        email,
        phone,
        age,
        dob,
        houseNo,
        moo,
        soi,
        road,
        subdistrict,
        district,
        province,
        dormName,
      };
    } else if (role === "admin") {
      updateData = { firstName, lastName, email, phone };
    } else {
      return res.status(400).json({ error: "ประเภทผู้ใช้ไม่ถูกต้อง" });
    }

    // เพิ่ม password ถ้ามีการส่งมา
    if (password && password.trim()) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const tableName =
      role === "customer"
        ? "customers"
        : role === "owner"
        ? "owners"
        : "admins";

    // ถ้า role เปลี่ยน ต้องย้ายข้อมูล
    if (userRole !== role) {
      // ลบจากตารางเดิม
      pool.query(
        `DELETE FROM ${currentTableName} WHERE id = ?`,
        [userId],
        (deleteErr) => {
          if (deleteErr) {
            console.error("Error deleting from old table:", deleteErr);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในการย้ายข้อมูล" });
          }

          // เพิ่มในตารางใหม่
          const columns = Object.keys(updateData).join(", ");
          const values = Object.values(updateData);
          const placeholders = values.map(() => "?").join(", ");

          pool.query(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
            values,
            (insertErr, result) => {
              if (insertErr) {
                console.error("Error inserting into new table:", insertErr);
                return res
                  .status(500)
                  .json({ error: "เกิดข้อผิดพลาดในการย้ายข้อมูล" });
              }

              res.json({
                success: true,
                message: "แก้ไขข้อมูลผู้ใช้สำเร็จ",
                newUserId: result.insertId,
              });
            }
          );
        }
      );
    } else {
      // อัปเดตในตารางเดิม
      const setClause = Object.keys(updateData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updateData), userId];

      pool.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        values,
        (err, result) => {
          if (err) {
            console.error(`Error updating ${role}:`, err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
          }

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "ไม่พบผู้ใช้ที่ต้องการแก้ไข" });
          }

          res.json({ success: true, message: "แก้ไขข้อมูลผู้ใช้สำเร็จ" });
        }
      );
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  }
});

// ดึงข้อมูลหอพักทั้งหมดสำหรับ Admin - แบบง่าย
app.get("/admin/dorms", verifyAdminToken, (req, res) => {
  const status = req.query.status;

  // ปรับ query ให้รวมรูปภาพจากตาราง dorm_images และข้อมูลเจ้าของจากตาราง owners
  let sql = `
    SELECT 
      dorms.*,
      owners.firstName as owner_firstName,
      owners.lastName as owner_lastName,
      owners.phone as owner_phone,
      owners.email as owner_email,
      GROUP_CONCAT(dorm_images.image_path) AS images
    FROM dorms 
    LEFT JOIN dorm_images ON dorms.id = dorm_images.dorm_id
    LEFT JOIN owners ON dorms.owner_id = owners.id
  `;

  let params = [];

  if (status && status !== "all") {
    sql += " WHERE dorms.status = ?";
    params = [status];
  }

  sql += " GROUP BY dorms.id ORDER BY dorms.created_at DESC";

  pool.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching dorms for admin:", err);
      return res.status(500).json({
        error: "เกิดข้อผิดพลาดในการดึงข้อมูลหอพัก",
        details: err.message,
      });
    }

    // แปลงรูปภาพจาก GROUP_CONCAT string เป็น array
    const processedResults = results.map((dorm) => ({
      ...dorm,
      images: dorm.images ? dorm.images.split(",") : [],
    }));

    console.log(
      "📊 Admin dorms fetched:",
      processedResults.length,
      "dorms with images"
    );

    res.json(processedResults);
  });
});

// อนุมัติหอพัก (Admin)
app.put("/admin/dorms/:id/approve", verifyAdminToken, (req, res) => {
  const dormId = req.params.id;

  const sql = "UPDATE dorms SET status = ? WHERE id = ?";

  pool.query(sql, ["approved", dormId], (err, result) => {
    if (err) {
      console.error("Error approving dorm:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอนุมัติหอพัก" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบหอพักที่ต้องการอนุมัติ" });
    }

    res.json({ success: true, message: "อนุมัติหอพักสำเร็จ" });
  });
});

// ปฏิเสธหอพัก (Admin)
app.put("/admin/dorms/:id/reject", verifyAdminToken, (req, res) => {
  const dormId = req.params.id;
  const { reason } = req.body;

  const sql = "UPDATE dorms SET status = ?, reject_reason = ? WHERE id = ?";

  pool.query(sql, ["rejected", reason || null, dormId], (err, result) => {
    if (err) {
      console.error("Error rejecting dorm:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการปฏิเสธหอพัก" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบหอพักที่ต้องการปฏิเสธ" });
    }

    res.json({ success: true, message: "ปฏิเสธหอพักสำเร็จ" });
  });
});

// ลบหอพัก (Admin)
app.delete("/admin/dorms/:id", verifyAdminToken, (req, res) => {
  const dormId = req.params.id;

  // ลบรูปภาพก่อน
  pool.query("DELETE FROM dorm_images WHERE dorm_id = ?", [dormId], (err) => {
    if (err) {
      console.error("Error deleting dorm images:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบรูปภาพ" });
    }

    // ลบหอพัก
    pool.query("DELETE FROM dorms WHERE id = ?", [dormId], (err, result) => {
      if (err) {
        console.error("Error deleting dorm:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบหอพัก" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "ไม่พบหอพักที่ต้องการลบ" });
      }

      res.json({ success: true, message: "ลบหอพักสำเร็จ" });
    });
  });
});

// ลบผู้ใช้ (Admin)
/**
 * Delete user (Admin only)
 * @route DELETE /admin/users/:id?role=userRole
 */
app.delete("/admin/users/:id", verifyAdminToken, (req, res) => {
  const userId = req.params.id;
  const userRole = req.query.role;

  // ตรวจสอบประเภทผู้ใช้
  const allowedTypes = ["customer", "owner", "admin"];
  if (!allowedTypes.includes(userRole)) {
    return res.status(400).json({ error: "ประเภทผู้ใช้ไม่ถูกต้อง" });
  }

  const tableName =
    userRole === "customer"
      ? "customers"
      : userRole === "owner"
      ? "owners"
      : "admins";
  const sql = `DELETE FROM ${tableName} WHERE id = ?`;

  pool.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(`Error deleting ${userRole}:`, err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบผู้ใช้" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการลบ" });
    }

    res.json({ success: true, message: "ลบผู้ใช้สำเร็จ" });
  });
});

// === ADMIN MANAGEMENT ENDPOINTS ===

// ดึงข้อมูลแอดมินทั้งหมด
app.get("/admin/admins", verifyAdminToken, (req, res) => {
  const sql = `
    SELECT * FROM admins 
    ORDER BY id DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching admins:", err);
      return res.status(500).json({
        error: "เกิดข้อผิดพลาดในการดึงข้อมูลแอดมิน",
        details: err.message,
      });
    }

    // ไม่ส่งรหัสผ่านกลับไป
    const admins = results.map((admin) => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });

    res.json(admins);
  });
});

// ดึงข้อมูลบทบาททั้งหมด
app.get("/admin/roles", verifyAdminToken, (req, res) => {
  const sql = "SELECT * FROM roles ORDER BY id";

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching roles:", err);
      return res.status(500).json({
        error: "เกิดข้อผิดพลาดในการดึงข้อมูลบทบาท",
        details: err.message,
      });
    }

    res.json(results);
  });
});

// เพิ่มแอดมินใหม่
app.post("/admin/admins", verifyAdminToken, async (req, res) => {
  const {
    firstName,
    lastName,
    age,
    dob,
    houseNo,
    moo,
    soi,
    road,
    subdistrict,
    district,
    province,
    email,
    password,
    phone,
    role_id: role_name,
    zip_code,
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!firstName || !lastName || !email || !password || !phone || !role_name) {
    return res.status(400).json({
      error:
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, รหัสผ่าน, เบอร์โทร, บทบาท)",
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

    pool.query(
      sql,
      [
        firstName,
        lastName,
        age,
        dob,
        houseNo,
        moo,
        soi,
        road,
        subdistrict,
        district,
        province,
        email,
        hashedPassword,
        phone,
        role_name,
        zip_code,
      ],
      (err, result) => {
        if (err) {
          console.error("Error adding admin:", err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
          }
          return res.status(500).json({
            error: "เกิดข้อผิดพลาดในการเพิ่มแอดมิน",
            details: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: "เพิ่มแอดมินสำเร็จ",
          adminId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน" });
  }
});

// อัพเดทข้อมูลแอดมิน
app.put("/admin/admins/:id", verifyAdminToken, async (req, res) => {
  const adminId = req.params.id;
  const {
    firstName,
    lastName,
    age,
    dob,
    houseNo,
    moo,
    soi,
    road,
    subdistrict,
    district,
    province,
    email,
    password,
    phone,
    role_id: role_name,
    zip_code,
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!firstName || !lastName || !email || !phone || !role_name) {
    return res.status(400).json({
      error:
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, เบอร์โทร, บทบาท)",
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
        firstName,
        lastName,
        age,
        dob,
        houseNo,
        moo,
        soi,
        road,
        subdistrict,
        district,
        province,
        email,
        hashedPassword,
        phone,
        role_name,
        zip_code,
        adminId,
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
        firstName,
        lastName,
        age,
        dob,
        houseNo,
        moo,
        soi,
        road,
        subdistrict,
        district,
        province,
        email,
        phone,
        role_name,
        zip_code,
        adminId,
      ];
    }

    pool.query(sql, params, (err, result) => {
      if (err) {
        console.error("Error updating admin:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
        }
        return res.status(500).json({
          error: "เกิดข้อผิดพลาดในการอัพเดทแอดมิน",
          details: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "ไม่พบแอดมินที่ต้องการอัพเดท" });
      }

      res.json({ success: true, message: "อัพเดทข้อมูลแอดมินสำเร็จ" });
    });
  } catch (error) {
    console.error("Error processing admin update:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการประมวลผลข้อมูล" });
  }
});

// ลบแอดมิน
app.delete("/admin/admins/:id", verifyAdminToken, (req, res) => {
  const adminId = req.params.id;

  // ตรวจสอบว่าไม่ลบตัวเอง
  if (parseInt(adminId) === req.user.id) {
    return res.status(400).json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" });
  }

  const sql = "DELETE FROM admins WHERE id = ?";

  pool.query(sql, [adminId], (err, result) => {
    if (err) {
      console.error("Error deleting admin:", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการลบแอดมิน", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบแอดมินที่ต้องการลบ" });
    }

    res.json({ success: true, message: "ลบแอดมินสำเร็จ" });
  });
});

// === OWNER PROFILE ENDPOINTS ===

// ดึงข้อมูลโปรไฟล์เจ้าของหอพัก
app.get("/owner/profile", authOwner, (req, res) => {
  const ownerId = req.user.id;

  const sql = `SELECT * FROM owners WHERE id = ?`;

  pool.query(sql, [ownerId], (err, results) => {
    if (err) {
      console.error("Error fetching owner profile:", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }

    const owner = results[0];
    // ไม่ส่งรหัสผ่านกลับไป
    delete owner.password;

    res.json(owner);
  });
});

// อัพเดทข้อมูลโปรไฟล์เจ้าของหอพัก
app.put("/owner/profile", authOwner, (req, res) => {
  const ownerId = req.user.id;
  const {
    dormName,
    firstName,
    lastName,
    age,
    dob,
    houseNo,
    moo,
    soi,
    road,
    subdistrict,
    district,
    province,
    email,
    phone,
    zip_code,
    profile_image,
  } = req.body;

  const sql = `
    UPDATE owners 
    SET dormName = ?, firstName = ?, lastName = ?, age = ?, dob = ?, 
        houseNo = ?, moo = ?, soi = ?, road = ?, subdistrict = ?, 
        district = ?, province = ?, email = ?, phone = ?, zip_code = ?, profile_image = ?
    WHERE id = ?
  `;

  pool.query(
    sql,
    [
      dormName,
      firstName,
      lastName,
      age,
      dob,
      houseNo,
      moo,
      soi,
      road,
      subdistrict,
      district,
      province,
      email,
      phone,
      zip_code,
      profile_image,
      ownerId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating owner profile:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
        }
        return res
          .status(500)
          .json({ error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการอัพเดท" });
      }

      res.json({ success: true, message: "อัพเดทข้อมูลสำเร็จ" });
    }
  );
});

// อัปโหลดรูปโปรไฟล์เจ้าของหอพัก
app.post(
  "/owner/upload-profile-image",
  authOwner,
  uploadOwnerProfile.single("profileImage"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "ไม่พบไฟล์รูปภาพที่อัปโหลด",
        });
      }

      // สร้าง URL สำหรับเข้าถึงรูปภาพ
      const imageUrl = `/uploads/${req.file.filename}`;

      // อัปเดตฐานข้อมูลด้วย URL รูปภาพใหม่
      const sql = "UPDATE owners SET profile_image = ? WHERE id = ?";
      pool.query(sql, [imageUrl, req.user.id], (err, result) => {
        if (err) {
          console.error("Error updating profile image in database:", err);
          // ลบไฟล์ที่อัปโหลดแล้วถ้าเกิดข้อผิดพลาดในการบันทึกฐานข้อมูล
          try {
            fs.unlinkSync(path.join(__dirname, "uploads", req.file.filename));
          } catch (unlinkErr) {
            console.error("Error deleting uploaded file:", unlinkErr);
          }
          return res.status(500).json({
            success: false,
            error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลรูปภาพ",
          });
        }

        res.json({
          success: true,
          message: "อัปโหลดรูปโปรไฟล์สำเร็จ",
          imageUrl: imageUrl,
          filename: req.file.filename,
        });
      });
    } catch (error) {
      console.error("Error in profile image upload:", error);
      res.status(500).json({
        success: false,
        error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
      });
    }
  }
);

// === REVIEWS API ENDPOINTS ===

// ดึงรีวิวทั้งหมดของหอพักเฉพาะ
app.get("/dorms/:id/reviews", (req, res) => {
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
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงรีวิว" });
    }

    const reviews = results.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      cleanliness_rating: review.cleanliness_rating,
      location_rating: review.location_rating,
      value_rating: review.value_rating,
      service_rating: review.service_rating,
      customerName:
        `${review.firstName || ""} ${review.lastName || ""}`.trim() || "ลูกค้า",
      customerAvatar: review.avatar_url,
      dormName: review.dormName,
      date: review.created_at,
      created_at: review.created_at,
    }));

    res.json(reviews);
  });
});

// เพิ่มรีวิวใหม่ (สำหรับลูกค้า)
app.post("/dorms/:id/reviews", verifyToken, (req, res) => {
  const dormId = req.params.id;
  const customerId = req.user.id;
  const {
    rating,
    comment,
    cleanliness_rating,
    location_rating,
    value_rating,
    service_rating,
  } = req.body;

  // ตรวจสอบ role
  if (req.user.role !== "customer") {
    return res
      .status(403)
      .json({ error: "เฉพาะลูกค้าเท่านั้นที่สามารถเขียนรีวิวได้" });
  }

  // ตรวจสอบว่ามีรีวิวอยู่แล้วหรือไม่
  pool.query(
    "SELECT id FROM reviews WHERE customer_id = ? AND dorm_id = ?",
    [customerId, dormId],
    (err, existing) => {
      if (err) {
        console.error("Error checking existing review:", err);
        return res
          .status(500)
          .json({ error: "เกิดข้อผิดพลาดในการตรวจสอบรีวิว" });
      }

      if (existing.length > 0) {
        return res.status(400).json({ error: "คุณได้เขียนรีวิวหอพักนี้แล้ว" });
      }

      const insertSql = `
      INSERT INTO reviews (customer_id, dorm_id, rating, comment, cleanliness_rating, location_rating, value_rating, service_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

      pool.query(
        insertSql,
        [
          customerId,
          dormId,
          rating,
          comment || null,
          cleanliness_rating || null,
          location_rating || null,
          value_rating || null,
          service_rating || null,
        ],
        (err, result) => {
          if (err) {
            console.error("Error inserting review:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในการบันทึกรีวิว" });
          }

          res.json({ success: true, reviewId: result.insertId });
        }
      );
    }
  );
});

// ดึงรีวิวของเจ้าของหอพัก (สำหรับ Owner)
app.get("/owner/reviews", authOwner, (req, res) => {
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
      console.error("Error fetching owner reviews:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงรีวิว" });
    }

    const reviews = results.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      cleanliness_rating: review.cleanliness_rating,
      location_rating: review.location_rating,
      value_rating: review.value_rating,
      service_rating: review.service_rating,
      customerName:
        `${review.firstName || ""} ${review.lastName || ""}`.trim() || "ลูกค้า",
      customerAvatar: review.avatar_url,
      dormName: review.dormName,
      date: review.created_at,
      created_at: review.created_at,
    }));

    res.json(reviews);
  });
});

// ดึงสถิติรีวิวของหอพักเฉพาะ
app.get("/dorms/:id/reviews/stats", (req, res) => {
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
      console.error("Error fetching review stats:", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการดึงสถิติรีวิว" });
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
      one_stars: 0,
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
app.post("/admin/sync-room-count", authOwner, (req, res) => {
  // อัปเดตจำนวนห้องพักสำหรับทุกหอพัก
  pool.query(
    `
    UPDATE dorms 
    SET room_count = (
      SELECT COUNT(*) 
      FROM rooms 
      WHERE rooms.dorm_id = dorms.id
    )
  `,
    (err, result) => {
      if (err) {
        console.error("Error syncing room count:", err);
        return res
          .status(500)
          .json({ error: "เกิดข้อผิดพลาดในการอัปเดตจำนวนห้อง" });
      }

      res.json({
        message: "อัปเดตจำนวนห้องพักสำเร็จ",
        affectedRows: result.affectedRows,
      });
    }
  );
});

/**
 * Sync room count for specific dorm
 * @route POST /dorms/:dormId/sync-room-count
 * @param {string} dormId - ID of the dorm
 * @returns {Object} Success message
 */
app.post("/dorms/:dormId/sync-room-count", authOwner, (req, res) => {
  const { dormId } = req.params;
  const ownerId = req.user.id;

  // ตรวจสอบสิทธิ์เจ้าของ
  pool.query(
    "SELECT id FROM dorms WHERE id = ? AND owner_id = ?",
    [dormId, ownerId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง" });
      }

      // อัปเดตจำนวนห้องพัก
      pool.query(
        "UPDATE dorms SET room_count = (SELECT COUNT(*) FROM rooms WHERE dorm_id = ?) WHERE id = ?",
        [dormId, dormId],
        (updateErr, result) => {
          if (updateErr) {
            console.error("Error updating room count:", updateErr);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในการอัปเดตจำนวนห้อง" });
          }

          res.json({ message: "อัปเดตจำนวนห้องพักสำเร็จ" });
        }
      );
    }
  );
});

// ==================== CHATBOT API ====================

// Helper: แปลงตัวเลขไทย -> อารบิก (หยาบๆ)
function normalizeThaiNumerals(str = "") {
  const map = {
    "๐": "0",
    "๑": "1",
    "๒": "2",
    "๓": "3",
    "๔": "4",
    "๕": "5",
    "๖": "6",
    "๗": "7",
    "๘": "8",
    "๙": "9",
  };
  return str.replace(/[๐-๙]/g, (d) => map[d] || d);
}

// Helper: หา price (ตัวเลข) ในข้อความ
function extractBudget(message) {
  const norm = normalizeThaiNumerals(message).replace(/[, ]+/g, "");
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
    results = results.filter((d) => {
      const prices = [d.price_monthly, d.price_daily, d.price_term]
        .filter((p) => p && !isNaN(p))
        .map(Number);
      if (prices.length === 0) return false;
      return prices.some((p) => p <= budget);
    });
  }

  // คำสำคัญเกี่ยวกับสิ่งอำนวยความสะดวก
  const facilityKeywords = [
    "wifi",
    "ไวไฟ",
    "internet",
    "แอร์",
    "air",
    "เครื่องปรับอากาศ",
    "เฟอร์นิเจอร์",
    "ที่จอดรถ",
    "parking",
    "ลิฟต์",
    "cctv",
  ];
  const matchedFacilities = facilityKeywords.filter((k) => msg.includes(k));
  if (matchedFacilities.length) {
    results = results.filter((d) =>
      (d.facilities || "").toLowerCase().includes(
        matchedFacilities[0] // ใช้อันแรกพอ
      )
    );
  }

  // คำสำคัญสถานที่ใกล้เคียง (ถ้าระบุคำว่า ใกล้ / near)
  if (/ใกล้|near|แถว|ละแวก/.test(msg)) {
    // ดึงคำหลัง "ใกล้" หรือ "แถว" อย่างหยาบ
    const placeMatch = msg.match(
      /(?:ใกล้|แถว|near)\s*([\u0E00-\u0E7Fa-zA-Z0-9]+)/
    );
    if (placeMatch) {
      const token = placeMatch[1];
      results = results.filter((d) =>
        (d.near_places || "").toLowerCase().includes(token)
      );
    }
  }

  // จำกัดจำนวน context ไม่ให้ยาวเกิน (เช่น 15 แรก) เพื่อประหยัด token
  return results.slice(0, 15);
}

// Helper: สร้าง context (สั้นลง) สำหรับโมเดล
function buildDormContext(dorms) {
  // เรียงลำดับหอพักตามราคาจากถูกไปแพงก่อนส่งให้ AI
  const sortedDorms = [...dorms].sort((a, b) => {
    // หาราคาต่ำสุดของแต่ละหอ
    const pricesA = [a.price_monthly, a.price_daily, a.price_term]
      .filter((p) => p && Number(p) > 0)
      .map(Number);
    const pricesB = [b.price_monthly, b.price_daily, b.price_term]
      .filter((p) => p && Number(p) > 0)
      .map(Number);

    const minPriceA = pricesA.length > 0 ? Math.min(...pricesA) : Infinity;
    const minPriceB = pricesB.length > 0 ? Math.min(...pricesB) : Infinity;

    return minPriceA - minPriceB;
  });

  return sortedDorms
    .map((dorm) => {
      const prices = [];
      if (dorm.price_monthly) prices.push(`รายเดือน ${dorm.price_monthly}`);
      if (dorm.price_daily) prices.push(`รายวัน ${dorm.price_daily}`);
      if (dorm.price_term) prices.push(`รายเทอม ${dorm.price_term}`);
      return `ชื่อ: ${dorm.name}\nราคา: ${
        prices.join(" | ") || "ไม่ระบุ"
      }\nที่อยู่: ${dorm.address_detail || "ไม่ระบุ"}\nใกล้: ${
        dorm.near_places || "ไม่ระบุ"
      }\nสิ่งอำนวยความสะดวก: ${dorm.facilities || "ไม่ระบุ"}\nน้ำ/ไฟ: ${
        dorm.water_cost || "-"
      } / ${dorm.electricity_cost || "-"}\nติดต่อ: ${
        dorm.contact_phone || "ไม่ระบุ"
      }`;
    })
    .join("\n\n");
}

// Helper: ตอบแบบ rule-based ทันทีถ้าเป็นคำถามง่าย ลดภาระโมเดล
function answerSimpleQuery(message, dorms) {
  const msg = message.toLowerCase();

  // นับจำนวนทั้งหมด
  if (/ทั้งหมดกี่|กี่หอ|กี่แห่ง|ทั้งหมด/.test(msg) && /หอ/.test(msg)) {
    return `ตอนนี้มีหอพักที่เปิดอนุมัติทั้งหมด ${dorms.length} แห่งค่ะ 🏠`;
  }

  // ตรวจสอบคำถามหาหอพักราคาถูกที่สุด
  const cheapestResponse = answerCheapestDormQuery(message, dorms);
  if (cheapestResponse) {
    return cheapestResponse;
  }

  // คำถามทั่วไปไม่เกี่ยวกับหอพัก (บาง pattern) ปฏิเสธเบื้องต้น
  if (
    !/หอ|ดอร์ม|dorm|ราคา|เช่า|ใกล้|แอร์|wifi|ไวไฟ|ห้อง|เปรียบเทียบ|ระยะทาง/.test(
      msg
    )
  ) {
    if (/สวัสดี|hello|hi|หวัดดี/.test(msg)) {
      return "สวัสดีค่ะ 😊 มีเรื่องหอพักอะไรให้ช่วยไหมคะ?";
    }
    return "ขออภัยค่ะ ฉันสามารถช่วยเรื่องหอพักเท่านั้น 🏠 มีอะไรเกี่ยวกับหอพักให้ช่วยไหมคะ?";
  }
  return null; // ให้ AI ตอบต่อ
}

// ฟังก์ชันเรียกใช้ Google Gemini AI
async function callGeminiAI(userMessage, dormContext) {
  const systemPrompt = `คุณคือ "น้องดอร์ม" 🏠 ผู้ช่วยหอพักอัจฉริยะของระบบ Smart Dormitory มหาวิทยาลัยมหาสารคาม

## 🎭 บุคลิกภาพและการสนทนา:
- **เป็นธรรมชาติ:** สนทนาได้อย่างเป็นกันเอง เหมือนเพื่อนที่ช่วยแนะนำหอพัก ไม่ต้องเป็นทางการเกินไป
- **ยืดหยุ่น:** ตอบคำถามได้หลากหลายรูปแบบ ไม่ติดกรอบ สามารถตีความคำถามได้
- **เป็นมิตร:** ใช้ "ค่ะ/ครับ", emoji น้อยๆ ให้อบอุ่น พูดจาสุภาพแต่ไม่เกร็ง
- **ซื่อสัตย์:** ถ้าไม่รู้ ต้องบอกตรงๆ ไม่แต่งเรื่อง
- **ช่วยเหลือ:** เสนอข้อมูลเพิ่มเติม แนะนำสิ่งที่น่าสนใจ ถามกลับถ้าไม่แน่ใจ

## ✅ ขอบเขตที่ตอบได้ (Scope):

### **เรื่องหอพักและบริบทที่เกี่ยวข้อง:**
1. **ข้อมูลหอพัก:** ราคา, สิ่งอำนวยความสะดวก, ที่ตั้ง, รีวิว
2. **การเปรียบเทียบ:** เปรียบเทียบหอพักหลายๆ แห่ง
3. **ระยะทางและการเดินทาง:** รถเมล์, วินมอเตอร์ไซค์, Grab, การเดิน
4. **สถานที่ใกล้เคียง:** ร้านอาหาร, 7-11, ห้าง, ตลาด, คาเฟ่
5. **ชีวิตนักศึกษา:** ค่าครองชีพ, งบประมาณ, การจัดการเงิน
6. **เคล็ดลับการเช่า:** สิ่งที่ต้องดู, คำถามที่ควรถาม, การเจรจาราคา
7. **ปัญหาทั่วไป:** เรื่องห้อง, เพื่อนร่วมห้อง, กฎระเบียบ
8. **Small Talk:** ทักทาย, ขอบคุณ, อำลา, แชร์ความรู้สึก

### **คำถามทั่วไปที่ตอบได้:**
- "หอพักคืออะไร" "ความแตกต่างระหว่างหอพักกับคอนโด"
- "การเช่าหอพักต้องทำอะไรบ้าง" "ต้องจ่ายค่าอะไรบ้าง"
- "ช่วงไหนดีที่สุดในการหาหอ" "วิธีเจรจาราคา"
- "งบ X บาท พอไหม" "หอใกล้ๆ มหาลัยมีอะไรบ้าง"

## ❌ เรื่องที่ปฏิเสธอย่างนุ่มนวล:

**เรื่องที่ไม่เกี่ยวกับหอพัก:** การเมือง, ศาสนา, กีฬา, ข่าว, บันเทิง, ดารา, วิทยาศาสตร์, คณิตศาสตร์, โปรแกรม, สุขภาพ, กฎหมาย

**วิธีตอบ:** "ขอโทษนะคะ เรื่องนี้อยู่นอกความเชี่ยวชาญของน้องดอร์ม 😅 น้องช่วยได้เฉพาะเรื่องหอพักค่ะ มีอะไรเกี่ยวกับหอพักให้ช่วยไหมคะ?"

## 🎨 รูปแบบการตอบ:

### **เมื่อแนะนำหอพัก:**
1. 🏠 **ชื่อหอพัก**
   💰 ราคารายเดือน: ฿X,XXX บาท
   💰 ราคารายเทอม: ฿X,XXX บาท
   🌟 สิ่งอำนวยความสะดวก: WiFi, แอร์, ตู้เย็น
   📍 ที่ตั้ง: ใกล้มหาวิทยาลัยมหาสารคาม
   📞 ติดต่อ: 0XX-XXX-XXXX

### **สไตล์การสนทนา:**
- ตอบยาวพอดี 2-5 ประโยคถ้าคำถามง่าย, ยาวขึ้นถ้าซับซ้อน
- ถามกลับถ้าคำถามไม่ชัดเจน
- เสนอทางเลือก 2-3 ตัวเลือก
- ใช้ตัวอย่างเพื่ออธิบาย

### **ตัวอย่างการตอบแบบอิสระ:**

**"เฮ้ย"** → "หวัดดีค่ะ! 👋 มีอะไรให้น้องดอร์มช่วยเรื่องหอพักไหมคะ?"

**"งบ 3000 พอมั้ย"** → "งบ 3,000 บาท/เดือนพอเลยค่ะ! 💰 มีหอพักให้เลือกเยอะมาก อยากรู้หอพักแบบไหนเป็นพิเศษคะ? เช่น ใกล้มหาลัย หรือมีสิ่งอำนวยความสะดวกครบ?"

**"เบื่อจัง"** → "เบื่ออยู่หอหรอคะ? 😅 ลองหาหอพักใหม่ที่มีกิจกรรม/ชุมชนดีๆ หรือใกล้คาเฟ่ ร้านอาหารไหมคะ?"

**สถานที่สำคัญ:** ม.มหาสารคาม, ม.ราชภัฏมหาสารคาม, เสริมไทย คอมเพล็กซ์, แม็คโครมหาสารคาม, สถานีขนส่ง, รพ.มหาสารคาม

**ข้อมูลหอพัก:**
${dormContext}

**ห้าม:**
❌ แต่งข้อมูลที่ไม่มีในฐานข้อมูล
❌ สร้างรีวิวปลอม
❌ ด่า/ติหอพัก
❌ ให้คำมั่นสัญญาแทนเจ้าของ

ตอบอย่างเป็นธรรมชาติ ยืดหยุ่น และเป็นมิตร! 🚀`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.9, // เพิ่มจาก 0.7 → 0.9 เพื่อความยืดหยุ่นและความเป็นธรรมชาติมากขึ้น
        topP: 0.95, // เพิ่มจาก 0.9 → 0.95 เพื่อให้เลือกคำได้หลากหลายขึ้น
        topK: 64, // เพิ่มจาก 40 → 64 เพื่อพิจารณาตัวเลือกมากขึ้น
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [
            {
              text: "เข้าใจแล้วค่ะ! 🏠 น้องดอร์มพร้อมช่วยเหลือทุกคนที่กำลังมองหาหอพักในมหาสารคามแล้วค่ะ จะตอบคำถามอย่างเป็นธรรมชาติ เป็นกันเอง แต่ยังคงให้ข้อมูลที่ถูกต้องและเป็นประโยชน์ บอกมาได้เลยนะคะว่ามีอะไรให้ช่วย! 😊",
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    console.error("Full error:", error);

    // ให้ error message ที่ชัดเจนและเป็นมิตร
    if (
      error.message?.includes("API key") ||
      error.message?.includes("API_KEY")
    ) {
      return "⚠️ ขออภัยค่ะ มีปัญหาการตั้งค่า API Key\n\n💡 กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบการตั้งค่าค่ะ";
    }

    if (
      error.message?.includes("quota") ||
      error.message?.includes("QUOTA") ||
      error.message?.includes("429")
    ) {
      return "⚠️ ขออภัยค่ะ ใช้งาน API เกินโควต้าแล้ว\n\n🕒 กรุณาลองใหม่ในอีก 1-2 นาทีค่ะ\n\n💡 หรือลองถามคำถามอื่นดูก่อนนะคะ";
    }

    if (
      error.message?.includes("SAFETY") ||
      error.message?.includes("blocked")
    ) {
      return '⚠️ ขออภัยค่ะ ข้อความถูกบล็อคด้วยเหตุผลด้านความปลอดภัย\n\n💡 ลองถามคำถามใหม่ในรูปแบบอื่นดูนะคะ เช่น:\n• "แนะนำหอพักราคาถูกหน่อย"\n• "หอพักใกล้มหาลัยมีอะไรบ้าง"';
    }

    if (
      error.message?.includes("timeout") ||
      error.message?.includes("TIMEOUT")
    ) {
      return "⏰ ขออภัยค่ะ การตอบสนองใช้เวลานานเกินไป\n\n💡 ลองถามคำถามสั้นๆ หรือเปลี่ยนคำถามใหม่ดูนะคะ";
    }

    // Error ทั่วไป - ให้คำแนะนำที่เป็นประโยชน์
    return `😔 ขออภัยค่ะ น้องดอร์มมีปัญหาเล็กน้อย\n\n💡 **ลองวิธีนี้ดูนะคะ:**\n• รีเฟรชหน้าเว็บแล้วลองใหม่\n• ถามคำถามแบบง่ายๆ เช่น "หอพักราคาถูก"\n• ดูข้อมูลหอพักในหน้าหลัก\n• ใช้ฟิลเตอร์ค้นหาหอพัก\n\n🔧 ถ้ายังมีปัญหา กรุณาติดต่อทีมงานค่ะ`;
  }
}

// Chatbot API endpoint
app.post("/chatbot", async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "กรุณาส่งข้อความมา" });
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

    // ตรวจสอบคำถามเปรียบเทียบ 2 หอพักก่อน
    const comparisonAnswer = await answerComparisonQuery(message, dorms);
    if (comparisonAnswer) {
      return res.json({
        message: comparisonAnswer,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "comparison",
      });
    }

    // ตรวจสอบคำถามเกี่ยวกับระยะทางก่อน
    const distanceAnswer = await answerDistanceQuery(message, dorms);
    if (distanceAnswer) {
      return res.json({
        message: distanceAnswer,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "distance-calc",
      });
    }

    // ตอบแบบ simple rule-based ถ้าเข้าเงื่อนไข
    const simple = answerSimpleQuery(message, dorms);
    if (simple) {
      return res.json({
        message: simple,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "rule",
      });
    }

    // กรองเฉพาะหอที่เกี่ยวข้องกับคำถามเพื่อย่อ context
    const filteredDorms = filterDormsForQuery(message, dorms);
    const dormContext = buildDormContext(filteredDorms);

    // เรียกใช้ Google Gemini AI พร้อม context ที่ย่อแล้ว
    const aiResponse = await callGeminiAI(message.trim(), dormContext);

    if (aiResponse) {
      // ใช้คำตอบจาก AI
      res.json({
        message: aiResponse,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "gemini-ai",
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
        source: "fallback",
      });
    }
  } catch (error) {
    console.error("Chatbot API error:", error);
    res.status(500).json({
      error: "ขออภัย เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
      message:
        "🤖 ขออภัยค่ะ ระบบมีปัญหาชั่วคราว กรุณาลองถามใหม่อีกครั้งหรือใช้ฟอร์มค้นหาด้านบนแทนค่ะ 😊",
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
app.get("/dorms/:dormId/rooms", authOwner, (req, res) => {
  const { dormId } = req.params;
  const ownerId = req.user.id;

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query(
    "SELECT id FROM dorms WHERE id = ? AND owner_id = ?",
    [dormId, ownerId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง" });
      }

      // ดึงข้อมูลห้องพัก
      pool.query(
        "SELECT * FROM rooms WHERE dorm_id = ? ORDER BY floor, room_number",
        [dormId],
        (err, rooms) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก" });
          }

          res.json(rooms);
        }
      );
    }
  );
});

/**
 * Add new room to a dorm
 * @route POST /dorms/:dormId/rooms
 * @param {string} dormId - ID of the dorm
 * @param {Object} roomData - Room information
 * @returns {Object} Success message and room ID
 */
app.post("/dorms/:dormId/rooms", authOwner, (req, res) => {
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
    notes,
  } = req.body;

  // ตรวจสอบข้อมูลจำเป็น
  if (!room_number || !floor) {
    return res.status(400).json({ error: "กรุณาระบุหมายเลขห้องและชั้น" });
  }

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query(
    "SELECT id FROM dorms WHERE id = ? AND owner_id = ?",
    [dormId, ownerId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง" });
      }

      // ตรวจสอบว่าหมายเลขห้องซ้ำหรือไม่
      pool.query(
        "SELECT id FROM rooms WHERE dorm_id = ? AND room_number = ?",
        [dormId, room_number],
        (err, existingRooms) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
          }

          if (existingRooms.length > 0) {
            return res
              .status(400)
              .json({ error: "หมายเลขห้องนี้มีอยู่แล้วในหอพัก" });
          }

          // เพิ่มห้องพักใหม่
          const roomData = {
            dorm_id: dormId,
            room_number,
            floor: parseInt(floor),
            price_daily: price_daily ? parseFloat(price_daily) : null,
            price_monthly: price_monthly ? parseFloat(price_monthly) : null,
            price_term: price_term ? parseFloat(price_term) : null,
            room_type: room_type || "air_conditioner",
            is_occupied: is_occupied || false,
            tenant_name: tenant_name || null,
            tenant_phone: tenant_phone || null,
            move_in_date: move_in_date || null,
            notes: notes || null,
            created_at: new Date(),
          };

          pool.query("INSERT INTO rooms SET ?", roomData, (err, result) => {
            if (err) {
              console.error("Database error:", err);
              return res
                .status(500)
                .json({ error: "เกิดข้อผิดพลาดในการเพิ่มห้องพัก" });
            }

            // อัปเดตจำนวนห้องในตารางหอพัก
            pool.query(
              "UPDATE dorms SET room_count = (SELECT COUNT(*) FROM rooms WHERE dorm_id = ?) WHERE id = ?",
              [dormId, dormId],
              (updateErr) => {
                if (updateErr) {
                  console.error("Error updating room count:", updateErr);
                  // ไม่ return error เพราะห้องเพิ่มสำเร็จแล้ว แค่ไม่อัปเดต count
                }
              }
            );

            res.json({
              message: "เพิ่มห้องพักสำเร็จ",
              roomId: result.insertId,
            });
          });
        }
      );
    }
  );
});

/**
 * Update room information
 * @route PUT /dorms/:dormId/rooms/:roomId
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @param {Object} roomData - Updated room information
 * @returns {Object} Success message
 */
app.put("/dorms/:dormId/rooms/:roomId", authOwner, (req, res) => {
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
    notes,
  } = req.body;

  // ตรวจสอบข้อมูลจำเป็น
  if (!room_number || !floor) {
    return res.status(400).json({ error: "กรุณาระบุหมายเลขห้องและชั้น" });
  }

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query(
    "SELECT id FROM dorms WHERE id = ? AND owner_id = ?",
    [dormId, ownerId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง" });
      }

      // ตรวจสอบว่าห้องพักมีอยู่หรือไม่
      pool.query(
        "SELECT id FROM rooms WHERE id = ? AND dorm_id = ?",
        [roomId, dormId],
        (err, roomResults) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
          }

          if (roomResults.length === 0) {
            return res.status(404).json({ error: "ไม่พบห้องพัก" });
          }

          // ตรวจสอบว่าหมายเลขห้องซ้ำหรือไม่ (ยกเว้นห้องปัจจุบัน)
          pool.query(
            "SELECT id FROM rooms WHERE dorm_id = ? AND room_number = ? AND id != ?",
            [dormId, room_number, roomId],
            (err, existingRooms) => {
              if (err) {
                console.error("Database error:", err);
                return res
                  .status(500)
                  .json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
              }

              if (existingRooms.length > 0) {
                return res
                  .status(400)
                  .json({ error: "หมายเลขห้องนี้มีอยู่แล้วในหอพัก" });
              }

              // อัปเดตข้อมูลห้องพัก
              const roomData = {
                room_number,
                floor: parseInt(floor),
                price_daily: price_daily ? parseFloat(price_daily) : null,
                price_monthly: price_monthly ? parseFloat(price_monthly) : null,
                price_term: price_term ? parseFloat(price_term) : null,
                room_type: room_type || "air_conditioner",
                is_occupied: is_occupied || false,
                tenant_name: tenant_name || null,
                tenant_phone: tenant_phone || null,
                move_in_date: move_in_date || null,
                notes: notes || null,
                updated_at: new Date(),
              };

              pool.query(
                "UPDATE rooms SET ? WHERE id = ?",
                [roomData, roomId],
                (err) => {
                  if (err) {
                    console.error("Database error:", err);
                    return res
                      .status(500)
                      .json({ error: "เกิดข้อผิดพลาดในการอัปเดตห้องพัก" });
                  }

                  res.json({ message: "อัปเดตข้อมูลห้องพักสำเร็จ" });
                }
              );
            }
          );
        }
      );
    }
  );
});

/**
 * Delete room
 * @route DELETE /dorms/:dormId/rooms/:roomId
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @returns {Object} Success message
 */
app.delete("/dorms/:dormId/rooms/:roomId", authOwner, (req, res) => {
  const { dormId, roomId } = req.params;
  const ownerId = req.user.id;

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
  pool.query(
    "SELECT id FROM dorms WHERE id = ? AND owner_id = ?",
    [dormId, ownerId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง" });
      }

      // ตรวจสอบว่าห้องพักมีอยู่หรือไม่
      pool.query(
        "SELECT id FROM rooms WHERE id = ? AND dorm_id = ?",
        [roomId, dormId],
        (err, roomResults) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
          }

          if (roomResults.length === 0) {
            return res.status(404).json({ error: "ไม่พบห้องพัก" });
          }

          // ลบห้องพัก
          pool.query("DELETE FROM rooms WHERE id = ?", [roomId], (err) => {
            if (err) {
              console.error("Database error:", err);
              return res
                .status(500)
                .json({ error: "เกิดข้อผิดพลาดในการลบห้องพัก" });
            }

            // อัปเดตจำนวนห้องในตารางหอพัก
            pool.query(
              "UPDATE dorms SET room_count = (SELECT COUNT(*) FROM rooms WHERE dorm_id = ?) WHERE id = ?",
              [dormId, dormId],
              (updateErr) => {
                if (updateErr) {
                  console.error("Error updating room count:", updateErr);
                  // ไม่ return error เพราะห้องลบสำเร็จแล้ว แค่ไม่อัปเดต count
                }
              }
            );

            res.json({ message: "ลบห้องพักสำเร็จ" });
          });
        }
      );
    }
  );
});

/**
 * Update room utility usage (electricity and water)
 * @route PUT /dorms/:dormId/rooms/:roomId/utilities
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @returns {Object} Success message
 */
app.put("/dorms/:dormId/rooms/:roomId/utilities", authOwner, (req, res) => {
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
    meter_reading_date,
  } = req.body;

  console.log("=== UTILITIES UPDATE REQUEST ===");
  console.log("User ID:", ownerId);
  console.log("Dorm ID:", dormId);
  console.log("Room ID:", roomId);
  console.log("Request body:", req.body);

  // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่ และดึงข้อมูลหอพัก
  pool.query(
    "SELECT * FROM dorms WHERE id = ? AND owner_id = ?",
    [dormId, ownerId],
    (err, dormResults) => {
      if (err) {
        console.error("Database error in dorms query:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
      }

      if (dormResults.length === 0) {
        console.log("Dorm not found or access denied:", { dormId, ownerId });
        return res
          .status(404)
          .json({ error: "ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง" });
      }

      const dorm = dormResults[0];
      console.log("Found dorm:", { id: dorm.id, name: dorm.name });
      const dormElectricityRate = dorm.electricity_cost || 0;
      const dormWaterRate = dorm.water_cost || 0;

      // ตรวจสอบว่าห้องพักมีอยู่หรือไม่
      pool.query(
        "SELECT * FROM rooms WHERE id = ? AND dorm_id = ?",
        [roomId, dormId],
        (err, roomResults) => {
          if (err) {
            console.error("Database error in rooms query:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
          }

          if (roomResults.length === 0) {
            console.log("Room not found:", { roomId, dormId });
            return res.status(404).json({ error: "ไม่พบห้องพัก" });
          }

          const currentRoom = roomResults[0];
          console.log("Found room:", {
            id: currentRoom.id,
            room_number: currentRoom.room_number,
          });

          // คำนวณการใช้งานจากค่ามิเตอร์เก่า-ใหม่
          const electricityUsage =
            electricity_meter_new && electricity_meter_old
              ? parseFloat(electricity_meter_new) -
                parseFloat(electricity_meter_old)
              : 0;
          const waterUsage =
            water_meter_new && water_meter_old
              ? parseFloat(water_meter_new) - parseFloat(water_meter_old)
              : 0;

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
                meter_reading_date || new Date().toISOString().split("T")[0],
                electricity_meter_old || 0,
                electricity_meter_new || 0,
                dormElectricityRate,
                electricityUsage,
                water_meter_old || 0,
                water_meter_new || 0,
                dormWaterRate,
                waterUsage,
                electricity_notes || "",
                water_notes || "",
                req.user.firstName || "เจ้าของหอพัก",
              ],
              (err) => {
                if (err) {
                  console.error("Error saving meter reading history:", err);
                }
              }
            );
          }

          // อัปเดตข้อมูลการใช้สาธารณูปโภค (ไม่รวม rate ที่ควรมาจากการตั้งค่าหอพัก)
          const utilityData = {};
          if (electricity_meter_old !== undefined)
            utilityData.electricity_meter_old =
              parseFloat(electricity_meter_old) || 0;
          if (electricity_meter_new !== undefined)
            utilityData.electricity_meter_new =
              parseFloat(electricity_meter_new) || 0;
          if (water_meter_old !== undefined)
            utilityData.water_meter_old = parseFloat(water_meter_old) || 0;
          if (water_meter_new !== undefined)
            utilityData.water_meter_new = parseFloat(water_meter_new) || 0;
          // หมายเหตุ: electricity_rate และ water_rate จะไม่ถูกอัปเดตที่นี่ ใช้ค่าจากการตั้งค่าหอพัก
          if (electricity_notes !== undefined)
            utilityData.electricity_notes = electricity_notes;
          if (water_notes !== undefined) utilityData.water_notes = water_notes;
          if (meter_reading_date !== undefined)
            utilityData.meter_reading_date = meter_reading_date;

          if (Object.keys(utilityData).length > 0) {
            utilityData.updated_at = new Date();

            pool.query(
              "UPDATE rooms SET ? WHERE id = ?",
              [utilityData, roomId],
              (err) => {
                if (err) {
                  console.error("Database error in UPDATE rooms:", err);
                  console.error("Query data:", utilityData);
                  console.error("Room ID:", roomId);
                  return res.status(500).json({
                    error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลสาธารณูปโภค",
                  });
                }

                console.log("Successfully updated utilities for room:", roomId);
                res.json({ message: "อัปเดตข้อมูลการใช้สาธารณูปโภคสำเร็จ" });
              }
            );
          } else {
            res.json({ message: "ไม่มีข้อมูลที่ต้องอัปเดต" });
          }
        }
      );
    }
  );
});

/**
 * Get room utility usage history
 * @route GET /dorms/:dormId/rooms/:roomId/utilities/history
 * @param {string} dormId - ID of the dorm
 * @param {string} roomId - ID of the room
 * @returns {Array} Utility usage history
 */
app.get(
  "/dorms/:dormId/rooms/:roomId/utilities/history",
  authOwner,
  (req, res) => {
    const { dormId, roomId } = req.params;
    const ownerId = req.user.id;

    console.log("=== UTILITIES HISTORY REQUEST ===");
    console.log("User ID:", ownerId);
    console.log("Dorm ID:", dormId);
    console.log("Room ID:", roomId);

    // ตรวจสอบว่าเป็นเจ้าของหอพักหรือไม่
    pool.query(
      "SELECT id FROM dorms WHERE id = ? AND owner_id = ?",
      [dormId, ownerId],
      (err, results) => {
        if (err) {
          console.error("Database error in dorm check:", err);
          return res
            .status(500)
            .json({ error: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });
        }

        console.log("Dorm check results:", results);

        if (results.length === 0) {
          console.log("Dorm not found or access denied");
          return res
            .status(404)
            .json({ error: "ไม่พบหอพักหรือคุณไม่มีสิทธิ์เข้าถึง" });
        }

        console.log("Fetching meter readings for room:", roomId);

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
              console.error("Database error in meter readings query:", err);
              return res
                .status(500)
                .json({ error: "เกิดข้อผิดพลาดในการดึงประวัติ" });
            }

            console.log("History results:", historyResults);
            console.log("Results count:", historyResults.length);
            res.json(historyResults);
          }
        );
      }
    );
  }
);

// ==================== REVIEWS API ENDPOINTS ====================

/**
 * Get reviews for a specific dorm
 * @route GET /dorms/:dormId/reviews
 */
app.get("/dorms/:dormId/reviews", async (req, res) => {
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
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว" });
        }
        res.json(results);
      }
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว" });
  }
});

/**
 * Get review statistics for a specific dorm
 * @route GET /dorms/:dormId/reviews/stats
 */
app.get("/dorms/:dormId/reviews/stats", async (req, res) => {
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
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "เกิดข้อผิดพลาดในการดึงสถิติรีวิว" });
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
    console.error("Error fetching review stats:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงสถิติรีวิว" });
  }
});

/**
 * Create a new review for a dorm
 * @route POST /dorms/:dormId/reviews
 */
app.post("/dorms/:dormId/reviews", verifyToken, async (req, res) => {
  const { dormId } = req.params;
  const {
    rating,
    comment,
    cleanliness_rating,
    location_rating,
    value_rating,
    service_rating,
  } = req.body;
  const customerId = req.user.id;

  // Validation
  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "กรุณาให้คะแนนและเขียนความคิดเห็น" });
  }

  if (
    !cleanliness_rating ||
    !location_rating ||
    !value_rating ||
    !service_rating
  ) {
    return res.status(400).json({ error: "กรุณาให้คะแนนในทุกหมวดหมู่" });
  }

  try {
    // Check if user already reviewed this dorm
    pool.query(
      "SELECT id FROM reviews WHERE dorm_id = ? AND customer_id = ?",
      [dormId, customerId],
      (err, existing) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "เกิดข้อผิดพลาดในการตรวจสอบรีวิว" });
        }

        if (existing.length > 0) {
          return res.status(400).json({ error: "คุณได้รีวิวหอพักนี้แล้ว" });
        }

        // Insert new review
        pool.query(
          `INSERT INTO reviews (dorm_id, customer_id, rating, comment, cleanliness_rating, location_rating, value_rating, service_rating, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            dormId,
            customerId,
            rating,
            comment,
            cleanliness_rating,
            location_rating,
            value_rating,
            service_rating,
          ],
          (err, result) => {
            if (err) {
              console.error("Database error:", err);
              return res
                .status(500)
                .json({ error: "เกิดข้อผิดพลาดในการบันทึกรีวิว" });
            }

            res.status(201).json({
              message: "บันทึกรีวิวสำเร็จ",
              reviewId: result.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกรีวิว" });
  }
});

/**
 * Update an existing review
 * @route PUT /reviews/:reviewId
 */
app.put("/reviews/:reviewId", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const {
    rating,
    comment,
    cleanliness_rating,
    location_rating,
    value_rating,
    service_rating,
  } = req.body;
  const customerId = req.user.id;

  // Validation
  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "กรุณาให้คะแนนและเขียนความคิดเห็น" });
  }

  try {
    // Check if review belongs to the user
    pool.query(
      "SELECT customer_id FROM reviews WHERE id = ?",
      [reviewId],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "เกิดข้อผิดพลาดในการตรวจสอบรีวิว" });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "ไม่พบรีวิวที่ต้องการแก้ไข" });
        }

        if (result[0].customer_id !== customerId) {
          return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไขรีวิวนี้" });
        }

        // Update review
        pool.query(
          `UPDATE reviews 
           SET rating = ?, comment = ?, cleanliness_rating = ?, location_rating = ?, value_rating = ?, service_rating = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            rating,
            comment,
            cleanliness_rating,
            location_rating,
            value_rating,
            service_rating,
            reviewId,
          ],
          (err) => {
            if (err) {
              console.error("Database error:", err);
              return res
                .status(500)
                .json({ error: "เกิดข้อผิดพลาดในการอัปเดตรีวิว" });
            }

            res.json({ message: "อัปเดตรีวิวสำเร็จ" });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตรีวิว" });
  }
});

/**
 * Delete a review
 * @route DELETE /reviews/:reviewId
 */
app.delete("/reviews/:reviewId", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const customerId = req.user.id;

  try {
    // Check if review belongs to the user
    pool.query(
      "SELECT customer_id FROM reviews WHERE id = ?",
      [reviewId],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "เกิดข้อผิดพลาดในการตรวจสอบรีวิว" });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "ไม่พบรีวิวที่ต้องการลบ" });
        }

        if (result[0].customer_id !== customerId) {
          return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบรีวิวนี้" });
        }

        // Delete review
        pool.query("DELETE FROM reviews WHERE id = ?", [reviewId], (err) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ error: "เกิดข้อผิดพลาดในการลบรีวิว" });
          }

          res.json({ message: "ลบรีวิวสำเร็จ" });
        });
      }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบรีวิว" });
  }
});

// ==================== METER READING MANAGEMENT ====================

// มาตรวัดน้ำและไฟ - ส่วนของผู้จัดการ
app.get("/meter-readings/:roomId", (req, res) => {
  const { roomId } = req.params;

  // ดึงประวัติการอ่านมิเตอร์
  pool.query(
    "SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC, created_at DESC LIMIT 50",
    [roomId],
    (err, readings) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ" });
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
app.post("/dorms/:dormId/nearby-locations", authOwner, (req, res) => {
  const { dormId } = req.params;
  const {
    location_type,
    location_name,
    latitude,
    longitude,
    description,
    distance_km,
  } = req.body;

  const sql =
    "INSERT INTO location_coordinates (dorm_id, location_type, location_name, latitude, longitude, description, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?)";

  pool.query(
    sql,
    [
      dormId,
      location_type,
      location_name,
      latitude,
      longitude,
      description,
      distance_km,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        location_id: result.insertId,
        message: "เพิ่มสถานที่ใกล้เคียงสำเร็จ",
      });
    }
  );
});

/**
 * ดูสถานที่ใกล้เคียงของหอพัก
 * @route GET /dorms/:dormId/nearby-locations
 */
app.get("/dorms/:dormId/nearby-locations", (req, res) => {
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
    sql += " AND lc.location_type = ?";
    params.push(location_type);
  }

  sql += " ORDER BY lc.location_type, lc.distance_km";

  pool.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * แก้ไขสถานที่ใกล้เคียง
 * @route PUT /nearby-locations/:locationId
 */
app.put("/nearby-locations/:locationId", authOwner, (req, res) => {
  const { locationId } = req.params;
  const {
    location_type,
    location_name,
    latitude,
    longitude,
    description,
    distance_km,
  } = req.body;

  const sql =
    "UPDATE location_coordinates SET location_type = ?, location_name = ?, latitude = ?, longitude = ?, description = ?, distance_km = ? WHERE id = ?";

  pool.query(
    sql,
    [
      location_type,
      location_name,
      latitude,
      longitude,
      description,
      distance_km,
      locationId,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "ไม่พบสถานที่ที่ต้องการแก้ไข" });
      res.json({ success: true, message: "แก้ไขสถานที่ใกล้เคียงสำเร็จ" });
    }
  );
});

/**
 * ลบสถานที่ใกล้เคียง
 * @route DELETE /nearby-locations/:locationId
 */
app.delete("/nearby-locations/:locationId", authOwner, (req, res) => {
  const { locationId } = req.params;

  const sql = "DELETE FROM location_coordinates WHERE id = ?";

  pool.query(sql, [locationId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "ไม่พบสถานที่ที่ต้องการลบ" });
    res.json({ success: true, message: "ลบสถานที่ใกล้เคียงสำเร็จ" });
  });
});

/**
 * ค้นหาหอพักตามสถานที่ใกล้เคียง
 * @route GET /search/dorms-by-location
 */
app.get("/search/dorms-by-location", (req, res) => {
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
    sql += " AND lc.location_type = ?";
    params.push(location_type);
  }

  if (max_distance) {
    sql += " AND lc.distance_km <= ?";
    params.push(max_distance);
  }

  sql += " GROUP BY d.id ORDER BY location_count DESC, d.name";

  pool.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * ค้นหาสถานที่ทั้งหมดตามประเภท
 * @route GET /locations/by-type/:locationType
 */
app.get("/locations/by-type/:locationType", (req, res) => {
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

// ==================== DISTANCE CALCULATION API ====================

/**
 * คำนวณระยะทางระหว่างหอพัก 2 แห่ง
 * @route POST /distance-between-dorms
 */
app.post("/distance-between-dorms", async (req, res) => {
  try {
    const { dorm1_id, dorm2_id } = req.body;

    if (!dorm1_id || !dorm2_id) {
      return res.status(400).json({
        error: "กรุณาระบุ dorm1_id และ dorm2_id",
      });
    }

    // ดึงข้อมูลหอพักและพิกัดทั้ง 2 หอ
    const dormQuery = `
      SELECT 
        d.id, 
        d.name,
        lc.latitude, 
        lc.longitude
      FROM dorms d
      LEFT JOIN location_coordinates lc ON d.id = lc.dorm_id
      WHERE d.id IN (?, ?)
      GROUP BY d.id
    `;

    const dorms = await new Promise((resolve, reject) => {
      pool.query(dormQuery, [dorm1_id, dorm2_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (dorms.length < 2) {
      return res.status(404).json({
        error: "ไม่พบข้อมูลหอพักหนึ่งหอหรือทั้งสองหอ",
      });
    }

    // แยกข้อมูลทั้ง 2 หอ
    const dorm1 = dorms.find((d) => d.id === parseInt(dorm1_id));
    const dorm2 = dorms.find((d) => d.id === parseInt(dorm2_id));

    if (!dorm1 || !dorm2) {
      return res.status(404).json({
        error: "ไม่พบข้อมูลหอพัก",
      });
    }

    // ตรวจสอบว่ามีพิกัด
    if (
      !dorm1.latitude ||
      !dorm1.longitude ||
      !dorm2.latitude ||
      !dorm2.longitude
    ) {
      return res.status(400).json({
        error: "หอพักไม่มีข้อมูลพิกัด กรุณาเพิ่มตำแหน่งก่อน",
      });
    }

    // คำนวณระยะทาง
    const distanceResult = await calculateDistanceBetweenDorms(
      {
        name: dorm1.name,
        coordinates: [{ latitude: dorm1.latitude, longitude: dorm1.longitude }],
      },
      {
        name: dorm2.name,
        coordinates: [{ latitude: dorm2.latitude, longitude: dorm2.longitude }],
      }
    );

    res.json({
      dorm1: {
        id: dorm1.id,
        name: dorm1.name,
      },
      dorm2: {
        id: dorm2.id,
        name: dorm2.name,
      },
      distance: distanceResult,
    });
  } catch (error) {
    console.error("❌ Distance Calculation Error:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการคำนวณระยะทาง",
      details: error.message,
    });
  }
});

/**
 * คำนวณระยะทางจากพิกัดไปยังหอพัก
 * @route POST /distance-to-dorm
 */
app.post("/distance-to-dorm", async (req, res) => {
  try {
    const { latitude, longitude, dorm_id, mode = "foot-walking" } = req.body;

    if (!latitude || !longitude || !dorm_id) {
      return res.status(400).json({
        error: "กรุณาระบุ latitude, longitude และ dorm_id",
      });
    }

    // ดึงข้อมูลหอพัก
    const dormQuery = `
      SELECT 
        d.id, 
        d.name,
        lc.latitude, 
        lc.longitude
      FROM dorms d
      LEFT JOIN location_coordinates lc ON d.id = lc.dorm_id
      WHERE d.id = ?
      LIMIT 1
    `;

    const dorms = await new Promise((resolve, reject) => {
      pool.query(dormQuery, [dorm_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (dorms.length === 0) {
      return res.status(404).json({
        error: "ไม่พบข้อมูลหอพัก",
      });
    }

    const dorm = dorms[0];

    if (!dorm.latitude || !dorm.longitude) {
      return res.status(400).json({
        error: "หอพักไม่มีข้อมูลพิกัด",
      });
    }

    // คำนวณระยะทาง
    const distanceResult = await calculateRoadDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(dorm.latitude),
      parseFloat(dorm.longitude),
      mode
    );

    res.json({
      dorm: {
        id: dorm.id,
        name: dorm.name,
        latitude: dorm.latitude,
        longitude: dorm.longitude,
      },
      origin: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      distance: distanceResult,
    });
  } catch (error) {
    console.error("❌ Distance Calculation Error:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการคำนวณระยะทาง",
      details: error.message,
    });
  }
});

// ==================== CHATBOT API ====================

// Helper: แปลงตัวเลขไทย -> อารบิก (หยาบๆ)
function normalizeThaiNumerals(str = "") {
  const map = {
    "๐": "0",
    "๑": "1",
    "๒": "2",
    "๓": "3",
    "๔": "4",
    "๕": "5",
    "๖": "6",
    "๗": "7",
    "๘": "8",
    "๙": "9",
  };
  return str.replace(/[๐-๙]/g, (d) => map[d] || d);
}

// Helper: หา price (ตัวเลข) ในข้อความ
function extractBudget(message) {
  const norm = normalizeThaiNumerals(message).replace(/[, ]+/g, "");
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
    results = results.filter((d) => {
      const prices = [d.price_monthly, d.price_daily, d.price_term]
        .filter((p) => p && !isNaN(p))
        .map(Number);
      if (prices.length === 0) return false;
      return prices.some((p) => p <= budget);
    });
  }

  // คำสำคัญเกี่ยวกับสิ่งอำนวยความสะดวก
  const facilityKeywords = [
    "wifi",
    "ไวไฟ",
    "internet",
    "แอร์",
    "air",
    "เครื่องปรับอากาศ",
    "เฟอร์นิเจอร์",
    "ที่จอดรถ",
    "parking",
    "ลิฟต์",
    "cctv",
  ];
  const matchedFacilities = facilityKeywords.filter((k) => msg.includes(k));
  if (matchedFacilities.length) {
    results = results.filter((d) =>
      (d.facilities || "").toLowerCase().includes(
        matchedFacilities[0] // ใช้อันแรกพอ
      )
    );
  }

  // คำสำคัญสถานที่ใกล้เคียง (ถ้าระบุคำว่า ใกล้ / near)
  if (/ใกล้|near|แถว|ละแวก/.test(msg)) {
    // ดึงคำหลัง "ใกล้" หรือ "แถว" อย่างหยาบ
    const placeMatch = msg.match(
      /(?:ใกล้|แถว|near)\s*([\u0E00-\u0E7Fa-zA-Z0-9]+)/
    );
    if (placeMatch) {
      const token = placeMatch[1];
      results = results.filter((d) =>
        (d.near_places || "").toLowerCase().includes(token)
      );
    }
  }

  // จำกัดจำนวน context ไม่ให้ยาวเกิน (เช่น 15 แรก) เพื่อประหยัด token
  return results.slice(0, 15);
}

// Helper: สร้าง context (สั้นลง) สำหรับโมเดล
function buildDormContext(dorms) {
  // เรียงลำดับหอพักตามราคาจากถูกไปแพงก่อนส่งให้ AI
  const sortedDorms = [...dorms].sort((a, b) => {
    // หาราคาต่ำสุดของแต่ละหอ
    const pricesA = [a.price_monthly, a.price_daily, a.price_term]
      .filter((p) => p && Number(p) > 0)
      .map(Number);
    const pricesB = [b.price_monthly, b.price_daily, b.price_term]
      .filter((p) => p && Number(p) > 0)
      .map(Number);

    const minPriceA = pricesA.length > 0 ? Math.min(...pricesA) : Infinity;
    const minPriceB = pricesB.length > 0 ? Math.min(...pricesB) : Infinity;

    return minPriceA - minPriceB;
  });

  return sortedDorms
    .map((dorm) => {
      const prices = [];
      if (dorm.price_monthly) prices.push(`รายเดือน ${dorm.price_monthly}`);
      if (dorm.price_daily) prices.push(`รายวัน ${dorm.price_daily}`);
      if (dorm.price_term) prices.push(`รายเทอม ${dorm.price_term}`);
      return `ชื่อหอ: ${dorm.name}\nราคา: ${
        prices.join(" | ") || "ไม่ระบุ"
      }\nที่อยู่: ${dorm.address_detail || "ไม่ระบุ"}\nใกล้: ${
        dorm.near_places || "ไม่ระบุ"
      }\nสิ่งอำนวยความสะดวก: ${dorm.facilities || "ไม่ระบุ"}\nค่าน้ำ/ไฟ: ${
        dorm.water_cost || "-"
      } / ${dorm.electricity_cost || "-"}\nติดต่อ: ${
        dorm.contact_phone || "ไม่ระบุ"
      }`;
    })
    .join("\n\n");
}

// Helper: ตอบคำถามเปรียบเทียบ 2 หอพัก
async function answerComparisonQuery(message, dorms) {
  const msg = message.toLowerCase();

  // ตรวจสอบว่าเป็นคำถามเปรียบเทียบหรือไม่
  if (!/ดีกว่า|แย่กว่า|เปรียบเทียบ|compare|better|worse|vs|เทียบ/.test(msg)) {
    return null;
  }

  // ลองหาชื่อหอพัก 2 หอจากข้อความ
  const foundDorms = [];

  for (const dorm of dorms) {
    const dormNameLower = dorm.name.toLowerCase();
    const dormNameClean = dormNameLower
      .replace(/\s+/g, "")
      .replace(/หอพัก|หอ/g, "");
    const msgClean = msg.replace(/\s+/g, "").replace(/หอพัก|หอ/g, "");

    if (msgClean.includes(dormNameClean) || msg.includes(dormNameLower)) {
      foundDorms.push(dorm);
      if (foundDorms.length === 2) break; // หยุดเมื่อเจอ 2 หอ
    }
  }

  // ถ้าเจอหอพัก 2 หอ ให้สร้างคำตอบเปรียบเทียบ
  if (foundDorms.length === 2) {
    console.log(
      "🔄 Comparison query detected:",
      foundDorms[0].name,
      "vs",
      foundDorms[1].name
    );

    const dorm1 = foundDorms[0];
    const dorm2 = foundDorms[1];

    let response = `📊 **เปรียบเทียบหอพัก**\n\n`;

    // หอพักที่ 1
    response += `**1. 🏠 ${dorm1.name}**\n`;
    const prices1 = [];
    if (dorm1.price_monthly && Number(dorm1.price_monthly) > 0)
      prices1.push(`รายเดือน ฿${Number(dorm1.price_monthly).toLocaleString()}`);
    if (dorm1.price_daily && Number(dorm1.price_daily) > 0)
      prices1.push(`รายวัน ฿${Number(dorm1.price_daily).toLocaleString()}`);
    if (dorm1.price_term && Number(dorm1.price_term) > 0)
      prices1.push(`รายเทอม ฿${Number(dorm1.price_term).toLocaleString()}`);
    if (prices1.length > 0) response += `💰 ราคา: ${prices1.join(" | ")}\n`;
    if (dorm1.facilities)
      response += `🌟 สิ่งอำนวยความสะดวก: ${dorm1.facilities.substring(
        0,
        100
      )}${dorm1.facilities.length > 100 ? "..." : ""}\n`;
    if (dorm1.near_places)
      response += `📍 ที่ตั้ง: ${dorm1.near_places.substring(0, 80)}${
        dorm1.near_places.length > 80 ? "..." : ""
      }\n`;
    response += `\n`;

    // หอพักที่ 2
    response += `**2. 🏠 ${dorm2.name}**\n`;
    const prices2 = [];
    if (dorm2.price_monthly && Number(dorm2.price_monthly) > 0)
      prices2.push(`รายเดือน ฿${Number(dorm2.price_monthly).toLocaleString()}`);
    if (dorm2.price_daily && Number(dorm2.price_daily) > 0)
      prices2.push(`รายวัน ฿${Number(dorm2.price_daily).toLocaleString()}`);
    if (dorm2.price_term && Number(dorm2.price_term) > 0)
      prices2.push(`รายเทอม ฿${Number(dorm2.price_term).toLocaleString()}`);
    if (prices2.length > 0) response += `💰 ราคา: ${prices2.join(" | ")}\n`;
    if (dorm2.facilities)
      response += `🌟 สิ่งอำนวยความสะดวก: ${dorm2.facilities.substring(
        0,
        100
      )}${dorm2.facilities.length > 100 ? "..." : ""}\n`;
    if (dorm2.near_places)
      response += `📍 ที่ตั้ง: ${dorm2.near_places.substring(0, 80)}${
        dorm2.near_places.length > 80 ? "..." : ""
      }\n`;
    response += `\n`;

    // สรุปการเปรียบเทียบ
    response += `**📋 สรุป:**\n`;

    // เปรียบเทียบราคา
    const price1 =
      Number(dorm1.price_monthly) ||
      Number(dorm1.price_daily) ||
      Number(dorm1.price_term) ||
      0;
    const price2 =
      Number(dorm2.price_monthly) ||
      Number(dorm2.price_daily) ||
      Number(dorm2.price_term) ||
      0;

    if (price1 > 0 && price2 > 0) {
      if (price1 < price2) {
        response += `💰 **${dorm1.name}** ราคาถูกกว่า (ต่างกัน ฿${(
          price2 - price1
        ).toLocaleString()})\n`;
      } else if (price2 < price1) {
        response += `💰 **${dorm2.name}** ราคาถูกกว่า (ต่างกัน ฿${(
          price1 - price2
        ).toLocaleString()})\n`;
      } else {
        response += `💰 ราคาเท่ากัน\n`;
      }
    }

    // นับสิ่งอำนวยความสะดวก
    const facilities1Count = dorm1.facilities
      ? dorm1.facilities.split(",").length
      : 0;
    const facilities2Count = dorm2.facilities
      ? dorm2.facilities.split(",").length
      : 0;

    if (facilities1Count > facilities2Count) {
      response += `🌟 **${dorm1.name}** มีสิ่งอำนวยความสะดวกมากกว่า (${facilities1Count} รายการ)\n`;
    } else if (facilities2Count > facilities1Count) {
      response += `🌟 **${dorm2.name}** มีสิ่งอำนวยความสะดวกมากกว่า (${facilities2Count} รายการ)\n`;
    }

    response += `\n💡 **ทั้ง 2 หอมีจุดเด่นของตัวเอง ขึ้นอยู่กับความต้องการของคุณค่ะ**`;

    return response;
  }

  return null;
}

// Helper: ตอบคำถามเกี่ยวกับระยะทางระหว่างหอพัก
async function answerDistanceQuery(message, dorms) {
  const msg = message.toLowerCase();

  // ตรวจสอบว่าเป็นคำถามเกี่ยวกับราคาหรือไม่ - ถ้าใช่ให้ข้าม
  if (/ราคา|ถูก|แพง|เท่าไหร่|เท่าไร|บาท|price|cost|cheap|expensive/.test(msg)) {
    console.log("💰 Price query detected - skipping distance calculation");
    return null;
  }

  // ตรวจสอบว่าเป็นคำถามเกี่ยวกับระยะทางหรือไม่
  if (!/ระยะทาง|ไกล|ใกล้|กี่กิโล|กี่เมตร|ห่างกัน|ห่าง/.test(msg)) {
    return null;
  }

  console.log("🔍 Distance query detected:", message);

  // ฟังก์ชันตรวจสอบว่าชื่อหอพักมีอยู่ในข้อความหรือไม่ (แบบ fuzzy)
  function isDormNameInMessage(dormName, message) {
    const cleanDormName = dormName
      .toLowerCase()
      .replace(/\s+/g, "") // ลบช่องว่าง
      .replace(/หอพัก/g, ""); // ลบคำว่า "หอพัก"

    const cleanMessage = message
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/หอพัก/g, "");

    // ตรวจสอบหลายวิธี
    return (
      cleanMessage.includes(cleanDormName) ||
      message.toLowerCase().includes(dormName.toLowerCase()) ||
      cleanDormName.includes(cleanMessage.split("กับ")[0]?.trim()) ||
      cleanDormName.includes(cleanMessage.split("กับ")[1]?.trim())
    );
  }

  // ลองหาชื่อหอพัก 2 หอจากข้อความ
  const foundDorms = [];

  for (const dorm of dorms) {
    if (isDormNameInMessage(dorm.name, msg)) {
      foundDorms.push(dorm);
      console.log("✅ Found dorm:", dorm.name);
    }
  }

  console.log(`📊 Total dorms found: ${foundDorms.length}`);

  // ถ้าไม่เจอหอพักเลย หรือเจอแค่หอเดียว ให้ลองวิธีอื่น
  if (foundDorms.length < 2) {
    // ลองแยกชื่อหอพักจากคำว่า "กับ" หรือ "และ"
    const parts = msg.split(/กับ|และ|ห่างจาก/);

    if (parts.length >= 2) {
      console.log("🔄 Trying alternative splitting method...");

      for (const part of parts) {
        const cleanPart = part.trim().replace(/หอพัก|หอ/g, "");

        // หาหอพักที่มีชื่อคล้ายกับส่วนที่แยกได้
        const matched = dorms.find((d) => {
          const cleanDormName = d.name
            .toLowerCase()
            .replace(/หอพัก|หอ/g, "")
            .replace(/\s+/g, "");
          const cleanSearch = cleanPart.replace(/\s+/g, "");
          return cleanDormName.includes(cleanSearch) && cleanSearch.length > 3;
        });

        if (matched && !foundDorms.find((fd) => fd.id === matched.id)) {
          foundDorms.push(matched);
          console.log("✅ Found dorm (alternative):", matched.name);
        }
      }
    }
  }

  console.log(`📊 Final dorms found: ${foundDorms.length}`);

  // ถ้าเจอหอพัก 2 หอ ให้คำนวณระยะทาง
  if (foundDorms.length >= 2) {
    try {
      const dorm1 = foundDorms[0];
      const dorm2 = foundDorms[1];

      // ดึงพิกัดจากฐานข้อมูล
      const coordQuery = `
        SELECT d.id, d.name, lc.latitude, lc.longitude
        FROM dorms d
        LEFT JOIN location_coordinates lc ON d.id = lc.dorm_id
        WHERE d.id IN (?, ?)
        GROUP BY d.id
      `;

      const coords = await new Promise((resolve, reject) => {
        pool.query(coordQuery, [dorm1.id, dorm2.id], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (coords.length < 2) {
        return `ขอโทษค่ะ ไม่พบข้อมูลพิกัดของหอพักที่ต้องการคำนวณระยะทาง 📍`;
      }

      const coord1 = coords.find((c) => c.id === dorm1.id);
      const coord2 = coords.find((c) => c.id === dorm2.id);

      if (!coord1.latitude || !coord2.latitude) {
        return `ขอโทษค่ะ หอพักยังไม่มีข้อมูลตำแหน่งที่ชัดเจน กรุณาติดต่อเจ้าของหอพักเพื่ออัพเดตข้อมูลค่ะ 📍`;
      }

      // คำนวณระยะทาง
      const distanceResult = await calculateDistanceBetweenDorms(
        {
          name: coord1.name,
          coordinates: [
            { latitude: coord1.latitude, longitude: coord1.longitude },
          ],
        },
        {
          name: coord2.name,
          coordinates: [
            { latitude: coord2.latitude, longitude: coord2.longitude },
          ],
        }
      );

      // สร้างคำตอบ
      let response = `📍 ระยะทางระหว่าง ${coord1.name} กับ ${coord2.name}\n\n`;

      if (distanceResult.walking) {
        response += `🚶 เดินเท้า: ${distanceResult.walking.distance_km} กม. (ประมาณ ${distanceResult.walking.duration_text})\n`;
      }

      if (distanceResult.driving) {
        response += `🚗 ขับรถ: ${distanceResult.driving.distance_km} กม. (ประมาณ ${distanceResult.driving.duration_text})\n`;
      }

      response += `\n💡 ระยะทางคำนวณตามเส้นทางถนนจริงค่ะ`;

      return response;
    } catch (error) {
      console.error("❌ Distance Query Error:", error);
      return `ขอโทษค่ะ เกิดข้อผิดพลาดในการคำนวณระยะทาง กรุณาลองใหม่อีกครั้งค่ะ`;
    }
  } else if (foundDorms.length === 1) {
    // เจอแค่หอเดียว
    console.log("⚠️ Found only 1 dorm");
    return `ฉันพบหอพัก "${foundDorms[0].name}" ค่ะ แต่ไม่สามารถหาหอพักที่สองได้\n\n💡 กรุณาระบุชื่อหอพักทั้งสองหออย่างชัดเจนค่ะ เช่น "ระยะทางระหว่างหอ A กับหอ B เท่าไหร์"`;
  } else if (foundDorms.length === 0) {
    // ไม่เจอเลย
    console.log("⚠️ No dorms found in message");
    return `ฉันไม่พบชื่อหอพักในคำถามค่ะ\n\n💡 กรุณาระบุชื่อหอพักทั้งสองหออย่างชัดเจน เช่น:\n"ระยะทางระหว่าง [ชื่อหอพัก 1] กับ [ชื่อหอพัก 2] เท่าไหร์"`;
  }

  return null;
}

// Helper: ตอบแบบ rule-based ทันทีถ้าเป็นคำถามง่าย ลดภาระโมเดล
function answerSimpleQuery(message, dorms) {
  const msg = message.toLowerCase();

  // นับจำนวนทั้งหมด
  if (/ทั้งหมดกี่|กี่หอ|กี่แห่ง|ทั้งหมด/.test(msg) && /หอ/.test(msg)) {
    return `ตอนนี้มีหอพักที่เปิดอนุมัติทั้งหมด ${dorms.length} แห่งค่ะ 🏠`;
  }

  // ตรวจสอบคำถามหาหอพักราคาถูกที่สุด
  const cheapestResponse = answerCheapestDormQuery(message, dorms);
  if (cheapestResponse) {
    return cheapestResponse;
  }

  // คำทักทาย
  if (/สวัสดี|hello|hi|หวัดดี/.test(msg)) {
    return "สวัสดีค่ะ 😊 มีเรื่องหอพักอะไรให้ช่วยไหมคะ?";
  }

  // ให้ AI ตอบทุกคำถาม
  return null;
}

// ฟังก์ชันกรองคำตอบที่ไม่ถูกต้อง
function filterInvalidResponse(aiResponse, dormContext) {
  try {
    // ดึงรายชื่อหอพักที่มีจริงในฐานข้อมูล
    const validDormNames = [];
    const dormLines = dormContext.split("\n");

    for (const line of dormLines) {
      if (line.includes("ชื่อหอ:")) {
        const dormName = line.split("ชื่อหอ:")[1]?.trim();
        if (dormName) {
          validDormNames.push(dormName);
        }
      }
    }

    // ตรวจสอบคำที่ห้ามใช้
    const forbiddenWords = [
      "อื่นๆ",
      "หลายแห่ง",
      "มากมาย",
      "เช่น",
      "เป็นต้น",
      "ยังมี",
    ];
    const hasForbiddenWords = forbiddenWords.some((word) =>
      aiResponse.includes(word)
    );

    if (hasForbiddenWords) {
      return "ขออภัยค่ะ ไม่มีข้อมูลหอพักที่ตรงกับคำถามในระบบ กรุณาดูรายละเอียดหอพักจากหน้าหลักแทนค่ะ";
    }

    // ตรวจสอบว่า AI ไม่ได้สร้างชื่อหอพักเพิ่ม
    if (validDormNames.length > 0) {
      const mentionsValidDorm = validDormNames.some((name) =>
        aiResponse.includes(name)
      );
      const mentionsDorm =
        aiResponse.includes("หอพัก") || aiResponse.includes("หอ");

      // ถ้าพูดถึงหอพักแต่ไม่ได้ระบุชื่อที่ถูกต้อง
      if (
        mentionsDorm &&
        !mentionsValidDorm &&
        !aiResponse.includes("ไม่มีข้อมูล")
      ) {
        return "ขออภัยค่ะ ไม่มีข้อมูลหอพักที่ตรงกับคำถามในระบบ";
      }
    }

    return aiResponse;
  } catch (error) {
    console.error("Error filtering AI response:", error);
    return "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง";
  }
}

// ฟังก์ชันเรียกใช้ Google Gemini AI (Duplicate - สำหรับ endpoint ที่ 2)
async function callGeminiAI2(userMessage, dormContext) {
  const systemPrompt = `คุณคือ "น้องดอร์ม" 🏠 ผู้ช่วยหอพักอัจฉริยะของระบบ Smart Dormitory มหาวิทยาลัยมหาสารคาม

## 🎭 บุคลิกภาพและการสนทนา:
- **เป็นธรรมชาติ:** สนทนาได้อย่างเป็นกันเอง เหมือนเพื่อนที่ช่วยแนะนำหอพัก
- **ยืดหยุ่น:** ตอบคำถามได้หลากหลายรูปแบบ ไม่ติดกรอบ
- **เป็นมิตร:** ใช้ "ค่ะ/ครับ", emoji น้อยๆ
- **ซื่อสัตย์:** ถ้าไม่รู้ ต้องบอกตรงๆ ไม่แต่ง

## ✅ ขอบเขต: ตอบได้เฉพาะเรื่องหอพักและบริบทที่เกี่ยวข้อง
## ❌ ห้าม: แต่งข้อมูล, สร้างรีวิวปลอม, ด่าหอพัก

**ข้อมูลหอพัก:**
${dormContext}

ตอบอย่างเป็นธรรมชาติ ยืดหยุ่น และเป็นมิตร!`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.85, // เพิ่มความยืดหยุ่น
        topP: 0.9,
        topK: 50,
        maxOutputTokens: 1536,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [
            {
              text: "เข้าใจแล้วค่ะ! น้องพร้อมช่วยหาหอพักที่ใช่สำหรับคุณ จะตอบแบบเป็นกันเองและให้ข้อมูลที่ถูกต้องค่ะ! 😊",
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    let aiResponse = response.text();

    // กรองคำตอบ
    aiResponse = filterInvalidResponse(aiResponse, dormContext);

    console.log(
      "✅ Gemini Response (Filtered):",
      aiResponse.substring(0, 100) + "..."
    );

    return aiResponse;
  } catch (error) {
    console.error("❌ Gemini API Error (Endpoint 2):", error.message);
    console.error("Full error:", error);

    // ให้ error message ที่ชัดเจนและเป็นมิตร
    if (
      error.message?.includes("API key") ||
      error.message?.includes("API_KEY")
    ) {
      return "⚠️ ขออภัยค่ะ มีปัญหาการตั้งค่า API Key\n\n💡 กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบการตั้งค่าค่ะ";
    }

    if (
      error.message?.includes("quota") ||
      error.message?.includes("QUOTA") ||
      error.message?.includes("429")
    ) {
      return "⚠️ ขออภัยค่ะ ใช้งาน API เกินโควต้าแล้ว\n\n🕒 กรุณาลองใหม่ในอีก 1-2 นาทีค่ะ";
    }

    if (
      error.message?.includes("SAFETY") ||
      error.message?.includes("blocked")
    ) {
      return "⚠️ ข้อความถูกบล็อค\n\n💡 ลองถามคำถามใหม่ในรูปแบบอื่นดูนะคะ";
    }

    // Error ทั่วไป
    return `😔 ขออภัยค่ะ น้องดอร์มมีปัญหาเล็กน้อย\n\n💡 ลองวิธีนี้:\n• รีเฟรชหน้าเว็บ\n• ถามคำถามง่ายๆ\n• ดูหอพักในหน้าหลัก`;
  }
}

// Chatbot API endpoint
app.post("/chatbot", async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "กรุณาส่งข้อความมา" });
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

    // ตรวจสอบคำถามเปรียบเทียบ 2 หอพักก่อน
    const comparisonAnswer = await answerComparisonQuery(message, dorms);
    if (comparisonAnswer) {
      return res.json({
        message: comparisonAnswer,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "comparison",
      });
    }

    // ตรวจสอบคำถามเกี่ยวกับระยะทางก่อน
    const distanceAnswer = await answerDistanceQuery(message, dorms);
    if (distanceAnswer) {
      return res.json({
        message: distanceAnswer,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "distance-calc",
      });
    }

    // ตอบแบบ simple rule-based ถ้าเข้าเงื่อนไข
    const simple = answerSimpleQuery(message, dorms);
    if (simple) {
      return res.json({
        message: simple,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "rule",
      });
    }

    // กรองเฉพาะหอที่เกี่ยวข้องกับคำถามเพื่อย่อ context
    const filteredDorms = filterDormsForQuery(message, dorms);
    const dormContext = buildDormContext(filteredDorms);

    // เรียกใช้ Google Gemini AI พร้อม context ที่ย่อแล้ว
    const aiResponse = await callGeminiAI2(message.trim(), dormContext);

    // บันทึก log เพื่อตรวจสอบ
    console.log(
      "✅ Gemini AI Response:",
      aiResponse?.substring(0, 200) + "..."
    );
    console.log("📊 Dorm Context Length:", dormContext.length);

    if (aiResponse) {
      // ใช้คำตอบจาก AI
      res.json({
        message: aiResponse,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: "gemini-ai",
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
        source: "fallback",
      });
    }
  } catch (error) {
    console.error("Chatbot API error:", error);
    res.status(500).json({
      error: "ขออภัย เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
      message:
        "🤖 ขออภัยค่ะ ระบบมีปัญหาชั่วคราว กรุณาลองถามใหม่อีกครั้งหรือใช้ฟอร์มค้นหาด้านบนแทนค่ะ 😊",
    });
  }
});

// ==================== GEOAPIFY STATIC MAP API ====================
// API endpoint สำหรับสร้าง Static Map URL
app.get("/api/static-map", (req, res) => {
  try {
    const {
      lat,
      lng,
      width = 300,
      height = 200,
      zoom = 15,
      style = "osm-bright",
    } = req.query;

    // ตรวจสอบ parameters
    if (!lat || !lng) {
      return res.status(400).json({
        error: "Missing required parameters: lat, lng",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // ตรวจสอบความถูกต้องของพิกัด
    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        error: "Invalid coordinates",
      });
    }

    // ตรวจสอบ Geoapify API Key
    const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
    if (!GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Geoapify API key not configured",
      });
    }

    // สร้าง Static Map URL
    const baseUrl = "https://maps.geoapify.com/v1/staticmap";
    const params = new URLSearchParams({
      style: style,
      width: parseInt(width),
      height: parseInt(height),
      center: `lonlat:${longitude},${latitude}`,
      zoom: parseInt(zoom),
      marker: `lonlat:${longitude},${latitude};type:material;color:%23ff0000;size:large`,
      apiKey: GEOAPIFY_API_KEY,
    });

    const staticMapUrl = `${baseUrl}?${params.toString()}`;

    res.json({
      success: true,
      url: staticMapUrl,
      coordinates: { latitude, longitude },
      parameters: {
        width: parseInt(width),
        height: parseInt(height),
        zoom: parseInt(zoom),
        style,
      },
    });
  } catch (error) {
    console.error("Static Map API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🗄️  Database: MySQL`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
});
