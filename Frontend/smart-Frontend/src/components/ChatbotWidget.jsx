import React, { useState, useRef, useEffect } from 'react';
import { 
  FaMapMarkerAlt, 
  FaMoneyBillWave, 
  FaTint, 
  FaBolt, 
  FaWifi,
  FaSnowflake,
  FaCar,
  FaBath,
  FaTshirt,
  FaArrowUp,
  FaShieldAlt,
  FaEye,
  FaStore,
  FaCouch,
  FaBed,
  FaTv,
  FaCheckCircle,
  FaUniversity,
  FaShoppingBag,
  FaHospital,
  FaLeaf,
  FaBus,
  FaTrain,
  FaUtensils,
  FaGasPump,
  FaMailBulk,
  FaTree,
  FaDumbbell,
  FaPlane,
  FaLandmark,
  FaStar,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import './ChatbotWidget.css';
import './DormDetailModal.css';

// Interactive Map Component
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
          const map = L.map('map').setView([${lat}, ${lng}], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          const dormIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          const placeIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          const dormMarker = L.marker([${lat}, ${lng}], { icon: dormIcon }).addTo(map);
          dormMarker.bindPopup('<div class="custom-popup"><div class="popup-title">${dormName}</div><div class="popup-type">หอพัก</div></div>');
          
          const nearbyPlaces = ${JSON.stringify(nearbyMarkersData)};
          nearbyPlaces.forEach(place => {
            if (place.lat && place.lng && !isNaN(place.lat) && !isNaN(place.lng)) {
              const marker = L.marker([place.lat, place.lng], { icon: placeIcon }).addTo(map);
              marker.bindPopup('<div class="custom-popup"><div class="popup-title">' + place.name + '</div><div class="popup-type">' + place.type + '</div></div>');
            }
          });
          
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
        <iframe
          src={createLeafletMap()}
          className="w-full h-full rounded-lg"
          title={`แผนที่ Leaflet ${dormName}`}
          onError={handleMapError}
        />
      ) : (
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
    </div>
  );
}

const SUGGESTIONS = [
  { text: 'หอพักราคาถูกที่สุด', icon: '🏠', color: 'blue' },
  { text: 'หอพักใกล้มหาวิทยาลัยมหาสารคาม', icon: '🎓', color: 'green' },
  { text: 'หอพักที่มี WiFi และแอร์', icon: '⭐', color: 'yellow' },
  { text: 'เปรียบเทียบระยะทางหอพัก', icon: '📍', color: 'purple' },
];

// รายการสถานที่สำหรับเปรียบเทียบระยะทาง (ให้ AI ใช้)
const PLACES_FOR_COMPARISON = [
  'ม.มหาสารคาม',
  'ม.ราชภัฏมหาสารคาม',
  'เสริมไทย คอมเพล็กซ์',
  'เสริมไทย พลาซ่า',
  'วิทยาลัยเทคนิคมหาสารคาม',
  'วิทยาลัยพยาบาลศรีมหาสารคาม',
  'แม็คโครมหาสารคาม',
  'สถานีขนส่งมหาสารคาม',
  'รพ.มหาสารคาม'
];

// Load conversation history from localStorage
const loadConversationHistory = () => {
  try {
    const saved = localStorage.getItem('chatbot_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Add timestamp to old messages if they don't have it
      return parsed.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
    }
  } catch (error) {
    console.warn('Failed to load chat history:', error);
  }
  return [
    { 
      sender: 'bot', 
      text: 'สวัสดีค่ะ! ฉันคือ AI ผู้ช่วยของ Smart Dormitory 🏠\n\nฉันพร้อมช่วยคุณค้นหาหอพักที่เหมาะสม แนะนำสิ่งอำนวยความสะดวก และตอบคำถามต่างๆ ค่ะ 😊\n\nพิเศษ! ตอนนี้ฉันสามารถเปรียบเทียบระยะทางระหว่างหอพักกับสถานที่ต่างๆ ได้แล้วค่ะ\n\nมีอะไรให้ช่วยไหมคะ?',
      timestamp: new Date()
    }
  ];
};

