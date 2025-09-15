import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import '../components/ChatbotWidgetCircle.css';

const LABELS = {
  firstName: 'ชื่อ',
  lastName: 'นามสกุล',
  age: 'อายุ',
  dob: 'วันเกิด',
  houseNo: 'บ้านเลขที่',
  moo: 'หมู่',
  soi: 'ซอย',
  road: 'ถนน',
  subdistrict: 'ตำบล',
  district: 'อำเภอ',
  province: 'จังหวัด',
  email: 'อีเมล',
  phone: 'เบอร์โทร',
  zip_code: 'รหัสไปรษณีย์',
};

const TH_API = {
  provinces: 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json',
  amphures: 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json',
  tambons: 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json',
};

function CustomerProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [allAmphures, setAllAmphures] = useState([]);
  const [allTambons, setAllTambons] = useState([]);
  // States สำหรับการอัปโหลดรูปโปรไฟล์
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // ดึงข้อมูลจังหวัด, อำเภอ, ตำบลทั้งหมดมาเก็บไว้
    const fetchThaiData = async () => {
      try {
        console.log('Starting to fetch Thai location data...');
        
        const [provincesRes, amphuresRes, tambonsRes] = await Promise.all([
          fetch(TH_API.provinces),
          fetch(TH_API.amphures),
          fetch(TH_API.tambons)
        ]);
        
        if (!provincesRes.ok || !amphuresRes.ok || !tambonsRes.ok) {
          throw new Error('Failed to fetch Thai data');
        }
        
        const provincesData = await provincesRes.json();
        const amphuresData = await amphuresRes.json();
        const tambonsData = await tambonsRes.json();
        
        console.log('Provinces loaded:', provincesData.length);
        console.log('Amphures loaded:', amphuresData.length); 
        console.log('Tambons loaded:', tambonsData.length);
        
        if (provincesData.length === 0 || amphuresData.length === 0 || tambonsData.length === 0) {
          throw new Error('Empty data received');
        }
        
        setProvinces(provincesData);
        setAllAmphures(amphuresData);
        setAllTambons(tambonsData);
      } catch (error) {
        console.error('Error loading Thai data:', error);
        showNotification('ไม่สามารถโหลดข้อมูลจังหวัด-อำเภอ-ตำบล ได้', 'error');
        
        // Fallback: กำหนดข้อมูลจังหวัดที่เป็นพื้นฐาน
        setProvinces([
          { id: 1, name_th: 'กรุงเทพมหานคร' },
          { id: 10, name_th: 'กระบี่' },
          { id: 11, name_th: 'กาญจนบุรี' }
        ]);
      }
    };
    
    fetchThaiData();
  }, []);

  useEffect(() => {
    // ดึงข้อมูลลูกค้าจาก token
    const token = sessionStorage.getItem('token') || localStorage.getItem('token'); // ตรวจสอบทั้ง sessionStorage และ localStorage
    const role = sessionStorage.getItem('role') || localStorage.getItem('role');
    
    console.log('Token:', token); // Debug
    console.log('Role:', role); // Debug
    
    if (!token) {
      console.log('No token found'); // Debug
      setLoading(false);
      setUser(null);
      return;
    }
    
    if (role !== 'customer') {
      console.log('Not customer role:', role); // Debug
      setLoading(false);
      setUser(null);
      return;
    }
    
    fetch('http://localhost:3001/customer/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log('Response status:', res.status); // Debug
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Profile data:', data); // Debug
        setUser(data);
        setForm(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Profile fetch error:', error); // Debug
        setUser(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // โหลดอำเภอเมื่อเลือกจังหวัด
    if (form.province && allAmphures.length > 0 && provinces.length > 0) {
      console.log('Loading amphures for province:', form.province);
      
      // หา province_id จากชื่อจังหวัด
      const selectedProvince = provinces.find(p => p.name_th === form.province);
      console.log('Selected province:', selectedProvince);
      
      if (selectedProvince) {
        const filtered = allAmphures.filter(a => a.province_id === selectedProvince.id);
        console.log('Filtered amphures:', filtered.length);
        setAmphures(filtered);
      } else {
        setAmphures([]);
      }
    } else if (!form.province) {
      // ถ้าไม่มีการเลือกจังหวัด ให้ reset ทุกอย่าง
      setAmphures([]);
      setTambons([]);
    }
  }, [form.province, allAmphures, provinces]);

  useEffect(() => {
    // โหลดตำบลเมื่อเลือกอำเภอ
    if (form.district && allTambons.length > 0 && amphures.length > 0) {
      console.log('Loading tambons for district:', form.district);
      
      // หา amphure_id จากชื่ออำเภอ
      const selectedAmphure = amphures.find(a => a.name_th === form.district);
      console.log('Selected amphure:', selectedAmphure);
      
      if (selectedAmphure) {
        const filtered = allTambons.filter(t => t.amphure_id === selectedAmphure.id);
        console.log('Filtered tambons:', filtered.length, filtered);
        setTambons(filtered);
      } else {
        console.log('Amphure not found');
        setTambons([]);
      }
    } else if (!form.district) {
      // ถ้าไม่มีการเลือกอำเภอ ให้ reset ตำบล
      setTambons([]);
    }
  }, [form.district, allTambons, amphures]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => { setEditMode(false); setForm(user); };
  const handleChange = e => {
    const { name, value } = e.target;
    console.log('Field changed:', name, 'Value:', value);
    console.log('Current form state:', form);
    console.log('Available amphures:', amphures.length);
    console.log('Available tambons:', tambons.length);
    
    // Reset dependent fields และ auto-fill zip_code
    if (name === "province") {
      setForm(f => ({ ...f, [name]: value, district: '', subdistrict: '', zip_code: '' }));
      setAmphures([]);
      setTambons([]);
    } else if (name === "district") {
      setForm(f => ({ ...f, [name]: value, subdistrict: '', zip_code: '' }));
      setTambons([]);
    } else if (name === "subdistrict") {
      setForm(f => ({ ...f, [name]: value }));
      // หารหัสไปรษณีย์จากตำบลที่เลือก
      setTimeout(() => {
        const selectedTambon = tambons.find(t => t.name_th === value);
        if (selectedTambon && selectedTambon.zip_code) {
          setForm(f => ({ ...f, zip_code: selectedTambon.zip_code }));
        }
      }, 100);
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/customer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      
      if (response.ok) {
        setUser(form);
        setEditMode(false);
        showNotification('อัปเดตข้อมูลสำเร็จ!', 'success');
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile');
        showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error');
    }
    setLoading(false);
  };

  // ฟังก์ชันสำหรับแสดง notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ฟังก์ชันสำหรับการจัดการการเลือกไฟล์รูปโปรไฟล์
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        showNotification('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
        return;
      }
      
      // อัปโหลดทันที
      await handleUploadAvatar(file);
    }
  };

  // ฟังก์ชันสำหรับอัปโหลดรูปโปรไฟล์
  const handleUploadAvatar = async (file) => {
    if (!file) {
      showNotification('กรุณาเลือกไฟล์รูปภาพก่อน', 'error');
      return;
    }

    setUploading(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('http://localhost:3001/customer/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        // อัปเดตข้อมูลผู้ใช้ด้วย URL รูปโปรไฟล์ใหม่
        const updatedUser = { ...user, avatar_url: result.avatarUrl };
        setUser(updatedUser);
        setForm(updatedUser);
        
        // รีเซ็ต input file
        const fileInput = document.getElementById('avatar-upload');
        if (fileInput) {
          fileInput.value = '';
        }
        
        showNotification('อัปโหลดรูปโปรไฟล์สำเร็จ!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('เกิดข้อผิดพลาดในการอัปโหลด', 'error');
    }
    
    setUploading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex justify-center items-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex justify-center items-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-md mx-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลลูกค้า</h3>
        <p className="text-gray-600 text-center mb-6">กรุณาเข้าสู่ระบบด้วยบัญชีลูกค้าเพื่อดูข้อมูลโปรไฟล์</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100">
      <Header />
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-900/90"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              โปรไฟล์ของฉัน
            </h1>
            <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
              จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center space-x-6">
                  {/* Avatar with Upload Feature */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 p-1">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                      {user.avatar_url ? (
                        <img 
                          src={`http://localhost:3001${user.avatar_url}`} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : user.firstName ? (
                        <span className="text-2xl font-bold text-blue-600">
                          {user.firstName.charAt(0)}{user.lastName?.charAt(0) || ''}
                        </span>
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                      
                      {/* Upload overlay */}
                      {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                            <span className="text-xs">กำลังอัปโหลด</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>                  {/* Camera Icon for Upload */}
                  <button
                    onClick={() => document.getElementById('avatar-upload').click()}
                    disabled={uploading}
                    className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transform transition-colors ${
                      uploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    title={uploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูปโปรไฟล์"}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Hidden File Input */}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                
                {/* User Info */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ลูกค้า
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-4 sm:mt-0">
                {!editMode ? (
                  <button 
                    onClick={handleEdit}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    แก้ไขข้อมูล
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleSave}
                      disabled={loading}
                      className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-lg hover:shadow-xl ${
                        loading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          บันทึก
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลส่วนตัว</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(user).filter(([k]) => !['avatar','avatar_url','password','id', 'role_id'].includes(k)).map(([key, value]) => {
                  if (editMode && key === 'province') {
                    return (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">{LABELS[key] || key}</label>
                        <select
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                          name="province"
                          value={form.province || ''}
                          onChange={handleChange}
                          disabled={provinces.length === 0}
                        >
                          <option value="">
                            {provinces.length === 0 ? 'กำลังโหลดจังหวัด...' : 'เลือกจังหวัด'}
                          </option>
                          {provinces.map(p => <option key={p.id} value={p.name_th}>{p.name_th}</option>)}
                        </select>
                        {provinces.length === 0 && (
                          <p className="text-sm text-orange-500">กำลังโหลดรายการจังหวัด...</p>
                        )}
                      </div>
                    );
                  }
                  if (editMode && key === 'district') {
                    return (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">{LABELS[key] || key}</label>
                        <select
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                          name="district"
                          value={form.district || ''}
                          onChange={handleChange}
                          disabled={!form.province || amphures.length === 0}
                        >
                          <option value="">เลือกอำเภอ</option>
                          {amphures.map(a => <option key={a.id} value={a.name_th}>{a.name_th}</option>)}
                        </select>
                        {form.province && amphures.length === 0 && (
                          <p className="text-sm text-gray-500">กรุณาเลือกจังหวัดก่อน</p>
                        )}
                      </div>
                    );
                  }
                  if (editMode && key === 'subdistrict') {
                    return (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">{LABELS[key] || key}</label>
                        <select
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                          name="subdistrict"
                          value={form.subdistrict || ''}
                          onChange={handleChange}
                          disabled={!form.district || tambons.length === 0}
                        >
                          <option value="">เลือกตำบล</option>
                          {tambons.map(t => <option key={t.id} value={t.name_th}>{t.name_th}</option>)}
                        </select>
                        {form.district && tambons.length === 0 && (
                          <p className="text-sm text-gray-500">กรุณาเลือกอำเภอก่อน</p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">{LABELS[key] || key}</label>
                      {editMode ? (
                        <input
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                          name={key}
                          value={form[key] || ''}
                          onChange={handleChange}
                          type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : key === 'age' ? 'number' : key === 'dob' ? 'date' : 'text'}
                        />
                      ) : (
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                          {value || '-'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerProfilePage;
