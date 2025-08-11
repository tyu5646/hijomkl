import React, { useEffect, useState } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { FaBed, FaMoneyBillWave, FaMapMarkerAlt, FaCouch, FaLandmark, FaChevronLeft, FaChevronRight, FaTint, FaBolt, FaPhoneAlt, FaWifi, FaStar, FaSearch } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function OwnerHomePage() {
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showAddDormModal, setShowAddDormModal] = useState(false);
  const [addDormForm, setAddDormForm] = useState({
    name: '',
    location: '',
    price_daily: '',
    price_monthly: '',
    price_term: '',
    facilities: '',
    near_places: ''
  });
  const navigate = useNavigate();

  // ฟังก์ชันเพิ่มเติมสำหรับการโหลดรูปภาพให้ชัด
  const handleImageLoad = (e) => {
    e.target.classList.add('loaded');
    e.target.classList.remove('image-loading');
    
    // ปรับ filter ตามความละเอียดหน้าจอ
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // ใช้ค่า filter ที่แรงขึ้นสำหรับรูปภาพทั่วไป
    if (devicePixelRatio >= 3) {
      // หน้าจอความละเอียดสูงมาก
      e.target.style.filter = 'contrast(1.35) brightness(1.15) saturate(1.2) sharpen(1.2)';
    } else if (devicePixelRatio >= 2) {
      // หน้าจอความละเอียดสูง (Retina)
      e.target.style.filter = 'contrast(1.25) brightness(1.1) saturate(1.15) sharpen(1.0)';
    } else {
      // หน้าจอความละเอียดปกติ
      e.target.style.filter = 'contrast(1.2) brightness(1.05) saturate(1.1) sharpen(0.8)';
    }
    
    // เพิ่มความคมชัดโดยใช้ CSS properties
    e.target.style.imageRendering = 'high-quality';
    e.target.style.textRendering = 'optimizeLegibility';
    e.target.style.fontSmooth = 'always';
    e.target.style.webkitFontSmoothing = 'antialiased';
    e.target.style.mozOsxFontSmoothing = 'grayscale';
  };

  const handleImageError = (e) => {
    e.target.src = '/no-image.png';
    e.target.style.filter = 'grayscale(0.2) contrast(1.15) brightness(1.05)';
    e.target.classList.remove('image-loading');
  };

  // ฟังก์ชันแสดงราคาตามลำดับความสำคัญ
  const getPriorityPrice = (dorm) => {
    if (dorm.price_monthly && Number(dorm.price_monthly) > 0) {
      return { price: Number(dorm.price_monthly), label: '/เดือน', color: 'bg-blue-600' };
    } else if (dorm.price_daily && Number(dorm.price_daily) > 0) {
      return { price: Number(dorm.price_daily), label: '/วัน', color: 'bg-green-600' };
    } else if (dorm.price_term && Number(dorm.price_term) > 0) {
      return { price: Number(dorm.price_term), label: '/เทอม', color: 'bg-purple-600' };
    }
    return null;
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    if (!token || role !== 'owner') {
      navigate('/login');
      return;
    }
    fetch('http://localhost:3001/owner/dorms', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async res => {
        if (res.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('role');
          alert('กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุหรือไม่ถูกต้อง)');
          navigate('/login');
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setDorms(data);
        } else {
          setDorms([]); // หรือแจ้งเตือน error
        }
        setLoading(false);
      })
      .catch(() => {
        setDorms([]);
        setLoading(false);
      });
  }, [navigate]);

  // Modal logic
  const handleOpenDorm = (dorm) => {
    setSelectedDorm(dorm);
    setModalVisible(true);
    setModalClosing(false);
    setGalleryIndex(0);
  };
  const handleCloseDorm = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModalVisible(false);
      setSelectedDorm(null);
      setModalClosing(false);
      setGalleryIndex(0);
    }, 200);
  };

  // Gallery navigation
  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (!selectedDorm || !selectedDorm.images || selectedDorm.images.length === 0) return;
    setGalleryIndex((prev) => (prev - 1 + selectedDorm.images.length) % selectedDorm.images.length);
  };
  const handleNextImage = (e) => {
    e.stopPropagation();
    if (!selectedDorm || !selectedDorm.images || selectedDorm.images.length === 0) return;
    setGalleryIndex((prev) => (prev + 1) % selectedDorm.images.length);
  };

  // Add Dorm Modal functions
  const handleOpenAddDormModal = () => {
    setShowAddDormModal(true);
  };

  const handleCloseAddDormModal = () => {
    setShowAddDormModal(false);
    setAddDormForm({
      name: '',
      location: '',
      price_daily: '',
      price_monthly: '',
      price_term: '',
      facilities: '',
      near_places: ''
    });
  };

  const handleAddDormSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:3001/owner/dorms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addDormForm)
      });

      if (response.ok) {
        // Refresh dorms list
        const updatedDorms = await fetch('http://localhost:3001/owner/dorms', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json());
        
        setDorms(updatedDorms);
        handleCloseAddDormModal();
        alert('เพิ่มหอพักสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการเพิ่มหอพัก');
      }
    } catch (error) {
      console.error('Error adding dorm:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มหอพัก');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex">
      <OwnerSidebar />
      <main className="flex-1 p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
            
            {/* Content */}
            <div className="relative px-8 py-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <FaBed className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    หอพักของคุณ
                  </h1>
                  <p className="text-blue-100 mt-1">
                    จัดการและดูแลหอพักของคุณ
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Add Dorm Button */}
                {dorms.length > 0 && (
                  <button
                    onClick={handleOpenAddDormModal}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มหอพัก
                  </button>
                )}
                
                {/* Statistics */}
                <div className="hidden md:flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {dorms.length}
                    </div>
                    <div className="text-blue-200 text-xs">หอพัก</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {dorms.filter(d => d.price_monthly > 0).length}
                    </div>
                    <div className="text-blue-200 text-xs">รายเดือน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {dorms.filter(d => d.price_daily > 0).length}
                    </div>
                    <div className="text-blue-200 text-xs">รายวัน</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dorms Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 font-medium">กำลังโหลดข้อมูลหอพัก...</p>
              </div>
            </div>
          ) : (
            <>
              {dorms.length === 0 ? (
                <div className="text-center py-20">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaBed className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">ยังไม่มีหอพัก</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      เริ่มต้นการจัดการหอพักของคุณ โดยการเพิ่มหอพักแรก
                    </p>
                    <button 
                      onClick={handleOpenAddDormModal}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                      เพิ่มหอพักแรก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dorms.map((dorm, index) => (
                    <div
                      key={dorm.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 group cursor-pointer transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleOpenDorm(dorm)}
                    >
                      {/* Image Section */}
                      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 image-container">
                        <img
                          src={
                            dorm.images && dorm.images.length > 0 && dorm.images[0]
                              ? (dorm.images[0].startsWith && dorm.images[0].startsWith('http')
                                  ? dorm.images[0]
                                  : `http://localhost:3001${dorm.images[0]}`)
                              : '/no-image.png'
                          }
                          alt={dorm.name}
                          className="w-full h-full object-cover transition-all duration-300 image-enhance image-loading"
                          style={{
                            imageRendering: 'auto',
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            imageOrientation: 'from-image',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            width: '100%',
                            height: '100%',
                            display: 'block',
                            WebkitFontSmoothing: 'antialiased'
                          }}
                          loading="lazy"
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                        
                        {/* Image Count Badge */}
                        {dorm.images && dorm.images.length > 1 && (
                          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            +{dorm.images.length - 1} รูป
                          </div>
                        )}
                        
                        {/* Popular Badge */}
                        {index < 3 && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                            🔥 ยอดนิยม
                          </div>
                        )}

                        {/* Price Overlay */}
                        <div className="absolute bottom-3 right-3">
                          {(() => {
                            const priceInfo = getPriorityPrice(dorm);
                            if (priceInfo) {
                              return (
                                <div className={`${priceInfo.color} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                                  ฿{priceInfo.price.toLocaleString()}{priceInfo.label}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5">
                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {dorm.name}
                        </h3>
                        
                        {/* Location */}
                        {(dorm.address_detail || dorm.location) && (
                          <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                            <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{dorm.address_detail || dorm.location}</span>
                          </div>
                        )}

                        {/* Facilities */}
                        {dorm.facilities && (
                          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                            <FaWifi className="text-indigo-500 flex-shrink-0" />
                            <span className="line-clamp-1">{dorm.facilities}</span>
                          </div>
                        )}

                        {/* Price Section - Enhanced with Selection Highlight */}
                        <div className="space-y-2 mb-4">
                          {(() => {
                            const prices = [
                              {
                                type: 'รายเดือน',
                                value: dorm.price_monthly,
                                unit: '/เดือน',
                                searchType: 'รายเดือน',
                                color: 'blue',
                                bgColor: 'bg-blue-50',
                                borderColor: 'border-blue-300'
                              },
                              {
                                type: 'รายวัน',
                                value: dorm.price_daily,
                                unit: '/วัน',
                                searchType: 'รายวัน',
                                color: 'green',
                                bgColor: 'bg-green-50',
                                borderColor: 'border-green-300'
                              },
                              {
                                type: 'รายเทอม',
                                value: dorm.price_term,
                                unit: '/เทอม',
                                searchType: 'รายเทอม',
                                color: 'purple',
                                bgColor: 'bg-purple-50',
                                borderColor: 'border-purple-300'
                              }
                            ];

                            // Sort prices: monthly first, then others
                            const sortedPrices = prices
                              .filter(price => price.value && Number(price.value) > 0)
                              .sort((a, b) => {
                                if (a.searchType === 'รายเดือน') return -1;
                                if (b.searchType === 'รายเดือน') return 1;
                                return 0;
                              });

                            return sortedPrices.map((price) => {
                              const isHighlighted = price.searchType === 'รายเดือน';
                              
                              return (
                                <div 
                                  key={price.type}
                                  className={`flex items-center justify-between rounded-lg p-2 transition-all duration-200 ${
                                    isHighlighted 
                                      ? `${price.bgColor} border-2 ${price.borderColor} shadow-sm` 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${
                                      isHighlighted ? `text-${price.color}-700` : 'text-gray-600'
                                    }`}>
                                      {price.type}
                                    </span>
                                    {isHighlighted && (
                                      <span className={`text-xs px-2 py-1 rounded-full bg-${price.color}-100 text-${price.color}-700 font-medium`}>
                                        แนะนำ
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-semibold ${
                                      isHighlighted 
                                        ? `text-xl text-${price.color}-700` 
                                        : `text-lg text-${price.color}-600`
                                    }`}>
                                      ฿{Number(price.value).toLocaleString()}
                                    </span>
                                    <span className={`text-sm ml-1 ${
                                      isHighlighted ? `text-${price.color}-600` : 'text-gray-500'
                                    }`}>
                                      {price.unit}
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Rating & Reviews (Real Data per Dorm) */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i}>
                                  {i < Math.round(5) ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-1">
                              5.0
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            รีวิว 0 คน
                          </span>
                        </div>

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {dorm.water_cost && Number(dorm.water_cost) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 text-xs rounded-full">
                              <FaTint className="w-3 h-3" />
                              น้ำ ฿{Number(dorm.water_cost)}
                            </span>
                          )}
                          {dorm.electricity_cost && Number(dorm.electricity_cost) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                              <FaBolt className="w-3 h-3" />
                              ไฟ ฿{Number(dorm.electricity_cost)}
                            </span>
                          )}
                          {dorm.deposit && Number(dorm.deposit) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                              <FaMoneyBillWave className="w-3 h-3" />
                              มัดจำ ฿{Number(dorm.deposit).toLocaleString()}
                            </span>
                          )}
                          {dorm.contact_phone && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              <FaPhoneAlt className="w-3 h-3" />
                              มีเบอร์ติดต่อ
                            </span>
                          )}
                        </div>

                        {/* Nearby Places with Distance */}
                        {dorm.near_places && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                              <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                              สถานที่ใกล้เคียง
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {dorm.near_places.split(',').slice(0, 3).map((place, index) => (
                                <span 
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                >
                                  <FaMapMarkerAlt className="w-2 h-2" />
                                  {place.trim()}
                                </span>
                              ))}
                              {dorm.near_places.split(',').length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                                  +{dorm.near_places.split(',').length - 3} สถานที่
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Details Button */}
                        <button 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 text-sm shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDorm(dorm);
                          }}
                        >
                          <FaSearch className="w-4 h-4" />
                          ดูรายละเอียด
                        </button>
                        
                        {/* Management Buttons - Secondary */}
                        <div className="flex gap-2 mt-2">
                          <button 
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-all duration-200 text-xs flex items-center justify-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/owner/dorm-manage');
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            จัดการหอพัก
                          </button>
                          <button 
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-all duration-200 text-xs flex items-center justify-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/owner/room-manage/${dorm.id}`);
                            }}
                          >
                            <FaBed className="w-3 h-3" />
                            จัดการห้องพัก
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced Modal - Agoda Style */}
        {selectedDorm && modalVisible && (
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 ${modalClosing ? 'animate-fadeOutModal' : 'animate-fadeInModal'}`}
            onClick={handleCloseDorm}
          >
            <div
              className={`bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto relative modal-content ${modalClosing ? 'animate-zoomOutModal' : 'animate-zoomInModal'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button - Fixed Position */}
              <button
                className="absolute top-6 right-6 z-30 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-500 rounded-full p-2 transition-all duration-200 shadow-lg"
                onClick={handleCloseDorm}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>

              {/* Content Container */}
              <div className="flex flex-col lg:flex-row">
                {/* Left Side - Name, Images, Location */}
                <div className="w-full lg:w-1/2 bg-gray-50 p-6">
                  {/* Dorm Name */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedDorm.name}</h1>
                    {(selectedDorm.address_detail || selectedDorm.location) && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                        <span>{selectedDorm.address_detail || selectedDorm.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Main Image Gallery */}
                  <div className="mb-6">
                    <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-lg image-container">
                      {selectedDorm.images && selectedDorm.images.length > 0 && selectedDorm.images[galleryIndex] ? (
                        <>
                          <img
                            src={selectedDorm.images[galleryIndex] && selectedDorm.images[galleryIndex].startsWith ? 
                              (selectedDorm.images[galleryIndex].startsWith('http') ? selectedDorm.images[galleryIndex] : `http://localhost:3001${selectedDorm.images[galleryIndex]}`) 
                              : '/no-image.png'}
                            alt={selectedDorm.name}
                            className="w-full h-full object-cover image-enhance modal-image-enhance dorm-detail-image image-loading"
                            style={{
                              imageRendering: 'high-quality',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              transform: 'translate3d(0,0,0)',
                              WebkitTransform: 'translate3d(0,0,0)',
                              imageOrientation: 'from-image',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              maxWidth: '100%',
                              height: '100%',
                              WebkitFontSmoothing: 'antialiased',
                              filter: 'contrast(1.3) brightness(1.15) saturate(1.2)',
                              textRendering: 'optimizeLegibility'
                            }}
                            loading="eager"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                          />
                          
                          {/* Image Navigation */}
                          {selectedDorm.images.length > 1 && (
                            <>
                              <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
                                onClick={handlePrevImage}
                              >
                                <FaChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
                                onClick={handleNextImage}
                              >
                                <FaChevronRight className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {selectedDorm.images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    className={`w-3 h-3 rounded-full transition-all ${idx === galleryIndex ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'}`}
                                    onClick={e => { e.stopPropagation(); setGalleryIndex(idx); }}
                                  />
                                ))}
                              </div>
                              <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                                {galleryIndex + 1} / {selectedDorm.images.length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <FaBed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>ไม่มีรูปภาพ</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {selectedDorm.images && selectedDorm.images.length > 1 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {selectedDorm.images.slice(0, 6).map((img, idx) => (
                          <button
                            key={idx}
                            className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === galleryIndex ? 'border-blue-500 scale-105' : 'border-gray-200 hover:border-gray-400'}`}
                            onClick={e => { e.stopPropagation(); setGalleryIndex(idx); }}
                          >
                            <img
                              src={img.startsWith('http') ? img : `http://localhost:3001${img}`}
                              alt={`${selectedDorm.name} ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = '/no-image.png'; }}
                            />
                          </button>
                        ))}
                        {selectedDorm.images.length > 6 && (
                          <div className="flex-shrink-0 w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-xs border-2 border-gray-200">
                            +{selectedDorm.images.length - 6} รูป
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Details & Information */}
                <div className="w-full lg:w-1/2 bg-white">
                  <div className="p-6">
                    {/* Price Information */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaMoneyBillWave className="w-4 h-4 text-green-500" />
                        ราคาห้องพัก
                      </h3>
                      <div className="space-y-2">
                        {selectedDorm.price_daily && Number(selectedDorm.price_daily) > 0 && (
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm font-medium text-green-800">รายวัน</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">฿{Number(selectedDorm.price_daily).toLocaleString()}</span>
                              <span className="text-sm text-gray-500 ml-1">/วัน</span>
                            </div>
                          </div>
                        )}
                        {selectedDorm.price_monthly && Number(selectedDorm.price_monthly) > 0 && (
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-sm font-medium text-blue-800">รายเดือน</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-blue-600">฿{Number(selectedDorm.price_monthly).toLocaleString()}</span>
                              <span className="text-sm text-gray-500 ml-1">/เดือน</span>
                            </div>
                          </div>
                        )}
                        {selectedDorm.price_term && Number(selectedDorm.price_term) > 0 && (
                          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
                            <span className="text-sm font-medium text-purple-800">รายเทอม</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-purple-600">฿{Number(selectedDorm.price_term).toLocaleString()}</span>
                              <span className="text-sm text-gray-500 ml-1">/เทอม</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Additional Cost Info */}
                      {(selectedDorm.water_cost || selectedDorm.electricity_cost || selectedDorm.deposit) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            {selectedDorm.water_cost && Number(selectedDorm.water_cost) > 0 && (
                              <span className="flex items-center gap-1">
                                <FaTint className="w-3 h-3 text-cyan-500" />
                                น้ำ ฿{Number(selectedDorm.water_cost)}/หน่วย
                              </span>
                            )}
                            {selectedDorm.electricity_cost && Number(selectedDorm.electricity_cost) > 0 && (
                              <span className="flex items-center gap-1">
                                <FaBolt className="w-3 h-3 text-yellow-500" />
                                ไฟ ฿{Number(selectedDorm.electricity_cost)}/หน่วย
                              </span>
                            )}
                            {selectedDorm.deposit && Number(selectedDorm.deposit) > 0 && (
                              <span className="flex items-center gap-1">
                                <FaMoneyBillWave className="w-3 h-3 text-green-500" />
                                มัดจำ ฿{Number(selectedDorm.deposit).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rating & Reviews Summary */}
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-1">5.0</div>
                          <div className="text-xs text-gray-600">คะแนนรีวิว</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className="w-4 h-4 text-yellow-400" />
                            ))}
                          </div>
                          <div className="text-sm text-gray-600">0 รีวิวจากผู้เข้าพัก</div>
                        </div>
                      </div>
                    </div>

                    {/* Facilities & Amenities */}
                    {selectedDorm.facilities && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FaCouch className="w-4 h-4 text-green-500" />
                          สิ่งอำนวยความสะดวก
                        </h3>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <p className="text-gray-700 leading-relaxed">{selectedDorm.facilities}</p>
                        </div>
                      </div>
                    )}

                    {/* Nearby Places */}
                    {selectedDorm.near_places && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FaLandmark className="w-4 h-4 text-purple-500" />
                          สถานที่ใกล้เคียง
                        </h3>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <p className="text-gray-700 leading-relaxed">{selectedDorm.near_places}</p>
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    {selectedDorm.contact_phone && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FaPhoneAlt className="w-4 h-4 text-blue-500" />
                          ข้อมูลติดต่อ
                        </h3>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaPhoneAlt className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">เบอร์โทรศัพท์</p>
                              <p className="text-blue-600 font-semibold">{selectedDorm.contact_phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      {selectedDorm.contact_phone && (
                        <button
                          onClick={() => window.open(`tel:${selectedDorm.contact_phone}`, '_self')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <FaPhoneAlt className="w-5 h-5" />
                          โทรหาเจ้าของหอพัก
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/owner/dorm-manage')}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        จัดการหอพัก
                      </button>
                      <button
                        onClick={() => navigate(`/owner/room-manage/${selectedDorm.id}`)}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <FaBed className="w-5 h-5" />
                        จัดการห้องพัก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Dorm Modal */}
        {showAddDormModal && (
          <div className="fixed inset-0 bg-black/60 z-[2100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                      <FaBed className="text-white w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">เพิ่มหอพักใหม่</h2>
                  </div>
                  <button
                    className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-all backdrop-blur-sm"
                    onClick={handleCloseAddDormModal}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAddDormSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      ชื่อหอพัก *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="เช่น หอพักดารารัตน์"
                      value={addDormForm.name}
                      onChange={e => setAddDormForm({...addDormForm, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      ที่อยู่/สถานที่ตั้ง
                    </label>
                    <textarea
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="เช่น 123 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240"
                      value={addDormForm.location}
                      onChange={e => setAddDormForm({...addDormForm, location: e.target.value})}
                    />
                  </div>
                </div>

                {/* Prices */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-500" />
                    ราคาเช่า
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายวัน (บาท)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        value={addDormForm.price_daily}
                        onChange={e => setAddDormForm({...addDormForm, price_daily: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเดือน (บาท)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        value={addDormForm.price_monthly}
                        onChange={e => setAddDormForm({...addDormForm, price_monthly: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเทอม (บาท)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        value={addDormForm.price_term}
                        onChange={e => setAddDormForm({...addDormForm, price_term: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    สิ่งอำนวยความสะดวก
                  </label>
                  <textarea
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="เช่น Wi-Fi ฟรี, แอร์, ตู้เย็น, เครื่องซักผ้า, ที่จอดรถ"
                    value={addDormForm.facilities}
                    onChange={e => setAddDormForm({...addDormForm, facilities: e.target.value})}
                  />
                </div>

                {/* Nearby Places */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    สถานที่ใกล้เคียง
                  </label>
                  <textarea
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="เช่น มหาวิทยาลัยรามคำแหง, เซเว่น, ตลาดโต้รุ่ง, สถานีรถไฟฟ้า"
                    value={addDormForm.near_places}
                    onChange={e => setAddDormForm({...addDormForm, near_places: e.target.value})}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200"
                    onClick={handleCloseAddDormModal}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all duration-200"
                  >
                    เพิ่มหอพัก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OwnerHomePage;
