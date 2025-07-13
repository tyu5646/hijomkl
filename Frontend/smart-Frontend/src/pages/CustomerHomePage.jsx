import React, { useState, useEffect } from 'react';
import { FaSearch, FaBed, FaMoneyBillWave, FaMapMarkerAlt, FaCouch, FaLandmark, FaBuilding, FaDoorOpen, FaChevronLeft, FaChevronRight, FaWater, FaBolt, FaPhone } from 'react-icons/fa';
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

  const filteredDorms = dorms;

  useEffect(() => {
    if (selectedDorm && selectedDorm.images && selectedDorm.images.length > 0) {
      setCurrentImgIdx(0);
    }
  }, [selectedDorm]);


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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 flex flex-col relative">
      <Header />
      {/* ฟอร์มค้นหาแบบปกติ */}
      <div className="w-full max-w-7xl mx-auto mt-8 px-4 md:px-8 flex flex-col items-center justify-center">
        <form
          className="w-full bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-4 items-center justify-center border-2 border-blue-100"
          onSubmit={handleSearch}
        >
          <div className="relative w-full md:w-48">
            <FaBed className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
            <input
              className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              type="text"
              placeholder="ชื่อหอพัก"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-40">
            <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-green-300" />
            <input
              className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              type="number"
              placeholder="ราคาไม่เกิน (บาท)"
              value={searchPrice}
              onChange={e => setSearchPrice(e.target.value)}
              min="0"
            />
          </div>
          <div className="relative w-full md:w-40">
            <FaLandmark className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
            <input
              className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              type="text"
              placeholder="สถานที่ใกล้เคียง"
              value={searchNearPlaces}
              onChange={e => setSearchNearPlaces(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-48">
            <FaCouch className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300" />
            <input
              className="border border-blue-200 rounded-lg px-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              type="text"
              placeholder="สิ่งอำนวยความสะดวก (เช่น แอร์)"
              value={searchFacility}
              onChange={e => setSearchFacility(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-8 py-2 rounded-lg font-bold shadow hover:from-cyan-400 hover:to-blue-500 transition-all text-lg flex items-center gap-2"
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
        <h2 className="text-3xl font-extrabold mb-8 text-blue-700 tracking-tight border-l-8 border-orange-400 pl-6 bg-white py-4 rounded-2xl shadow-lg flex items-center gap-3">
          <FaBed className="text-orange-400 w-8 h-8" />
          ผลการค้นหาหอพัก
        </h2>
        {(searchResult !== null ? searchResult : filteredDorms).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(searchResult !== null ? searchResult : filteredDorms).map((dorm, index) => (
              <div 
                key={dorm.id} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 group cursor-pointer transform hover:-translate-y-1"
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
                      <FaCouch className="text-blue-500 flex-shrink-0" />
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

                  {/* Rating & Reviews (Mock) */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(4)}{'☆'.repeat(1)}
                      </div>
                      <span className="text-sm text-gray-600 ml-1">4.0</span>
                    </div>
                    <span className="text-xs text-gray-500">รีวิว {Math.floor(Math.random() * 50) + 10} คน</span>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dorm.water_cost && Number(dorm.water_cost) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 text-xs rounded-full">
                        <FaWater className="w-3 h-3" />
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
                        <FaPhone className="w-3 h-3" />
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
      {/* Dorm Detail Modal */}
      {selectedDorm && modalVisible && (
        <div
          className={`fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center ${modalClosing ? 'animate-fadeOutModal' : 'animate-fadeInModal'}`}
          onClick={handleCloseDorm}
        >
          <div
            className={`bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex overflow-hidden relative ${modalClosing ? 'animate-zoomOutModal' : 'animate-zoomInModal'}`}
            style={{ minHeight: '420px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ซ้าย: รูปเด่น (Gallery/Slider) และแผนที่ */}
            <div className="w-[340px] min-w-[240px] bg-gray-50 flex flex-col p-6 relative">
              {/* Image Gallery */}
              <div className="flex items-center justify-center mb-6">
                {selectedDorm.images && selectedDorm.images.length > 0 ? (
                  <>
                    <img
                      src={selectedDorm.images[currentImgIdx].startsWith('http') ? selectedDorm.images[currentImgIdx] : `http://localhost:3001${selectedDorm.images[currentImgIdx]}`}
                      alt={selectedDorm.name}
                      className="w-full h-[260px] object-cover rounded-2xl border-2 border-blue-200 shadow-lg"
                      style={{ maxWidth: 320 }}
                      onError={e => { e.target.src = '/no-image.png'; }}
                    />
                    {selectedDorm.images.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-[140px] -translate-y-1/2 bg-white/80 hover:bg-orange-200 text-orange-600 rounded-full p-2 shadow border-2 border-orange-300 transition-all duration-150"
                          onClick={e => { e.stopPropagation(); setCurrentImgIdx((currentImgIdx - 1 + selectedDorm.images.length) % selectedDorm.images.length); }}
                          style={{ zIndex: 2 }}
                          aria-label="Previous image"
                        >
                          <FaChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          className="absolute right-2 top-[140px] -translate-y-1/2 bg-white/80 hover:bg-orange-200 text-orange-600 rounded-full p-2 shadow border-2 border-orange-300 transition-all duration-150"
                          onClick={e => { e.stopPropagation(); setCurrentImgIdx((currentImgIdx + 1) % selectedDorm.images.length); }}
                          style={{ zIndex: 2 }}
                          aria-label="Next image"
                        >
                          <FaChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-[140px] left-1/2 -translate-x-1/2 flex gap-1">
                          {selectedDorm.images.map((_, idx) => (
                            <span key={idx} className={`inline-block w-2 h-2 rounded-full ${idx === currentImgIdx ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <img
                    src="/no-image.png"
                    alt="no-img"
                    className="w-full h-[260px] object-cover rounded-2xl border-2 border-blue-200 shadow-lg"
                    style={{ maxWidth: 320 }}
                  />
                )}
              </div>

              {/* Location Map Section - ย้ายมาไว้ด้านล่างรูป */}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-red-500">🗺️</span>
                  ตำแหน่งหอพัก
                </h4>
                
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                  {selectedDorm.latitude && selectedDorm.longitude ? (
                    // แสดงแผนที่แบบ embed โดยใช้พิกัด
                    <div className="relative h-[220px]">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(selectedDorm.longitude)-0.005},${parseFloat(selectedDorm.latitude)-0.005},${parseFloat(selectedDorm.longitude)+0.005},${parseFloat(selectedDorm.latitude)+0.005}&layer=mapnik&marker=${selectedDorm.latitude},${selectedDorm.longitude}`}
                        width="100%"
                        height="220"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        title={`แผนที่ ${selectedDorm.name}`}
                      />
                    </div>
                  ) : selectedDorm.address_detail ? (
                    // ใช้ที่อยู่หาแผนที่
                    <div className="relative h-[220px]">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=99.0,13.0,101.0,15.0&layer=mapnik`}
                        width="100%"
                        height="220"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        title={`แผนที่ ${selectedDorm.name}`}
                        onLoad={(e) => {
                          // ค้นหาตำแหน่งด้วย Nominatim API
                          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedDorm.address_detail + ' Thailand')}&limit=1`)
                            .then(response => response.json())
                            .then(data => {
                              if (data && data.length > 0) {
                                const lat = parseFloat(data[0].lat);
                                const lon = parseFloat(data[0].lon);
                                e.target.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.005},${lat-0.005},${lon+0.005},${lat+0.005}&layer=mapnik&marker=${lat},${lon}`;
                              }
                            })
                            .catch(error => console.log('ไม่สามารถหาตำแหน่งได้:', error));
                        }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        🔍 ค้นหาด้วยที่อยู่
                      </div>
                    </div>
                  ) : selectedDorm.name ? (
                    // ใช้ชื่อหอพักหาแผนที่
                    <div className="relative h-[220px]">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=99.0,13.0,101.0,15.0&layer=mapnik`}
                        width="100%"
                        height="220"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        title={`แผนที่ ${selectedDorm.name}`}
                        onLoad={(e) => {
                          // ค้นหาตำแหน่งด้วยชื่อหอพัก
                          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedDorm.name + ' หอพัก Thailand')}&limit=1`)
                            .then(response => response.json())
                            .then(data => {
                              if (data && data.length > 0) {
                                const lat = parseFloat(data[0].lat);
                                const lon = parseFloat(data[0].lon);
                                e.target.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.005},${lat-0.005},${lon+0.005},${lat+0.005}&layer=mapnik&marker=${lat},${lon}`;
                              }
                            })
                            .catch(error => console.log('ไม่สามารถหาตำแหน่งได้:', error));
                        }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        🔍 ค้นหาด้วยชื่อหอพัก
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center bg-gray-100 text-gray-500">
                      <div className="text-center">
                        <span className="text-3xl mb-2 block">📍</span>
                        <p className="text-sm">ไม่มีข้อมูลตำแหน่ง</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Address Info */}
                {selectedDorm.address_detail && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2 text-xs text-blue-800">
                      <span className="text-blue-600 mt-0.5 flex-shrink-0">📍</span>
                      <span className="font-medium leading-tight">{selectedDorm.address_detail}</span>
                    </div>
                    {selectedDorm.latitude && selectedDorm.longitude && (
                      <div className="mt-2 text-xs text-blue-600">
                        พิกัด: {parseFloat(selectedDorm.latitude).toFixed(6)}, {parseFloat(selectedDorm.longitude).toFixed(6)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Navigation Buttons */}
                {(selectedDorm.latitude && selectedDorm.longitude) && (
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDorm.latitude},${selectedDorm.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <span>🧭</span>
                      นำทาง
                    </a>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `ตำแหน่ง ${selectedDorm.name}`,
                            text: `ตำแหน่งหอพัก ${selectedDorm.name}`,
                            url: `https://www.google.com/maps/search/?api=1&query=${selectedDorm.latitude},${selectedDorm.longitude}`
                          });
                        } else {
                          navigator.clipboard.writeText(`${selectedDorm.latitude}, ${selectedDorm.longitude}`);
                          alert('คัดลอกพิกัดแล้ว!');
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <span>📋</span>
                      คัดลอก
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* ขวา: ข้อมูล */}
            <div className="flex-1 p-6 flex flex-col gap-4 justify-start overflow-y-auto max-h-[600px]">
              {/* Header */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FaBed className="text-blue-500" />
                  {selectedDorm.name}
                </h3>
                {selectedDorm.address_detail && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{selectedDorm.address_detail}</span>
                  </div>
                )}
              </div>

              {/* Price Section - Enhanced Agoda Style */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-500" />
                  ราคาห้องพัก
                </h4>
                <div className="space-y-3">
                  {selectedDorm.price_daily && Number(selectedDorm.price_daily) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-700">รายวัน</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-green-600">฿{Number(selectedDorm.price_daily).toLocaleString()}</span>
                        <span className="text-sm text-gray-500 ml-1">/วัน</span>
                      </div>
                    </div>
                  )}
                  {selectedDorm.price_monthly && Number(selectedDorm.price_monthly) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-700">รายเดือน</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">แนะนำ</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-blue-600">฿{Number(selectedDorm.price_monthly).toLocaleString()}</span>
                        <span className="text-sm text-gray-500 ml-1">/เดือน</span>
                      </div>
                    </div>
                  )}
                  {selectedDorm.price_term && Number(selectedDorm.price_term) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-medium text-gray-700">รายเทอม</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">ประหยัด</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-purple-600">฿{Number(selectedDorm.price_term).toLocaleString()}</span>
                        <span className="text-sm text-gray-500 ml-1">/เทอม</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Costs */}
              {(selectedDorm.water_cost > 0 || selectedDorm.electricity_cost > 0 || selectedDorm.deposit > 0) && (
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaBolt className="text-orange-500" />
                    ค่าใช้จ่ายเพิ่มเติม
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedDorm.water_cost && Number(selectedDorm.water_cost) > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <FaWater className="text-cyan-500 w-5 h-5" />
                          <span className="font-medium text-gray-700">ค่าน้ำ</span>
                        </div>
                        <span className="font-bold text-gray-900">฿{Number(selectedDorm.water_cost).toLocaleString()}<span className="text-sm font-normal text-gray-500">/หน่วย</span></span>
                      </div>
                    )}
                    {selectedDorm.electricity_cost && Number(selectedDorm.electricity_cost) > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <FaBolt className="text-yellow-500 w-5 h-5" />
                          <span className="font-medium text-gray-700">ค่าไฟ</span>
                        </div>
                        <span className="font-bold text-gray-900">฿{Number(selectedDorm.electricity_cost).toLocaleString()}<span className="text-sm font-normal text-gray-500">/หน่วย</span></span>
                      </div>
                    )}
                    {selectedDorm.deposit && Number(selectedDorm.deposit) > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <FaBuilding className="text-orange-500 w-5 h-5" />
                          <span className="font-medium text-gray-700">เงินมัดจำ</span>
                        </div>
                        <span className="font-bold text-gray-900">฿{Number(selectedDorm.deposit).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {selectedDorm.facilities && (
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaCouch className="text-green-500" />
                    สิ่งอำนวยความสะดวก
                  </h4>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      {selectedDorm.facilities.split(',').map((facility, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium"
                        >
                          ✓ {facility.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Nearby Places */}
              {selectedDorm.near_places && (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaLandmark className="text-purple-500" />
                    สถานที่ใกล้เคียง
                  </h4>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      {selectedDorm.near_places.split(',').map((place, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium"
                        >
                          📍 {place.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {selectedDorm.contact_phone && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaPhone className="text-gray-600" />
                    ติดต่อเจ้าของหอพัก
                  </h4>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FaPhone className="text-green-600 w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">โทรศัพท์</p>
                        <p className="text-sm text-gray-600">พร้อมให้คำปรึกษา</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedDorm.contact_phone}`}
                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
                    >
                      <FaPhone className="w-4 h-4" />
                      {selectedDorm.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2">
                  <span>💬</span>
                  สอบถามข้อมูล
                </button>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 bg-white/80 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full p-2 shadow transition-all z-10"
              onClick={handleCloseDorm}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
      <footer className="w-full max-w-7xl mx-auto mt-16 py-8 text-center text-gray-400 text-base px-4 md:px-8 border-t border-blue-100">
        © {new Date().getFullYear()} Smart Dorm | Inspired by Agoda
      </footer>
      {showChatbot && <ChatbotWidget onClose={() => setShowChatbot(false)} />}
    </div>
  );
}

export default CustomerHomePage;