const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  console.log('🟢 Health check requested');
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Test endpoint for adding dorms
app.post('/owner/dorms', upload.array('images', 10), (req, res) => {
  console.log('🔧 Add dorm request received');
  console.log('🔧 Headers:', req.headers.authorization ? 'Token present' : 'No token');
  console.log('🔧 Body fields:', Object.keys(req.body));
  console.log('🔧 Files:', req.files ? req.files.length : 0);
  console.log('🔧 Form data:', {
    name: req.body.name,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    address_detail: req.body.address_detail
  });
  
  // Check required fields
  if (!req.body.name || !req.body.latitude || !req.body.longitude) {
    return res.status(400).json({ 
      error: 'ข้อมูลไม่ครบถ้วน: ต้องมี name, latitude, longitude' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Dorm added successfully (test mode)',
    id: Math.floor(Math.random() * 1000),
    receivedData: {
      name: req.body.name,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      filesCount: req.files ? req.files.length : 0
    }
  });
});

// Test endpoint for getting dorms
app.get('/owner/dorms', (req, res) => {
  console.log('🔧 Get dorms request received');
  res.json([
    {
      id: 1,
      name: 'Test Dorm 1',
      latitude: '13.7563',
      longitude: '100.5018',
      status: 'approved'
    }
  ]);
});

// Admin endpoints
app.get('/admin/dorms', (req, res) => {
  console.log('🔧 Admin get dorms request received');
  console.log('🔧 Query params:', req.query);
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  const status = req.query.status || 'pending';
  
  // Mock data based on status
  const mockDorms = {
    pending: [
      {
        id: 1,
        name: 'หอพักรออนุมัติ 1',
        address_detail: '123 ถนนทดสอบ',
        price_monthly: 3000,
        status: 'pending',
        owner_name: 'ทดสอบ เจ้าของ',
        contact_phone: '081-234-5678'
      },
      {
        id: 2,
        name: 'หอพักรออนุมัติ 2',
        address_detail: '456 ถนนทดสอบ 2',
        price_monthly: 3500,
        status: 'pending',
        owner_name: 'ทดสอบ เจ้าของ 2',
        contact_phone: '081-234-5679'
      }
    ],
    approved: [
      {
        id: 3,
        name: 'หอพักอนุมัติแล้ว 1',
        address_detail: '789 ถนนอนุมัติ',
        price_monthly: 4000,
        status: 'approved',
        owner_name: 'ผู้อนุมัติ',
        contact_phone: '081-234-5680'
      }
    ],
    rejected: [
      {
        id: 4,
        name: 'หอพักถูกปฏิเสธ 1',
        address_detail: '999 ถนนปฏิเสธ',
        price_monthly: 2500,
        status: 'rejected',
        owner_name: 'ผู้ถูกปฏิเสธ',
        contact_phone: '081-234-5681'
      }
    ]
  };
  
  res.json(mockDorms[status] || []);
});

// Admin approve dorm
app.put('/admin/dorms/:id/approve', (req, res) => {
  console.log('🔧 Admin approve dorm request received');
  console.log('🔧 Dorm ID:', req.params.id);
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  res.json({ 
    success: true, 
    message: 'Dorm approved successfully',
    dormId: req.params.id
  });
});

// Admin reject dorm
app.put('/admin/dorms/:id/reject', (req, res) => {
  console.log('🔧 Admin reject dorm request received');
  console.log('🔧 Dorm ID:', req.params.id);
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  res.json({ 
    success: true, 
    message: 'Dorm rejected successfully',
    dormId: req.params.id
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Simplified Backend server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Dorms endpoint: http://localhost:${PORT}/owner/dorms`);
});
