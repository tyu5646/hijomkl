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
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      name: place.location_name || 'สถานที่ใกล้เคียง',
      type: place.location_type || 'อื่นๆ'
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

// ฟังก์ชันคำนวณระยะทางระหว่างสองจุดด้วย Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลกในหน่วยกิโลเมตร
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // ปัดเศษเป็น 2 ตำแหน่ง
}

// ฟังก์ชัน AI-Enhanced Distance Calculator
async function calculateDistanceWithAI(dormCoords, placeCoords, placeName) {
  try {
    // ใช้ Haversine formula เป็นฐาน
    const baseDistance = calculateDistance(
      parseFloat(dormCoords.latitude),
      parseFloat(dormCoords.longitude),
      parseFloat(placeCoords.latitude),
      parseFloat(placeCoords.longitude)
    );

    // AI Enhancement: ปรับค่าระยะทางตามประเภทของสถานที่และเส้นทาง
    let adjustedDistance = baseDistance;
    
    // AI Logic: ปรับค่าตามประเภทสถานที่
    if (placeName) {
      const nameToCheck = placeName.toLowerCase();
      
      // มหาวิทยาลัย - ปกติมีการจราจรหนาแน่น
      if (nameToCheck.includes('มหาวิทยาลัย') || nameToCheck.includes('ม.') || nameToCheck.includes('university')) {
        adjustedDistance = baseDistance * 1.1; // เพิ่ม 10% เพราะมีการจราจร
      }
      // โรงพยาบาล - เส้นทางตรงมากกว่า
      else if (nameToCheck.includes('โรงพยาบาล') || nameToCheck.includes('รพ.') || nameToCheck.includes('hospital')) {
        adjustedDistance = baseDistance * 0.95; // ลด 5% เพราะเส้นทางตรง
      }
      // ตลาด/ห้างสรรพสินค้า - ปกติอยู่ในเมือง
      else if (nameToCheck.includes('ตลาด') || nameToCheck.includes('ห้าง') || nameToCheck.includes('เซ็นทรัล') || nameToCheck.includes('บิ๊กซี')) {
        adjustedDistance = baseDistance * 1.05; // เพิ่ม 5% เพราะอยู่ในเมือง
      }
      // สถานีขนส่ง
      else if (nameToCheck.includes('สถานี') || nameToCheck.includes('ป้าย') || nameToCheck.includes('terminal')) {
        adjustedDistance = baseDistance * 0.9; // ลด 10% เพราะเส้นทางสาธารณะ
      }
    }

    // AI Logic: ปรับค่าตามระยะทาง
    if (baseDistance < 1) {
      // ระยะใกล้มาก - เดินได้
      adjustedDistance = adjustedDistance * 0.85;
    } else if (baseDistance > 10) {
      // ระยะไกลมาก - ต้องใช้เส้นทางหลัก
      adjustedDistance = adjustedDistance * 1.15;
    }

    // AI Enhancement: คำนวณเวลาเดินทางโดยประมาณ
    const walkingTime = Math.round(adjustedDistance * 12); // 12 นาที/กม. (การเดิน)
    const drivingTime = Math.round(adjustedDistance * 2.5); // 2.5 นาที/กม. (การขับรถ)

    return {
      distance: Math.round(adjustedDistance * 100) / 100,
      walkingTime,
      drivingTime,
      isWalkable: adjustedDistance <= 2,
      category: getDistanceCategory(adjustedDistance)
    };

  } catch (error) {
    console.error('AI Distance Calculation Error:', error);
    // Fallback ไปใช้การคำนวณแบบธรรมดา
    const fallbackDistance = calculateDistance(
      parseFloat(dormCoords.latitude),
      parseFloat(dormCoords.longitude),
      parseFloat(placeCoords.latitude),
      parseFloat(placeCoords.longitude)
    );
    
    return {
      distance: fallbackDistance,
      walkingTime: Math.round(fallbackDistance * 12),
      drivingTime: Math.round(fallbackDistance * 2.5),
      isWalkable: fallbackDistance <= 2,
      category: getDistanceCategory(fallbackDistance)
    };
  }
}

