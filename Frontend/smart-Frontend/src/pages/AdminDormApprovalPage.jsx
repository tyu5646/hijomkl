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
  const [imageModal, setImageModal] = useState({ show: false, images: [], currentIndex: 0, zoom: 1 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // เพิ่ม state สำหรับ carousel

  const fetchPendingDorms = useCallback(() => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    
    console.log('🔍 Fetching dorms with:', { 
      token: token ? 'Present' : 'Missing', 
      filterStatus,
      url: `http://localhost:3001/admin/dorms?status=${filterStatus}`
    });
    
    if (!token) {
      console.error('❌ No admin token found');
      // สำหรับการทดสอบ ให้ใช้ token dummy
      console.log('🔧 Using dummy token for testing');
      sessionStorage.setItem('token', 'dummy-admin-token');
    }
    
    fetch(`http://localhost:3001/admin/dorms?status=${filterStatus}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log('📡 Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('📥 Received data:', data);
        if (Array.isArray(data)) {
          // เพิ่มการ debug ข้อมูลรูปภาพ
          data.forEach((dorm, index) => {
            console.log(`🏠 Dorm ${index + 1} (${dorm.name}):`, {
              id: dorm.id,
              status: dorm.status,
              images: dorm.images,
              imagesType: typeof dorm.images,
              imagesLength: Array.isArray(dorm.images) ? dorm.images.length : (dorm.images ? dorm.images.split(',').length : 0),
              owner: dorm.owner_name || dorm.ownerName
            });
          });
          setPendingDorms(data);
          console.log('✅ Dorms data set successfully');
        } else {
          console.error('❌ Data is not an array:', data);
          setPendingDorms([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching dorms:', err);
        console.log('🔧 Trying to connect to backend...');
        
        // ลองเชื่อมต่อกับ health check endpoint
        fetch('http://localhost:3001/health')
          .then(res => res.json())
          .then(health => {
            console.log('✅ Backend health check:', health);
          })
          .catch(healthErr => {
            console.error('❌ Backend not responding:', healthErr);
            alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่ที่ http://localhost:3001');
          });
        
        setPendingDorms([]);
        setLoading(false);
      });
  }, [filterStatus]);

  useEffect(() => {
    fetchPendingDorms();
  }, [filterStatus, fetchPendingDorms]);

  // Keyboard event handler for image modal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!imageModal.show) return;
      
      switch (e.key) {
        case 'Escape':
          closeImageModal();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
        case '_':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        default:
          break;
      }
    };

    if (imageModal.show) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [imageModal.show, imageModal.currentIndex, imageModal.images.length]);

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
    const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ (ไม่บังคับ):');
    if (reason === null) return; // ผู้ใช้กด Cancel
    
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
          },
          body: JSON.stringify({ reason: reason || '' })
        });
        
        if (response.ok) {
          alert('ปฏิเสธหอพักเรียบร้อยแล้ว');
          fetchPendingDorms();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reject dorm');
        }
      } catch (error) {
        console.error('Error rejecting dorm:', error);
        alert(`เกิดข้อผิดพลาดในการปฏิเสธหอพัก: ${error.message}`);
      }
    }
  };

  const handleViewDetails = (dorm) => {
    console.log('📋 Selected dorm details:', dorm);
    console.log('📸 Images data:', dorm.images);
    console.log('📸 Images type:', typeof dorm.images);
    setSelectedDorm(dorm);
    setCurrentImageIndex(0); // รีเซ็ตให้กลับไปรูปแรก
    setShowDetailModal(true);
  };

  const openImageModal = (images, startIndex = 0) => {
    const imageArray = Array.isArray(images) ? images : images.split(',').filter(img => img.trim());
    setImageModal({
      show: true,
      images: imageArray,
      currentIndex: startIndex,
      zoom: 1
    });
  };

  const closeImageModal = () => {
    setImageModal({ show: false, images: [], currentIndex: 0, zoom: 1 });
  };

  const nextImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
      zoom: 1
    }));
  };

  const prevImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1,
      zoom: 1
    }));
  };

  const zoomIn = () => {
    setImageModal(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.5, 3)
    }));
  };

  const zoomOut = () => {
    setImageModal(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.5, 0.5)
    }));
  };

  const resetZoom = () => {
    setImageModal(prev => ({
      ...prev,
      zoom: 1
    }));
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
                          <div className="flex-shrink-0 h-16 w-16 relative">
                            {dorm.images && dorm.images.length > 0 ? (
                              <>
                                <img 
                                  className="h-16 w-16 rounded-xl object-cover border border-gray-200 shadow-sm block" 
                                  src={`http://localhost:3001${
                                    Array.isArray(dorm.images) 
                                      ? dorm.images[0] 
                                      : dorm.images.split(',')[0]
                                  }`}
                                  alt={dorm.name}
                                  onError={(e) => {
                                    console.log('❌ Table image failed to load:', e.target.src);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                  onLoad={() => {
                                    console.log('✅ Table image loaded successfully:', dorm.name);
                                  }}
                                />
                                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center" style={{ display: 'none' }}>
                                  <FaUniversity className="text-white text-xl" />
                                </div>
                              </>
                            ) : (
                              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <FaUniversity className="text-white text-xl" />
                              </div>
                            )}
                            
                            {/* Badge แสดงจำนวนรูป */}
                            {dorm.images && (Array.isArray(dorm.images) ? dorm.images : dorm.images.split(',')).length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {Array.isArray(dorm.images) ? dorm.images.length : dorm.images.split(',').length}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{dorm.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <FaMapMarkerAlt className="text-xs" />
                              {dorm.address_detail || dorm.address}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Images */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaUniversity className="text-blue-500" />
                    รูปภาพหอพัก
                    <span className="text-sm font-normal text-gray-500">
                      {(() => {
                        const hasImages = selectedDorm.images && 
                                         selectedDorm.images !== '' && 
                                         selectedDorm.images !== 'null' && 
                                         selectedDorm.images !== null &&
                                         selectedDorm.images !== undefined;
                        
                        const imageArray = hasImages ? 
                          (Array.isArray(selectedDorm.images) 
                            ? selectedDorm.images.filter(img => img && img.trim() !== '')
                            : selectedDorm.images.split(',').filter(img => img && img.trim() !== '')
                          ) : [];
                        
                        return `(${imageArray.length} รูป)`;
                      })()}
                    </span>
                  </h4>
                  {(() => {
                    // ตรวจสอบรูปภาพอย่างละเอียด
                    console.log('🔍 Raw images data:', selectedDorm.images);
                    console.log('🔍 Images type:', typeof selectedDorm.images);
                    
                    const hasImages = selectedDorm.images && 
                                     selectedDorm.images !== '' && 
                                     selectedDorm.images !== 'null' && 
                                     selectedDorm.images !== null &&
                                     selectedDorm.images !== undefined;
                    
                    let imageArray = [];
                    
                    if (hasImages) {
                      if (Array.isArray(selectedDorm.images)) {
                        imageArray = selectedDorm.images.filter(img => img && img.trim() !== '');
                      } else if (typeof selectedDorm.images === 'string') {
                        // ลองทั้ง comma-separated และ JSON format
                        try {
                          // ลอง parse เป็น JSON ก่อน
                          const parsed = JSON.parse(selectedDorm.images);
                          if (Array.isArray(parsed)) {
                            imageArray = parsed.filter(img => img && img.trim() !== '');
                          } else {
                            imageArray = [parsed].filter(img => img && img.trim() !== '');
                          }
                        } catch (e) {
                          // ถ้า parse ไม่ได้ ให้ split ด้วย comma
                          imageArray = selectedDorm.images.split(',').filter(img => img && img.trim() !== '');
                        }
                      }
                    }
                    
                    console.log('🖼️ Final image array:', imageArray);
                    console.log('🖼️ Array length:', imageArray.length);
                    
                    return imageArray.length > 0 ? (
                      <div className="relative">
                        {/* Container รูปภาพหลัก */}
                        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                          <img
                            src={`http://localhost:3001/uploads/${imageArray[currentImageIndex]?.replace(/^\/uploads\//, '') || imageArray[0]?.replace(/^\/uploads\//, '')}`}
                            alt="รูปหอพักหลัก"
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            onLoad={() => console.log('✅ Main image loaded successfully')}
                            onError={(e) => {
                              const originalSrc = e.target.src;
                              console.error('❌ Main image load error:', originalSrc);
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA1NUMzNy45IDU1IDI4IDQ1LjEgMjggMzNTMzcuOSAxMSA1MCAxMVM3MiAyMC45IDcyIDMzUzYyLjEgNTUgNTAgNTVaTTUwIDQ5QzU4IDQ5IDY2IDQxIDY2IDMzUzU4IDE3IDUwIDE3UzM0IDI1IDM0IDMzUzQyIDQ5IDUwIDQ5WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNTAgNjFIMjhWNzJINzJWNjFINTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                              e.target.alt = 'รูปภาพไม่สามารถโหลดได้';
                            }}
                            onClick={() => openImageModal(imageArray, currentImageIndex)}
                          />
                          
                          {/* Overlay แสดงจำนวนรูป */}
                          {imageArray.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {currentImageIndex + 1} / {imageArray.length}
                            </div>
                          )}
                          
                          {/* ปุ่มเลื่อนซ้าย */}
                          {imageArray.length > 1 && (
                            <button
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex(prev => prev === 0 ? imageArray.length - 1 : prev - 1);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          
                          {/* ปุ่มเลื่อนขวา */}
                          {imageArray.length > 1 && (
                            <button
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex(prev => prev === imageArray.length - 1 ? 0 : prev + 1);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        {/* Thumbnail แถบด้านล่าง */}
                        {imageArray.length > 1 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                            {imageArray.map((image, idx) => {
                              const cleanImageName = image.replace(/^\/uploads\//, '');
                              const imageUrl = `http://localhost:3001/uploads/${cleanImageName}`;
                              const isActive = idx === currentImageIndex;
                              
                              return (
                                <div
                                  key={idx}
                                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                                    isActive 
                                      ? 'border-orange-500 shadow-lg scale-105' 
                                      : 'border-gray-200 hover:border-orange-400'
                                  }`}
                                  onClick={() => setCurrentImageIndex(idx)}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`ตัวอย่างรูป ${idx + 1}`}
                                    className={`w-full h-full object-cover transition-transform duration-200 ${
                                      isActive ? 'scale-110' : 'hover:scale-110'
                                    }`}
                                    onLoad={() => console.log(`✅ Thumbnail ${idx + 1} loaded`)}
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA1NUMzNy45IDU1IDI4IDQ1LjEgMjggMzNTMzcuOSAxMSA1MCAxMVM3MiAyMC45IDcyIDMzUzYyLjEgNTUgNTAgNTVaTTUwIDQ5QzU4IDQ5IDY2IDQxIDY2IDMzUzU4IDE3IDUwIDE3UzM0IDI1IDM0IDMzUzQyIDQ5IDUwIDQ5WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNTAgNjFIMjhWNzJINzJWNjFINTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUniversity className="text-2xl text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-700 mb-1">ไม่มีรูปภาพ</h3>
                            <p className="text-sm text-gray-500">ยังไม่มีการอัปโหลดรูปภาพสำหรับหอพักนี้</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaHome className="text-green-500" />
                    ข้อมูลพื้นฐาน
                  </h4>
                  <div className="space-y-3">
                    <div className="border-b border-gray-100 pb-2">
                      <label className="block text-sm font-medium text-gray-600">ชื่อหอพัก</label>
                      <p className="text-gray-900 font-semibold text-lg">{selectedDorm.name}</p>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <label className="block text-sm font-medium text-gray-600">ที่อยู่</label>
                      <p className="text-gray-900">{selectedDorm.address_detail || selectedDorm.address}</p>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <label className="block text-sm font-medium text-gray-600">จำนวนชั้น</label>
                      <p className="text-gray-900">{selectedDorm.floor_count || 'ไม่ระบุ'} ชั้น</p>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <label className="block text-sm font-medium text-gray-600">จำนวนห้อง</label>
                      <p className="text-gray-900">{selectedDorm.room_count || selectedDorm.rooms || 'ไม่ระบุ'} ห้อง</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">สถานะ</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedDorm.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-500" />
                  ข้อมูลราคา
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">ราคาต่อวัน</label>
                    <p className="text-xl font-bold text-blue-600">{formatPrice(selectedDorm.price_daily || selectedDorm.price)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">ราคาต่อเดือน</label>
                    <p className="text-xl font-bold text-green-600">{formatPrice(selectedDorm.price_monthly)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">ราคาต่อเทอม</label>
                    <p className="text-xl font-bold text-purple-600">{formatPrice(selectedDorm.price_term)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Costs */}
              <div className="bg-orange-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaClipboardCheck className="text-orange-500" />
                  ค่าใช้จ่ายเพิ่มเติม
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">เงินมัดจำ</label>
                    <p className="text-lg font-semibold text-purple-600">{formatPrice(selectedDorm.deposit)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">ค่าน้ำต่อหน่วย</label>
                    <p className="text-lg font-semibold text-blue-600">
                      {selectedDorm.water_rate || selectedDorm.water_cost ? 
                        `฿${selectedDorm.water_rate || selectedDorm.water_cost}` : 'ไม่ระบุ'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">ค่าไฟต่อหน่วย</label>
                    <p className="text-lg font-semibold text-yellow-600">
                      {selectedDorm.electricity_rate || selectedDorm.electricity_cost ? 
                        `฿${selectedDorm.electricity_rate || selectedDorm.electricity_cost}` : 'ไม่ระบุ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUserCircle className="text-green-500" />
                  ข้อมูลเจ้าของหอพัก
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อเจ้าของ</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedDorm.owner_name || selectedDorm.ownerName || 'ไม่ระบุ'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">เบอร์โทรติดต่อ</label>
                    <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FaPhoneAlt className="text-green-500" />
                      {selectedDorm.contact_phone || selectedDorm.owner_phone || selectedDorm.ownerPhone || 'ไม่ระบุ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              {(selectedDorm.latitude && selectedDorm.longitude) && (
                <div className="bg-purple-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-purple-500" />
                    ข้อมูลตำแหน่ง
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">พิกัด GPS</label>
                        <p className="text-gray-800">
                          <span className="font-semibold">ละติจูด:</span> {parseFloat(selectedDorm.latitude).toFixed(6)}<br />
                          <span className="font-semibold">ลองจิจูด:</span> {parseFloat(selectedDorm.longitude).toFixed(6)}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${selectedDorm.latitude},${selectedDorm.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <FaMapMarkerAlt />
                        เปิดแผนที่
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Facilities */}
              {selectedDorm.facilities && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaShieldAlt className="text-gray-600" />
                    สิ่งอำนวยความสะดวก
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedDorm.facilities) 
                        ? selectedDorm.facilities 
                        : selectedDorm.facilities.split(',')
                      ).map((facility, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {facility.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Near Places */}
              {selectedDorm.near_places && (
                <div className="bg-yellow-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-yellow-600" />
                    สถานที่ใกล้เคียง
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedDorm.near_places) 
                        ? selectedDorm.near_places 
                        : selectedDorm.near_places.split(',')
                      ).map((place, idx) => (
                        <span key={idx} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          {place.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">คำอธิบายเพิ่มเติม</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedDorm.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                  </p>
                </div>
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

        {/* Image Modal */}
        {imageModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
            <div className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center overflow-hidden">
              {/* ปุ่มควบคุมด้านบน */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-50 rounded-full px-4 py-2 z-10">
                <button
                  onClick={zoomOut}
                  className="text-white hover:text-blue-400 transition-colors"
                  title="ซูมออก"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                
                <span className="text-white text-sm px-2">{Math.round(imageModal.zoom * 100)}%</span>
                
                <button
                  onClick={zoomIn}
                  className="text-white hover:text-blue-400 transition-colors"
                  title="ซูมเข้า"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                
                <button
                  onClick={resetZoom}
                  className="text-white hover:text-blue-400 transition-colors"
                  title="รีเซ็ตซูม"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* ปุ่มปิด */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all z-10"
                title="ปิด (ESC)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* ปุ่มก่อนหน้า */}
              {imageModal.images.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all z-10"
                  title="รูปก่อนหน้า (←)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* ปุ่มถัดไป */}
              {imageModal.images.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all z-10"
                  title="รูปถัดไป (→)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* รูปภาพ */}
              <div className="overflow-auto max-w-full max-h-full">
                <img
                  src={(() => {
                    const currentImage = imageModal.images[imageModal.currentIndex];
                    const cleanImageName = currentImage.replace(/^\/uploads\//, '');
                    return `http://localhost:3001/uploads/${cleanImageName}`;
                  })()}
                  alt={`รูปภาพ ${imageModal.currentIndex + 1}`}
                  className="max-w-none rounded-lg shadow-2xl transition-transform duration-200 cursor-grab active:cursor-grabbing"
                  style={{ 
                    transform: `scale(${imageModal.zoom})`,
                    transformOrigin: 'center'
                  }}
                  onLoad={() => console.log(`✅ Modal image ${imageModal.currentIndex + 1} loaded`)}
                  onError={(e) => {
                    const originalSrc = e.target.src;
                    console.error('❌ Modal image load error:', originalSrc);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA1NUMzNy45IDU1IDI4IDQ1LjEgMjggMzNTMzcuOSAxMSA1MCAxMVM3MiAyMC45IDcyIDMzUzYyLjEgNTUgNTAgNTVaTTUwIDQ5QzU4IDQ5IDY2IDQxIDY2IDMzUzU4IDE3IDUwIDE3UzM0IDI1IDM0IDMzUzQyIDQ5IDUwIDQ5WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNTAgNjFIMjhWNzJINzJWNjFINTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                  }}
                  onDoubleClick={imageModal.zoom === 1 ? zoomIn : resetZoom}
                />
              </div>

              {/* ตัวนับรูป */}
              {imageModal.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
                  {imageModal.currentIndex + 1} / {imageModal.images.length}
                </div>
              )}

              {/* Thumbnail Navigator */}
              {imageModal.images.length > 1 && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full px-4">
                  {imageModal.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={`http://localhost:3001${image}`}
                      alt={`ย่อ ${idx + 1}`}
                      className={`w-16 h-16 object-cover rounded cursor-pointer transition-all ${
                        idx === imageModal.currentIndex 
                          ? 'ring-2 ring-white opacity-100' 
                          : 'opacity-60 hover:opacity-80'
                      }`}
                      onClick={() => setImageModal(prev => ({ ...prev, currentIndex: idx, zoom: 1 }))}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}

              {/* คำแนะนำการใช้งาน */}
              <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 px-3 py-2 rounded text-xs">
                <div>← → เปลี่ยนรูป</div>
                <div>+ - ซูม ESC ปิด</div>
                <div>0 รีเซ็ต ดับเบิลคลิก ซูม</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDormApprovalPage;
