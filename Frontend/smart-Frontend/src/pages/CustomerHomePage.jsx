import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaHome, 
  FaMoneyBillWave, 
  FaMapMarkerAlt, 
  FaWifi, 
  FaUniversity, 
  FaBuilding, 
  FaDoorOpen, 
  FaChevronLeft, 
  FaChevronRight, 
  FaTint, 
  FaBolt, 
  FaPhoneAlt, 
  FaStar,
  FaGraduationCap,
  FaShoppingBag,
  FaCar,
  FaSnowflake,
  FaShower,
  FaBed,
  FaTv,
  FaGamepad,
  FaShieldAlt,
  FaArrowUp,
  FaUtensils,
  FaCoffee,
  FaLandmark,
  FaCheck,
  FaChevronDown,
  FaFilter,
  FaCog,
  FaBook,
  FaHospital,
  FaShoppingCart,
  FaClock
} from 'react-icons/fa';
import Header from '../components/Header';
import ChatbotWidget from '../components/ChatbotWidget';
import useDormsRealtime from '../hooks/useDormsRealtime';
import '../components/ChatbotWidgetCircle.css';
import '../components/DormDetailModal.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

function CustomerHomePage() {
  const dorms = useDormsRealtime();
  const [showChatbot, setShowChatbot] = useState(false);
  const [minimizeChatbot, setMinimizeChatbot] = useState(false);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // State สำหรับฟอร์มค้นหา
  const [searchName, setSearchName] = useState('');
  const [searchPrice, setSearchPrice] = useState('');
  const [searchNearPlaces, setSearchNearPlaces] = useState('');
  const [searchFacility, setSearchFacility] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // State สำหรับรีวิว
  const [_dormReviews, setDormReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [_loadingReviews, setLoadingReviews] = useState(false);
  const [_showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    cleanliness_rating: 5,
    location_rating: 5,
    value_rating: 5,
    service_rating: 5
  });

  const filteredDorms = dorms;

  useEffect(() => {
    if (selectedDorm && selectedDorm.images && selectedDorm.images.length > 0) {
      setCurrentImgIdx(0);
    }
  }, [selectedDorm]);

  // ดึงรีวิวเมื่อเปิด modal
  const fetchReviews = async (dormId) => {
    setLoadingReviews(true);
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        fetch(`http://localhost:3001/dorms/${dormId}/reviews`),
        fetch(`http://localhost:3001/dorms/${dormId}/reviews/stats`)
      ]);
      
      if (reviewsRes.ok && statsRes.ok) {
        const reviews = await reviewsRes.json();
        const stats = await statsRes.json();
        setDormReviews(reviews);
        setReviewStats(stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // ส่งรีวิว
  const _handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    if (!token) {
      alert('กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/dorms/${selectedDorm.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewForm)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('เขียนรีวิวสำเร็จแล้ว');
        setShowReviewForm(false);
        setReviewForm({
          rating: 5,
          comment: '',
          cleanliness_rating: 5,
          location_rating: 5,
          value_rating: 5,
          service_rating: 5
        });
        // ดึงรีวิวใหม่
        fetchReviews(selectedDorm.id);
      } else {
        alert(result.error || 'เกิดข้อผิดพลาดในการส่งรีวิว');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // แสดงดาว
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        className={`w-4 h-4 ${i < (rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };


  // เมื่อมีการค้นหาหอพักแบบปกติ ให้ย่อ chatbot เป็นวงกลม
  const handleSearch = (e) => {
    e.preventDefault();
    let result = dorms;

    // ค้นหาตามชื่อ
    if (searchName.trim()) {
      const name = searchName.trim().toLowerCase();
      result = result.filter(d => d.name && d.name.toLowerCase().includes(name));
    }

    // ค้นหาตามราคา (รายวัน, เดือน, เทอม)
    if (searchPrice.trim()) {
      const price = Number(searchPrice);
      result = result.filter(d => 
        (d.price_daily && Number(d.price_daily) <= price) ||
        (d.price_monthly && Number(d.price_monthly) <= price) ||
        (d.price_term && Number(d.price_term) <= price)
      );
    }

    // ค้นหาตามสถานที่ใกล้เคียง
    if (searchNearPlaces.trim()) {
      const near = searchNearPlaces.trim().toLowerCase();
      result = result.filter(d => d.near_places && d.near_places.toLowerCase().includes(near));
    }

    // ค้นหาตามสิ่งอำนวยความสะดวก
    if (searchFacility.trim()) {
      const fac = searchFacility.trim().toLowerCase();
      result = result.filter(d => d.facilities && d.facilities.toLowerCase().includes(fac));
    }

    setSearchResult(result);
    setMinimizeChatbot(true); // ย่อ chatbot เป็นวงกลม
  };

  // เมื่อกดดูรายละเอียด dorm
  const handleOpenDorm = (dorm) => {
    setSelectedDorm(dorm);
    setModalVisible(true);
    setModalClosing(false);
    // ดึงรีวิวเมื่อเปิด modal
    fetchReviews(dorm.id);
  };

  // เมื่อกดปิด modal
  const handleCloseDorm = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModalVisible(false);
      setSelectedDorm(null);
      setModalClosing(false);
    }, 200); // รอ fadeOutModal จบ (200ms)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative">
      <Header />
      {/* ฟอร์มค้นหาแบบปกติ */}
      <div className="w-full max-w-7xl mx-auto mt-8 px-4 md:px-8 flex flex-col items-center justify-center">
        <form
          className="w-full bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row gap-4 items-center justify-center border border-gray-200"
          onSubmit={handleSearch}
        >
          <div className="relative w-full md:w-48">
            <FaHome className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
            <input
              className="border border-gray-300 rounded-lg px-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              type="text"
              placeholder="ชื่อหอพัก"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-40">
            <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
            <input
              className="border border-gray-300 rounded-lg px-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              type="number"
              placeholder="ราคาไม่เกิน (บาท)"
              value={searchPrice}
              onChange={e => setSearchPrice(e.target.value)}
              min="0"
            />
          </div>
          <div className="relative w-full md:w-40">
            <FaUniversity className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" />
            <input
              className="border border-gray-300 rounded-lg px-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              type="text"
              placeholder="สถานที่ใกล้เคียง"
              value={searchNearPlaces}
              onChange={e => setSearchNearPlaces(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-48">
            <FaWifi className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
            <input
              className="border border-gray-300 rounded-lg px-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              type="text"
              placeholder="สิ่งอำนวยความสะดวก"
              value={searchFacility}
              onChange={e => setSearchFacility(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-lg flex items-center gap-2"
          >
            <FaSearch />
            ค้นหา
          </button>
        </form>
      </div>
      {/* Hero Section แชทบอต */}
      {!minimizeChatbot && (
        <div className="w-full max-w-7xl mx-auto mt-10 px-4 md:px-8 flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-700 rounded-3xl shadow-2xl relative mb-12 border-4 border-white overflow-hidden chatbot-hero-animate">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-300 opacity-30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-indigo-400 opacity-20 rounded-full blur-2xl animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-4 text-center tracking-tight">Smart Dorm Chatbot</h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8 text-center max-w-2xl font-medium">
            ผู้ช่วย <span className="font-bold text-yellow-200">AI</span> อัจฉริยะสำหรับการค้นหาหอพัก<br/>
            <span className="text-cyan-100">ถาม-ตอบ เปรียบเทียบ ค้นหาทำเล ราคาถูก รีวิว</span> ได้ทันที<br/>
            <span className="italic text-yellow-100">“ค้นหาหอพักที่ใช่ ด้วยเทคโนโลยีที่ล้ำสมัย”</span>
          </p>
          <button
            className="mx-auto mt-2 px-10 py-5 bg-gradient-to-r from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-blue-900 font-extrabold text-2xl rounded-full shadow-2xl transition-all duration-200 animate-bounce border-2 border-yellow-200"
            onClick={() => setShowChatbot(true)}
          >
            เริ่มต้นคุยกับแชทบอตอัจฉริยะ
          </button>
          <div className="absolute top-4 right-8 hidden md:block animate-pulse">
            <svg width="80" height="80" fill="none" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" stroke="#fff" strokeWidth="4" opacity="0.2"/><circle cx="40" cy="40" r="26" stroke="#fff" strokeWidth="2" opacity="0.4"/></svg>
          </div>
        </div>
      )}
      {/* วงกลม chatbot */}
      {minimizeChatbot && (
        <div className="chatbot-circle-btn" onClick={() => setMinimizeChatbot(false)} title="เปิด Smart Dorm Chatbot">
          <svg width="36" height="36" fill="none" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#06b6d4" opacity="0.8"/><path d="M12 24h12M14 20h8M16 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      )}
      <div className="w-full max-w-7xl mx-auto mt-10 px-4 md:px-8 flex-1">
        <h2 className="text-3xl font-extrabold mb-8 text-gray-800 tracking-tight border-l-4 border-orange-400 pl-6 bg-white py-4 rounded-xl shadow-md flex items-center gap-3">
          <FaHome className="text-orange-400 w-8 h-8" />
          ผลการค้นหาหอพัก
        </h2>
        {(searchResult !== null ? searchResult : filteredDorms).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(searchResult !== null ? searchResult : filteredDorms).map((dorm, index) => (
              <div 
                key={dorm.id} 
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 group cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleOpenDorm(dorm)}
              >
                {/* Image Section */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={
                      dorm.images && dorm.images.length > 0
                        ? (dorm.images[0].startsWith('http')
                            ? dorm.images[0]
                            : `http://localhost:3001${dorm.images[0]}`)
                        : '/no-image.png'
                    }
                    alt={dorm.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = '/no-image.png'; }}
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
                    {dorm.price_monthly && Number(dorm.price_monthly) > 0 ? (
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        ฿{Number(dorm.price_monthly).toLocaleString()}
                      </div>
                    ) : dorm.price_daily && Number(dorm.price_daily) > 0 ? (
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        ฿{Number(dorm.price_daily).toLocaleString()}/วัน
                      </div>
                    ) : dorm.price_term && Number(dorm.price_term) > 0 ? (
                      <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        ฿{Number(dorm.price_term).toLocaleString()}/เทอม
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {dorm.name}
                  </h3>
                  
                  {/* Location */}
                  {dorm.address_detail && (
                    <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                      <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{dorm.address_detail}</span>
                    </div>
                  )}

                  {/* Facilities */}
                  {dorm.facilities && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <FaWifi className="text-indigo-500 flex-shrink-0" />
                      <span className="line-clamp-1">{dorm.facilities}</span>
                    </div>
                  )}

                  {/* Price Section - Agoda Style */}
                  <div className="space-y-2 mb-4">
                    {dorm.price_monthly && Number(dorm.price_monthly) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">รายเดือน</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-blue-600">฿{Number(dorm.price_monthly).toLocaleString()}</span>
                          <span className="text-sm text-gray-500 ml-1">/เดือน</span>
                        </div>
                      </div>
                    )}
                    {dorm.price_daily && Number(dorm.price_daily) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">รายวัน</span>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-green-600">฿{Number(dorm.price_daily).toLocaleString()}</span>
                          <span className="text-sm text-gray-500 ml-1">/วัน</span>
                        </div>
                      </div>
                    )}
                    {dorm.price_term && Number(dorm.price_term) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">รายเทอม</span>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-purple-600">฿{Number(dorm.price_term).toLocaleString()}</span>
                          <span className="text-sm text-gray-500 ml-1">/เทอม</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating & Reviews (Real Data) */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < Math.round(reviewStats?.average_rating || 5) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-1">
                        {reviewStats?.average_rating ? reviewStats.average_rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      รีวิว {reviewStats?.total_reviews || 0} คน
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
                    {dorm.contact_phone && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        <FaPhoneAlt className="w-3 h-3" />
                        มีเบอร์ติดต่อ
                      </span>
                    )}
                  </div>

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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="col-span-full text-center text-gray-400 text-lg">ไม่พบหอพักที่ตรงกับเงื่อนไข</p>
        )}
      </div>
      {/* Dorm Detail Modal - Agoda Style */}
      {selectedDorm && modalVisible && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 ${modalClosing ? 'animate-fadeOutModal' : 'animate-fadeInModal'}`}
          onClick={handleCloseDorm}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden relative ${modalClosing ? 'animate-zoomOutModal' : 'animate-zoomInModal'}`}
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

            {/* Top Header - Agoda Style */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 pr-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FaHome className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDorm.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        {renderStars(reviewStats?.average_rating || 5)}
                        <span className="font-semibold text-gray-700">
                          {reviewStats?.average_rating ? reviewStats.average_rating.toFixed(1) : '5.0'}
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{reviewStats?.total_reviews || 0} รีวิว</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Price Display - Agoda Style */}
              <div className="text-right">
                {selectedDorm.price_monthly && Number(selectedDorm.price_monthly) > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      ฿{Number(selectedDorm.price_monthly).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">ต่อเดือน</div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Container */}
            <div className="flex overflow-hidden max-h-[calc(95vh-80px)]">
              {/* Left Side - Name, Images, Location */}
              <div className="w-1/2 bg-gray-50 p-6">
                {/* Dorm Name */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedDorm.name}</h1>
                  {selectedDorm.address_detail && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                      <span>{selectedDorm.address_detail}</span>
                    </div>
                  )}
                </div>

                {/* Main Image Gallery */}
                <div className="mb-6">
                  <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                    {selectedDorm.images && selectedDorm.images.length > 0 ? (
                      <>
                        <img
                          src={selectedDorm.images[currentImgIdx].startsWith('http') ? selectedDorm.images[currentImgIdx] : `http://localhost:3001${selectedDorm.images[currentImgIdx]}`}
                          alt={selectedDorm.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = '/no-image.png'; }}
                        />
                        
                        {/* Image Navigation - Agoda Style */}
                        {selectedDorm.images.length > 1 && (
                          <>
                            <button
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
                              onClick={e => { e.stopPropagation(); setCurrentImgIdx((currentImgIdx - 1 + selectedDorm.images.length) % selectedDorm.images.length); }}
                            >
                              <FaChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
                              onClick={e => { e.stopPropagation(); setCurrentImgIdx((currentImgIdx + 1) % selectedDorm.images.length); }}
                            >
                              <FaChevronRight className="w-4 h-4" />
                            </button>
                            
                            {/* Image Counter - Agoda Style */}
                            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                              {currentImgIdx + 1} / {selectedDorm.images.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <FaHome className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">ไม่มีรูปภาพ</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip - Agoda Style */}
                  {selectedDorm.images && selectedDorm.images.length > 1 && (
                    <div className="mt-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedDorm.images.slice(0, 6).map((image, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImgIdx(idx)}
                            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                              idx === currentImgIdx 
                                ? 'border-blue-500 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}  
                          >
                            <img
                              src={image.startsWith('http') ? image : `http://localhost:3001${image}`}
                              alt={`${selectedDorm.name} ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = '/no-image.png'; }}
                            />
                          </button>
                        ))}
                        {selectedDorm.images.length > 6 && (
                          <div className="flex-shrink-0 w-16 h-12 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                            +{selectedDorm.images.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Details & Information */}
              <div className="w-1/2 overflow-y-auto bg-white">
                <div className="p-6">
                  {/* Rating & Reviews Summary - Agoda Style */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {reviewStats?.average_rating ? reviewStats.average_rating.toFixed(1) : '5.0'}
                        </div>
                        <div className="text-xs text-gray-600">คะแนนรีวิว</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          {renderStars(reviewStats?.average_rating || 5)}
                        </div>
                        <div className="text-sm text-gray-600">{reviewStats?.total_reviews || 0} รีวิวจากผู้เข้าพัก</div>
                      </div>
                    </div>
                  </div>

                  {/* Room Options - Agoda Style */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">เลือกห้องพัก</h3>
                    
                    {/* Price Options */}
                    <div className="space-y-3">
                      {selectedDorm.price_monthly && Number(selectedDorm.price_monthly) > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">ห้องพักรายเดือน</h4>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">แนะนำ</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">เหมาะสำหรับนักศึกษา • ราคาคุ้มค่า</p>
                              
                              {/* Facilities Icons */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  <FaWifi className="w-3 h-3" />
                                  WiFi
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  <FaTint className="w-3 h-3" />
                                  น้ำ ฿{selectedDorm.water_cost || '6'}/หน่วย
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  <FaBolt className="w-3 h-3" />
                                  ไฟ ฿{selectedDorm.electricity_cost || '8'}/หน่วย
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-blue-600">
                                ฿{Number(selectedDorm.price_monthly).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">ต่อเดือน</div>
                              <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                เลือก
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedDorm.price_daily && Number(selectedDorm.price_daily) > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">ห้องพักรายวัน</h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">สำหรับพักระยะสั้น • ยืดหยุ่น</p>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-green-600">
                                ฿{Number(selectedDorm.price_daily).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">ต่อวัน</div>
                              <button className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                เลือก
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedDorm.price_term && Number(selectedDorm.price_term) > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">ห้องพักรายเทอม</h4>
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">ประหยัด</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">ลดราคาพิเศษ • ชำระครั้งเดียว</p>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-purple-600">
                                ฿{Number(selectedDorm.price_term).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">ต่อเทอม</div>
                              <button className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                เลือก
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Facilities & Amenities - Agoda Style */}
                  {(selectedDorm.facilities_wifi || selectedDorm.facilities_parking || selectedDorm.facilities_security || selectedDorm.facilities_washing_machine || selectedDorm.facilities_air_conditioner) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDorm.facilities_wifi === 'มี' && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FaWifi className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">WiFi ฟรี</span>
                            <FaCheck className="w-3 h-3 text-green-600 ml-auto" />
                          </div>
                        )}
                        
                        {selectedDorm.facilities_parking === 'มี' && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FaCar className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">ที่จอดรถ</span>
                            <FaCheck className="w-3 h-3 text-green-600 ml-auto" />
                          </div>
                        )}
                        
                        {selectedDorm.facilities_security === 'มี' && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FaShieldAlt className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">รักษาความปลอดภัย</span>
                            <FaCheck className="w-3 h-3 text-green-600 ml-auto" />
                          </div>
                        )}
                        
                        {selectedDorm.facilities_air_conditioner === 'มี' && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FaArrowUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">แอร์</span>
                            <FaCheck className="w-3 h-3 text-green-600 ml-auto" />
                          </div>
                        )}
                        
                        {selectedDorm.facilities_washing_machine === 'มี' && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FaCog className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">เครื่องซักผ้า</span>
                            <FaCheck className="w-3 h-3 text-green-600 ml-auto" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Nearby Places - Agoda Style */}
                  {(selectedDorm.nearby_university || selectedDorm.nearby_school || selectedDorm.nearby_hospital || selectedDorm.nearby_market) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานที่ใกล้เคียง</h3>
                      
                      <div className="space-y-3">
                        {selectedDorm.nearby_university && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <FaGraduationCap className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-blue-900">{selectedDorm.nearby_university}</span>
                            </div>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">มหาวิทยาลัย</span>
                          </div>
                        )}
                        
                        {selectedDorm.nearby_school && (
                          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <FaBook className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="font-medium text-purple-900">{selectedDorm.nearby_school}</span>
                            </div>
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">โรงเรียน</span>
                          </div>
                        )}
                        
                        {selectedDorm.nearby_hospital && (
                          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <FaHospital className="w-4 h-4 text-red-600" />
                              </div>
                              <span className="font-medium text-red-900">{selectedDorm.nearby_hospital}</span>
                            </div>
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">โรงพยาบาล</span>
                          </div>
                        )}
                        
                        {selectedDorm.nearby_market && (
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <FaShoppingCart className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-medium text-green-900">{selectedDorm.nearby_market}</span>
                            </div>
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">ตลาด/ร้านค้า</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Facilities */}
                  {selectedDorm.facilities && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaWifi className="w-5 h-5 text-blue-600" />
                        สิ่งอำนวยความสะดวก
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedDorm.facilities.split(',').map((facility, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">{facility.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nearby Places */}
                  {selectedDorm.near_places && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaLandmark className="w-5 h-5 text-purple-600" />
                        สถานที่ใกล้เคียง
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedDorm.near_places.split(',').map((place, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                          >
                            <FaMapMarkerAlt className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">{place.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar - Agoda Style */}
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedDorm.price_monthly && Number(selectedDorm.price_monthly) > 0 ? (
                      <>฿{Number(selectedDorm.price_monthly).toLocaleString()}</>
                    ) : selectedDorm.price_daily && Number(selectedDorm.price_daily) > 0 ? (
                      <>฿{Number(selectedDorm.price_daily).toLocaleString()}</>
                    ) : selectedDorm.price_term && Number(selectedDorm.price_term) > 0 ? (
                      <>฿{Number(selectedDorm.price_term).toLocaleString()}</>
                    ) : (
                      'ติดต่อสอบถาม'
                    )}
                  </div>
                  {selectedDorm.price_monthly && Number(selectedDorm.price_monthly) > 0 && (
                    <div className="text-sm text-gray-500">
                      ต่อเดือน • รวมค่าน้ำ-ไฟ
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {selectedDorm.contact_phone && (
                    <a
                      href={`tel:${selectedDorm.contact_phone}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <FaPhoneAlt className="w-4 h-4" />
                      โทรติดต่อ: {selectedDorm.contact_phone}
                    </a>
                  )}
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FaShieldAlt className="w-3 h-3 text-green-500" />
                      ปลอดภัยและเชื่อถือได้
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3 text-blue-500" />
                      ตอบกลับเร็ว
                    </span>
                  </div>
                  <div className="text-xs">
                    อัปเดตล่าสุด: วันนี้
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full max-w-7xl mx-auto mt-16 py-8 text-center text-gray-500 text-sm px-4 md:px-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FaHome className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700">Smart Dorm</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span>© {new Date().getFullYear()} Smart Dorm Platform</span>
            <span>•</span>
            <span>เพื่อประสบการณ์การหาหอพักที่ดีที่สุด</span>
            <span>•</span>
            <span className="text-blue-500">Inspired by Agoda</span>
          </div>
        </div>
      </footer>
      {showChatbot && <ChatbotWidget onClose={() => setShowChatbot(false)} />}
    </div>
  );
}

export default CustomerHomePage;