import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaPhone, FaEdit, FaTrashAlt, FaSearch, FaUserPlus,
  FaCalendarAlt, FaMapMarkerAlt, FaIdCard, FaKey, FaTimes, FaCheck,
  FaUserShield, FaUserTie, FaUserFriends, FaSave
} from 'react-icons/fa';
import AdminSidebar from '../components/AdminSidebar';

const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    role: 'customer',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    dob: '',
    houseNo: '',
    moo: '',
    soi: '',
    road: '',
    subdistrict: '',
    district: '',
    province: '',
    dormName: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/admin/users', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert('เพิ่มผู้ใช้เรียบร้อยแล้ว');
        setShowAddModal(false);
        resetForm();
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...form };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`http://localhost:3001/admin/users/${selectedUser.id}?role=${selectedUser.role}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('แก้ไขข้อมูลเรียบร้อยแล้ว');
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      }
    } catch (error) {
      console.error('Error editing user:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleDeleteUser = async (userId, userName, userRole) => {
    if (window.confirm(`ต้องการลบผู้ใช้ "${userName}" ใช่หรือไม่?`)) {
      try {
        const response = await fetch(`http://localhost:3001/admin/users/${userId}?role=${userRole}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          alert('ลบผู้ใช้เรียบร้อยแล้ว');
          fetchUsers();
        } else {
          alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setForm({
      role: user.role || 'customer',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      age: user.age || '',
      dob: user.dob || '',
      houseNo: user.houseNo || '',
      moo: user.moo || '',
      soi: user.soi || '',
      road: user.road || '',
      subdistrict: user.subdistrict || '',
      district: user.district || '',
      province: user.province || '',
      dormName: user.dormName || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({
      role: 'customer',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      age: '',
      dob: '',
      houseNo: '',
      moo: '',
      soi: '',
      road: '',
      subdistrict: '',
      district: '',
      province: '',
      dormName: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">ผู้ดูแลระบบ</span>;
      case 'owner':
        return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">เจ้าของหอพัก</span>;
      case 'customer':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">ลูกค้า</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">ไม่ระบุ</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
      <AdminSidebar />
      <main className="flex-1 px-8 py-6 overflow-y-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">จัดการผู้ใช้งาน</h1>
              <p className="text-gray-600">จัดการข้อมูลผู้ใช้ทั้งหมดในระบบอย่างมีประสิทธิภาพ</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
            >
              <FaUserPlus className="text-lg" />
              เพิ่มผู้ใช้ใหม่
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้ใช้ด้วยชื่อ, อีเมล, หรือเบอร์โทร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="admin">ผู้ดูแลระบบ</option>
                <option value="owner">เจ้าของหอพัก</option>
                <option value="customer">ลูกค้า</option>
              </select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">ผู้ใช้ทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-800">{users.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FaUser className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">ผู้ดูแลระบบ</p>
                  <p className="text-3xl font-bold text-gray-800">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-xl">
                  <FaUser className="text-2xl text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">เจ้าของหอพัก</p>
                  <p className="text-3xl font-bold text-gray-800">{users.filter(u => u.role === 'owner').length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <FaUser className="text-2xl text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">ลูกค้า</p>
                  <p className="text-3xl font-bold text-gray-800">{users.filter(u => u.role === 'customer').length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <FaUser className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ติดต่อ</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                              <FaUser className="text-white text-lg" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.role === 'owner' && user.dormName && (
                              <div className="text-xs text-orange-600 mt-1 font-medium">{user.dormName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center gap-2">
                          <FaPhone className="text-gray-400" />
                          {user.phone || '-'}
                        </div>
                        <div className="text-sm text-gray-500">อายุ {user.age || '-'} ปี</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                          >
                            <FaEdit className="mr-1" />
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`, user.role)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                          >
                            <FaTrashAlt className="mr-1" />
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-12">
                  <FaUser className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">ไม่พบข้อมูลผู้ใช้</h3>
                  <p className="text-gray-400">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มผู้ใช้ใหม่</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <FaUserPlus className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">เพิ่มผู้ใช้ใหม่</h3>
                      <p className="text-green-100 mt-1">สร้างบัญชีผู้ใช้ใหม่ในระบบ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[calc(90vh-140px)] overflow-y-auto">
                <form onSubmit={handleAddUser} className="space-y-8">
                  {/* Account Information Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FaUserShield className="text-blue-600 text-lg" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800">ข้อมูลบัญชี</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaUserTie className="text-gray-500" />
                          <span>สถานะผู้ใช้</span>
                        </label>
                        <select
                          name="role"
                          value={form.role}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        >
                          <option value="customer">👤 ลูกค้า</option>
                          <option value="owner">🏢 เจ้าของหอพัก</option>
                          <option value="admin">👑 ผู้ดูแลระบบ</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaEnvelope className="text-gray-500" />
                          <span>อีเมล</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleInputChange}
                          placeholder="example@email.com"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <FaKey className="text-gray-500" />
                        <span>รหัสผ่าน</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <FaIdCard className="text-purple-600 text-lg" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800">ข้อมูลส่วนตัว</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaUser className="text-gray-500" />
                          <span>ชื่อ</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleInputChange}
                          placeholder="ชื่อจริง"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaUser className="text-gray-500" />
                          <span>นามสกุล</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleInputChange}
                          placeholder="นามสกุล"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaPhone className="text-gray-500" />
                          <span>เบอร์โทรศัพท์</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleInputChange}
                          placeholder="0XX-XXX-XXXX"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaCalendarAlt className="text-gray-500" />
                          <span>อายุ</span>
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={form.age}
                          onChange={handleInputChange}
                          min="1"
                          max="120"
                          placeholder="25"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Owner-specific Information */}
                  {form.role === 'owner' && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <FaMapMarkerAlt className="text-orange-600 text-lg" />
                        </div>
                        <h4 className="text-xl font-semibold text-gray-800">ข้อมูลหอพัก</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaMapMarkerAlt className="text-gray-500" />
                          <span>ชื่อหอพัก</span>
                        </label>
                        <input
                          type="text"
                          name="dormName"
                          value={form.dormName}
                          onChange={handleInputChange}
                          placeholder="ชื่อหอพักที่จะดูแล"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium flex items-center space-x-2"
                    >
                      <FaTimes className="text-lg" />
                      <span>ยกเลิก</span>
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <FaCheck className="text-lg" />
                      <span>สร้างผู้ใช้</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <FaEdit className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">แก้ไขข้อมูลผู้ใช้</h3>
                      <p className="text-blue-100 mt-1">
                        แก้ไขข้อมูล {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      resetForm();
                    }}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[calc(90vh-140px)] overflow-y-auto">
                <form onSubmit={handleEditUser} className="space-y-8">
                  {/* Account Information Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FaUserShield className="text-blue-600 text-lg" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800">ข้อมูลบัญชี</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaUserTie className="text-gray-500" />
                          <span>สถานะผู้ใช้</span>
                        </label>
                        <select
                          name="role"
                          value={form.role}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        >
                          <option value="customer">👤 ลูกค้า</option>
                          <option value="owner">🏢 เจ้าของหอพัก</option>
                          <option value="admin">👑 ผู้ดูแลระบบ</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaEnvelope className="text-gray-500" />
                          <span>อีเมล</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <FaKey className="text-gray-500" />
                        <span>รหัสผ่านใหม่</span>
                        <span className="text-xs text-gray-500">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FaIdCard className="text-green-600 text-lg" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800">ข้อมูลส่วนตัว</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaUser className="text-gray-500" />
                          <span>ชื่อ</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaUser className="text-gray-500" />
                          <span>นามสกุล</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaPhone className="text-gray-500" />
                          <span>เบอร์โทรศัพท์</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleInputChange}
                          placeholder="0XX-XXX-XXXX"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaCalendarAlt className="text-gray-500" />
                          <span>อายุ</span>
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={form.age}
                          onChange={handleInputChange}
                          min="1"
                          max="120"
                          placeholder="25"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Owner-specific Information */}
                  {form.role === 'owner' && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <FaMapMarkerAlt className="text-orange-600 text-lg" />
                        </div>
                        <h4 className="text-xl font-semibold text-gray-800">ข้อมูลหอพัก</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <FaMapMarkerAlt className="text-gray-500" />
                          <span>ชื่อหอพัก</span>
                        </label>
                        <input
                          type="text"
                          name="dormName"
                          value={form.dormName}
                          onChange={handleInputChange}
                          placeholder="ชื่อหอพักที่ดูแล"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                        resetForm();
                      }}
                      className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium flex items-center space-x-2"
                    >
                      <FaTimes className="text-lg" />
                      <span>ยกเลิก</span>
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <FaSave className="text-lg" />
                      <span>บันทึกการเปลี่ยนแปลง</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUserManager;
