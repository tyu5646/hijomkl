import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import Logo from '../assets/logo.jpg';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // เพิ่ม state loading
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // ดีเลย์ 5 วินาที
      await new Promise(resolve => setTimeout(resolve, 5000));
      setLoading(false);
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.role) {
        sessionStorage.setItem('token', data.token); // เปลี่ยนเป็น sessionStorage
        sessionStorage.setItem('role', data.role); // เปลี่ยนเป็น sessionStorage
        if (data.role === 'admin') {
          navigate('/admin');
        } else if (data.role === 'owner') {
          navigate('/owner');
        } else {
          navigate('/');
        }
      } else {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setLoading(false);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-r from-blue-100 via-white to-white">
      {/* โลโก้ทางซ้าย */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-white/80">
        <img 
          src={Logo} 
          alt="Smart Dormitory Logo" 
          className="w-[520px] max-w-full h-[520px] object-cover rounded-full shadow-lg border-4 border-blue-200 animate-pulse-inout hover:scale-110 hover:shadow-2xl transition-transform duration-700"
        />
      </div>
      {/* ฟอร์มล็อกอิน */}
      <div className="flex-1 flex flex-col justify-center items-center w-full md:w-1/2 md:justify-center md:items-start md:pl-16">
        <form
          onSubmit={handleLogin}
          className="bg-white/90 p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-5 border border-blue-100 relative"
        >
          <h2 className="text-3xl font-extrabold text-blue-700 mb-2 text-center drop-shadow">
            เข้าสู่ระบบ
          </h2>
          <p className="text-center text-gray-500 mb-2">
            กรุณาเข้าสู่ระบบเพื่อใช้งานระบบหอพัก
          </p>
          {error && <div className="text-red-500 text-center">{error}</div>}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
              <FaUser />
            </span>
            <input
              className="pl-10 border border-blue-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              type="email"
              placeholder="อีเมล"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
              <FaLock />
            </span>
            <input
              className="pl-10 border border-blue-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={`bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-2 rounded-lg font-bold shadow mt-2 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
          <button
            type="button"
            className="mt-2 text-blue-700 underline hover:text-blue-900"
            onClick={() => navigate('/register')}
          >
            สมัครสมาชิก
          </button>
          {/* ไฮเทค loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 rounded-2xl">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <span className="absolute w-full h-full rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></span>
                <span className="absolute w-10 h-10 rounded-full border-2 border-blue-300 border-b-transparent animate-spin-slow"></span>
                <span className="absolute w-6 h-6 rounded-full border-2 border-blue-200 border-l-transparent animate-spin-reverse"></span>
                <span className="absolute w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              </div>
              <span className="mt-4 text-blue-700 font-bold tracking-widest animate-pulse">LOADING...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

/* tailwind.config.js (เพิ่ม keyframes pulse-inout ถ้ายังไม่มี)
theme: {
  extend: {
    animation: {
      'pulse-inout': 'pulse-inout 2.2s ease-in-out infinite',
    },
    keyframes: {
      'pulse-inout': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.06)' },
      },
    },
  },
},
*/