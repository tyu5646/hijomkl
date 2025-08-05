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

// ================================
// ADMIN MANAGEMENT ENDPOINTS
// ================================

// Get all roles
app.get('/admin/roles', (req, res) => {
  console.log('🔧 Get roles request received');
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  const mockRoles = [
    { id: 1, role_name: 'Super Admin', description: 'ผู้ดูแลระบบสูงสุด' },
    { id: 2, role_name: 'Admin', description: 'ผู้ดูแลระบบทั่วไป' },
    { id: 3, role_name: 'Moderator', description: 'ผู้ช่วยดูแลระบบ' },
    { id: 4, role_name: 'Support', description: 'ทีมสนับสนุน' }
  ];
  
  res.json(mockRoles);
});

// Get all admins
app.get('/admin/admins', (req, res) => {
  console.log('🔧 Get admins request received');
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  const mockAdmins = [
    {
      id: 1,
      firstName: 'ผู้ดูแล',
      lastName: 'ระบบสูงสุด',
      age: 35,
      dob: '1989-01-15',
      houseNo: '123',
      moo: '5',
      soi: 'สายไหม',
      road: 'ถนนพหลโยธิน',
      subdistrict: 'สายไหม',
      district: 'บางเขน',
      province: 'กรุงเทพมหานคร',
      email: 'superadmin@smartdorm.com',
      phone: '02-123-4567',
      role_id: 1,
      zip_code: '10220',
      created_at: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      firstName: 'ผู้ดูแล',
      lastName: 'ระบบหลัก',
      age: 32,
      dob: '1992-03-20',
      houseNo: '456',
      moo: '8',
      soi: 'ลาดพร้าว',
      road: 'ถนนลาดพร้าว',
      subdistrict: 'ลาดพร้าว',
      district: 'จตุจักร',
      province: 'กรุงเทพมหานคร',
      email: 'admin@smartdorm.com',
      phone: '02-234-5678',
      role_id: 2,
      zip_code: '10900',
      created_at: '2025-01-01T00:00:00.000Z'
    }
  ];
  
  res.json(mockAdmins);
});

// Add new admin
app.post('/admin/admins', (req, res) => {
  console.log('🔧 Add admin request received');
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('🔧 Body data:', req.body);
  
  // ตรวจสอบข้อมูลที่จำเป็น
  const { firstName, lastName, email, password, role_id } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ครบถ้วน: ต้องมี firstName, lastName, email, password'
    });
  }
  
  // จำลองการเพิ่มแอดมิน
  const newAdminId = Math.floor(Math.random() * 1000) + 100;
  
  res.json({
    success: true,
    message: 'เพิ่มแอดมินเรียบร้อยแล้ว',
    admin: {
      id: newAdminId,
      firstName,
      lastName,
      email,
      role_id: role_id || 2,
      created_at: new Date().toISOString()
    }
  });
});

// Update admin
app.put('/admin/admins/:id', (req, res) => {
  console.log('🔧 Update admin request received');
  console.log('🔧 Admin ID:', req.params.id);
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('🔧 Body data:', req.body);
  
  const adminId = req.params.id;
  const updateData = req.body;
  
  // ตรวจสอบข้อมูลที่จำเป็น
  if (!updateData.firstName || !updateData.lastName || !updateData.email) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ครบถ้วน: ต้องมี firstName, lastName, email'
    });
  }
  
  res.json({
    success: true,
    message: 'แก้ไขข้อมูลแอดมินเรียบร้อยแล้ว',
    admin: {
      id: adminId,
      ...updateData,
      updated_at: new Date().toISOString()
    }
  });
});

// Delete admin
app.delete('/admin/admins/:id', (req, res) => {
  console.log('🔧 Delete admin request received');
  console.log('🔧 Admin ID:', req.params.id);
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  const adminId = req.params.id;
  
  // ป้องกันการลบ Super Admin
  if (adminId === '1') {
    return res.status(403).json({
      success: false,
      message: 'ไม่สามารถลบ Super Admin ได้'
    });
  }
  
  res.json({
    success: true,
    message: 'ลบแอดมินเรียบร้อยแล้ว',
    deletedAdminId: adminId
  });
});

// ================================
// USER MANAGEMENT ENDPOINTS
// ================================

