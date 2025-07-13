import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaCheckCircle, 
  FaSignOutAlt, 
  FaUsers,
  FaChartLine
} from 'react-icons/fa';
import logo from '../assets/logo-H.jpg'; // Import รูปโลโก้

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <aside className="w-72 bg-gradient-to-b from-white to-blue-50 shadow-xl flex flex-col min-h-screen border-r border-gray-100">
      {/* Header Logo */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logo} alt="Smart Dorm Logo" className="h-10 w-10 rounded-lg shadow-md" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Smart Dorm
            </span>
            <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            หลัก
          </p>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-105'
              }`
            }
          >
            <div className={`p-2 rounded-lg transition-colors ${
              ({ isActive }) => isActive ? 'bg-white bg-opacity-20' : 'bg-blue-100 group-hover:bg-blue-200'
            }`}>
              <FaTachometerAlt className="text-lg" />
            </div>
            <div className="flex-1">
              <span className="font-semibold">แดชบอร์ด</span>
              <p className="text-xs opacity-75">ภาพรวมระบบ</p>
            </div>
          </NavLink>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            จัดการข้อมูล
          </p>
          <NavLink
            to="/admin/dorms"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-105'
              }`
            }
          >
            <div className={`p-2 rounded-lg transition-colors ${
              ({ isActive }) => isActive ? 'bg-white bg-opacity-20' : 'bg-orange-100 group-hover:bg-orange-200'
            }`}>
              <FaCheckCircle className="text-lg" />
            </div>
            <div className="flex-1">
              <span className="font-semibold">อนุมัติหอพัก</span>
              <p className="text-xs opacity-75">ตรวจสอบและอนุมัติ</p>
            </div>
            
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-105'
              }`
            }
          >
            <div className={`p-2 rounded-lg transition-colors ${
              ({ isActive }) => isActive ? 'bg-white bg-opacity-20' : 'bg-green-100 group-hover:bg-green-200'
            }`}>
              <FaUsers className="text-lg" />
            </div>
            <div className="flex-1">
              <span className="font-semibold">จัดการผู้ใช้</span>
              <p className="text-xs opacity-75">CRUD ผู้ใช้งาน</p>
            </div>
          </NavLink>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            รายงาน
          </p>
          <button
            className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105"
            onClick={() => navigate('/admin/statistics')}
          >
            <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <FaChartLine className="text-lg text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold">รายงาน & สถิติ</span>
              <p className="text-xs opacity-75">วิเคราะห์ข้อมูล</p>
            </div>
          </button>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <FaSignOutAlt />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;