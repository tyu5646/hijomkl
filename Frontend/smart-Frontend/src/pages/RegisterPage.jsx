import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const initialData = {
  firstName: '', lastName: '', age: '', dob: '', houseNo: '', moo: '', soi: '', road: '',
  subdistrict: '', district: '', province: '', email: '', phone: '', dormName: '', password: '',
  zip_code: ''
};

function RegisterPage() {
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState(initialData);
  const [error, setError] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [allAmphures, setAllAmphures] = useState([]);
  const [allTambons, setAllTambons] = useState([]);
  const [zipCode, setZipCode] = useState('');
  const navigate = useNavigate();

  // โหลดข้อมูลจาก raw.githubusercontent.com
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json')
      .then(res => res.json())
      .then(data => setProvinces(data));
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json')
      .then(res => res.json())
      .then(data => setAllAmphures(data));
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json')
      .then(res => res.json())
      .then(data => setAllTambons(data));
  }, []);

  // เมื่อเลือกจังหวัด ให้ filter อำเภอ
  useEffect(() => {
    if (form.province) {
      const amphures = allAmphures.filter(a => a.province_id === Number(form.province));
      setAmphures(amphures);
      setTambons([]);
      setForm(f => ({ ...f, district: '', subdistrict: '' }));
    } else {
      setAmphures([]);
      setTambons([]);
      setForm(f => ({ ...f, district: '', subdistrict: '' }));
    }
  }, [form.province, allAmphures]);

  // เมื่อเลือกอำเภอ ให้ filter ตำบล
  useEffect(() => {
    if (form.district) {
      const tambons = allTambons.filter(t => t.amphure_id === Number(form.district));
      setTambons(tambons);
      setForm(f => ({ ...f, subdistrict: '' }));
    } else {
      setTambons([]);
      setForm(f => ({ ...f, subdistrict: '' }));
    }
  }, [form.district, allTambons]);

  // เมื่อเลือกตำบล ให้ set zip_code
  useEffect(() => {
    if (form.subdistrict) {
      const tambon = tambons.find(t => t.id === Number(form.subdistrict));
      if (tambon) {
        setZipCode(tambon.zip_code);
        setForm(f => ({ ...f, zip_code: tambon.zip_code }));
      }
    } else {
      setZipCode('');
      setForm(f => ({ ...f, zip_code: '' }));
    }
  }, [form.subdistrict, tambons]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = e => {
    setRole(e.target.value);
    setForm(initialData);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...form, zip_code: zipCode })
      });
      const data = await res.json();
      if (data.success) {
        alert('สมัครสมาชิกสำเร็จ');
        navigate('/login');
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด');
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-60 h-60 bg-purple-300 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-cyan-300 opacity-10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-8 py-8 relative overflow-hidden">
            {/* Header Decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
            
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">สมัครสมาชิก</h2>
              <p className="text-blue-100">เริ่มต้นการเดินทางกับเรา</p>
            </div>
          </div>

          {/* Form Content */}
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">ประเภทผู้ใช้</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative cursor-pointer ${role === 'customer' ? 'ring-2 ring-blue-500' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={role === 'customer'}
                    onChange={handleRoleChange}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === 'customer' 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        role === 'customer' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">ลูกค้า</div>
                        <div className="text-sm text-gray-600">ค้นหาและจองหอพัก</div>
                      </div>
                    </div>
                  </div>
                </label>
                
                <label className={`relative cursor-pointer ${role === 'owner' ? 'ring-2 ring-purple-500' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    checked={role === 'owner'}
                    onChange={handleRoleChange}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === 'owner' 
                      ? 'border-purple-500 bg-purple-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        role === 'owner' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">ผู้ประกอบการ</div>
                        <div className="text-sm text-gray-600">ลงทะเบียนหอพัก</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Dorm Name for Owner */}
            {role === 'owner' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">ชื่อหอพัก</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="dormName"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                    placeholder="กรอกชื่อหอพักของคุณ"
                    value={form.dormName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                ข้อมูลส่วนตัว
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">ชื่อจริง</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      placeholder="กรอกชื่อจริง"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">นามสกุล</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="lastName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      placeholder="กรอกนามสกุล"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">อายุ</label>
                  <input
                    type="number"
                    name="age"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="กรอกอายุ"
                    value={form.age}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">วันเกิด</label>
                  <input
                    type="date"
                    name="dob"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    value={form.dob}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                ที่อยู่
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">บ้านเลขที่</label>
                  <input
                    type="text"
                    name="houseNo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="เลขที่บ้าน"
                    value={form.houseNo}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">หมู่</label>
                  <input
                    type="text"
                    name="moo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="หมู่ที่ (ถ้ามี)"
                    value={form.moo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">ซอย</label>
                  <input
                    type="text"
                    name="soi"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="ซอย (ถ้ามี)"
                    value={form.soi}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">ถนน</label>
                  <input
                    type="text"
                    name="road"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="ถนน (ถ้ามี)"
                    value={form.road}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">จังหวัด</label>
                  <select
                    name="province"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    value={form.province}
                    onChange={handleChange}
                    required
                  >
                    <option value="">เลือกจังหวัด</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name_th}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">อำเภอ</label>
                  <select
                    name="district"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100"
                    value={form.district}
                    onChange={handleChange}
                    required
                    disabled={!form.province}
                  >
                    <option value="">เลือกอำเภอ</option>
                    {amphures.map((a) => (
                      <option key={a.id} value={a.id}>{a.name_th}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">ตำบล</label>
                  <select
                    name="subdistrict"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100"
                    value={form.subdistrict}
                    onChange={handleChange}
                    required
                    disabled={!form.district}
                  >
                    <option value="">เลือกตำบล</option>
                    {tambons.map((t) => (
                      <option key={t.id} value={t.id}>{t.name_th}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">รหัสไปรษณีย์</label>
                <input
                  type="text"
                  name="zip_code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  value={zipCode}
                  readOnly
                  tabIndex={-1}
                  placeholder="รหัสไปรษณีย์จะแสดงอัตโนมัติ"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                ข้อมูลติดต่อ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">อีเมล</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      placeholder="อีเมลของคุณ"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">เบอร์โทร</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="phone"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      placeholder="เบอร์โทรศัพท์"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    placeholder="สร้างรหัสผ่าน"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                สมัครสมาชิก
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-2">มีบัญชีอยู่แล้ว?</p>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                เข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;