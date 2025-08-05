import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { 
  FaUniversity, 
  FaMapMarkerAlt, 
  FaUserCircle, 
  FaPhoneAlt, 
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaStar,
  FaMoneyBillWave,
  FaFilter,
  FaSearch,
  FaHome,
  FaShieldAlt,
  FaClipboardCheck
} from 'react-icons/fa';

function AdminDormApprovalPage() {
  const [pendingDorms, setPendingDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');

  const fetchPendingDorms = useCallback(() => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      console.error('No admin token found');
      setPendingDorms([]);
      setLoading(false);
      return;
    }
    
    fetch(`http://localhost:3001/admin/dorms?status=${filterStatus}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Received data:', data);
        if (Array.isArray(data)) {
          setPendingDorms(data);
        } else {
          console.error('Data is not an array:', data);
          setPendingDorms([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dorms:', err);
        setPendingDorms([]);
        setLoading(false);
      });
  }, [filterStatus]);

  useEffect(() => {
    fetchPendingDorms();
  }, [filterStatus, fetchPendingDorms]);

  const handleApprove = async (dormId) => {
    if (window.confirm('คุณต้องการอนุมัติหอพักนี้หรือไม่?')) {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          alert('กรุณาเข้าสู่ระบบใหม่');
          return;
        }
        
        const response = await fetch(`http://localhost:3001/admin/dorms/${dormId}/approve`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          alert('อนุมัติหอพักเรียบร้อยแล้ว');
          fetchPendingDorms();
        } else {
          throw new Error('Failed to approve dorm');
        }
      } catch (error) {
        console.error('Error approving dorm:', error);
        alert('เกิดข้อผิดพลาดในการอนุมัติหอพัก');
      }
    }
  };

  const handleReject = async (dormId) => {
    if (window.confirm('คุณต้องการปฏิเสธหอพักนี้หรือไม่?')) {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          alert('กรุณาเข้าสู่ระบบใหม่');
          return;
        }
        
        const response = await fetch(`http://localhost:3001/admin/dorms/${dormId}/reject`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          alert('ปฏิเสธหอพักเรียบร้อยแล้ว');
          fetchPendingDorms();
        } else {
          throw new Error('Failed to reject dorm');
        }
      } catch (error) {
        console.error('Error rejecting dorm:', error);
        alert('เกิดข้อผิดพลาดในการปฏิเสธหอพัก');
      }
    }
  };

  const handleViewDetails = (dorm) => {
    setSelectedDorm(dorm);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">รออนุมัติ</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">อนุมัติแล้ว</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">ไม่อนุมัติ</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">ไม่ทราบสถานะ</span>;
    }
  };

  const formatPrice = (price) => {
    return price ? new Intl.NumberFormat('th-TH').format(price) + ' บาท' : '-';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
      <AdminSidebar />
      <main className="flex-1 px-8 py-6 overflow-y-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">อนุมัติหอพัก</h1>
              <p className="text-gray-600">ตรวจสอบและอนุมัติหอพักที่ผู้ประกอบการส่งมาใหม่</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
              >
                <option value="pending">รออนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ไม่อนุมัติ</option>
                <option value="all">ทั้งหมด</option>
              </select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">รออนุมัติ</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingDorms.filter(d => d.status === 'pending').length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <FaUniversity className="text-2xl text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">อนุมัติแล้ว</p>
                  <p className="text-3xl font-bold text-green-600">{pendingDorms.filter(d => d.status === 'approved').length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">ไม่อนุมัติ</p>
                  <p className="text-3xl font-bold text-red-600">{pendingDorms.filter(d => d.status === 'rejected').length}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-xl">
                  <FaTimesCircle className="text-2xl text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">หอพักทั้งหมด</p>
                  <p className="text-3xl font-bold text-blue-600">{pendingDorms.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FaUniversity className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dorms List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
            </div>
          ) : pendingDorms.length === 0 ? (
            <div className="text-center py-12">
              <FaUniversity className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                ไม่มีหอพัก{filterStatus === 'pending' ? 'ที่รออนุมัติ' : 'ในสถานะนี้'}
              </h3>
              <p className="text-gray-400">
                {filterStatus === 'pending' ? 'ยังไม่มีหอพักใหม่ที่ส่งมาขออนุมัติ' : 'ลองเปลี่ยนตัวกรองเพื่อดูข้อมูลอื่น'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หอพัก</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เจ้าของ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคา/วัน</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingDorms.map((dorm, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            {dorm.images && dorm.images.length > 0 ? (
                              <img 
                                className="h-16 w-16 rounded-xl object-cover" 
                                src={`http://localhost:3001${dorm.images.split(',')[0]}`}
                                alt={dorm.name}
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <FaUniversity className="text-white text-xl" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{dorm.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <FaMapMarkerAlt className="text-xs" />
                              {dorm.address}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {dorm.rooms ? `${dorm.rooms} ห้อง` : 'ไม่ระบุจำนวนห้อง'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{dorm.ownerName || 'ไม่ระบุ'}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FaPhoneAlt className="text-xs" />
                          {dorm.ownerPhone || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                          <FaMoneyBillWave className="text-green-500" />
                          {formatPrice(dorm.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(dorm.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(dorm)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <FaEye className="mr-1" />
                            ดูรายละเอียด
                          </button>
                          {dorm.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(dorm.id)}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                              >
                                <FaCheckCircle className="mr-1" />
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleReject(dorm.id)}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                <FaTimesCircle className="mr-1" />
                                ปฏิเสธ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedDorm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-800">รายละเอียดหอพัก</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">รูปภาพ</h4>
                  {selectedDorm.images ? (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDorm.images.split(',').slice(0, 4).map((image, idx) => (
                        <img
                          key={idx}
                          src={`http://localhost:3001${image}`}
                          alt={`รูปภาพหอพัก ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <FaUniversity className="mx-auto text-4xl text-gray-400 mb-2" />
                      <p className="text-gray-500">ไม่มีรูปภาพ</p>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลทั่วไป</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อหอพัก</label>
                      <p className="text-gray-900 font-semibold">{selectedDorm.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                      <p className="text-gray-900">{selectedDorm.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ราคาต่อวัน</label>
                      <p className="text-gray-900 font-semibold">{formatPrice(selectedDorm.price)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">จำนวนห้อง</label>
                      <p className="text-gray-900">{selectedDorm.rooms || 'ไม่ระบุ'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedDorm.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">คำอธิบาย</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedDorm.description || 'ไม่มีคำอธิบาย'}
                </p>
              </div>

              {/* Action Buttons */}
              {selectedDorm.status === 'pending' && (
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                  <button
                    onClick={() => {
                      handleReject(selectedDorm.id);
                      setShowDetailModal(false);
                    }}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    ปฏิเสธ
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedDorm.id);
                      setShowDetailModal(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-colors"
                  >
                    อนุมัติหอพัก
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDormApprovalPage;
