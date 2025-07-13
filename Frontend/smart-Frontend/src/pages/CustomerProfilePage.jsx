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
  provinces: 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json',
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // ดึงข้อมูลจังหวัด, อำเภอ, ตำบลทั้งหมดมาเก็บไว้
    fetch(TH_API.provinces).then(r => r.json()).then(setProvinces);
    fetch(TH_API.amphures).then(r => r.json()).then(setAllAmphures);
    fetch(TH_API.tambons).then(r => r.json()).then(setAllTambons);
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
    if (form.province && allAmphures.length > 0) {
      // หา province_id จากชื่อจังหวัด
      const selectedProvince = provinces.find(p => p.name_th === form.province);
      if (selectedProvince) {
        const filtered = allAmphures.filter(a => a.province_id === selectedProvince.id);
        setAmphures(filtered);
      } else {
        setAmphures([]);
      }
    } else {
      setAmphures([]);
      setTambons([]);
    }
  }, [form.province, allAmphures, provinces]);

  useEffect(() => {
    // โหลดตำบลเมื่อเลือกอำเภอ
    if (form.district && allTambons.length > 0) {
      // หา amphure_id จากชื่ออำเภอ
      const selectedAmphure = amphures.find(a => a.name_th === form.district);
      if (selectedAmphure) {
        const filtered = allTambons.filter(t => t.amphure_id === selectedAmphure.id);
        setTambons(filtered);
      } else {
        setTambons([]);
      }
    } else {
      setTambons([]);
    }
  }, [form.district, allTambons, amphures]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => { setEditMode(false); setForm(user); };
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));

    // Reset dependent fields
    if (name === "province") {
      setForm(f => ({ ...f, district: '', subdistrict: '', zip_code: '' }));
    }
    if (name === "district") {
      setForm(f => ({ ...f, subdistrict: '', zip_code: '' }));
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
        // แสดงข้อความสำเร็จ (อาจเพิ่ม toast notification ได้)
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
    setLoading(false);
  };

  // ฟังก์ชันสำหรับการจัดการการเลือกไฟล์รูปโปรไฟล์
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // สร้าง preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ฟังก์ชันสำหรับอัปโหลดรูปโปรไฟล์
  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      alert('กรุณาเลือกไฟล์รูปภาพก่อน');
      return;
    }

    setUploading(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

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
        
        // รีเซ็ตการเลือกไฟล์
        setSelectedFile(null);
        setPreviewUrl(null);
        
        alert('อัปโหลดรูปโปรไฟล์สำเร็จ!');
      } else {
        const error = await response.json();
        alert(error.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    }
    
    setUploading(false);
  };

  // ฟังก์ชันสำหรับยกเลิกการเลือกไฟล์
  const handleCancelFileSelect = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // รีเซ็ต input file
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) {
      fileInput.value = '';
    }
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
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
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
                    </div>
                  </div>
                  
                  {/* Camera Icon for Upload */}
                  <button
                    onClick={() => document.getElementById('avatar-upload').click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg group-hover:scale-110 transform"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
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
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      บันทึก
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
                        >
                          <option value="">เลือกจังหวัด</option>
                          {provinces.map(p => <option key={p.id} value={p.name_th}>{p.name_th}</option>)}
                        </select>
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
                        >
                          <option value="">เลือกอำเภอ</option>
                          {amphures.map(a => <option key={a.id} value={a.name_th}>{a.name_th}</option>)}
                        </select>
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
                        >
                          <option value="">เลือกตำบล</option>
                          {tambons.map(t => <option key={t.id} value={t.name_th}>{t.name_th}</option>)}
                        </select>
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

          {/* Avatar Upload Preview Section */}
          {(selectedFile || previewUrl) && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-300">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">รูปโปรไฟล์ใหม่</h3>
                    <p className="text-blue-700 text-sm">{selectedFile?.name}</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleUploadAvatar}
                    disabled={uploading}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
                      uploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        อัปโหลด
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleCancelFileSelect}
                    disabled={uploading}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerProfilePage;