// ฟังก์ชันจำแนกประเภทระยะทาง
function getDistanceCategory(distance) {
  if (distance <= 0.5) return 'ใกล้มาก';
  if (distance <= 1.5) return 'เดินได้';
  if (distance <= 5) return 'ใกล้';
  if (distance <= 10) return 'ปานกลาง';
  return 'ไกล';
}

// ฟังก์ชันรับสีตามระยะทาง
function getDistanceColor(distance) {
  if (distance <= 0.5) return 'bg-green-100 text-green-700 border-green-200';
  if (distance <= 1.5) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (distance <= 5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (distance <= 10) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

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
  const [searchPriceType, setSearchPriceType] = useState('all'); // all, daily, monthly, term
  const [searchNearPlaces, setSearchNearPlaces] = useState('');
  const [searchFacility, setSearchFacility] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // State สำหรับรีวิว
  const [dormReviews, setDormReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    cleanliness_rating: 5,
    location_rating: 5,
    value_rating: 5,
    service_rating: 5
  });

  // State สำหรับ AI Distance Calculation
  const [aiDistances, setAiDistances] = useState({});
  const [calculatingDistances, setCalculatingDistances] = useState(false);

  // ฟังก์ชันคำนวณระยะทางด้วย AI เมื่อเปิด modal
  const calculateAIDistances = async (dorm) => {
    if (!dorm.coordinates || dorm.coordinates.length <= 1) return;
    
    setCalculatingDistances(true);
    const dormCoord = dorm.coordinates[0];
    const newAIDistances = {};

    try {
      // คำนวณระยะทางสำหรับแต่ละสถานที่ใกล้เคียง
      for (let i = 1; i < dorm.coordinates.length; i++) {
        const coord = dorm.coordinates[i];
        const key = `${dorm.id}-${i}`;
        
        const aiResult = await calculateDistanceWithAI(
          dormCoord,
          coord,
          coord.location_name
        );
        
        newAIDistances[key] = aiResult;
      }
      
      setAiDistances(prev => ({ ...prev, ...newAIDistances }));
    } catch (error) {
      console.error('Error calculating AI distances:', error);
    } finally {
      setCalculatingDistances(false);
    }
  };

  const filteredDorms = dorms;

  useEffect(() => {
    if (selectedDorm && selectedDorm.images && selectedDorm.images.length > 0) {
      // ตรวจสอบว่า currentImgIdx ไม่เกิน array length
      if (currentImgIdx >= selectedDorm.images.length) {
        setCurrentImgIdx(0);
      }
      
      // เพิ่มการปรับปรุงคุณภาพภาพสำหรับ modal
      setTimeout(() => {
        const modalImages = document.querySelectorAll('.dorm-detail-image');
        modalImages.forEach(img => {
          if (img.complete && img.naturalHeight !== 0) {
            img.style.filter = 'contrast(1.4) brightness(1.25) saturate(1.3) drop-shadow(0 0 1px rgba(0,0,0,0.5))';
            img.style.imageRendering = '-webkit-optimize-contrast';
            img.style.transform = 'translate3d(0,0,0)';
          }
        });
      }, 100);
    } else {
      // ถ้าไม่มีรูปภาพให้ reset index
      setCurrentImgIdx(0);
    }
  }, [selectedDorm, currentImgIdx]);

  // ฟังก์ชันเพิ่มเติมสำหรับการโหลดรูปภาพให้ชัด
  const handleImageLoad = (e) => {
    e.target.classList.add('loaded');
    e.target.classList.remove('image-loading');
    
    // ปรับ filter ตามความละเอียดหน้าจอและขนาดรูป
    const devicePixelRatio = window.devicePixelRatio || 1;
    const imageWidth = e.target.naturalWidth;
    const imageHeight = e.target.naturalHeight;
    const isModalImage = e.target.classList.contains('modal-image-enhance') || e.target.classList.contains('dorm-detail-image');
    
    // ใช้ค่า filter ที่แรงขึ้นสำหรับรูปภาพในหน้ารายละเอียด
    if (isModalImage) {
      if (devicePixelRatio >= 3) {
        // หน้าจอความละเอียดสูงมาก
        e.target.style.filter = 'contrast(1.6) brightness(1.35) saturate(1.4) drop-shadow(0 0 0.5px rgba(0,0,0,0.7)) unsharp-mask(amount=250% radius=0.5px threshold=0)';
      } else if (devicePixelRatio >= 2) {
        // หน้าจอ Retina
        e.target.style.filter = 'contrast(1.5) brightness(1.3) saturate(1.35) drop-shadow(0 0 0.5px rgba(0,0,0,0.6)) unsharp-mask(amount=200% radius=0.5px threshold=0)';
      } else {
        // หน้าจอปกติ แต่ใช้ค่าที่แรงขึ้น
        e.target.style.filter = 'contrast(1.4) brightness(1.25) saturate(1.3) drop-shadow(0 0 1px rgba(0,0,0,0.5)) unsharp-mask(amount=180% radius=0.5px threshold=0)';
      }
    } else {
      // เพิ่มความคมชัดตามขนาดและความละเอียดจริงของรูป (สำหรับรูปภาพทั่วไป)
      if (devicePixelRatio >= 3) {
        // หน้าจอความละเอียดสูงมาก
        e.target.style.filter = 'contrast(1.35) brightness(1.25) saturate(1.3) unsharp-mask(amount=200% radius=1px threshold=0)';
      } else if (devicePixelRatio >= 2) {
        // หน้าจอ Retina
        e.target.style.filter = 'contrast(1.3) brightness(1.2) saturate(1.25) unsharp-mask(amount=150% radius=1px threshold=0)';
      } else if (imageWidth > 1000 && imageHeight > 600) {
        // รูปขนาดใหญ่
        e.target.style.filter = 'contrast(1.25) brightness(1.15) saturate(1.2) unsharp-mask(amount=120% radius=1px threshold=0)';
      } else {
        // รูปขนาดปกติ
        e.target.style.filter = 'contrast(1.2) brightness(1.1) saturate(1.15) unsharp-mask(amount=100% radius=1px threshold=0)';
      }
    }
    
    // เพิ่ม sharpness สำหรับ Firefox และ Safari
    e.target.style.imageRendering = 'crisp-edges';
    e.target.style.imageRendering = '-webkit-optimize-contrast';
    
    // Force GPU acceleration for modal images
    if (isModalImage) {
      e.target.style.transform = 'translate3d(0,0,0)';
      e.target.style.webkitTransform = 'translate3d(0,0,0)';
      e.target.style.backfaceVisibility = 'hidden';
      e.target.style.webkitBackfaceVisibility = 'hidden';
    }
  };

  const handleImageError = (e) => {
    e.target.src = '/no-image.png';
    e.target.style.filter = 'grayscale(0.2) contrast(1.15) brightness(1.05)';
    e.target.classList.remove('image-loading');
  };

  // ฟังก์ชันสำหรับปรับปรุงคุณภาพภาพเมื่อเปลี่ยนรูป
  const enhanceCurrentImage = () => {
    setTimeout(() => {
      const currentImage = document.querySelector('.dorm-detail-image:not(.thumbnail-enhance)');
      if (currentImage && currentImage.complete && currentImage.naturalHeight !== 0) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        let filterValue = '';
        
        if (devicePixelRatio >= 3) {
          filterValue = 'contrast(1.6) brightness(1.35) saturate(1.4) drop-shadow(0 0 0.5px rgba(0,0,0,0.7))';
        } else if (devicePixelRatio >= 2) {
          filterValue = 'contrast(1.5) brightness(1.3) saturate(1.35) drop-shadow(0 0 0.5px rgba(0,0,0,0.6))';
        } else {
          filterValue = 'contrast(1.4) brightness(1.25) saturate(1.3) drop-shadow(0 0 1px rgba(0,0,0,0.5))';
        }
        
        currentImage.style.filter = filterValue;
        currentImage.style.imageRendering = '-webkit-optimize-contrast';
        currentImage.style.transform = 'translate3d(0,0,0)';
        currentImage.style.webkitTransform = 'translate3d(0,0,0)';
        currentImage.style.backfaceVisibility = 'hidden';
        currentImage.style.webkitBackfaceVisibility = 'hidden';
      }
    }, 50);
  };

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
  const handleSubmitReview = async (e) => {
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

  // ฟังก์ชันแสดงราคาตามประเภทที่เลือก
  const getPriorityPrice = (dorm) => {
    if (searchPriceType === 'daily' && dorm.price_daily && Number(dorm.price_daily) > 0) {
      return { price: Number(dorm.price_daily), type: 'daily', label: '/วัน', color: 'bg-blue-500' };
    } else if (searchPriceType === 'monthly' && dorm.price_monthly && Number(dorm.price_monthly) > 0) {
      return { price: Number(dorm.price_monthly), type: 'monthly', label: '/เดือน', color: 'bg-green-500' };
    } else if (searchPriceType === 'term' && dorm.price_term && Number(dorm.price_term) > 0) {
      return { price: Number(dorm.price_term), type: 'term', label: '/เทอม', color: 'bg-purple-500' };
    }
    
    // ถ้าไม่มีราคาประเภทที่เลือก หรือเลือก "ทุกประเภท" ให้แสดงตามลำดับความสำคัญ
    if (dorm.price_monthly && Number(dorm.price_monthly) > 0) {
      return { price: Number(dorm.price_monthly), type: 'monthly', label: '/เดือน', color: 'bg-green-500' };
    } else if (dorm.price_daily && Number(dorm.price_daily) > 0) {
      return { price: Number(dorm.price_daily), type: 'daily', label: '/วัน', color: 'bg-blue-500' };
    } else if (dorm.price_term && Number(dorm.price_term) > 0) {
      return { price: Number(dorm.price_term), type: 'term', label: '/เทอม', color: 'bg-purple-500' };
    }
    
    return null;
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

    // ค้นหาตามราคาและประเภทราคา
    if (searchPrice.trim() && searchPriceType !== 'all') {
      const price = Number(searchPrice);
      
      if (searchPriceType === 'daily') {
        result = result.filter(d => 
          d.price_daily && Number(d.price_daily) <= price
        );
      } else if (searchPriceType === 'monthly') {
        result = result.filter(d => 
          d.price_monthly && Number(d.price_monthly) <= price
        );
      } else if (searchPriceType === 'term') {
        result = result.filter(d => 
          d.price_term && Number(d.price_term) <= price
        );
      }
    } else if (searchPrice.trim() && searchPriceType === 'all') {
      // ถ้าเลือก "ทุกประเภท" ให้ค้นหาในทุกราคา
      const price = Number(searchPrice);
      result = result.filter(d => 
        (d.price_daily && Number(d.price_daily) <= price) ||
        (d.price_monthly && Number(d.price_monthly) <= price) ||
        (d.price_term && Number(d.price_term) <= price)
      );
    }

    // กรองตามประเภทราคาที่มีอยู่ (ถ้าไม่ได้ระบุราคาแต่เลือกประเภท)
    if (!searchPrice.trim() && searchPriceType !== 'all') {
      if (searchPriceType === 'daily') {
        result = result.filter(d => d.price_daily && Number(d.price_daily) > 0);
      } else if (searchPriceType === 'monthly') {
        result = result.filter(d => d.price_monthly && Number(d.price_monthly) > 0);
      } else if (searchPriceType === 'term') {
        result = result.filter(d => d.price_term && Number(d.price_term) > 0);
      }
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
    // คำนวณระยะทางด้วย AI
    calculateAIDistances(dorm);
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
            <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
            <select
              className="border border-gray-300 rounded-lg px-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm bg-white appearance-none"
              value={searchPriceType}
              onChange={e => setSearchPriceType(e.target.value)}
            >
              <option value="all">ทุกประเภท</option>
              <option value="daily">รายวัน</option>
              <option value="monthly">รายเดือน</option>
              <option value="term">รายเทอม</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 image-enhance image-loading"
                    style={{
                      imageRendering: '-webkit-optimize-contrast',
                      filter: 'contrast(1.2) brightness(1.1) saturate(1.15)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      imageOrientation: 'from-image'
                    }}
                    loading="eager"
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

                      // Sort prices: selected type first, then others
                      const sortedPrices = prices
                        .filter(price => price.value && Number(price.value) > 0)
                        .sort((a, b) => {
                          if (searchPriceType === 'ทุกประเภท') return 0;
                          if (a.searchType === searchPriceType) return -1;
                          if (b.searchType === searchPriceType) return 1;
                          return 0;
                        });

                      return sortedPrices.map((price) => {
                        const isSelected = searchPriceType === price.searchType;
                        const isHighlighted = searchPriceType !== 'ทุกประเภท' && isSelected;
                        
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
                                  ที่เลือก
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

                  {/* Rating & Reviews (Real Data) */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < Math.round(Number(reviewStats?.average_rating) || 5) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-1">
                        {reviewStats?.average_rating ? Number(reviewStats.average_rating).toFixed(1) : '5.0'}
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

                  {/* Nearby Places with Distance */}
                  {dorm.coordinates && dorm.coordinates.length > 1 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                        สถานที่ใกล้เคียง
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {dorm.coordinates.slice(1, 4).map((coord, index) => {
                          // ใช้ AI calculation ถ้ามี หรือ fallback ไปใช้การคำนวณธรรมดา
                          const aiKey = `${dorm.id}-${index + 1}`;
                          const aiResult = aiDistances[aiKey];
                          
                          let calculatedDistance = null;
                          if (dorm.coordinates[0] && dorm.coordinates[0].latitude && dorm.coordinates[0].longitude &&
                              coord.latitude && coord.longitude) {
                            calculatedDistance = calculateDistance(
                              parseFloat(dorm.coordinates[0].latitude),
                              parseFloat(dorm.coordinates[0].longitude),
                              parseFloat(coord.latitude),
                              parseFloat(coord.longitude)
                            );
                          }
                          
                          const displayDistance = aiResult ? aiResult.distance : calculatedDistance;
                          const distanceColor = aiResult && aiResult.isWalkable ? 'text-green-600' : 'text-blue-600';
                          
                          return (
                            <span 
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              <FaMapMarkerAlt className="w-2 h-2" />
                              {coord.location_name}
                              {displayDistance !== null && displayDistance > 0 && (
                                <span className={`font-medium ${distanceColor}`}>
                                  {displayDistance} กม.
                                  {aiResult && aiResult.isWalkable && ' 🚶‍♂️'}
                                </span>
                              )}
                            </span>
                          );
                        })}
                        {dorm.coordinates.length > 4 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                            +{dorm.coordinates.length - 4} สถานที่
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
              {/* Left Side - Name, Images, Location, Map */}
              <div className="w-full lg:w-1/2 bg-gray-50 p-6">
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
                  <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-lg image-container">
                    {selectedDorm.images && selectedDorm.images.length > 0 && selectedDorm.images[currentImgIdx] ? (
                      <>
                        <img
                          src={selectedDorm.images[currentImgIdx] && selectedDorm.images[currentImgIdx].startsWith ? 
                            (selectedDorm.images[currentImgIdx].startsWith('http') ? selectedDorm.images[currentImgIdx] : `http://localhost:3001${selectedDorm.images[currentImgIdx]}`) 
                            : '/no-image.png'}
                          alt={selectedDorm.name}
                          className="w-full h-full object-cover image-enhance modal-image-enhance dorm-detail-image image-loading"
                          style={{
                            imageRendering: '-webkit-optimize-contrast',
                            filter: 'contrast(1.4) brightness(1.25) saturate(1.3) drop-shadow(0 0 1px rgba(0,0,0,0.5))',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translate3d(0,0,0)',
                            WebkitTransform: 'translate3d(0,0,0)',
                            imageOrientation: 'from-image'
                          }}
                          loading="eager"
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                        
                        {/* Image Navigation - Agoda Style */}
                        {selectedDorm.images.length > 1 && (
                          <>
                            <button
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
                              onClick={e => { 
                                e.stopPropagation(); 
                                if (selectedDorm.images && selectedDorm.images.length > 0) {
                                  setCurrentImgIdx((currentImgIdx - 1 + selectedDorm.images.length) % selectedDorm.images.length); 
                                  enhanceCurrentImage();
                                }
                              }}
                            >
                              <FaChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
                              onClick={e => { 
                                e.stopPropagation(); 
                                if (selectedDorm.images && selectedDorm.images.length > 0) {
                                  setCurrentImgIdx((currentImgIdx + 1) % selectedDorm.images.length); 
                                  enhanceCurrentImage();
                                }
                              }}
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
                            onClick={() => {
                              if (selectedDorm.images && selectedDorm.images.length > idx) {
                                setCurrentImgIdx(idx);
                                enhanceCurrentImage();
                              }
                            }}
                            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                              idx === currentImgIdx 
                                ? 'border-blue-500 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}  
                          >
                            <img
                              src={image && image.startsWith ? 
                                (image.startsWith('http') ? image : `http://localhost:3001${image}`) 
                                : '/no-image.png'}
                              alt={`${selectedDorm.name} ${idx + 1}`}
                              className="w-full h-full object-cover image-enhance thumbnail-enhance dorm-detail-image image-loading"
                              style={{
                                imageRendering: '-webkit-optimize-contrast',
                                filter: 'contrast(1.35) brightness(1.2) saturate(1.25) drop-shadow(0 0 0.5px rgba(0,0,0,0.5))',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'translate3d(0,0,0)',
                                WebkitTransform: 'translate3d(0,0,0)',
                                imageOrientation: 'from-image'
                              }}
                              loading="eager"
                              onLoad={handleImageLoad}
                              onError={handleImageError}
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

                {/* Interactive Map Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                    ตำแหน่งหอพัก
                    <span className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">Interactive</span>
                  </h3>
                  {(selectedDorm.coordinates && selectedDorm.coordinates.length > 0 && 
                    selectedDorm.coordinates[0].latitude && selectedDorm.coordinates[0].longitude &&
                    parseFloat(selectedDorm.coordinates[0].latitude) !== 0 && parseFloat(selectedDorm.coordinates[0].longitude) !== 0 &&
                    !isNaN(parseFloat(selectedDorm.coordinates[0].latitude)) && !isNaN(parseFloat(selectedDorm.coordinates[0].longitude))) ? (
                    <InteractiveMap
                      latitude={selectedDorm.coordinates[0].latitude}
                      longitude={selectedDorm.coordinates[0].longitude}
                      dormName={selectedDorm.name}
                      nearbyPlaces={selectedDorm.coordinates.slice(1)}
                    />
                  ) : (
                    <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <FaMapMarkerAlt className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-lg font-medium">ไม่มีข้อมูลตำแหน่ง</p>
                        <p className="text-sm">หอพักนี้ยังไม่มีการระบุพิกัด</p>
                        <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 p-2 rounded max-h-32 overflow-y-auto">
                          <p className="font-semibold mb-2">Debug Info:</p>
                          <p>coordinates array length: {selectedDorm.coordinates ? selectedDorm.coordinates.length : 0}</p>
                          {selectedDorm.coordinates && selectedDorm.coordinates.length > 0 ? (
                            <>
                              <p>First coordinate:</p>
                              <p>- lat = "{selectedDorm.coordinates[0].latitude}" (type: {typeof selectedDorm.coordinates[0].latitude})</p>
                              <p>- lng = "{selectedDorm.coordinates[0].longitude}" (type: {typeof selectedDorm.coordinates[0].longitude})</p>
                              <p>- location_name = "{selectedDorm.coordinates[0].location_name}"</p>
                              <p>- location_type = "{selectedDorm.coordinates[0].location_type}"</p>
                              <p>- lat valid: {selectedDorm.coordinates[0].latitude && !isNaN(parseFloat(selectedDorm.coordinates[0].latitude)) && parseFloat(selectedDorm.coordinates[0].latitude) !== 0 ? 'true' : 'false'}</p>
                              <p>- lng valid: {selectedDorm.coordinates[0].longitude && !isNaN(parseFloat(selectedDorm.coordinates[0].longitude)) && parseFloat(selectedDorm.coordinates[0].longitude) !== 0 ? 'true' : 'false'}</p>
                            </>
                          ) : (
                            <p>No coordinates found</p>
                          )}
                          <p className="mt-2 text-xs">Legacy fields: lat={selectedDorm.latitude || 'null'}, lng={selectedDorm.longitude || 'null'}</p>
                        </div>
                      </div>
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
                    {(selectedDorm.water_cost || selectedDorm.electricity_cost) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
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
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating & Reviews Summary - Agoda Style */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {reviewStats?.average_rating ? Number(reviewStats.average_rating).toFixed(1) : '5.0'}
                        </div>
                        <div className="text-xs text-gray-600">คะแนนรีวิว</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          {renderStars(Number(reviewStats?.average_rating) || 5)}
                        </div>
                        <div className="text-sm text-gray-600">{reviewStats?.total_reviews || 0} รีวิวจากผู้เข้าพัก</div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FaStar className="w-4 h-4 text-yellow-500" />
                        รีวิวจากผู้เข้าพัก
                      </h3>
                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        เขียนรีวิว
                      </button>
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-4">เขียนรีวิวของคุณ</h4>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          {/* Overall Rating */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              คะแนนรวม
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewForm({...reviewForm, rating: star})}
                                  className={`text-2xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                                >
                                  ★
                                </button>
                              ))}
                              <span className="ml-2 text-sm text-gray-600">({reviewForm.rating}/5)</span>
                            </div>
                          </div>

                          {/* Detailed Ratings */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ความสะอาด
                              </label>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm({...reviewForm, cleanliness_rating: star})}
                                    className={`text-lg ${star <= reviewForm.cleanliness_rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ทำเล/สถานที่
                              </label>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm({...reviewForm, location_rating: star})}
                                    className={`text-lg ${star <= reviewForm.location_rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                คุณภาพ/ราคา
                              </label>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm({...reviewForm, value_rating: star})}
                                    className={`text-lg ${star <= reviewForm.value_rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                บริการ
                              </label>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm({...reviewForm, service_rating: star})}
                                    className={`text-lg ${star <= reviewForm.service_rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Comment */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ความคิดเห็น
                            </label>
                            <textarea
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows="4"
                              placeholder="แบ่งปันประสบการณ์ของคุณเกี่ยวกับหอพักนี้..."
                              required
                            />
                          </div>

                          {/* Submit Buttons */}
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                              ส่งรีวิว
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowReviewForm(false)}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {loadingReviews ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-600">กำลังโหลดรีวิว...</p>
                        </div>
                      ) : dormReviews.length > 0 ? (
                        dormReviews.map((review, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    {review.customer_name ? review.customer_name.charAt(0).toUpperCase() : 'A'}
                                  </span>
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {review.customer_name || 'ผู้ใช้งาน'}
                                  </h5>
                                  <div className="flex items-center gap-2">
                                    <div className="flex text-yellow-400 text-sm">
                                      {renderStars(review.rating)}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      {new Date(review.created_at).toLocaleDateString('th-TH')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Detailed Ratings */}
                            <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">ความสะอาด:</span>
                                <div className="flex text-yellow-400">
                                  {renderStars(review.cleanliness_rating)}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">ทำเล:</span>
                                <div className="flex text-yellow-400">
                                  {renderStars(review.location_rating)}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">คุณภาพ/ราคา:</span>
                                <div className="flex text-yellow-400">
                                  {renderStars(review.value_rating)}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">บริการ:</span>
                                <div className="flex text-yellow-400">
                                  {renderStars(review.service_rating)}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaStar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>ยังไม่มีรีวิวสำหรับหอพักนี้</p>
                          <p className="text-sm">เป็นคนแรกที่เขียนรีวิว!</p>
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

                  {/* AI-Enhanced Nearby Places with Smart Distance Calculation */}
                  {selectedDorm.coordinates && selectedDorm.coordinates.length > 1 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaLandmark className="w-5 h-5 text-purple-600" />
                        สถานที่ใกล้เคียง (AI Analysis)
                        {calculatingDistances && (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 ml-2"></div>
                        )}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedDorm.coordinates.slice(1).map((coord, index) => {
                          const aiKey = `${selectedDorm.id}-${index + 1}`;
                          const aiResult = aiDistances[aiKey];
                          
                          // Fallback ไปใช้การคำนวณแบบธรรมดาถ้า AI ยังไม่เสร็จ
                          let fallbackDistance = null;
                          if (selectedDorm.coordinates[0] && selectedDorm.coordinates[0].latitude && selectedDorm.coordinates[0].longitude &&
                              coord.latitude && coord.longitude) {
                            fallbackDistance = calculateDistance(
                              parseFloat(selectedDorm.coordinates[0].latitude),
                              parseFloat(selectedDorm.coordinates[0].longitude),
                              parseFloat(coord.latitude),
                              parseFloat(coord.longitude)
                            );
                          }
                          
                          const displayDistance = aiResult ? aiResult.distance : fallbackDistance;
                          const distanceColor = aiResult ? getDistanceColor(aiResult.distance) : 'bg-gray-100 text-gray-700 border-gray-200';
                          
                          return (
                            <div 
                              key={index}
                              className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FaMapMarkerAlt className="w-4 h-4 text-red-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-700">{coord.location_name}</span>
                                </div>
                                {displayDistance !== null && displayDistance > 0 && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${distanceColor}`}>
                                    {displayDistance} กม.
                                  </span>
                                )}
                              </div>
                              
                              {/* AI Enhanced Information */}
                              {aiResult && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                    📍 {aiResult.category}
                                  </span>
                                  {aiResult.isWalkable && (
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                                      🚶‍♂️ เดินได้ ({aiResult.walkingTime} นาที)
                                    </span>
                                  )}
                                  <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">
                                    🚗 ขับรถ {aiResult.drivingTime} นาที
                                  </span>
                                </div>
                              )}
                              
                              {/* Loading State */}
                              {!aiResult && calculatingDistances && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                                  <span>กำลังคำนวณด้วย AI...</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nearby Places from Legacy Data */}
                  {selectedDorm.near_places && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5 border border-green-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaLandmark className="w-5 h-5 text-green-600" />
                        สถานที่ใกล้เคียงอื่นๆ
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedDorm.near_places.split(',').map((place, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                          >
                            <FaMapMarkerAlt className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">{place.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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