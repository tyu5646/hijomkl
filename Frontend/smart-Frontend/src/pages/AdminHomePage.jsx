import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { 
  FaUniversity, 
  FaUsers, 
  FaCalendarAlt, 
  FaCheckCircle,
} from 'react-icons/fa';

function AdminHomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDorms: 0,
    pendingDorms: 0,
    approvedDorms: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ตรวจสอบสิทธิ์ก่อนโหลดข้อมูล
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const role = sessionStorage.getItem('role') || localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      console.error('Access denied - not admin:', { token: !!token, role });
      window.location.href = '/login';
      return;
    }
    
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // ตรวจสอบ token
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const role = sessionStorage.getItem('role') || localStorage.getItem('role');
      
      console.log('Admin token check:', { token: !!token, role });
      
      if (!token || role !== 'admin') {
        console.error('No admin token or wrong role:', { token: !!token, role });
        // รีไดเรกต์ไปหน้าล็อกอิน
        window.location.href = '/login';
        return;
      }

      // Fetch users data
      const usersResponse = await fetch('http://localhost:3001/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch dorms data
      const dormsResponse = await fetch('http://localhost:3001/admin/dorms?status=all', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', { 
        users: usersResponse.status, 
        dorms: dormsResponse.status 
      });

      if (usersResponse.status === 401 || dormsResponse.status === 401) {
        console.error('Unauthorized access - redirecting to login');
        // ลบ token ที่หมดอายุ
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return;
      }

      if (usersResponse.ok && dormsResponse.ok) {
        const usersData = await usersResponse.json();
        const dormsData = await dormsResponse.json();
        
        setStats({
          totalUsers: Array.isArray(usersData) ? usersData.length : 0,
          totalDorms: Array.isArray(dormsData) ? dormsData.length : 0,
          pendingDorms: Array.isArray(dormsData) ? dormsData.filter(d => d.status === 'pending').length : 0,
          approvedDorms: Array.isArray(dormsData) ? dormsData.filter(d => d.status === 'approved').length : 0
        });
      } else {
        console.error('API Error:', { 
          usersStatus: usersResponse.status,
          dormsStatus: dormsResponse.status
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'อนุมัติหอพัก', desc: 'ตรวจสอบและอนุมัติหอพักใหม่', icon: <FaUniversity className="text-2xl" />, route: '/admin/dorms', color: 'text-orange-600', bg: 'bg-orange-100 hover:bg-orange-200', badge: stats.pendingDorms },
    { title: 'จัดการผู้ใช้', desc: 'เพิ่ม แก้ไข ลบข้อมูลผู้ใช้', icon: <FaUsers className="text-2xl" />, route: '/admin/users', color: 'text-blue-600', bg: 'bg-blue-100 hover:bg-blue-200', badge: stats.totalUsers }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <AdminSidebar />
      
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ยินดีต้อนรับ, ผู้ดูแลระบบ</h1>
              <p className="text-gray-600 mt-1">จัดการระบบหอพักของคุณได้อย่างมีประสิทธิภาพ</p>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <FaCalendarAlt className="mr-2" />
            {new Date().toLocaleDateString('th-TH', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-2xl">
                  <FaCheckCircle className="text-orange-500" />
                </div>
                <span className="text-orange-500 text-sm font-medium">รออนุมัติ</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.pendingDorms}</h3>
              <p className="text-gray-600 text-sm">หอพักรออนุมัติ</p>
            </div>

            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-2xl">
                  <FaUniversity className="text-green-500" />
                </div>
                <span className="text-green-500 text-sm font-medium">อนุมัติแล้ว</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.approvedDorms}</h3>
              <p className="text-gray-600 text-sm">หอพักอนุมัติแล้ว</p>
            </div>

            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">
                  <FaUsers className="text-blue-500" />
                </div>
                <span className="text-blue-500 text-sm font-medium">ทั้งหมด</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalUsers}</h3>
              <p className="text-gray-600 text-sm">ผู้ใช้ในระบบ</p>
            </div>

            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-2xl">
                  <FaUniversity className="text-purple-500" />
                </div>
                <span className="text-purple-500 text-sm font-medium">รวม</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalDorms}</h3>
              <p className="text-gray-600 text-sm">หอพักทั้งหมด</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-2 h-6 bg-blue-500 rounded mr-3"></span>
              การดำเนินการด่วน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => navigate(action.route)}
                  className={`p-6 rounded-xl ${action.bg} cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border border-transparent hover:border-gray-200 relative`}
                >
                  {action.badge && action.badge > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                      {action.badge}
                    </div>
                  )}
                  <div className={`${action.color} mb-3`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default AdminHomePage;