// Save conversation history to localStorage
const saveConversationHistory = (messages) => {
  try {
    // Keep only last 50 messages to prevent localStorage from getting too large
    const messagesToSave = messages.slice(-50);
    localStorage.setItem('chatbot_history', JSON.stringify(messagesToSave));
  } catch (error) {
    console.warn('Failed to save chat history:', error);
  }
};

function ChatbotWidget({ onClose }) {
  const [messages, setMessages] = useState(loadConversationHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatContext, setChatContext] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [showDormModal, setShowDormModal] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [reviewStats, setReviewStats] = useState(null);
  const messagesEndRef = useRef(null);

  // Check server connection status
  const checkServerStatus = async () => {
    try {
      setConnectionStatus('checking');
      const res = await fetch('http://localhost:3001/health', {
        method: 'GET',
        timeout: 5000
      });
      if (res.ok) {
        setConnectionStatus('online');
      } else {
        setConnectionStatus('offline');
      }
    } catch {
      setConnectionStatus('offline');
    }
  };

  useEffect(() => {
    checkServerStatus();
    // Check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages whenever they change
  useEffect(() => {
    saveConversationHistory(messages);
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px';
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const userMessage = { 
      sender: 'user', 
      text: text.trim(),
      timestamp: new Date()
    };
    
    setMessages(msgs => [...msgs, userMessage]);
    setInput('');
    setLoading(true);

    // Context handling สำหรับคำถามต่อเนื่อง
    let context = { ...chatContext };
    if (/อีก|เพิ่ม|กว่านี้|ไหม|ล่ะ|ด้วย|และ|หรือ|ขอ|แบบ|ไหน|อะไร|ยังไง|อีกบ้าง|อีกไหม|อีกมั้ย|อีกหรือเปล่า|อีกหรือ/i.test(text)) {
      const prevUserMsg = messages.slice().reverse().find(m => m.sender === 'user');
      if (prevUserMsg) {
        context.lastUser = prevUserMsg.text;
        text = prevUserMsg.text + ' ' + text;
      }
    }
    setChatContext(context);

    try {
      const res = await fetch('http://localhost:3001/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          conversationId: Date.now().toString()
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // ตรวจสอบว่า Backend ส่งข้อความกลับมาหรือไม่
      const botMessage = data.message;
      
      if (!botMessage || botMessage.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      setMessages(msgs => [...msgs, { 
        sender: 'bot', 
        text: botMessage,
        timestamp: new Date(),
        // ถ้าข้อความเริ่มด้วย ⚠️ หรือ 😔 ถือว่าเป็น error message จาก Backend
        isError: botMessage.startsWith('⚠️') || botMessage.startsWith('😔')
      }]);
      
    } catch (error) {
      console.error('Chatbot API error:', error);
      
      // ให้คำตอบ fallback เฉพาะกรณีที่เป็น network error เท่านั้น
      let fallbackMessage = '';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        fallbackMessage = '🔌 ขออภัยค่ะ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\n\n� กรุณาตรวจสอบ:\n• การเชื่อมต่ออินเทอร์เน็ต\n• Backend server ทำงานอยู่หรือไม่ (http://localhost:3001)\n• Firewall หรือ Antivirus บล็อกหรือไม่\n\n🔄 ลองรีเฟรชหน้าเว็บและทดสอบอีกครั้งค่ะ';
      } else if (error.message.includes('500')) {
        fallbackMessage = '⚙️ ขออภัยค่ะ เซิร์ฟเวอร์กำลังมีปัญหา\n\n🔧 ทีมงานกำลังแก้ไขปัญหา\n⏰ กรุณาลองใหม่ในอีกสักครู่ค่ะ';
      } else if (error.message.includes('timeout')) {
        fallbackMessage = '⏰ ขออภัยค่ะ การตอบสนองใช้เวลานานเกินไป\n\n� ลองวิธีนี้:\n• ถามคำถามสั้นๆ\n• รีเฟรชหน้าเว็บ\n• ลองใหม่อีกครั้ง';
      } else if (error.message.includes('Empty response')) {
        fallbackMessage = '📭 ขออภัยค่ะ ไม่ได้รับคำตอบจากเซิร์ฟเวอร์\n\n💡 ลองวิธีนี้:\n• รีเฟรชหน้าเว็บ\n• ถามคำถามใหม่\n• ตรวจสอบ Backend logs';
      } else {
        fallbackMessage = '😔 ขออภัยค่ะ เกิดข้อผิดพลาดที่ไม่คาดคิด\n\n💡 สำหรับตอนนี้ คุณสามารถ:\n• รีเฟรชหน้าเว็บและลองใหม่\n• ดูข้อมูลหอพักในหน้าหลัก\n• ใช้ฟิลเตอร์ค้นหาหอพัก\n• ติดต่อทีมงานโดยตรง\n\n🔍 Error: ' + error.message;
      }
      
      setMessages(msgs => [...msgs, { 
        sender: 'bot', 
        text: fallbackMessage,
        timestamp: new Date(),
        isError: true
      }]);
    }
    
    setLoading(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChatHistory = () => {
    setShowClearConfirm(true);
  };

  const confirmClearHistory = () => {
    const welcomeMessage = [
      { 
        sender: 'bot', 
        text: 'สวัสดีค่ะ! ฉันคือ AI ผู้ช่วยของ Smart Dormitory 🏠\n\nฉันพร้อมช่วยคุณค้นหาหอพักที่เหมาะสม แนะนำสิ่งอำนวยความสะดวก และตอบคำถามต่างๆ ค่ะ 😊\n\nพิเศษ! ตอนนี้ฉันสามารถเปรียบเทียบระยะทางระหว่างหอพักกับสถานที่ต่างๆ ได้แล้วค่ะ\n\nมีอะไรให้ช่วยไหมคะ?',
        timestamp: new Date()
      }
    ];
    setMessages(welcomeMessage);
    localStorage.removeItem('chatbot_history');
    setShowClearConfirm(false);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ฟังก์ชันเปิดหอพัก - ดึงข้อมูลจาก API แล้วแสดง Modal
  const handleOpenDorm = async (dormName) => {
    try {
      // ดึงข้อมูลหอพักทั้งหมด
      const response = await fetch('http://localhost:3001/dorms');
      if (!response.ok) throw new Error('Failed to fetch dorms');
      
      const dorms = await response.json();
      
      // หาหอพักที่ตรงกับชื่อ
      const dorm = dorms.find(d => d.name === dormName);
      
      if (dorm) {
        setSelectedDorm(dorm);
        setShowDormModal(true);
        setCurrentImgIdx(0);

        // ดึงข้อมูลรีวิว
        try {
          const reviewResponse = await fetch(`http://localhost:3001/reviews?dormId=${dorm.id}`);
          if (reviewResponse.ok) {
            const reviewData = await reviewResponse.json();
            setReviewStats(reviewData);
          }
        } catch (error) {
          console.warn('Failed to fetch reviews:', error);
          setReviewStats({ average_rating: 5, total_reviews: 0 });
        }
      } else {
        console.warn('Dorm not found:', dormName);
      }
    } catch (error) {
      console.error('Error opening dorm:', error);
    }
  };

  // Render stars for rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}
        />
      );
    }
    return stars;
  };

  // ฟังก์ชันปิด Modal
  const handleCloseDormModal = () => {
    setShowDormModal(false);
    setTimeout(() => {
      setSelectedDorm(null);
      setCurrentImgIdx(0);
      setReviewStats(null);
    }, 300);
  };

  // Parse dorm information from bot message
  const parseDormCards = (text) => {
    const dorms = [];
    const lines = text.split('\n');
    let currentDorm = null;

    console.log('🔍 Parsing chatbot message for dorm cards...');
    console.log('📝 Total lines:', lines.length);

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // ตรวจจับชื่อหอพัก (บรรทัดที่มี 🏠 และ **)
      // รูปแบบ: "1. 🏠 **ชื่อหอพัก**"
      const dormNameMatch = trimmedLine.match(/^\d+\.\s*🏠\s*\*\*(.+?)\*\*/);
      
      if (dormNameMatch) {
        // ถ้าพบหอพักใหม่ ให้เก็บหอพักเก่าก่อน
        if (currentDorm && currentDorm.name) {
          console.log('✅ Found dorm:', currentDorm);
          dorms.push(currentDorm);
        }
        
        // สร้างหอพักใหม่
        currentDorm = { 
          name: dormNameMatch[1].trim(), 
          prices: [], 
          facilities: [], 
          location: '',
          contact: ''
        };
        console.log('🏠 New dorm found:', currentDorm.name);
        return;
      }

      // ถ้ามีหอพักปัจจุบัน ให้ดึงข้อมูลต่างๆ
      if (currentDorm) {
        // ตรวจจับราคา - รูปแบบ: "💰 ราคารายเดือน: ฿2,500 บาท"
        const priceMatch = trimmedLine.match(/💰\s*ราคา(รายวัน|รายเดือน|รายเทอม):\s*฿?([\d,]+)\s*บาท?/i);
        if (priceMatch) {
          const priceType = priceMatch[1];
          const amount = priceMatch[2].replace(/,/g, '');
          currentDorm.prices.push({ type: priceType, amount });
          console.log('  💰 Price added:', priceType, '=', amount);
          return;
        }

        // ตรวจจับสิ่งอำนวยความสะดวก - รูปแบบ: "🌟 สิ่งอำนวยความสะดวก: WiFi, แอร์"
        const facilityMatch = trimmedLine.match(/🌟\s*สิ่งอำนวยความสะดวก:\s*(.+)/i);
        if (facilityMatch) {
          const facilities = facilityMatch[1].split(',').map(f => f.trim()).filter(f => f);
          currentDorm.facilities = facilities;
          console.log('  🌟 Facilities added:', facilities);
          return;
        }

        // ตรวจจับที่ตั้ง - รูปแบบ: "📍 ที่ตั้ง: ใกล้ม.มหาสารคาม"
        const locationMatch = trimmedLine.match(/📍\s*ที่ตั้ง:\s*(.+)/i);
        if (locationMatch) {
          currentDorm.location = locationMatch[1].trim();
          console.log('  📍 Location added:', currentDorm.location);
          return;
        }

        // ตรวจจับเบอร์ติดต่อ - รูปแบบ: "📞 ติดต่อ: 043-123456"
        const contactMatch = trimmedLine.match(/📞\s*ติดต่อ:\s*(.+)/i);
        if (contactMatch) {
          currentDorm.contact = contactMatch[1].trim();
          console.log('  📞 Contact added:', currentDorm.contact);
          return;
        }
      }
    });

    // เพิ่มหอพักสุดท้าย
    if (currentDorm && currentDorm.name) {
      console.log('✅ Found dorm (last):', currentDorm);
      dorms.push(currentDorm);
    }

    // กรองเฉพาะหอพักที่มีชื่อ
    const filteredDorms = dorms.filter(d => d.name && d.name.length > 0);
    console.log('🎯 Total dorms parsed:', filteredDorms.length);
    
    return filteredDorms;
  };

  // Render message content with dorm cards
  const renderMessageContent = (msg) => {
    const dormCards = parseDormCards(msg.text);
    
    if (dormCards.length > 0) {
      // แยกข้อความแนะนำออกจากส่วนของหอพัก
      const lines = msg.text.split('\n');
      const introLines = [];
      let foundFirstDorm = false;
      
      for (const line of lines) {
        // ถ้ายังไม่เจอหอพักแรก ให้เก็บบรรทัดนี้
        if (!foundFirstDorm && !line.match(/^\d+\.\s*🏠\s*\*\*/)) {
          if (line.trim()) {
            introLines.push(line);
          }
        } else if (line.match(/^\d+\.\s*🏠\s*\*\*/)) {
          foundFirstDorm = true;
        }
      }
      
      const textWithoutDorms = introLines.join('\n').trim();

      return (
        <>
          {textWithoutDorms && (
            <div className="chatbot-message-intro">
              {textWithoutDorms.split('\n').map((line, i) => (
                <div key={i}>
                  {line.startsWith('**') && line.endsWith('**') ? (
                    <strong>{line.slice(2, -2)}</strong>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="chatbot-dorm-cards">
            {dormCards.map((dorm, index) => (
              <div 
                key={index} 
                className="chatbot-dorm-card"
                onClick={() => handleOpenDorm(dorm.name)}
                title="คลิกเพื่อดูรายละเอียดเพิ่มเติม"
              >
                <div className="chatbot-dorm-card-header">
                  <div className="chatbot-dorm-icon">🏠</div>
                  <h4 className="chatbot-dorm-name">{dorm.name}</h4>
                  <div className="chatbot-dorm-view-icon">👁️</div>
                </div>
                <div className="chatbot-dorm-card-body">
                  {dorm.prices && dorm.prices.length > 0 && dorm.prices.map((price, i) => (
                    <div key={i} className="chatbot-dorm-price">
                      <span className="chatbot-price-label">{price.type}</span>
                      <span className="chatbot-price-amount">฿{parseInt(price.amount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="chatbot-dorm-click-hint">
                    <span>💡 คลิกเพื่อดูรายละเอียดเพิ่มเติม</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    // ถ้าไม่พบข้อมูลหอพัก แสดงข้อความปกติ
    return msg.text.split('\n').map((line, lineIndex) => (
      <div key={lineIndex}>
        {line.startsWith('**') && line.endsWith('**') ? (
          <strong>{line.slice(2, -2)}</strong>
        ) : (
          line
        )}
      </div>
    ));
  };

  return (
    <div className="chatbot-widget">
      {/* Dorm Detail Modal - Agoda Style */}
      {showDormModal && selectedDorm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={handleCloseDormModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto relative modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 z-30 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-500 rounded-full p-2 transition-all duration-200 shadow-lg"
              onClick={handleCloseDormModal}
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
                  {selectedDorm.address_detail && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                      <span>{selectedDorm.address_detail}</span>
                    </div>
                  )}
                </div>

                {/* Main Image Gallery */}
                <div className="mb-6">
                  <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-lg">
                    {selectedDorm.images && selectedDorm.images.length > 0 && selectedDorm.images[currentImgIdx] ? (
                      <>
                        <img
                          src={selectedDorm.images[currentImgIdx].startsWith && selectedDorm.images[currentImgIdx].startsWith('http') 
                            ? selectedDorm.images[currentImgIdx] 
                            : `http://localhost:3001${selectedDorm.images[currentImgIdx]}`}
                          alt={selectedDorm.name}
                          className="w-full h-full object-cover"
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
                                  onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }}
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
                          onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(idx); }}
                        >
                          <img
                            src={img.startsWith('http') ? img : `http://localhost:3001${img}`}
                            alt={`${selectedDorm.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/no-image.png'; }}
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
                        latitude="16.246825"
                        longitude="103.252075"
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
                        {(() => {
                          const facilitiesText = selectedDorm.facilities;
                          const facilityItems = facilitiesText
                            .split(/[,\n•-]/)
                            .map(item => item.trim())
                            .filter(item => item.length > 0);

                          const getFacilityIcon = (facility) => {
                            const text = facility.toLowerCase();
                            if (text.includes('wifi') || text.includes('อินเทอร์เน็ต') || text.includes('internet')) return { icon: 'wifi', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
                            if (text.includes('แอร์') || text.includes('เครื่องปรับอากาศ') || text.includes('air')) return { icon: 'snowflake', color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200' };
                            if (text.includes('ห้องน้ำ') || text.includes('bathroom') || text.includes('ส้วม')) return { icon: 'bath', color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-200' };
                            if (text.includes('ที่จอดรถ') || text.includes('parking') || text.includes('จอด')) return { icon: 'car', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
                            if (text.includes('ซักผ้า') || text.includes('laundry') || text.includes('washing')) return { icon: 'tshirt', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
                            if (text.includes('ลิฟต์') || text.includes('elevator')) return { icon: 'arrowup', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
                            if (text.includes('ยาม') || text.includes('รปภ') || text.includes('security') || text.includes('guards')) return { icon: 'shield', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
                            if (text.includes('cctv') || text.includes('กล้อง')) return { icon: 'eye', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
                            if (text.includes('ร้าน') || text.includes('shop') || text.includes('7-11') || text.includes('เซเว่น')) return { icon: 'store', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
                            if (text.includes('โต๊ะ') || text.includes('เก้าอี้') || text.includes('furniture') || text.includes('เฟอร์นิเจอร์')) return { icon: 'couch', color: 'text-brown-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
                            if (text.includes('เตียง') || text.includes('bed')) return { icon: 'bed', color: 'text-purple-400', bg: 'bg-purple-50', border: 'border-purple-200' };
                            if (text.includes('ทีวี') || text.includes('tv') || text.includes('television')) return { icon: 'tv', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
                            return { icon: 'check', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
                          };

                          const renderFacilityIcon = (iconType, colorClass) => {
                            const iconProps = { className: `w-4 h-4 ${colorClass}` };
                            switch(iconType) {
                              case 'wifi': return <FaWifi {...iconProps} />;
                              case 'snowflake': return <FaSnowflake {...iconProps} />;
                              case 'bath': return <FaBath {...iconProps} />;
                              case 'car': return <FaCar {...iconProps} />;
                              case 'tshirt': return <FaTshirt {...iconProps} />;
                              case 'arrowup': return <FaArrowUp {...iconProps} />;
                              case 'shield': return <FaShieldAlt {...iconProps} />;
                              case 'eye': return <FaEye {...iconProps} />;
                              case 'store': return <FaStore {...iconProps} />;
                              case 'couch': return <FaCouch {...iconProps} />;
                              case 'bed': return <FaBed {...iconProps} />;
                              case 'tv': return <FaTv {...iconProps} />;
                              default: return <FaCheckCircle {...iconProps} />;
                            }
                          };

                          if (facilityItems.length <= 1) {
                            return <p className="text-gray-700 leading-relaxed">{facilitiesText}</p>;
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {facilityItems.slice(0, 8).map((facility, index) => {
                                const iconData = getFacilityIcon(facility);
                                return (
                                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${iconData.bg} ${iconData.border} hover:shadow-md transition-all duration-200 hover:scale-105`}>
                                    <div className={`w-8 h-8 rounded-full ${iconData.bg} border ${iconData.border} flex items-center justify-center flex-shrink-0`}>
                                      {renderFacilityIcon(iconData.icon, iconData.color)}
                                    </div>
                                    <span className="text-gray-800 font-medium text-sm flex-1 leading-tight">{facility}</span>
                                  </div>
                                );
                              })}
                              {facilityItems.length > 8 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                    +{facilityItems.length - 8}
                                  </div>
                                  <span className="text-gray-600 text-sm">สิ่งอำนวยความสะดวกอื่นๆ</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                        {(() => {
                          const nearPlacesText = selectedDorm.near_places;
                          const placeItems = nearPlacesText
                            .split(/[,\n•-]/)
                            .map(item => item.trim())
                            .filter(item => item.length > 0);

                          const getPlaceIcon = (place) => {
                            const text = place.toLowerCase();
                            if (text.includes('มหาวิทยาลัย') || text.includes('university') || text.includes('college') || text.includes('วิทยาลัย')) return { icon: 'university', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
                            if (text.includes('โรงพยาบาล') || text.includes('hospital') || text.includes('คลินิก') || text.includes('clinic')) return { icon: 'hospital', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
                            if (text.includes('ห้าง') || text.includes('mall') || text.includes('shopping') || text.includes('เซ็นทรัล') || text.includes('central')) return { icon: 'shopping', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200' };
                            if (text.includes('7-11') || text.includes('เซเว่น') || text.includes('ร้านสะดวกซื้อ') || text.includes('convenience')) return { icon: 'store', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
                            if (text.includes('ตลาด') || text.includes('market') || text.includes('fresh market')) return { icon: 'leaf', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
                            if (text.includes('ป้ายรถ') || text.includes('bus') || text.includes('รถเมล์') || text.includes('ขนส่ง')) return { icon: 'bus', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
                            if (text.includes('bts') || text.includes('mrt') || text.includes('รถไฟฟ้า') || text.includes('สถานี')) return { icon: 'train', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
                            if (text.includes('ร้านอาหาร') || text.includes('restaurant') || text.includes('food') || text.includes('อาหาร')) return { icon: 'utensils', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
                            if (text.includes('ปั๊ม') || text.includes('gas') || text.includes('น้ำมัน') || text.includes('petrol')) return { icon: 'gas', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
                            if (text.includes('ไปรษณีย์') || text.includes('post') || text.includes('office')) return { icon: 'mail', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' };
                            if (text.includes('สวน') || text.includes('park') || text.includes('garden')) return { icon: 'tree', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
                            if (text.includes('ฟิตเนส') || text.includes('fitness') || text.includes('gym')) return { icon: 'dumbbell', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
                            if (text.includes('สนามบิน') || text.includes('airport')) return { icon: 'plane', color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-200' };
                            return { icon: 'marker', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
                          };

                          const renderPlaceIcon = (iconType, colorClass) => {
                            const iconProps = { className: `w-4 h-4 ${colorClass}` };
                            switch(iconType) {
                              case 'university': return <FaUniversity {...iconProps} />;
                              case 'hospital': return <FaHospital {...iconProps} />;
                              case 'shopping': return <FaShoppingBag {...iconProps} />;
                              case 'store': return <FaStore {...iconProps} />;
                              case 'leaf': return <FaLeaf {...iconProps} />;
                              case 'bus': return <FaBus {...iconProps} />;
                              case 'train': return <FaTrain {...iconProps} />;
                              case 'utensils': return <FaUtensils {...iconProps} />;
                              case 'gas': return <FaGasPump {...iconProps} />;
                              case 'mail': return <FaMailBulk {...iconProps} />;
                              case 'tree': return <FaTree {...iconProps} />;
                              case 'dumbbell': return <FaDumbbell {...iconProps} />;
                              case 'plane': return <FaPlane {...iconProps} />;
                              default: return <FaMapMarkerAlt {...iconProps} />;
                            }
                          };

                          if (placeItems.length <= 1) {
                            return <p className="text-gray-700 leading-relaxed">{nearPlacesText}</p>;
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {placeItems.slice(0, 8).map((place, index) => {
                                const iconData = getPlaceIcon(place);
                                return (
                                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${iconData.bg} ${iconData.border} hover:shadow-md transition-all duration-200 hover:scale-105`}>
                                    <div className={`w-8 h-8 rounded-full ${iconData.bg} border ${iconData.border} flex items-center justify-center flex-shrink-0`}>
                                      {renderPlaceIcon(iconData.icon, iconData.color)}
                                    </div>
                                    <span className="text-gray-800 font-medium text-sm flex-1 leading-tight">{place}</span>
                                  </div>
                                );
                              })}
                              {placeItems.length > 8 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                    +{placeItems.length - 8}
                                  </div>
                                  <span className="text-gray-600 text-sm">สถานที่อื่นๆ</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  {selectedDorm.contact_phone && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">📞 ติดต่อ</h3>
                      <a href={`tel:${selectedDorm.contact_phone}`} className="text-blue-600 font-semibold hover:underline">
                        {selectedDorm.contact_phone}
                      </a>
                    </div>
                  )}

                  {/* Room Availability */}
                  {(selectedDorm.total_rooms || selectedDorm.available_rooms || selectedDorm.occupied_rooms) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">🚪 สถานะห้องพัก</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedDorm.total_rooms > 0 && (
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-gray-800">{selectedDorm.total_rooms}</div>
                            <div className="text-sm text-gray-600">ห้องทั้งหมด</div>
                          </div>
                        )}
                        {selectedDorm.available_rooms >= 0 && (
                          <div className="p-4 bg-green-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{selectedDorm.available_rooms}</div>
                            <div className="text-sm text-gray-600">ห้องว่าง</div>
                          </div>
                        )}
                        {selectedDorm.occupied_rooms >= 0 && (
                          <div className="p-4 bg-red-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600">{selectedDorm.occupied_rooms}</div>
                            <div className="text-sm text-gray-600">ห้องไม่ว่าง</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-content">
          <div className="chatbot-avatar">
            <div className="chatbot-avatar-inner">
              🤖
            </div>
            <div className="chatbot-status-dot"></div>
          </div>
          <div className="chatbot-header-text">
            <h3>AI Assistant</h3>
            <p>
              Smart Dormitory Helper
              {connectionStatus === 'online' && <span className="status-indicator online"> • ออนไลน์</span>}
              {connectionStatus === 'offline' && <span className="status-indicator offline"> • ออฟไลน์</span>}
              {connectionStatus === 'checking' && <span className="status-indicator checking"> • กำลังตรวจสอบ...</span>}
            </p>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button
            className="chatbot-action-btn"
            onClick={clearChatHistory}
            title="ล้างประวัติการสนทนา"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
            </svg>
          </button>
          <button
            className="chatbot-close-btn"
            onClick={onClose}
            aria-label="ปิดแชทบอท"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chatbot-message ${msg.sender === 'user' ? 'user' : 'bot'} ${msg.isError ? 'error' : ''}`}
          >
            <div className="chatbot-message-content">
              <div className="chatbot-message-text">
                {renderMessageContent(msg)}
              </div>
              <div className="chatbot-message-time">
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="chatbot-message bot">
            <div className="chatbot-message-content">
              <div className="chatbot-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chatbot-input-container">
        <div className="chatbot-input-wrapper">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="พิมพ์ข้อความ... (เช่น เปรียบเทียบระยะทางกับ ม.มหาสารคาม)"
            className="chatbot-input"
            disabled={loading}
            rows="1"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="chatbot-send-btn"
            aria-label="ส่งข้อความ"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="chatbot-modal-overlay">
          <div className="chatbot-modal">
            <div className="chatbot-modal-header">
              <div className="chatbot-modal-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
                </svg>
              </div>
              <h3>ยืนยันการลบประวัติสนทนา</h3>
            </div>
            <div className="chatbot-modal-content">
              <p>คุณแน่ใจหรือไม่ที่จะลบประวัติการสนทนาทั้งหมด?</p>
              <p className="chatbot-modal-warning">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="chatbot-modal-actions">
              <button 
                className="chatbot-modal-btn cancel"
                onClick={() => setShowClearConfirm(false)}
              >
                ยกเลิก
              </button>
              <button 
                className="chatbot-modal-btn confirm"
                onClick={confirmClearHistory}
              >
                ลบประวัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatbotWidget;
