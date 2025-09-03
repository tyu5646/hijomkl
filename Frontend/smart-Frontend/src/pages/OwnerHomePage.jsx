import React, { useEffect, useState } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { FaBed, FaMoneyBillWave, FaMapMarkerAlt, FaCouch, FaLandmark, FaChevronLeft, FaChevronRight, FaTint, FaBolt, FaPhoneAlt, FaWifi, FaStar, FaSearch, FaArrowUp } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

// Map Component แบบ Interactive
function InteractiveMap({ latitude, longitude, dormName, nearbyPlaces = [] }) {
  const [mapError, setMapError] = useState(false);
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  const handleMapError = () => {
    setMapError(true);
  };
  
  // ฟังก์ชันสร้าง Custom HTML Map ด้วย Leaflet
  const createLeafletMap = () => {
    const nearbyMarkersData = nearbyPlaces.map(place => ({
      lat: parseFloat(place.latitude || 0),
      lng: parseFloat(place.longitude || 0),
      name: place.location_name || place.name || 'สถานที่ใกล้เคียง',
      type: place.location_type || place.type || 'อื่นๆ'
    }));
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          #map { height: 100vh; width: 100%; }
          .custom-popup { font-size: 13px; max-width: 200px; }
          .popup-title { font-weight: bold; color: #1f2937; margin-bottom: 4px; }
          .popup-type { color: #6b7280; font-size: 11px; }
          .dorm-marker { background: #dc2626; border-radius: 50%; }
          .place-marker { background: #2563eb; border-radius: 50%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          // สร้างแผนที่
          const map = L.map('map').setView([${lat}, ${lng}], 15);
          
          // เพิ่ม tile layer (OpenStreetMap)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          // สร้าง custom icon สำหรับหอพัก
          const dormIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          // สร้าง custom icon สำหรับสถานที่ใกล้เคียง
          const placeIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          // เพิ่ม marker สำหรับหอพัก
          const dormMarker = L.marker([${lat}, ${lng}], { icon: dormIcon }).addTo(map);
          dormMarker.bindPopup('<div class="custom-popup"><div class="popup-title">${dormName}</div><div class="popup-type">หอพัก</div></div>');
          
          // เพิ่ม markers สำหรับสถานที่ใกล้เคียง
          const nearbyPlaces = ${JSON.stringify(nearbyMarkersData)};
          nearbyPlaces.forEach(place => {
            if (place.lat && place.lng && !isNaN(place.lat) && !isNaN(place.lng)) {
              const marker = L.marker([place.lat, place.lng], { icon: placeIcon }).addTo(map);
              marker.bindPopup('<div class="custom-popup"><div class="popup-title">' + place.name + '</div><div class="popup-type">' + place.type + '</div></div>');
            }
          });
          
          // ปรับ bounds ให้แสดงทุก markers
          if (nearbyPlaces.length > 0) {
            const allPoints = [[${lat}, ${lng}]];
            nearbyPlaces.forEach(place => {
              if (place.lat && place.lng && !isNaN(place.lat) && !isNaN(place.lng)) {
                allPoints.push([place.lat, place.lng]);
              }
            });
            const group = new L.featureGroup(allPoints.map(point => L.marker(point)));
            map.fitBounds(group.getBounds().pad(0.1));
          }
          
          // เปิด popup หอพักเป็นค่าเริ่มต้น
          setTimeout(() => {
            dormMarker.openPopup();
          }, 500);
        </script>
      </body>
      </html>
    `;
    
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  };
  
  return (
    <div className="interactive-map-container relative h-64 bg-gray-100 rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {!mapError ? (
        <>
          {/* Map Display - Leaflet Only */}
          <iframe
            src={createLeafletMap()}
            className="w-full h-full rounded-lg"
            title={`แผนที่ Leaflet ${dormName}`}
            onError={handleMapError}
          />
        </>
      ) : (
        // Fallback Display
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg font-semibold text-gray-800 mb-2">{dormName}</p>
            <p className="text-sm text-gray-600 mb-4">
              พิกัด: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <FaMapMarkerAlt className="w-3 h-3" />
                Google Maps
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <FaArrowUp className="w-3 h-3" />
                นำทาง
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Map Info Overlay */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
          <span className="font-medium text-gray-800">{dormName}</span>
        </div>
      </div>
    </div>
  );
}

function OwnerHomePage() {
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showAddDormModal, setShowAddDormModal] = useState(false);
  const [uploadingDorm, setUploadingDorm] = useState(false);
  const [addDormForm, setAddDormForm] = useState({
    name: '',
    address_detail: '',
    price_daily: '',
    price_monthly: '',
    price_term: '',
    water_rate: '',
    electricity_rate: '',
    deposit: '',
    contact_phone: '',
    facilities: '',
    near_places: '',
    latitude: '',
    longitude: '',
    images: []
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
    setUploadingDorm(false);
    setAddDormForm({
      name: '',
      address_detail: '',
      price_daily: '',
      price_monthly: '',
      price_term: '',
      water_rate: '',
      electricity_rate: '',
      deposit: '',
      contact_phone: '',
      facilities: '',
      near_places: '',
      latitude: '',
      longitude: '',
      images: []
    });
  };

  const handleAddDormSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    
    // ตรวจสอบข้อมูลพื้นฐาน
    if (!addDormForm.name.trim()) {
      alert('กรุณาใส่ชื่อหอพัก');
      return;
    }
    
    if (!addDormForm.address_detail.trim()) {
      alert('กรุณาใส่ที่อยู่หอพัก');
      return;
    }

    // ตรวจสอบว่ามีราคาอย่างน้อยหนึ่งประเภท
    const hasPrice = addDormForm.price_daily || addDormForm.price_monthly || addDormForm.price_term;
    if (!hasPrice) {
      alert('กรุณาใส่ราคาค่าเช่าอย่างน้อยหนึ่งประเภท');
      return;
    }
    
    setUploadingDorm(true);
    
    try {
      // สร้าง FormData สำหรับส่งไฟล์รูปภาพ
      const formData = new FormData();
      
      // เพิ่มข้อมูลพื้นฐาน
      formData.append('name', addDormForm.name.trim());
      formData.append('address_detail', addDormForm.address_detail.trim());
      formData.append('price_daily', addDormForm.price_daily || '0');
      formData.append('price_monthly', addDormForm.price_monthly || '0');
      formData.append('price_term', addDormForm.price_term || '0');
      formData.append('water_rate', addDormForm.water_rate || '0');
      formData.append('electricity_rate', addDormForm.electricity_rate || '0');
      formData.append('deposit', addDormForm.deposit || '0');
      formData.append('contact_phone', addDormForm.contact_phone.trim() || '');
      formData.append('facilities', addDormForm.facilities.trim() || '');
      formData.append('near_places', addDormForm.near_places.trim() || '');
      formData.append('latitude', addDormForm.latitude || '');
      formData.append('longitude', addDormForm.longitude || '');
      
      // เพิ่มรูปภาพ
      if (addDormForm.images && addDormForm.images.length > 0) {
        console.log(`📤 Uploading ${addDormForm.images.length} images...`);
        for (let i = 0; i < addDormForm.images.length; i++) {
          formData.append('images', addDormForm.images[i]);
        }
      } else {
        console.log('📤 No images to upload');
      }

      console.log('📤 Sending dorm data:', {
        name: addDormForm.name,
        images: addDormForm.images ? addDormForm.images.length : 0,
        address: addDormForm.address_detail,
        hasPrice: hasPrice
      });

      const response = await fetch('http://localhost:3001/owner/dorms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // ไม่ต้องใส่ Content-Type เพราะ FormData จะจัดการเอง
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Dorm created successfully:', result);
        
        // Refresh dorms list
        const updatedDorms = await fetch('http://localhost:3001/owner/dorms', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json());
        
        setDorms(updatedDorms);
        handleCloseAddDormModal();
        alert('🎉 เพิ่มหอพักสำเร็จแล้ว!\n\nหอพักของคุณจะต้องผ่านการอนุมัติจากแอดมินก่อนจึงจะแสดงในระบบ');
      } else {
        console.error('❌ Failed to create dorm:', result);
        alert(result.error || 'เกิดข้อผิดพลาดในการเพิ่มหอพัก');
      }
    } catch (error) {
      console.error('❌ Error adding dorm:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setUploadingDorm(false);
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
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 group cursor-pointer transform hover:-translate-y-1 flex flex-col h-full"
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
                      <div className="p-5 flex flex-col flex-1">
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
                        <div className="mt-auto pt-4">
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

                    {/* Quick Map Preview - Left Side */}
                    {(selectedDorm.coordinates && selectedDorm.coordinates.length > 0 && 
                      selectedDorm.coordinates[0].latitude && selectedDorm.coordinates[0].longitude &&
                      parseFloat(selectedDorm.coordinates[0].latitude) !== 0 && parseFloat(selectedDorm.coordinates[0].longitude) !== 0 &&
                      !isNaN(parseFloat(selectedDorm.coordinates[0].latitude)) && !isNaN(parseFloat(selectedDorm.coordinates[0].longitude))) ? (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                          ตำแหน่งหอพัก
                          <span className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">Preview</span>
                        </h3>
                        <InteractiveMap
                          latitude={selectedDorm.coordinates[0].latitude}
                          longitude={selectedDorm.coordinates[0].longitude}
                          dormName={selectedDorm.name}
                          nearbyPlaces={selectedDorm.coordinates.slice(1)}
                        />
                      </div>
                    ) : (selectedDorm.latitude && selectedDorm.longitude &&
                      parseFloat(selectedDorm.latitude) !== 0 && parseFloat(selectedDorm.longitude) !== 0 &&
                      !isNaN(parseFloat(selectedDorm.latitude)) && !isNaN(parseFloat(selectedDorm.longitude))) ? (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                          ตำแหน่งหอพัก
                          <span className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">Preview</span>
                        </h3>
                        <InteractiveMap
                          latitude={selectedDorm.latitude}
                          longitude={selectedDorm.longitude}
                          dormName={selectedDorm.name}
                          nearbyPlaces={[]}
                        />
                      </div>
                    ) : (
                      // แสดงแผนที่ตัวอย่างสำหรับ demo
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                          ตำแหน่งหอพัก
                          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">Demo</span>
                        </h3>
                        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800">📍 แผนที่ตัวอย่าง - พื้นที่ใกล้เคียง</p>
                        </div>
                        <InteractiveMap
                          latitude="13.7684"
                          longitude="100.6147"
                          dormName={`${selectedDorm.name} (ตัวอย่าง)`}
                          nearbyPlaces={[]}
                        />
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Dorm Modal */}
        {showAddDormModal && (
          <div className="fixed inset-0 bg-black/60 z-[2100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="text-white w-6 h-6" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">เพิ่มหอพักใหม่</h3>
                  </div>
                  <button
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
                    onClick={handleCloseAddDormModal}
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAddDormSubmit} className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="text-green-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M480 416v16c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V176c0-26.51 21.49-48 48-48h16v208c0 44.112 35.888 80 80 80h336zm96-80V80c0-26.51-21.49-48-48-48H144c-26.51 0-48 21.49-48 48v256c0 26.51 21.49 48 48 48h384c26.51 0 48-21.49 48-48zM256 128c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-96 144l55.515-55.515c4.686-4.686 12.284-4.686 16.971 0L272 256l135.515-135.515c4.686-4.686 12.284-4.686 16.971 0L512 208v112H160v-48z"></path>
                    </svg>
                    รูปภาพหอพัก
                    {addDormForm.images && addDormForm.images.length > 0 && (
                      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {addDormForm.images.length} รูป
                      </span>
                    )}
                  </label>
                  
                  <div className="flex gap-3 flex-wrap items-start">
                    {/* Add Image Button */}
                    <div className="w-24 h-20 flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-lg cursor-pointer bg-green-50 hover:bg-green-100 transition-colors relative">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="text-green-400 text-xl mb-1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"></path>
                      </svg>
                      <span className="text-xs text-green-600">เพิ่มรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={e => {
                          const files = Array.from(e.target.files);
                          
                          // ตรวจสอบไฟล์
                          const validFiles = [];
                          const errors = [];
                          
                          files.forEach(file => {
                            // ตรวจสอบประเภทไฟล์
                            if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
                              errors.push(`${file.name}: ประเภทไฟล์ไม่รองรับ (รองรับเฉพาะ JPG, PNG, WEBP)`);
                              return;
                            }
                            
                            // ตรวจสอบขนาดไฟล์ (5MB = 5 * 1024 * 1024 bytes)
                            if (file.size > 5 * 1024 * 1024) {
                              errors.push(`${file.name}: ขนาดไฟล์เกิน 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
                              return;
                            }
                            
                            validFiles.push(file);
                          });
                          
                          // แสดงข้อผิดพลาด (ถ้ามี)
                          if (errors.length > 0) {
                            alert('ข้อผิดพลาดในการอัปโหลดไฟล์:\n\n' + errors.join('\n'));
                          }
                          
                          // เพิ่มไฟล์ที่ถูกต้อง
                          if (validFiles.length > 0) {
                            const currentImages = addDormForm.images || [];
                            const totalImages = currentImages.length + validFiles.length;
                            
                            // จำกัดจำนวนรูปสูงสุด 10 รูป
                            if (totalImages > 10) {
                              alert(`สามารถอัปโหลดได้สูงสุด 10 รูป (ปัจจุบันมี ${currentImages.length} รูป)`);
                              const allowedCount = 10 - currentImages.length;
                              if (allowedCount > 0) {
                                setAddDormForm({...addDormForm, images: [...currentImages, ...validFiles.slice(0, allowedCount)]});
                              }
                            } else {
                              setAddDormForm({...addDormForm, images: [...currentImages, ...validFiles]});
                            }
                          }
                          
                          // รีเซ็ต input
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* Preview Images */}
                    {addDormForm.images && addDormForm.images.length > 0 && (
                      addDormForm.images.map((file, index) => (
                        <div key={index} className="relative w-24 h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`รูปที่ ${index + 1}`}
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              // เพิ่มเอฟเฟกต์ให้รูปดูคมชัด
                              e.target.style.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
                            }}
                          />
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg transition-colors"
                            onClick={() => {
                              const newImages = addDormForm.images.filter((_, i) => i !== index);
                              setAddDormForm({...addDormForm, images: newImages});
                            }}
                            title="ลบรูปนี้"
                          >
                            ×
                          </button>
                          
                          {/* Image Number */}
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Upload Progress */}
                  {uploadingDorm && addDormForm.images && addDormForm.images.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                        <span className="text-green-700 font-medium">กำลังอัปโหลดรูปภาพ...</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        กำลังอัปโหลด {addDormForm.images.length} รูป กรุณารอสักครู่...
                      </p>
                    </div>
                  )}
                  
                  {/* Image Upload Instructions */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">คำแนะนำการอัปโหลดรูป:</p>
                        <ul className="text-xs space-y-1">
                          <li>• รองรับไฟล์: JPG, PNG, WEBP</li>
                          <li>• ขนาดไฟล์ไม่เกิน 5MB ต่อรูป</li>
                          <li>• แนะนำอัปโหลด 3-8 รูป เพื่อดึงดูดผู้เช่า</li>
                          <li>• รูปแรกจะเป็นรูปหลักที่แสดงในรายการ</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="text-green-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path>
                      </svg>
                      ชื่อหอพัก *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="กรุณาใส่ชื่อหอพัก"
                      required
                      value={addDormForm.name}
                      onChange={e => setAddDormForm({...addDormForm, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" className="text-green-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path>
                      </svg>
                      ที่อยู่/ทำเล *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="ที่อยู่หรือทำเลที่ตั้ง"
                      required
                      value={addDormForm.address_detail}
                      onChange={e => setAddDormForm({...addDormForm, address_detail: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" className="text-blue-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path>
                        </svg>
                        ละติจูด (Latitude)
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="16.246825"
                        type="number"
                        step="any"
                        value={addDormForm.latitude}
                        onChange={e => setAddDormForm({...addDormForm, latitude: e.target.value})}
                      />
                      <span className="text-xs text-gray-500 mt-1">ตัวอย่าง: 16.246825</span>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" className="text-green-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path>
                        </svg>
                        ลองติจูด (Longitude)
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="103.255025"
                        type="number"
                        step="any"
                        value={addDormForm.longitude}
                        onChange={e => setAddDormForm({...addDormForm, longitude: e.target.value})}
                      />
                      <span className="text-xs text-gray-500 mt-1">ตัวอย่าง: 103.255025</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <strong>วิธีหาพิกัด GPS:</strong> เปิด Google Maps → คลิกขวาที่ตำแหน่ง → คัดลอกพิกัด → วางในช่องด้านบน
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prices */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaMoneyBillWave className="text-green-500" />
                    ราคาค่าเช่า
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายวัน (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        min="0"
                        type="number"
                        value={addDormForm.price_daily}
                        onChange={e => setAddDormForm({...addDormForm, price_daily: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเดือน (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        min="0"
                        type="number"
                        value={addDormForm.price_monthly}
                        onChange={e => setAddDormForm({...addDormForm, price_monthly: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเทอม (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        min="0"
                        type="number"
                        value={addDormForm.price_term}
                        onChange={e => setAddDormForm({...addDormForm, price_term: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Utilities */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaMoneyBillWave className="text-green-500" />
                    อัตราค่าสาธารณูปโภค
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">อัตราค่าน้ำ (บาท/หน่วย)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        step="0.01"
                        placeholder="เช่น 18.00"
                        type="number"
                        value={addDormForm.water_rate}
                        onChange={e => setAddDormForm({...addDormForm, water_rate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">อัตราค่าไฟ (บาท/หน่วย)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        step="0.01"
                        placeholder="เช่น 7.50"
                        type="number"
                        value={addDormForm.electricity_rate}
                        onChange={e => setAddDormForm({...addDormForm, electricity_rate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="text-green-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M160 224v64h320v-64c0-35.3 28.7-64 64-64h32c0-53-43-96-96-96H160c-53 0-96 43-96 96h32c35.3 0 64 28.7 64 64zm416-32h-32c-17.7 0-32 14.3-32 32v96H128v-96c0-17.7-14.3-32-32-32H64c-35.3 0-64 28.7-64 64 0 23.6 13 44 32 55.1V432c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-16h384v16c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16V311.1c19-11.1 32-31.5 32-55.1 0-35.3-28.7-64-64-64z"></path>
                    </svg>
                    สิ่งอำนวยความสะดวก
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">เงินมัดจำ (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="เช่น 5000"
                        min="0"
                        type="number"
                        value={addDormForm.deposit}
                        onChange={e => setAddDormForm({...addDormForm, deposit: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">เบอร์โทรติดต่อ</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="เช่น 02-123-4567"
                        type="tel"
                        value={addDormForm.contact_phone}
                        onChange={e => setAddDormForm({...addDormForm, contact_phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Facilities Checkboxes */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaWifi className="text-green-500" />
                    สิ่งอำนวยความสะดวก
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      {['เครื่องปรับอากาศ', 'ที่จอดรถ', 'เฟอร์นิเจอร์', 'บริการเครื่องซักผ้า', 'เครื่องทำน้ำอุ่น', 'ลิฟต์', 'พัดลม', 'สระว่ายน้ำ', 'โรงยิม', 'ตู้เย็น', 'ระบบรักษาความปลอดภัย', 'กล้องวงจรปิด', 'รปภ.', 'อินเตอร์เน็ต', 'อนุญาตให้เลี้ยงสัตว์'].map((facility) => (
                        <label key={facility} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-2 transition-colors">
                          <input
                            className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                            type="checkbox"
                            checked={addDormForm.facilities.includes(facility)}
                            onChange={e => {
                              const currentFacilities = addDormForm.facilities.split(',').filter(f => f.trim());
                              if (e.target.checked) {
                                setAddDormForm({...addDormForm, facilities: [...currentFacilities, facility].join(', ')});
                              } else {
                                setAddDormForm({...addDormForm, facilities: currentFacilities.filter(f => f !== facility).join(', ')});
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700">{facility}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nearby Places Checkboxes */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaLandmark className="text-green-500" />
                    สถานที่ใกล้เคียง
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-1 gap-3">
                      {['ม.มหาสารคาม', 'ม.มหาสารคาม(ม.เก่า)', 'ม.ราชภัฏมหาสารคาม', 'เสริมไทย คอมเพล็กซ์', 'เสริมไทย พลาซ่า', 'วิทยาลัยเทคนิคมหาสารคาม', 'วิทยาลัยพยาบาลศรีมหาสารคาม', 'แม็คโครมหาสารคาม', 'โรงพยาบาลสุทธาเวช', 'โรงพยาบาลมหาสารคาม', 'สถานีขนส่งมหาสารคาม', 'สถานีตำรวจภูธรเมืองมหาสารคาม'].map((place) => (
                        <label key={place} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-2 transition-colors">
                          <input
                            className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                            type="checkbox"
                            checked={addDormForm.near_places.includes(place)}
                            onChange={e => {
                              const currentPlaces = addDormForm.near_places.split(',').filter(p => p.trim());
                              if (e.target.checked) {
                                setAddDormForm({...addDormForm, near_places: [...currentPlaces, place].join(', ')});
                              } else {
                                setAddDormForm({...addDormForm, near_places: currentPlaces.filter(p => p !== place).join(', ')});
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700">{place}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-2">หรือเพิ่มสถานที่อื่น ๆ (คั่นด้วยเครื่องหมายจุลภาค)</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="เช่น ห้างเดอะมอลล์, ตลาดนัด, BTS"
                      rows="2"
                      onChange={e => {
                        const additionalPlaces = e.target.value;
                        const checkboxPlaces = ['ม.มหาสารคาม', 'ม.มหาสารคาม(ม.เก่า)', 'ม.ราชภัฏมหาสารคาม', 'เสริมไทย คอมเพล็กซ์', 'เสริมไทย พลาซ่า', 'วิทยาลัยเทคนิคมหาสารคาม', 'วิทยาลัยพยาบาลศรีมหาสารคาม', 'แม็คโครมหาสารคาม', 'โรงพยาบาลสุทธาเวช', 'โรงพยาบาลมหาสารคาม', 'สถานีขนส่งมหาสารคาม', 'สถานีตำรวจภูธรเมืองมหาสารคาม']
                          .filter(place => addDormForm.near_places.includes(place));
                        const allPlaces = [...checkboxPlaces];
                        if (additionalPlaces.trim()) {
                          allPlaces.push(...additionalPlaces.split(',').map(p => p.trim()).filter(p => p));
                        }
                        setAddDormForm({...addDormForm, near_places: allPlaces.join(', ')});
                      }}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCloseAddDormModal}
                    disabled={uploadingDorm}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={uploadingDorm}
                  >
                    {uploadingDorm ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>บันทึกข้อมูล</span>
                      </>
                    )}
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
