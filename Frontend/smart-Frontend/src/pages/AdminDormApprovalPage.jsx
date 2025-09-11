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
  const [allDorms, setAllDorms] = useState([]); // เพิ่ม state สำหรับข้อมูลทั้งหมด
  const [loading, setLoading] = useState(true);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [imageModal, setImageModal] = useState({ show: false, images: [], currentIndex: 0, zoom: 1 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // เพิ่ม state สำหรับ carousel
  
  // เพิ่ม state สำหรับ pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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
    
    // ดึงข้อมูลตาม filter
    const filteredPromise = fetch(`http://localhost:3001/admin/dorms?status=${filterStatus}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    // ดึงข้อมูลทั้งหมดสำหรับสถิติ
    const allDataPromise = fetch(`http://localhost:3001/admin/dorms?status=all`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    Promise.all([filteredPromise, allDataPromise])
      .then(async ([filteredRes, allRes]) => {
        console.log('📡 Response status - Filtered:', filteredRes.status, 'All:', allRes.status);
        
        if (!filteredRes.ok || !allRes.ok) {
          throw new Error(`HTTP error! Filtered status: ${filteredRes.status}, All status: ${allRes.status}`);
        }
        
        const [filteredData, allData] = await Promise.all([
          filteredRes.json(),
          allRes.json()
        ]);
        
        console.log('📥 Received filtered data:', filteredData);
        console.log('� Received all data for stats:', allData);
        
        // ตั้งค่าข้อมูลที่กรองแล้ว
        if (Array.isArray(filteredData)) {
          // เพิ่มการ debug ข้อมูลรูปภาพและชื่อผู้ใช้
          filteredData.forEach((dorm, index) => {
            console.log(`🏠 Dorm ${index + 1} (${dorm.name}):`, {
              id: dorm.id,
              status: dorm.status,
              images: dorm.images,
              imagesType: typeof dorm.images,
              imagesLength: Array.isArray(dorm.images) ? dorm.images.length : (dorm.images ? dorm.images.split(',').length : 0),
              userNameFields: {
                owner_name: dorm.owner_name,
                ownerName: dorm.ownerName,
                user_name: dorm.user_name,
                userName: dorm.userName,
                firstName: dorm.firstName,
                first_name: dorm.first_name,
                firstname: dorm.firstname,
                created_by_name: dorm.created_by_name,
                submitter_name: dorm.submitter_name
              }
            });
          });
          setPendingDorms(filteredData);
          console.log('✅ Filtered dorms data set successfully');
        } else {
          console.error('❌ Filtered data is not an array:', filteredData);
          setPendingDorms([]);
        }

        // ตั้งค่าข้อมูลทั้งหมดสำหรับสถิติ
        if (Array.isArray(allData)) {
          setAllDorms(allData);
          console.log('✅ All dorms data set successfully for stats');
        } else {
          console.error('❌ All data is not an array:', allData);
          setAllDorms([]);
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
    setCurrentPage(1); // รีเซ็ตไปหน้า 1 เมื่อเปลี่ยนฟิลเตอร์
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

  // ฟังก์ชันสำหรับ pagination
  const totalPages = Math.ceil(pendingDorms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDorms = pendingDorms.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
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
                  <p className="text-3xl font-bold text-orange-600">{allDorms.filter(d => d.status === 'pending').length}</p>
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
                  <p className="text-3xl font-bold text-green-600">{allDorms.filter(d => d.status === 'approved').length}</p>
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
                  <p className="text-3xl font-bold text-red-600">{allDorms.filter(d => d.status === 'rejected').length}</p>
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
                  <p className="text-3xl font-bold text-blue-600">{allDorms.length}</p>
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
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '35%', minWidth: '220px'}}>หอพัก</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '30%', minWidth: '180px'}}>ผู้เพิ่มหอพัก</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%', minWidth: '90px'}}>สถานะ</th>
                    <th className="px-2 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%', minWidth: '110px'}}>จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentDorms.map((dorm, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-2 py-3" style={{width: '35%', minWidth: '220px'}}>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            {(() => {
                              // ฟังก์ชันตรวจสอบรูปภาพ
                              const findFirstImage = (dormData) => {
                                // ตรวจสอบทุกฟิลด์ในระบบเพื่อหารูปภาพ
                                for (const [, value] of Object.entries(dormData)) {
                                  if (value && typeof value === 'string' && value.trim() !== '' && value !== 'null') {
                                    // ตรวจสอบว่าเป็น URL หรือ path ของรูปภาพหรือไม่
                                    if (value.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || 
                                        value.includes('/uploads/') || 
                                        (value.startsWith('http') && (value.includes('image') || value.includes('photo')))) {
                                      return value;
                                    }
                                  }
                                }
                                
                                // ตรวจสอบฟิลด์พิเศษ
                                const possibleImageFields = [
                                  dormData.images,
                                  dormData.image, 
                                  dormData.photo,
                                  dormData.picture,
                                  dormData.thumbnail,
                                  dormData.cover_image,
                                  dormData.main_image,
                                  dormData.image_path,
                                  dormData.gallery,
                                  dormData.photos,
                                  dormData.image_url,
                                  dormData.image_urls
                                ];
                                
                                for (const field of possibleImageFields) {
                                  if (field && field !== '' && field !== 'null' && field !== null && field !== undefined) {
                                    if (Array.isArray(field)) {
                                      const validImages = field.filter(img => img && img.trim() !== '' && img !== 'null');
                                      if (validImages.length > 0) {
                                        return validImages[0];
                                      }
                                    } else if (typeof field === 'string') {
                                      try {
                                        const parsed = JSON.parse(field);
                                        if (Array.isArray(parsed)) {
                                          const validImages = parsed.filter(img => img && img.trim() !== '' && img !== 'null');
                                          if (validImages.length > 0) {
                                            return validImages[0];
                                          }
                                        } else if (parsed && parsed.trim() !== '' && parsed !== 'null') {
                                          return parsed;
                                        }
                                      } catch {
                                        if (field.includes(',')) {
                                          const validImages = field.split(',').filter(img => img && img.trim() !== '' && img !== 'null');
                                          if (validImages.length > 0) {
                                            return validImages[0];
                                          }
                                        } else if (field.trim() !== '' && field !== 'null') {
                                          return field.trim();
                                        }
                                      }
                                    }
                                  }
                                }
                                
                                return null;
                              };
                              
                              const firstImageUrl = findFirstImage(dorm);
                              
                              return firstImageUrl ? (
                                <>
                                  <img 
                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-sm block" 
                                    src={(() => {
                                      // สร้าง URL ที่ถูกต้อง
                                      if (firstImageUrl.startsWith('/uploads/')) {
                                        return `http://localhost:3001${firstImageUrl}`;
                                      } else if (firstImageUrl.startsWith('http')) {
                                        return firstImageUrl;
                                      } else {
                                        return `http://localhost:3001/uploads/${firstImageUrl}`;
                                      }
                                    })()}
                                    alt={dorm.name}
                                    onError={(e) => {
                                      console.log('❌ Table image failed to load:', e.target.src);
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                    onLoad={() => {
                                      // Image loaded successfully
                                    }}
                                  />
                                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center" style={{ display: 'none' }}>
                                    <FaUniversity className="text-white text-sm" />
                                  </div>
                                </>
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                  <FaUniversity className="text-white text-sm" />
                                </div>
                              );
                            })()}
                            
                            {/* Badge แสดงจำนวนรูป */}
                            {(() => {
                              // นับจำนวนรูปด้วย logic เดียวกัน
                              let imageCount = 0;
                              const possibleImageFields = [
                                dorm.images,
                                dorm.image, 
                                dorm.photo,
                                dorm.picture,
                                dorm.thumbnail,
                                dorm.cover_image,
                                dorm.main_image
                              ];
                              
                              for (const field of possibleImageFields) {
                                if (field && field !== '' && field !== 'null' && field !== null && field !== undefined) {
                                  if (Array.isArray(field)) {
                                    const validImages = field.filter(img => img && img.trim() !== '' && img !== 'null');
                                    if (validImages.length > 0) {
                                      imageCount = validImages.length;
                                      break;
                                    }
                                  } else if (typeof field === 'string') {
                                    try {
                                      const parsed = JSON.parse(field);
                                      if (Array.isArray(parsed)) {
                                        const validImages = parsed.filter(img => img && img.trim() !== '' && img !== 'null');
                                        if (validImages.length > 0) {
                                          imageCount = validImages.length;
                                          break;
                                        }
                                      } else if (parsed && parsed.trim() !== '' && parsed !== 'null') {
                                        imageCount = 1;
                                        break;
                                      }
                                    } catch {
                                      if (field.includes(',')) {
                                        const validImages = field.split(',').filter(img => img && img.trim() !== '' && img !== 'null');
                                        if (validImages.length > 0) {
                                          imageCount = validImages.length;
                                          break;
                                        }
                                      } else if (field.trim() !== '' && field !== 'null') {
                                        imageCount = 1;
                                        break;
                                      }
                                    }
                                  }
                                }
                              }
                              
                              return imageCount > 1 && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                  {imageCount}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate" title={dorm.name}>{dorm.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FaMapMarkerAlt className="text-xs flex-shrink-0" />
                              <span className="truncate" title={dorm.address_detail || dorm.address}>{dorm.address_detail || dorm.address}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3" style={{width: '30%', minWidth: '180px'}}>
                        <div className="text-sm text-gray-900 font-medium truncate" title={dorm.owner_firstName && dorm.owner_lastName ? 
                            `${dorm.owner_firstName} ${dorm.owner_lastName}` :
                           dorm.owner_firstName || dorm.ownerFirstName || 
                           dorm.owner_name || dorm.ownerName || dorm.owner?.name || 
                           dorm.user_name || dorm.userName || dorm.user?.name ||
                           dorm.created_by_name || dorm.createdByName || dorm.created_by?.name ||
                           dorm.submitter_name || dorm.submitterName || dorm.submitter?.name ||
                           dorm.added_by_name || dorm.addedByName || dorm.added_by?.name ||
                           dorm.creator_name || dorm.creatorName || dorm.creator?.name ||
                           dorm.firstName || dorm.first_name || dorm.firstname || 'ไม่พบชื่อผู้เพิ่มหอพัก'}>
                          {dorm.owner_firstName && dorm.owner_lastName ? 
                            `${dorm.owner_firstName} ${dorm.owner_lastName}` :
                           dorm.owner_firstName || dorm.ownerFirstName || 
                           dorm.owner_name || dorm.ownerName || dorm.owner?.name || 
                           dorm.user_name || dorm.userName || dorm.user?.name ||
                           dorm.created_by_name || dorm.createdByName || dorm.created_by?.name ||
                           dorm.submitter_name || dorm.submitterName || dorm.submitter?.name ||
                           dorm.added_by_name || dorm.addedByName || dorm.added_by?.name ||
                           dorm.creator_name || dorm.creatorName || dorm.creator?.name ||
                           dorm.firstName || dorm.first_name || dorm.firstname || 'ไม่พบชื่อผู้เพิ่มหอพัก'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FaPhoneAlt className="text-xs flex-shrink-0" />
                          <span className="truncate" title={dorm.owner_phone || dorm.contact_phone || dorm.ownerPhone || dorm.owner?.phone || dorm.phone || 
                           dorm.user_phone || dorm.userPhone || dorm.user?.phone ||
                           dorm.created_by_phone || dorm.createdByPhone || dorm.created_by?.phone ||
                           dorm.submitter_phone || dorm.submitterPhone || dorm.submitter?.phone || 'ไม่ระบุ'}>{dorm.owner_phone || dorm.contact_phone || dorm.ownerPhone || dorm.owner?.phone || dorm.phone || 
                           dorm.user_phone || dorm.userPhone || dorm.user?.phone ||
                           dorm.created_by_phone || dorm.createdByPhone || dorm.created_by?.phone ||
                           dorm.submitter_phone || dorm.submitterPhone || dorm.submitter?.phone || 'ไม่ระบุ'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3" style={{width: '15%', minWidth: '90px'}}>
                        {getStatusBadge(dorm.status)}
                      </td>
                      <td className="px-2 py-3 text-center" style={{width: '20%', minWidth: '110px'}}>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleViewDetails(dorm)}
                            className="inline-flex items-center justify-center px-1 py-1 text-xs font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors w-full"
                          >
                            <FaEye className="mr-1" />
                            <span className="hidden sm:inline">ดูรายละเอียด</span>
                            <span className="sm:hidden">ดู</span>
                          </button>
                          {dorm.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(dorm.id)}
                                className="inline-flex items-center justify-center px-1 py-1 text-xs font-medium rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors w-full"
                              >
                                <FaCheckCircle className="mr-1" />
                                <span className="hidden sm:inline">อนุมัติ</span>
                                <span className="sm:hidden">✓</span>
                              </button>
                              <button
                                onClick={() => handleReject(dorm.id)}
                                className="inline-flex items-center justify-center px-1 py-1 text-xs font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors w-full"
                              >
                                <FaTimesCircle className="mr-1" />
                                <span className="hidden sm:inline">ปฏิเสธ</span>
                                <span className="sm:hidden">✗</span>
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

        {/* Pagination */}
        {!loading && pendingDorms.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>แสดง {startIndex + 1}-{Math.min(endIndex, pendingDorms.length)} จาก {pendingDorms.length} รายการ</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* ปุ่มหน้าก่อนหน้า */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ← ก่อนหน้า
                </button>

                {/* หมายเลขหน้า */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // แสดงหน้าทั้งหมดถ้าไม่เกิน 7 หน้า
                    if (totalPages <= 7) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }

                    // แสดงแบบมี ... ถ้าเกิน 7 หน้า
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }

                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* ปุ่มหน้าถัดไป */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          </div>
        )}

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
                        // ใช้ logic เดียวกันกับการหารูปภาพ
                        let imageCount = 0;
                        
                        const possibleImageFields = [
                          selectedDorm.images,
                          selectedDorm.image, 
                          selectedDorm.photo,
                          selectedDorm.picture,
                          selectedDorm.thumbnail,
                          selectedDorm.cover_image,
                          selectedDorm.main_image,
                          selectedDorm.gallery,
                          selectedDorm.photos,
                          selectedDorm.image_url,
                          selectedDorm.image_urls
                        ];
                        
                        for (const field of possibleImageFields) {
                          if (field && field !== '' && field !== 'null' && field !== null && field !== undefined) {
                            if (Array.isArray(field)) {
                              const validImages = field.filter(img => img && img.trim() !== '' && img !== 'null' && img !== 'undefined');
                              if (validImages.length > 0) {
                                imageCount = validImages.length;
                                break;
                              }
                            } else if (typeof field === 'string') {
                              try {
                                const parsed = JSON.parse(field);
                                if (Array.isArray(parsed)) {
                                  const validImages = parsed.filter(img => img && img.trim() !== '' && img !== 'null' && img !== 'undefined');
                                  if (validImages.length > 0) {
                                    imageCount = validImages.length;
                                    break;
                                  }
                                } else if (parsed && parsed.trim() !== '' && parsed !== 'null') {
                                  imageCount = 1;
                                  break;
                                }
                              } catch {
                                if (field.includes(',')) {
                                  const validImages = field.split(',').filter(img => img && img.trim() !== '' && img !== 'null' && img !== 'undefined');
                                  if (validImages.length > 0) {
                                    imageCount = validImages.length;
                                    break;
                                  }
                                } else if (field.trim() !== '' && field !== 'null') {
                                  imageCount = 1;
                                  break;
                                }
                              }
                            }
                          }
                        }
                        
                        return `(${imageCount} รูป)`;
                      })()}
                    </span>
                  </h4>
                  {(() => {
                    // ตรวจสอบรูปภาพอย่างละเอียด
                    
                    // รวบรวมรูปภาพจากทุกแหล่งที่เป็นไปได้
                    let imageArray = [];
                    
                    // เพิ่มฟิลด์ที่เป็นไปได้ทั้งหมด รวมถึง image_path
                    const possibleImageFields = [
                      selectedDorm.images,
                      selectedDorm.image, 
                      selectedDorm.photo,
                      selectedDorm.picture,
                      selectedDorm.thumbnail,
                      selectedDorm.cover_image,
                      selectedDorm.main_image,
                      selectedDorm.gallery,
                      selectedDorm.photos,
                      selectedDorm.image_url,
                      selectedDorm.image_urls,
                      selectedDorm.image_path,  // เพิ่มฟิลด์ที่พบใน debug
                      selectedDorm.img,
                      selectedDorm.imageUrl,
                      selectedDorm.imagePath,
                      selectedDorm.photoUrl,
                      selectedDorm.photoPath,
                      selectedDorm.pictureUrl,
                      selectedDorm.picturePath
                    ];
                    
                    // ตรวจสอบทุกฟิลด์ในทั้ง object เพื่อหาข้อมูลรูปภาพ
                    const allFields = Object.keys(selectedDorm);
                    
                    // เพิ่มฟิลด์ที่มีคำว่า image, photo, picture, gallery เข้าไปด้วย
                    allFields.forEach(key => {
                      const lowerKey = key.toLowerCase();
                      if ((lowerKey.includes('image') || lowerKey.includes('photo') || 
                          lowerKey.includes('picture') || lowerKey.includes('gallery') || 
                          lowerKey.includes('img') || lowerKey.includes('pic')) && 
                          !possibleImageFields.includes(selectedDorm[key])) {
                        possibleImageFields.push(selectedDorm[key]);
                        console.log(`🔍 Found potential image field: ${key} = ${selectedDorm[key]}`);
                      }
                    });
                    
                    for (const field of possibleImageFields) {
                      if (field && field !== '' && field !== 'null' && field !== null && field !== undefined) {
                        console.log('🔄 Processing field:', field, typeof field);
                        
                        if (Array.isArray(field)) {
                          const validImages = field.filter(img => img && img.trim() !== '' && img !== 'null' && img !== 'undefined');
                          if (validImages.length > 0) {
                            imageArray = validImages;
                            break;
                          }
                        } else if (typeof field === 'string') {
                          // ลอง parse เป็น JSON ก่อน
                          try {
                            const parsed = JSON.parse(field);
                            if (Array.isArray(parsed)) {
                              const validImages = parsed.filter(img => img && img.trim() !== '' && img !== 'null' && img !== 'undefined');
                              if (validImages.length > 0) {
                                imageArray = validImages;
                                break;
                              }
                            } else if (parsed && parsed.trim() !== '' && parsed !== 'null') {
                              imageArray = [parsed];
                              break;
                            }
                          } catch {
                            // ถ้า parse ไม่ได้ ลอง split ด้วย comma
                            if (field.includes(',')) {
                              const validImages = field.split(',').filter(img => img && img.trim() !== '' && img !== 'null' && img !== 'undefined');
                              if (validImages.length > 0) {
                                imageArray = validImages;
                                break;
                              }
                            } else if (field.trim() !== '' && field !== 'null') {
                              // เป็น string เดี่ยว
                              imageArray = [field.trim()];
                              console.log('✅ Found single image in string field:', field.trim());
                              break;
                            }
                          }
                        }
                      }
                    }
                    
                    // หากยังไม่เจอรูปภาพ ให้ลองหาจากทุกฟิลด์ในระบบ
                    if (imageArray.length === 0) {
                      console.log('🔍 No images found in standard fields, checking all object properties...');
                      for (const [key, value] of Object.entries(selectedDorm)) {
                        if (value && typeof value === 'string' && value.trim() !== '' && value !== 'null') {
                          // ตรวจสอบว่าเป็น URL หรือ path ของรูปภาพหรือไม่
                          if (value.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || 
                              value.includes('/uploads/') || 
                              value.startsWith('http') && (value.includes('image') || value.includes('photo'))) {
                            imageArray = [value];
                            console.log(`✅ Found image in field ${key}:`, value);
                            break;
                          }
                        }
                      }
                    }
                    
                    return imageArray.length > 0 ? (
                      <div className="relative">
                        {/* Container รูปภาพหลัก */}
                        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                          <img
                            src={(() => {
                              const currentImage = imageArray[currentImageIndex] || imageArray[0];
                              // ตรวจสอบรูปแบบ URL
                              if (currentImage.startsWith('/uploads/')) {
                                return `http://localhost:3001${currentImage}`;
                              } else if (currentImage.startsWith('http')) {
                                return currentImage;
                              } else {
                                return `http://localhost:3001/uploads/${currentImage}`;
                              }
                            })()}
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
                              // สร้าง URL ที่ถูกต้อง
                              const imageUrl = (() => {
                                if (image.startsWith('/uploads/')) {
                                  return `http://localhost:3001${image}`;
                                } else if (image.startsWith('http')) {
                                  return image;
                                } else {
                                  return `http://localhost:3001/uploads/${image}`;
                                }
                              })();
                              
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
                                      console.error(`❌ Thumbnail ${idx + 1} failed to load:`, e.target.src);
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
                      // ถ้าไม่มีรูปภาพใดๆ ให้แสดง placeholder ที่สวยงาม พร้อมข้อมูล debug
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center border-2 border-dashed border-blue-200">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                            <FaUniversity className="text-3xl text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                              {selectedDorm.name || 'หอพัก'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              ไม่พบรูปภาพในระบบ
                            </p>
                          </div>
                          
                          {/* แสดงข้อมูล debug ทันที */}
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-left w-full max-w-4xl">
                            <h4 className="text-sm font-bold text-red-800 mb-2">🔍 Complete Debug Info:</h4>
                            <div className="text-xs text-red-700 space-y-1 font-mono max-h-60 overflow-y-auto">
                              <div><span className="font-bold">images:</span> {JSON.stringify(selectedDorm.images)}</div>
                              <div><span className="font-bold">image:</span> {JSON.stringify(selectedDorm.image)}</div>
                              <div><span className="font-bold">photo:</span> {JSON.stringify(selectedDorm.photo)}</div>
                              <div><span className="font-bold">picture:</span> {JSON.stringify(selectedDorm.picture)}</div>
                              <div><span className="font-bold">thumbnail:</span> {JSON.stringify(selectedDorm.thumbnail)}</div>
                              <div><span className="font-bold">cover_image:</span> {JSON.stringify(selectedDorm.cover_image)}</div>
                              <div><span className="font-bold">main_image:</span> {JSON.stringify(selectedDorm.main_image)}</div>
                              <div><span className="font-bold">image_path:</span> {JSON.stringify(selectedDorm.image_path)}</div>
                              <div><span className="font-bold">gallery:</span> {JSON.stringify(selectedDorm.gallery)}</div>
                              <div><span className="font-bold">photos:</span> {JSON.stringify(selectedDorm.photos)}</div>
                              <div><span className="font-bold">image_url:</span> {JSON.stringify(selectedDorm.image_url)}</div>
                              <div><span className="font-bold">image_urls:</span> {JSON.stringify(selectedDorm.image_urls)}</div>
                              <hr className="my-2"/>
                              <div className="text-blue-700">
                                <span className="font-bold">🔍 ALL OBJECT FIELDS:</span><br/>
                                {Object.entries(selectedDorm).map(([key, value]) => 
                                  `${key}: ${JSON.stringify(value)}`
                                ).join('\n')}
                              </div>
                              <hr className="my-2"/>
                              <div className="text-green-700">
                                <span className="font-bold">🔍 POTENTIAL IMAGE FIELDS:</span><br/>
                                {Object.entries(selectedDorm)
                                  .filter(([key, value]) => {
                                    const lowerKey = key.toLowerCase();
                                    return (lowerKey.includes('image') || 
                                           lowerKey.includes('photo') || 
                                           lowerKey.includes('picture') ||
                                           lowerKey.includes('gallery') ||
                                           lowerKey.includes('img') ||
                                           lowerKey.includes('pic')) ||
                                           (value && typeof value === 'string' && 
                                            (value.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
                                             value.includes('/uploads/') ||
                                             (value.startsWith('http') && (value.includes('image') || value.includes('photo')))));
                                  })
                                  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                                  .join('\n')
                                }
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ตรวจสอบข้อมูล debug ข้างบนเพื่อหาข้อมูลรูปภาพ
                            </div>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-b border-gray-100 pb-2">
                        <label className="block text-sm font-medium text-gray-600">วันที่ส่งคำขอ</label>
                        <p className="text-gray-900">
                          {selectedDorm.created_at ? 
                            new Date(selectedDorm.created_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'ไม่ระบุ'}
                        </p>
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
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedDorm.owner_firstName && selectedDorm.owner_lastName ? 
                        `${selectedDorm.owner_firstName} ${selectedDorm.owner_lastName}` :
                       selectedDorm.owner_firstName || selectedDorm.ownerFirstName || 
                       selectedDorm.owner_name || selectedDorm.ownerName || selectedDorm.owner?.name || 
                       selectedDorm.user_name || selectedDorm.userName || selectedDorm.user?.name ||
                       selectedDorm.created_by_name || selectedDorm.createdByName || selectedDorm.created_by?.name ||
                       selectedDorm.submitter_name || selectedDorm.submitterName || selectedDorm.submitter?.name ||
                       selectedDorm.added_by_name || selectedDorm.addedByName || selectedDorm.added_by?.name ||
                       selectedDorm.creator_name || selectedDorm.creatorName || selectedDorm.creator?.name ||
                       selectedDorm.firstName || selectedDorm.first_name || selectedDorm.firstname || 'ไม่พบชื่อผู้เพิ่มหอพัก'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">เบอร์โทรติดต่อ</label>
                    <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FaPhoneAlt className="text-green-500" />
                      {selectedDorm.owner_phone || selectedDorm.contact_phone || selectedDorm.ownerPhone || selectedDorm.owner?.phone || 
                       selectedDorm.user_phone || selectedDorm.userPhone || selectedDorm.user?.phone ||
                       selectedDorm.created_by_phone || selectedDorm.createdByPhone || selectedDorm.created_by?.phone ||
                       selectedDorm.submitter_phone || selectedDorm.submitterPhone || selectedDorm.submitter?.phone || 'ไม่ระบุ'}
                    </p>
                  </div>
                  {(selectedDorm.owner_email || selectedDorm.ownerEmail || selectedDorm.owner?.email ||
                    selectedDorm.user_email || selectedDorm.userEmail || selectedDorm.user?.email ||
                    selectedDorm.created_by_email || selectedDorm.createdByEmail || selectedDorm.created_by?.email ||
                    selectedDorm.submitter_email || selectedDorm.submitterEmail || selectedDorm.submitter?.email) && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">อีเมล</label>
                      <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FaEnvelope className="text-green-500" />
                        {selectedDorm.owner_email || selectedDorm.ownerEmail || selectedDorm.owner?.email ||
                         selectedDorm.user_email || selectedDorm.userEmail || selectedDorm.user?.email ||
                         selectedDorm.created_by_email || selectedDorm.createdByEmail || selectedDorm.created_by?.email ||
                         selectedDorm.submitter_email || selectedDorm.submitterEmail || selectedDorm.submitter?.email}
                      </p>
                    </div>
                  )}
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
                    // สร้าง URL ที่ถูกต้อง
                    if (currentImage.startsWith('/uploads/')) {
                      return `http://localhost:3001${currentImage}`;
                    } else if (currentImage.startsWith('http')) {
                      return currentImage;
                    } else {
                      return `http://localhost:3001/uploads/${currentImage}`;
                    }
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
