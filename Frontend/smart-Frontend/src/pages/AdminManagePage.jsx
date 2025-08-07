import React, { useState, useEffect } from 'react';

const AdminManagePage = () => {
  const [admins, setAdmins] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    dob: '',
    houseNo: '',
    moo: '',
    soi: '',
    road: '',
    subdistrict: '',
    district: '',
    province: '',
    email: '',
    password: '',
    phone: '',
    role_id: 'Admin',
    zip_code: ''
  });

  // Fetch admins
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3001/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // เพิ่มแอดมินใหม่
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3001/admin/admins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('เพิ่มแอดมินเรียบร้อยแล้ว');
        setShowAddModal(false);
        resetForm();
        fetchAdmins();
      } else {
        const error = await response.json();
        alert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถเพิ่มแอดมินได้'}`);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // แก้ไขแอดมิน
  const handleEditAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/admin/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('แก้ไขข้อมูลแอดมินเรียบร้อยแล้ว');
        setShowEditModal(false);
        setEditingAdmin(null);
        resetForm();
        fetchAdmins();
      } else {
        const error = await response.json();
        alert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถแก้ไขแอดมินได้'}`);
      }
    } catch (error) {
      console.error('Error editing admin:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // ลบแอดมิน
  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('คุณต้องการลบแอดมินนี้หรือไม่?')) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/admin/admins/${adminId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          alert('ลบแอดมินเรียบร้อยแล้ว');
          fetchAdmins();
        } else {
          const error = await response.json();
          alert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถลบแอดมินได้'}`);
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    }
  };

  // เปิด modal แก้ไข
  const openEditModal = (admin) => {
    console.log('🔧 เริ่มเปิด modal แก้ไข, admin:', admin);
    console.log('🔧 showEditModal ก่อน:', showEditModal);
    
    setEditingAdmin(admin);
    setFormData({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      age: admin.age || '',
      dob: admin.dob ? admin.dob.split('T')[0] : '',
      houseNo: admin.houseNo || '',
      moo: admin.moo || '',
      soi: admin.soi || '',
      road: admin.road || '',
      subdistrict: admin.subdistrict || '',
      district: admin.district || '',
      province: admin.province || '',
      email: admin.email || '',
      password: '',
      phone: admin.phone || '',
      role_id: admin.role_name || 'Admin',
      zip_code: admin.zip_code || ''
    });
    setShowEditModal(true);
    
    console.log('🔧 เซ็ต showEditModal = true แล้ว');
  };

  // รีเซ็ตฟอร์ม
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      age: '',
      dob: '',
      houseNo: '',
      moo: '',
      soi: '',
      road: '',
      subdistrict: '',
      district: '',
      province: '',
      email: '',
      password: '',
      phone: '',
      role_id: 'Admin',
      zip_code: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">จัดการแอดมิน</h1>
            <div className="flex gap-2">
              {/* ปุ่มทดสอบ */}
              <button
                onClick={() => {
                  console.log('🔧 ทดสอบเปิด modal โดยตรง');
                  setShowEditModal(true);
                  setEditingAdmin({ id: 999, firstName: 'Test', lastName: 'User', email: 'test@test.com' });
                }}
                className="bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
              >
                Test Modal
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + เพิ่มแอดมินใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Admin List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เบอร์โทร</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จังหวัด</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บทบาท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {admin.firstName} {admin.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.province}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {admin.role_name || 'ไม่ระบุ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('กดปุ่มแก้ไข:', admin);
                          openEditModal(admin);
                        }}
                        className="bg-indigo-500 text-white px-3 py-1 rounded mr-2 hover:bg-indigo-600 transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteAdmin(admin.id);
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">เพิ่มแอดมินใหม่</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ข้อมูลส่วนตัว */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อายุ</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันเกิด</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* ที่อยู่ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">บ้านเลขที่</label>
                      <input
                        type="text"
                        name="houseNo"
                        value={formData.houseNo}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">หมู่</label>
                      <input
                        type="text"
                        name="moo"
                        value={formData.moo}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ซอย</label>
                      <input
                        type="text"
                        name="soi"
                        value={formData.soi}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ถนน</label>
                      <input
                        type="text"
                        name="road"
                        value={formData.road}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล/แขวง</label>
                      <input
                        type="text"
                        name="subdistrict"
                        value={formData.subdistrict}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ/เขต</label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* ข้อมูลระบบ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท *</label>
                      <input
                        type="text"
                        name="role_id"
                        value={formData.role_id}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="เช่น Admin, Super Admin, Moderator"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'กำลังเพิ่ม...' : 'เพิ่มแอดมิน'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    แก้ไขข้อมูลแอดมิน 
                    <span className="text-sm text-green-600 ml-2">
                      (Modal เปิดแล้ว! showEditModal: {showEditModal.toString()})
                    </span>
                  </h2>
                  <button
                    onClick={() => {
                      console.log('🔧 กดปิด modal');
                      setShowEditModal(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ฟอร์มเดียวกับ Add Modal */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    {/* ... ฟิลด์อื่นๆ เหมือน Add Modal ... */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยน"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท *</label>
                      <input
                        type="text"
                        name="role_id"
                        value={formData.role_id}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="เช่น Admin, Super Admin, Moderator"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagePage;
