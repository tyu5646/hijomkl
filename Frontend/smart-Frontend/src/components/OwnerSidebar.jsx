import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBuilding, FaUserCircle, FaSignOutAlt, FaStar, FaBed } from 'react-icons/fa';
import logo from '../assets/logo-H.jpg';

function OwnerSidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = '/login';
  };

  const menuItems = [
    {
      to: "/owner",
      icon: FaTachometerAlt,
      label: "หน้าหลัก",
      color: "green",
      description: "ภาพรวมและสถิติ"
    },
    {
      to: "/owner/dorms",
      icon: FaBuilding,
      label: "จัดการหอพัก",
      color: "blue",
      description: "เพิ่ม แก้ไข หอพัก"
    },
    {
      to: "/owner/rooms",
      icon: FaBed,
      label: "จัดการห้องพัก",
      color: "indigo",
      description: "จัดการห้องแต่ละห้อง"
    },
    {
      to: "/owner/profile",
      icon: FaUserCircle,
      label: "ข้อมูลส่วนตัว",
      color: "orange",
      description: "แก้ไขโปรไฟล์"
    },
    {
      to: "/owner/reviews",
      icon: FaStar,
      label: "จัดการรีวิว",
      color: "purple",
      description: "ตอบกลับและจัดการ"
    }
  ];

  const getColorClasses = (color, isActive) => {
    const colorMap = {
      green: isActive 
        ? 'text-green-700 bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
        : 'text-gray-700 hover:text-green-600 hover:bg-green-50',
      blue: isActive 
        ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' 
        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
      indigo: isActive 
        ? 'text-indigo-700 bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200' 
        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
      orange: isActive 
        ? 'text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' 
        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50',
      purple: isActive 
        ? 'text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200' 
        : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
    };
    return colorMap[color];
  };

  return (
    <aside className="w-72 bg-white shadow-xl flex flex-col min-h-screen border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-0.5 group-hover:scale-105 transition-transform duration-300 shadow-lg">
              <img 
                src={logo} 
                alt="Smart Dorm Logo" 
                className="w-full h-full rounded-xl object-cover" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Smart Dorm
            </span>
            <span className="text-sm text-gray-600 font-medium">Owner Dashboard</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1 p-4">
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-3">
            เมนูหลัก
          </h3>
        </div>
        
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-4 font-semibold px-4 py-3 rounded-xl transition-all duration-300 border border-transparent ${getColorClasses(item.color, isActive)} ${isActive ? 'shadow-lg transform scale-105' : 'hover:shadow-md hover:transform hover:scale-102'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'} transition-all duration-300`}>
                    <IconComponent className="text-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="text-xs opacity-75">{item.description}</span>
                  </div>
                  {isActive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              O
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">เจ้าของหอพัก</span>
              <span className="text-xs text-gray-500">ออนไลน์</span>
            </div>
            <div className="ml-auto">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 transform hover:scale-105"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
            <FaSignOutAlt className="text-lg group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <span>ออกจากระบบ</span>
          <div className="ml-auto">
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default OwnerSidebar;