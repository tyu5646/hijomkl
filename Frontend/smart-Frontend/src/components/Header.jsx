import React, { useState } from 'react';
import LogoH from '../assets/logo-H.jpg';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('role');
    window.location.href = '/login';
  };
  
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 p-0.5 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <img 
                  src={LogoH} 
                  alt="Smart Dorm Logo" 
                  className="w-full h-full rounded-xl object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-500">
                SMART Dormitory
              </span>
              <span className="text-xs text-gray-500 font-medium tracking-wide">
                ระบบจัดการหอพักอัจฉริยะ
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <a 
              href="/" 
              className="group px-4 py-2 rounded-xl text-gray-700 font-medium hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 relative overflow-hidden"
            >
              <span className="relative z-10">หน้าหลัก</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </a>
            
            <a 
              href="/profile" 
              className="group px-4 py-2 rounded-xl text-gray-700 font-medium hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 relative overflow-hidden"
            >
              <span className="relative z-10">ข้อมูลส่วนตัว</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </a>

            <button
              onClick={handleLogout}
              className="group px-4 py-2 rounded-xl text-gray-700 font-medium hover:text-red-600 hover:bg-red-50 transition-all duration-200 relative overflow-hidden ml-2"
            >
              <span className="relative z-10">ออกจากระบบ</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a 
                href="/" 
                className="block px-3 py-2 rounded-lg text-gray-700 font-medium hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                หน้าหลัก
              </a>
              
              <a 
                href="/profile" 
                className="block px-3 py-2 rounded-lg text-gray-700 font-medium hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                ข้อมูลส่วนตัว
              </a>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-gray-700 font-medium hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;