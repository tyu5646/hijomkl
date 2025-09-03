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
  FaImages,
  FaEye,
  FaSearchPlus,
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
  FaClock,
  FaCouch
} from 'react-icons/fa';
import Header from '../components/Header';
import ChatbotWidget from '../components/ChatbotWidget';
import useDormsRealtime from '../hooks/useDormsRealtime';
import '../components/ChatbotWidgetCircle.css';
import '../components/DormDetailModal.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

// CSS Animation สำหรับ smooth sticky navigation
const stickyNavStyles = `
  @keyframes slideDownSmooth {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(0.98);
    }
  }
  
  @keyframes slideUpSmooth {
    from {
      opacity: 1;
      transform: translateY(0) scale(0.98);
    }
    to {
      opacity: 0;
      transform: translateY(-10px) scale(0.98);
    }
  }

  .nav-sticky-enter {
    animation: slideDownSmooth 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  .nav-sticky-exit {
    animation: slideUpSmooth 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
  }
`;

// เพิ่ม style tag ใน head
if (typeof document !== 'undefined' && !document.getElementById('sticky-nav-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'sticky-nav-styles';
  styleElement.textContent = stickyNavStyles;
  document.head.appendChild(styleElement);
}

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

  // โหลดข้อมูลรีวิวสำหรับหอพักทุกแห่งเมื่อได้ข้อมูลหอพัก
  useEffect(() => {
    if (dorms && dorms.length > 0) {
      dorms.forEach(dorm => {
        fetchDormReviewStats(dorm.id);
      });
    }
  }, [dorms]);

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
  const [dormReviewStats, setDormReviewStats] = useState({}); // เก็บข้อมูลรีวิวของแต่ละหอพัก
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

  // State สำหรับ sticky navigation
  const [isNavSticky, setIsNavSticky] = useState(false);
  const [navOffset, setNavOffset] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [navAnimationClass, setNavAnimationClass] = useState('');

  // useEffect สำหรับจัดการ sticky navigation
  useEffect(() => {
    if (!selectedDorm || !modalVisible) {
      setIsNavSticky(false);
      setNavAnimationClass('');
      setNavOffset(0);
      setScrollY(0);
      return;
    }

    let ticking = false;

    const updateScrollY = (scrollContainer) => {
      setScrollY(scrollContainer.scrollTop);
      ticking = false;
    };

    const handleScroll = (e) => {
      if (!ticking) {
        requestAnimationFrame(() => updateScrollY(e.target));
        ticking = true;
      }
    };

    // รอให้ modal render เสร็จก่อน แล้วค่อยหาตำแหน่งของ navigation
    const timer = setTimeout(() => {
      const navElement = document.getElementById('dorm-navigation');
      const modalContent = document.querySelector('.modal-content-scroll');
      
      if (navElement && modalContent) {
        // คำนวณตำแหน่งของ nav จากด้านบนของ modal content
        const navRect = navElement.getBoundingClientRect();
        const modalRect = modalContent.getBoundingClientRect();
        const currentOffset = navRect.top - modalRect.top + modalContent.scrollTop;
        
        setNavOffset(currentOffset - 100); // เริ่ม sticky ก่อน 100px
        
        modalContent.addEventListener('scroll', handleScroll, { passive: true });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const modalContent = document.querySelector('.modal-content-scroll');
      if (modalContent) {
        modalContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, [selectedDorm, modalVisible]);

  // useEffect แยกสำหรับอัปเดต sticky state
  useEffect(() => {
    if (!selectedDorm || !modalVisible || navOffset === 0) {
      return;
    }

    if (scrollY > navOffset && !isNavSticky) {
      setNavAnimationClass('nav-sticky-enter');
      setIsNavSticky(true);
    } else if (scrollY <= navOffset && isNavSticky) {
      setNavAnimationClass('nav-sticky-exit');
      setTimeout(() => {
        setIsNavSticky(false);
        setNavAnimationClass('');
      }, 300);
    }
  }, [scrollY, navOffset, isNavSticky, selectedDorm, modalVisible]);

  // State สำหรับ AI Distance Calculation
  const [aiDistances, setAiDistances] = useState({});
  const [calculatingDistances, setCalculatingDistances] = useState(false);

  // ฟังก์ชันดึงข้อมูลรีวิวสำหรับหอพักแต่ละแห่ง
  const fetchDormReviewStats = async (dormId) => {
    try {
      const response = await fetch(`http://localhost:3001/dorms/${dormId}/reviews/stats`);
      if (response.ok) {
        const stats = await response.json();
        setDormReviewStats(prev => ({
          ...prev,
          [dormId]: stats
        }));
        return stats;
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
    return null;
  };

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
    } else {
      // ถ้าไม่มีรูปภาพให้ reset index
      setCurrentImgIdx(0);
    }
  }, [selectedDorm, currentImgIdx]);

  // ฟังก์ชันเพิ่มเติมสำหรับการโหลดรูปภาพ
  const handleImageLoad = (e) => {
    e.target.classList.add('loaded');
    e.target.classList.remove('image-loading');
  };

  const handleImageError = (e) => {
    e.target.src = '/no-image.png';
    e.target.classList.remove('image-loading');
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

    // ค้นหาตามราคาและประเภทราคา - แบบแม่นยำ
    if (searchPrice.trim()) {
      const price = Number(searchPrice);
      
      if (searchPriceType === 'daily') {
        // ค้นหาเฉพาะราคารายวันที่มีค่าและไม่เกินราคาที่ระบุ
        result = result.filter(d => 
          d.price_daily && 
          !isNaN(Number(d.price_daily)) && 
          Number(d.price_daily) > 0 && 
          Number(d.price_daily) <= price
        );
      } else if (searchPriceType === 'monthly') {
        // ค้นหาเฉพาะราคารายเดือนที่มีค่าและไม่เกินราคาที่ระบุ
        result = result.filter(d => 
          d.price_monthly && 
          !isNaN(Number(d.price_monthly)) && 
          Number(d.price_monthly) > 0 && 
          Number(d.price_monthly) <= price
        );
      } else if (searchPriceType === 'term') {
        // ค้นหาเฉพาะราคารายเทอมที่มีค่าและไม่เกินราคาที่ระบุ
        result = result.filter(d => 
          d.price_term && 
          !isNaN(Number(d.price_term)) && 
          Number(d.price_term) > 0 && 
          Number(d.price_term) <= price
        );
      } else if (searchPriceType === 'all') {
        // ถ้าเลือก "ทุกประเภท" ให้ค้นหาหอพักที่มีราคาใดราคาหนึ่งที่ไม่เกินราคาที่ระบุ
        result = result.filter(d => {
          const dailyValid = d.price_daily && !isNaN(Number(d.price_daily)) && Number(d.price_daily) > 0 && Number(d.price_daily) <= price;
          const monthlyValid = d.price_monthly && !isNaN(Number(d.price_monthly)) && Number(d.price_monthly) > 0 && Number(d.price_monthly) <= price;
          const termValid = d.price_term && !isNaN(Number(d.price_term)) && Number(d.price_term) > 0 && Number(d.price_term) <= price;
          
          return dailyValid || monthlyValid || termValid;
        });
      }
    } else if (!searchPrice.trim() && searchPriceType !== 'all') {
      // กรองตามประเภทราคาที่มีอยู่ (ถ้าไม่ได้ระบุราคาแต่เลือกประเภท)
      if (searchPriceType === 'daily') {
        result = result.filter(d => 
          d.price_daily && 
          !isNaN(Number(d.price_daily)) && 
          Number(d.price_daily) > 0
        );
      } else if (searchPriceType === 'monthly') {
        result = result.filter(d => 
          d.price_monthly && 
          !isNaN(Number(d.price_monthly)) && 
          Number(d.price_monthly) > 0
        );
      } else if (searchPriceType === 'term') {
        result = result.filter(d => 
          d.price_term && 
          !isNaN(Number(d.price_term)) && 
          Number(d.price_term) > 0
        );
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

    // เรียงลำดับผลลัพธ์ตามราคา (ราคาต่ำไปสูง) ตามประเภทที่เลือก
    if (result.length > 0) {
      result.sort((a, b) => {
        let priceA = 0;
        let priceB = 0;

        if (searchPriceType === 'daily') {
          priceA = (a.price_daily && !isNaN(Number(a.price_daily))) ? Number(a.price_daily) : Infinity;
          priceB = (b.price_daily && !isNaN(Number(b.price_daily))) ? Number(b.price_daily) : Infinity;
        } else if (searchPriceType === 'monthly') {
          priceA = (a.price_monthly && !isNaN(Number(a.price_monthly))) ? Number(a.price_monthly) : Infinity;
          priceB = (b.price_monthly && !isNaN(Number(b.price_monthly))) ? Number(b.price_monthly) : Infinity;
        } else if (searchPriceType === 'term') {
          priceA = (a.price_term && !isNaN(Number(a.price_term))) ? Number(a.price_term) : Infinity;
          priceB = (b.price_term && !isNaN(Number(b.price_term))) ? Number(b.price_term) : Infinity;
        } else {
          // ถ้าเป็น "ทุกประเภท" ให้ใช้ราคาต่ำสุดที่มี
          const aPrices = [
            (a.price_daily && !isNaN(Number(a.price_daily))) ? Number(a.price_daily) : Infinity,
            (a.price_monthly && !isNaN(Number(a.price_monthly))) ? Number(a.price_monthly) : Infinity,
            (a.price_term && !isNaN(Number(a.price_term))) ? Number(a.price_term) : Infinity
          ];
          const bPrices = [
            (b.price_daily && !isNaN(Number(b.price_daily))) ? Number(b.price_daily) : Infinity,
            (b.price_monthly && !isNaN(Number(b.price_monthly))) ? Number(b.price_monthly) : Infinity,
            (b.price_term && !isNaN(Number(b.price_term))) ? Number(b.price_term) : Infinity
          ];
          
          priceA = Math.min(...aPrices);
          priceB = Math.min(...bPrices);
        }

        return priceA - priceB;
      });
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
          <div className="relative w-full md:w-64">
            <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 z-10" />
            <div className="flex border border-gray-300 rounded-lg overflow-hidden shadow-sm">
              <input
                className="flex-1 px-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border-r border-gray-300"
                type="number"
                placeholder="ราคาไม่เกิน (บาท)"
                value={searchPrice}
                onChange={e => setSearchPrice(e.target.value)}
                min="0"
              />
              <select
                className="bg-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[100px] appearance-none cursor-pointer"
                value={searchPriceType}
                onChange={e => setSearchPriceType(e.target.value)}
              >
                <option value="all">ทุกประเภท</option>
                <option value="daily">รายวัน</option>
                <option value="monthly">รายเดือน</option>
                <option value="term">รายเทอม</option>
              </select>
            </div>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
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
          หอพักทั้งหมด
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
                <div className="relative h-52 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  <img
                    src={
                      dorm.images && dorm.images.length > 0 && dorm.images[0]
                        ? (dorm.images[0].startsWith && dorm.images[0].startsWith('http')
                            ? dorm.images[0]
                            : `http://localhost:3001${dorm.images[0]}`)
                        : '/no-image.png'
                    }
                    alt={dorm.name}
                    className="w-full h-full object-cover transition-all duration-300"
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

                  {/* Rating & Reviews (Real Data per Dorm) */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < Math.round(Number(dormReviewStats[dorm.id]?.average_rating) || 5) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-1">
                        {dormReviewStats[dorm.id]?.average_rating ? Number(dormReviewStats[dorm.id].average_rating).toFixed(1) : '5.0'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      รีวิว {dormReviewStats[dorm.id]?.total_reviews || 0} คน
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

                  {/* Nearby Places with Distance (from coordinates) */}
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

                  {/* Nearby Places (from text field) */}
                  {dorm.near_places && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                        สถานที่ใกล้เคียงอื่นๆ
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
            className={`bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto relative modal-content modal-content-scroll ${modalClosing ? 'animate-zoomOutModal' : 'animate-zoomInModal'}`}
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
                      {selectedDorm.images && selectedDorm.images.length > 0 && selectedDorm.images[currentImgIdx] ? (
                        <>
                          <img
                            src={selectedDorm.images[currentImgIdx] && selectedDorm.images[currentImgIdx].startsWith ? 
                              (selectedDorm.images[currentImgIdx].startsWith('http') ? selectedDorm.images[currentImgIdx] : `http://localhost:3001${selectedDorm.images[currentImgIdx]}`) 
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
                                onClick={() => setCurrentImgIdx(prev => prev === 0 ? selectedDorm.images.length - 1 : prev - 1)}
                              >
                                <FaChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
                                onClick={() => setCurrentImgIdx(prev => prev === selectedDorm.images.length - 1 ? 0 : prev + 1)}
                              >
                                <FaChevronRight className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {selectedDorm.images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    className={`w-3 h-3 rounded-full transition-all ${idx === currentImgIdx ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'}`}
                                    onClick={e => { e.stopPropagation(); setCurrentImgIdx(idx); }}
                                  />
                                ))}
                              </div>
                              <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                                {currentImgIdx + 1} / {selectedDorm.images.length}
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
                            className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImgIdx ? 'border-blue-500 scale-105' : 'border-gray-200 hover:border-gray-400'}`}
                            onClick={e => { e.stopPropagation(); setCurrentImgIdx(idx); }}
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
                    ) : (
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

                    {/* Reviews Section - More Compact */}
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

                            {/* Comment */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                ความคิดเห็น
                              </label>
                              <textarea
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
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

                      {/* Reviews List - Compact */}
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {loadingReviews ? (
                          <div className="text-center py-4">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-sm text-gray-600">กำลังโหลดรีวิว...</p>
                          </div>
                        ) : dormReviews.length > 0 ? (
                          dormReviews.slice(0, 3).map((review, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-xs">
                                      {review.customer_name ? review.customer_name.charAt(0).toUpperCase() : 'A'}
                                    </span>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900 text-sm">
                                      {review.customer_name || 'ผู้ใช้งาน'}
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <div className="flex text-yellow-400 text-xs">
                                        {renderStars(review.rating)}
                                      </div>
                                      <span className="text-xs text-gray-600">
                                        {new Date(review.created_at).toLocaleDateString('th-TH')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <FaStar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">ยังไม่มีรีวิวสำหรับหอพักนี้</p>
                          </div>
                        )}
                      </div>
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