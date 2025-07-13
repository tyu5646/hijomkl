import React from 'react';
import LogoH from '../assets/logo-H.jpg';

function Header() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('role');
    window.location.href = '/login';
  };
  
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between py-4 px-4 md:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-0.5 group-hover:scale-105 transition-transform duration-300">
              <img 
                src={LogoH} 
                alt="Smart Dorm Logo" 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              SMART Dormitory
            </span>
            <span className="text-xs text-gray-500 font-medium">ระบบจัดการหอพักอัจฉริยะ</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 mt-4 md:mt-0 items-center">
          <a 
            href="/" 
            className="group relative px-4 py-2 text-gray-700 font-semibold hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-blue-50"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              หน้าหลัก
            </span>
            <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
          </a>
          
          <a 
            href="/profile" 
            className="group relative px-4 py-2 text-gray-700 font-semibold hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-blue-50"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              ข้อมูลส่วนตัว
            </span>
            <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
          </a>

          {/* Logout Button */}
          <div className="ml-4 pl-4 border-l border-gray-200">
            <button
              onClick={handleLogout}
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;