// Get all users (customers and owners)
app.get('/admin/users', (req, res) => {
  console.log('🔧 Get users request received');
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  const mockUsers = [
    // Mock customers
    {
      id: 1,
      role: 'customer',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      email: 'customer1@example.com',
      phone: '081-111-1111',
      age: 22,
      dob: '2002-05-15',
      houseNo: '123',
      moo: '5',
      soi: 'ลาดพร้าว 1',
      road: 'ถนนลาดพร้าว',
      subdistrict: 'ลาดพร้าว',
      district: 'จตุจักร',
      province: 'กรุงเทพมหานคร',
      created_at: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      role: 'customer',
      firstName: 'สมหญิง',
      lastName: 'สวยงาม',
      email: 'customer2@example.com',
      phone: '081-222-2222',
      age: 21,
      dob: '2003-08-20',
      houseNo: '456',
      moo: '8',
      soi: 'รามคำแหง 24',
      road: 'ถนนรามคำแหง',
      subdistrict: 'หัวหมาก',
      district: 'บางกะปิ',
      province: 'กรุงเทพมหานคร',
      created_at: '2025-01-02T00:00:00.000Z'
    },
    // Mock owners
    {
      id: 3,
      role: 'owner',
      firstName: 'สมปอง',
      lastName: 'เจ้าของ',
      email: 'owner1@example.com',
      phone: '081-333-3333',
      age: 35,
      dob: '1989-12-10',
      houseNo: '789',
      moo: '12',
      soi: 'สุขุมวิท 71',
      road: 'ถนนสุขุมวิท',
      subdistrict: 'พระโขนงเหนือ',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      dormName: 'หอพักดีมาก',
      created_at: '2025-01-03T00:00:00.000Z'
    },
    {
      id: 4,
      role: 'owner',
      firstName: 'สมศรี',
      lastName: 'นักธุรกิจ',
      email: 'owner2@example.com',
      phone: '081-444-4444',
      age: 42,
      dob: '1982-03-25',
      houseNo: '321',
      moo: '15',
      soi: 'เพชรบุรี 15',
      road: 'ถนนเพชรบุรี',
      subdistrict: 'ทุ่งพญาไท',
      district: 'ราชเทวี',
      province: 'กรุงเทพมหานคร',
      dormName: 'หอพักสบายใจ',
      created_at: '2025-01-04T00:00:00.000Z'
    }
  ];
  
  res.json(mockUsers);
});

// Add new user
app.post('/admin/users', (req, res) => {
  console.log('🔧 Add user request received');
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('🔧 Body data:', req.body);
  
  const { role, firstName, lastName, email, password } = req.body;
  
  // ตรวจสอบข้อมูลที่จำเป็น
  if (!role || !firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ครบถ้วน: ต้องมี role, firstName, lastName, email, password'
    });
  }
  
  // ตรวจสอบ role ที่ถูกต้อง
  if (!['customer', 'owner'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Role ต้องเป็น customer หรือ owner เท่านั้น'
    });
  }
  
  // จำลองการเพิ่มผู้ใช้
  const newUserId = Math.floor(Math.random() * 1000) + 100;
  
  res.json({
    success: true,
    message: `เพิ่ม${role === 'customer' ? 'ลูกค้า' : 'เจ้าของหอพัก'}เรียบร้อยแล้ว`,
    user: {
      id: newUserId,
      role,
      firstName,
      lastName,
      email,
      created_at: new Date().toISOString()
    }
  });
});

// Update user
app.put('/admin/users/:id', (req, res) => {
  console.log('🔧 Update user request received');
  console.log('🔧 User ID:', req.params.id);
  console.log('🔧 Query role:', req.query.role);
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('🔧 Body data:', req.body);
  
  const userId = req.params.id;
  const userRole = req.query.role;
  const updateData = req.body;
  
  // ตรวจสอบข้อมูลที่จำเป็น
  if (!updateData.firstName || !updateData.lastName || !updateData.email) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ครบถ้วน: ต้องมี firstName, lastName, email'
    });
  }
  
  res.json({
    success: true,
    message: `แก้ไขข้อมูล${userRole === 'customer' ? 'ลูกค้า' : 'เจ้าของหอพัก'}เรียบร้อยแล้ว`,
    user: {
      id: userId,
      role: userRole,
      ...updateData,
      updated_at: new Date().toISOString()
    }
  });
});

// Delete user
app.delete('/admin/users/:id', (req, res) => {
  console.log('🔧 Delete user request received');
  console.log('🔧 User ID:', req.params.id);
  console.log('🔧 Query role:', req.query.role);
  console.log('🔧 Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  
  const userId = req.params.id;
  const userRole = req.query.role;
  
  res.json({
    success: true,
    message: `ลบ${userRole === 'customer' ? 'ลูกค้า' : 'เจ้าของหอพัก'}เรียบร้อยแล้ว`,
    deletedUserId: userId,
    deletedUserRole: userRole
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Simplified Backend server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Dorms endpoint: http://localhost:${PORT}/owner/dorms`);
});
