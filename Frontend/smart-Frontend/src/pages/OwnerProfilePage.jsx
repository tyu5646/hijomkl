import React, { useEffect, useState } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { FaUser, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const LABELS = {
  dormName: 'ชื่อหอพัก',
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

function OwnerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // API States สำหรับจังหวัด อำเภอ ตำบล
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [allAmphures, setAllAmphures] = useState([]);
  const [allTambons, setAllTambons] = useState([]);
  const [originalProvinceId, setOriginalProvinceId] = useState('');
  const [originalAmphureId, setOriginalAmphureId] = useState('');
  const [originalTambonId, setOriginalTambonId] = useState('');

  // โหลดข้อมูลจาก API จังหวัด อำเภอ ตำบล
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Failed to load provinces:', err));
    
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json')
      .then(res => res.json())
      .then(data => setAllAmphures(data))
      .catch(err => console.error('Failed to load amphures:', err));
    
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json')
      .then(res => res.json())
      .then(data => setAllTambons(data))
      .catch(err => console.error('Failed to load tambons:', err));
  }, []);

  // หาค่า ID จากชื่อเมื่อโหลดข้อมูลโปรไฟล์
  useEffect(() => {
    if (profile && provinces.length > 0 && allAmphures.length > 0 && allTambons.length > 0) {
      // หา province_id จากชื่อจังหวัด
      const province = provinces.find(p => p.name_th === profile.province);
      if (province) {
        setOriginalProvinceId(province.id.toString());
        setForm(f => ({ ...f, province: province.id.toString() }));
        
        // หา amphure_id จากชื่ออำเภอ
        const amphure = allAmphures.find(a => a.name_th === profile.district && a.province_id === province.id);
        if (amphure) {
          setOriginalAmphureId(amphure.id.toString());
          setForm(f => ({ ...f, district: amphure.id.toString() }));
          
          // หา tambon_id จากชื่อตำบล
          const tambon = allTambons.find(t => t.name_th === profile.subdistrict && t.amphure_id === amphure.id);
          if (tambon) {
            setOriginalTambonId(tambon.id.toString());
            setForm(f => ({ ...f, subdistrict: tambon.id.toString(), zip_code: tambon.zip_code }));
          }
        }
      }
    }
  }, [profile, provinces, allAmphures, allTambons]);

  // เมื่อเลือกจังหวัด ให้ filter อำเภอ
  useEffect(() => {
    if (form.province && allAmphures.length > 0) {
      const filteredAmphures = allAmphures.filter(a => a.province_id === Number(form.province));
      setAmphures(filteredAmphures);
      setTambons([]);
      // ถ้าไม่ใช่การโหลดข้อมูลครั้งแรก ให้ reset district และ subdistrict
      if (form.province !== originalProvinceId) {
        setForm(f => ({ ...f, district: '', subdistrict: '', zip_code: '' }));
      }
    } else {
      setAmphures([]);
      setTambons([]);
    }
  }, [form.province, allAmphures, originalProvinceId]);

  // เมื่อเลือกอำเภอ ให้ filter ตำบล
  useEffect(() => {
    if (form.district && allTambons.length > 0) {
      const filteredTambons = allTambons.filter(t => t.amphure_id === Number(form.district));
      setTambons(filteredTambons);
      // ถ้าไม่ใช่การโหลดข้อมูลครั้งแรก ให้ reset subdistrict
      if (form.district !== originalAmphureId) {
        setForm(f => ({ ...f, subdistrict: '', zip_code: '' }));
      }
    } else {
      setTambons([]);
    }
  }, [form.district, allTambons, originalAmphureId]);

  // เมื่อเลือกตำบล ให้ set zip_code อัตโนมัติ
  useEffect(() => {
    if (form.subdistrict && tambons.length > 0) {
      const tambon = tambons.find(t => t.id === Number(form.subdistrict));
      if (tambon) {
        setForm(f => ({ ...f, zip_code: tambon.zip_code }));
      }
    } else if (form.subdistrict !== originalTambonId) {
      setForm(f => ({ ...f, zip_code: '' }));
    }
  }, [form.subdistrict, tambons, originalTambonId]);

  useEffect(() => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'owner') {
      setError('กรุณาเข้าสู่ระบบในฐานะเจ้าของหอพัก');
      setLoading(false);
      return;
    }

    fetch('http://localhost:3001/owner/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async res => {
        if (res.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('role');
          setError('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setProfile(data);
          setForm(data);
          setError('');
        } else {
          setError('ไม่พบข้อมูลผู้ใช้');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Profile fetch error:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // ฟังก์ชันจัดการการอัปโหลดรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      setProfileImage(file);
      
      // สร้างรูปภาพตัวอย่าง
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // ฟังก์ชันลบรูปภาพ
  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setForm(f => ({ ...f, profile_image: null }));
    // รีเซ็ต input file
    const fileInput = document.getElementById('profile-image-input');
    if (fileInput) fileInput.value = '';
  };

  // ฟังก์ชันอัปโหลดรูปภาพ
  const uploadProfileImage = async () => {
    if (!profileImage) return null;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profileImage', profileImage);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3001/owner/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.imageUrl;
      } else {
        throw new Error(data.error || 'การอัปโหลดรูปภาพล้มเหลว');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        setSaving(false);
        return;
      }

      // อัปโหลดรูปภาพก่อน (ถ้ามี)
      let imageUrl = form.profile_image;
      if (profileImage) {
        const uploadedImageUrl = await uploadProfileImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        } else {
          setSaving(false);
          return; // หยุดการบันทึกถ้าอัปโหลดรูปภาพล้มเหลว
        }
      }

      // แปลง ID กลับเป็นชื่อสำหรับส่งไปเซิร์ฟเวอร์
      const formToSend = { ...form };
      
      if (form.province && provinces.length > 0) {
        const province = provinces.find(p => p.id === Number(form.province));
        if (province) formToSend.province = province.name_th;
      }
      
      if (form.district && allAmphures.length > 0) {
        const amphure = allAmphures.find(a => a.id === Number(form.district));
        if (amphure) formToSend.district = amphure.name_th;
      }
      
      if (form.subdistrict && allTambons.length > 0) {
        const tambon = allTambons.find(t => t.id === Number(form.subdistrict));
        if (tambon) formToSend.subdistrict = tambon.name_th;
      }

      // เพิ่ม URL รูปภาพ
      if (imageUrl) {
        formToSend.profile_image = imageUrl;
      }

      const res = await fetch(`http://localhost:3001/owner/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formToSend)
      });
      
      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        setError('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        setSaving(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(formToSend);
        setEditMode(false);
        setError('');
        setProfileImage(null);
        setImagePreview(null);
        // แสดงข้อความสำเร็จ
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      } else {
        setError(data.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm(profile);
    setError('');
    setProfileImage(null);
    setImagePreview(null);
    // รีเซ็ต input file
    const fileInput = document.getElementById('profile-image-input');
    if (fileInput) fileInput.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex">
        <OwnerSidebar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex">
        <OwnerSidebar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-md mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">เกิดปัญหาในการโหลดข้อมูล</h3>
            <p className="text-gray-600 text-center mb-4">{error || 'ไม่พบข้อมูลผู้ใช้'}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                รีเฟรช
              </button>
              <button 
                onClick={() => {
                  sessionStorage.removeItem('token');
                  sessionStorage.removeItem('role');
                  window.location.href = '/login';
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                เข้าสู่ระบบใหม่
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex">
      <OwnerSidebar />
      <main className="flex-1 p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
            
            {/* Content */}
            <div className="relative px-8 py-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <FaUser className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    ข้อมูลส่วนตัว
                  </h1>
                  <p className="text-blue-100 mt-1">
                    จัดการข้อมูลของคุณ
                  </p>
                </div>
              </div>
              
              {/* Profile Avatar */}
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden">
                  {(imagePreview || profile.profile_image) ? (
                    <img 
                      src={imagePreview || `http://localhost:3001${profile.profile_image}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={`text-2xl font-bold text-white ${(imagePreview || profile.profile_image) ? 'hidden' : ''}`}>
                    {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 p-1">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {(imagePreview || profile.profile_image) ? (
                          <>
                            <img 
                              src={imagePreview || `http://localhost:3001${profile.profile_image}`}
                              alt="Profile"
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <span className="text-2xl font-bold text-blue-600 w-full h-full flex items-center justify-center" style={{display: 'none'}}>
                              {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-blue-600">
                            {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
                    
                    {/* ปุ่มแก้ไขรูปภาพ (แสดงเฉพาะในโหมดแก้ไข) */}
                    {editMode && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <label 
                          htmlFor="profile-image-input"
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors flex items-center justify-center"
                          title="เปลี่ยนรูปโปรไฟล์"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </label>
                        <input
                          id="profile-image-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-gray-600">{profile.email}</p>
                    <div className="flex items-center mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ผู้ประกอบการ
                      </span>
                      {profile.dormName && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profile.dormName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 sm:mt-0">
                  {!editMode ? (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg hover:shadow-xl"
                    >
                      <FaEdit className="w-5 h-5 mr-2" />
                      แก้ไขข้อมูล
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        <FaSave className="w-5 h-5 mr-2" />
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                      <button 
                        onClick={handleCancel}
                        disabled={saving}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        <FaTimes className="w-5 h-5 mr-2" />
                        ยกเลิก
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-6 flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-red-700 font-medium">{error}</span>
                  {error.includes('Session หมดอายุ') && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          sessionStorage.removeItem('token');
                          sessionStorage.removeItem('role');
                          window.location.href = '/login';
                        }}
                        className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        เข้าสู่ระบบใหม่
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Form */}
            <div className="p-6">
              <div className="max-w-5xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลส่วนตัว</h3>
                
                {/* ส่วนจัดการรูปโปรไฟล์ (แสดงเฉพาะในโหมดแก้ไข) */}
                {editMode && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      รูปโปรไฟล์
                    </h4>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* แสดงรูปตัวอย่าง */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 p-1">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {(imagePreview || profile.profile_image) ? (
                              <>
                                <img 
                                  src={imagePreview || `http://localhost:3001${profile.profile_image}`}
                                  alt="Profile Preview"
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <span className="text-3xl font-bold text-blue-600 w-full h-full flex items-center justify-center" style={{display: 'none'}}>
                                  {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                </span>
                              </>
                            ) : (
                              <span className="text-3xl font-bold text-blue-600">
                                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* ปุ่มจัดการรูปภาพ */}
                      <div className="flex-1">
                        <div className="space-y-4">
                          <div>
                            <label 
                              htmlFor="profile-image-input-main"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {profileImage ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
                            </label>
                            <input
                              id="profile-image-input-main"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </div>
                          
                          {(profileImage || imagePreview || profile.profile_image) && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              ลบรูปภาพ
                            </button>
                          )}
                          
                          <div className="text-sm text-gray-500">
                            <p>• รองรับไฟล์: JPG, PNG, GIF</p>
                            <p>• ขนาดไม่เกิน: 5MB</p>
                            <p>• แนะนำขนาด: 400x400 พิกเซล</p>
                          </div>
                          
                          {uploadingImage && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-sm">กำลังอัปโหลดรูปภาพ...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(profile)
                      .filter(([key]) => !['id', 'password', 'role_id', 'province', 'district', 'subdistrict', 'zip_code', 'profile_image'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {LABELS[key] || key}
                          </label>
                          {editMode ? (
                            <input
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                              name={key}
                              value={form[key] || ''}
                              onChange={handleChange}
                              type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : key === 'age' ? 'number' : key === 'dob' ? 'date' : 'text'}
                              required={['firstName', 'lastName', 'email'].includes(key)}
                            />
                          ) : (
                            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                              {value || '-'}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* ส่วนที่อยู่ (จังหวัด อำเภอ ตำบล รหัสไปรษณีย์) */}
                  <div className="mt-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      
                      {/* จังหวัด */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">จังหวัด</label>
                        {editMode ? (
                          <select
                            name="province"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                            value={form.province || ''}
                            onChange={handleChange}
                            required
                          >
                            <option value="">เลือกจังหวัด</option>
                            {provinces.map((p) => (
                              <option key={p.id} value={p.id}>{p.name_th}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {profile.province || '-'}
                          </div>
                        )}
                      </div>

                      {/* อำเภอ */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">อำเภอ</label>
                        {editMode ? (
                          <select
                            name="district"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 disabled:bg-gray-100"
                            value={form.district || ''}
                            onChange={handleChange}
                            required
                            disabled={!form.province}
                          >
                            <option value="">เลือกอำเภอ</option>
                            {amphures.map((a) => (
                              <option key={a.id} value={a.id}>{a.name_th}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {profile.district || '-'}
                          </div>
                        )}
                      </div>

                      {/* ตำบล */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">ตำบล</label>
                        {editMode ? (
                          <select
                            name="subdistrict"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 disabled:bg-gray-100"
                            value={form.subdistrict || ''}
                            onChange={handleChange}
                            required
                            disabled={!form.district}
                          >
                            <option value="">เลือกตำบล</option>
                            {tambons.map((t) => (
                              <option key={t.id} value={t.id}>{t.name_th}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {profile.subdistrict || '-'}
                          </div>
                        )}
                      </div>

                      {/* รหัสไปรษณีย์ */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">รหัสไปรษณีย์</label>
                        {editMode ? (
                          <div className="relative">
                            <input
                              type="text"
                              name="zip_code"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={form.zip_code || ''}
                              readOnly
                              tabIndex={-1}
                              placeholder="รหัสไปรษณีย์จะแสดงอัตโนมัติ"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {profile.zip_code || '-'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default OwnerProfilePage;