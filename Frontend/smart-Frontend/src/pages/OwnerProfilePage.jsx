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

      const res = await fetch(`http://localhost:3001/owner/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
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
        setProfile(form);
        setEditMode(false);
        setError('');
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
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
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
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
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
                
                <form onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(profile)
                      .filter(([key]) => !['id', 'password', 'role_id'].includes(key))
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