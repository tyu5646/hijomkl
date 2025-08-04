import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

const SUGGESTIONS = [
  { text: 'ค้นหาหอพักราคาถูก', icon: '🏠', color: 'blue' },
  { text: 'หอพักใกล้มหาวิทยาลัย', icon: '🎓', color: 'green' },
  { text: 'รีวิวหอพัก', icon: '⭐', color: 'yellow' },
];

// รายการสถานที่สำหรับเปรียบเทียบระยะทาง
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

// ฟังก์ชันเปรียบเทียบระยะทางระหว่างหอพักกับสถานที่
const compareDistanceToPlace = (dorms, placeName) => {
  const dormsWithDistance = dorms.map(dorm => {
    let distance = 'ไม่ระบุ';
    let priority = 999;
    
    if (dorm.near_places) {
      const nearPlaces = dorm.near_places.toLowerCase();
      const place = placeName.toLowerCase();
      
      if (nearPlaces.includes(place)) {
        // ถ้าหอพักมีสถานที่นั้นในรายการใกล้เคียง
        distance = 'ใกล้มาก';
        priority = 1;
      } else {
        // ประมาณระยะทางตามความคล้ายคลึงของชื่อ
        if (place.includes('ม.') || place.includes('มหาวิทยาลัย')) {
          if (nearPlaces.includes('มหาวิทยาลัย') || nearPlaces.includes('ม.')) {
            distance = 'ใกล้';
            priority = 2;
          } else {
            distance = 'ปานกลาง';
            priority = 3;
          }
        } else if (place.includes('โรงพยาบาล') || place.includes('รพ')) {
          if (nearPlaces.includes('โรงพยาบาล') || nearPlaces.includes('รพ')) {
            distance = 'ใกล้';
            priority = 2;
          } else {
            distance = 'ไกล';
            priority = 4;
          }
        } else {
          distance = 'ไม่ทราบ';
          priority = 5;
        }
      }
    }
    
    return {
      ...dorm,
      distanceToPlace: distance,
      distancePriority: priority
    };
  });
  
  // เรียงลำดับตามความใกล้
  return dormsWithDistance.sort((a, b) => a.distancePriority - b.distancePriority);
};

// ฟังก์ชันสร้างข้อความเปรียบเทียบ
const generateDistanceComparisonMessage = (dorms, placeName) => {
  const sortedDorms = compareDistanceToPlace(dorms, placeName);
  
  if (sortedDorms.length === 0) {
    return `ขออภัยค่ะ ไม่พบข้อมูลหอพักสำหรับเปรียบเทียบระยะทางกับ ${placeName}`;
  }
  
  let message = `📏 **การเปรียบเทียบระยะทางกับ ${placeName}**\n\n`;
  
  const veryClose = sortedDorms.filter(d => d.distanceToPlace === 'ใกล้มาก');
  const close = sortedDorms.filter(d => d.distanceToPlace === 'ใกล้');
  const medium = sortedDorms.filter(d => d.distanceToPlace === 'ปานกลาง');
  const far = sortedDorms.filter(d => d.distanceToPlace === 'ไกล');
  
  if (veryClose.length > 0) {
    message += `🟢 **ใกล้มาก (แนะนำ)**\n`;
    veryClose.slice(0, 3).forEach((dorm, index) => {
      const price = dorm.price_monthly ? `฿${Number(dorm.price_monthly).toLocaleString()}/เดือน` : 'ไม่ระบุราคา';
      message += `${index + 1}. ${dorm.name} - ${price}\n`;
    });
    message += '\n';
  }
  
  if (close.length > 0) {
    message += `🟡 **ใกล้**\n`;
    close.slice(0, 3).forEach((dorm, index) => {
      const price = dorm.price_monthly ? `฿${Number(dorm.price_monthly).toLocaleString()}/เดือน` : 'ไม่ระบุราคา';
      message += `${index + 1}. ${dorm.name} - ${price}\n`;
    });
    message += '\n';
  }
  
  if (medium.length > 0) {
    message += `🟠 **ปานกลาง**\n`;
    medium.slice(0, 2).forEach((dorm, index) => {
      const price = dorm.price_monthly ? `฿${Number(dorm.price_monthly).toLocaleString()}/เดือน` : 'ไม่ระบุราคา';
      message += `${index + 1}. ${dorm.name} - ${price}\n`;
    });
    message += '\n';
  }
  
  if (far.length > 0) {
    message += `🔴 **ไกล**\n`;
    far.slice(0, 2).forEach((dorm, index) => {
      const price = dorm.price_monthly ? `฿${Number(dorm.price_monthly).toLocaleString()}/เดือน` : 'ไม่ระบุราคา';
      message += `${index + 1}. ${dorm.name} - ${price}\n`;
    });
  }
  
  message += `\n💡 **คำแนะนำ:** หอพักที่ใกล้ ${placeName} จะช่วยประหยัดเวลาและค่าเดินทาง`;
  
  return message;
};

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

  // ดึงข้อมูลหอพักสำหรับการเปรียบเทียบ
  const fetchDormsForComparison = async () => {
    try {
      const res = await fetch('http://localhost:3001/dorms');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.error('Error fetching dorms:', error);
    }
    return [];
  };

  // จัดการข้อความเปรียบเทียบระยะทาง
  const handleDistanceComparison = async (placeName) => {
    setLoading(true);
    
    try {
      const dorms = await fetchDormsForComparison();
      const comparisonMessage = generateDistanceComparisonMessage(dorms, placeName);
      
      setMessages(msgs => [...msgs, { 
        sender: 'bot', 
        text: comparisonMessage,
        timestamp: new Date(),
        isDistanceComparison: true
      }]);
      
      // เพิ่มข้อความเสนอสถานที่อื่น
      setTimeout(() => {
        const suggestOtherPlaces = `\n🔍 **เปรียบเทียบกับสถานที่อื่น?**\n\nคลิกเลือกสถานที่ที่ต้องการ:\n${PLACES_FOR_COMPARISON.filter(p => p !== placeName).slice(0, 4).map(place => `• ${place}`).join('\n')}`;
        
        setMessages(msgs => [...msgs, { 
          sender: 'bot', 
          text: suggestOtherPlaces,
          timestamp: new Date(),
          showPlaceButtons: true,
          availablePlaces: PLACES_FOR_COMPARISON.filter(p => p !== placeName)
        }]);
      }, 1000);
      
    } catch (error) {
      console.error('Error in distance comparison:', error);
      setMessages(msgs => [...msgs, { 
        sender: 'bot', 
        text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในการเปรียบเทียบระยะทาง กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date()
      }]);
    }
    
    setLoading(false);
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

    // ตรวจสอบคำขอเปรียบเทียบระยะทาง
    const distanceKeywords = ['เปรียบเทียบ', 'ระยะทาง', 'ใกล้', 'ไกล', 'ระยะ', 'ห่าง', 'เดินทาง'];
    const isDistanceRequest = distanceKeywords.some(keyword => text.includes(keyword));
    
    if (isDistanceRequest) {
      // หาสถานที่ที่ถูกกล่าวถึง
      const mentionedPlace = PLACES_FOR_COMPARISON.find(place => 
        text.includes(place) || text.includes(place.replace('ม.', 'มหาวิทยาลัย'))
      );
      
      if (mentionedPlace) {
        await handleDistanceComparison(mentionedPlace);
        return;
      } else {
        // ถ้าไม่ระบุสถานที่ ให้แสดงตัวเลือก
        const placeOptions = `📏 **เปรียบเทียบระยะทางหอพัก**\n\nกรุณาเลือกสถานที่ที่ต้องการเปรียบเทียบ:\n\n${PLACES_FOR_COMPARISON.map((place, index) => `${index + 1}. ${place}`).join('\n')}`;
        
        setMessages(msgs => [...msgs, { 
          sender: 'bot', 
          text: placeOptions,
          timestamp: new Date(),
          showPlaceButtons: true,
          availablePlaces: PLACES_FOR_COMPARISON
        }]);
        setLoading(false);
        return;
      }
    }

    // Context handling
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
      
      setMessages(msgs => [...msgs, { 
        sender: 'bot', 
        text: data.message || 'ขออภัยค่ะ ไม่สามารถประมวลผลคำตอบได้ในขณะนี้',
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Chatbot API error:', error);
      
      // ให้คำตอบ fallback ตามประเภทของข้อผิดพลาด
      let fallbackMessage = 'ขออภัยค่ะ มีปัญหาเทคนิคชั่วคราว 😔\n\n';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        fallbackMessage += '🔄 กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต\n📡 หรือลองใหม่อีกครั้งในอีกสักครู่ค่ะ';
      } else if (error.message.includes('500')) {
        fallbackMessage += '⚙️ เซิร์ฟเวอร์กำลังมีปัญหา\n🔧 ทีมงานกำลังแก้ไขปัญหาค่ะ';
      } else if (error.message.includes('timeout')) {
        fallbackMessage += '⏰ การตอบสนองใช้เวลานานเกินไป\n🚀 ลองส่งข้อความสั้นๆ ดูค่ะ';
      } else {
        fallbackMessage += '💡 สำหรับตอนนี้ คุณสามารถ:\n• ดูข้อมูลหอพักในหน้าหลัก\n• ใช้ฟิลเตอร์ค้นหาหอพัก\n• เปรียบเทียบระยะทางหอพัก\n• ติดต่อเจ้าหน้าที่โดยตรง';
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
    if (window.confirm('คุณต้องการล้างประวัติการสนทนาทั้งหมดหรือไม่?')) {
      const welcomeMessage = [
        { 
          sender: 'bot', 
          text: 'สวัสดีค่ะ! ฉันคือ AI ผู้ช่วยของ Smart Dormitory 🏠\n\nฉันพร้อมช่วยคุณค้นหาหอพักที่เหมาะสม แนะนำสิ่งอำนวยความสะดวก และตอบคำถามต่างๆ ค่ะ 😊\n\nพิเศษ! ตอนนี้ฉันสามารถเปรียบเทียบระยะทางระหว่างหอพักกับสถานที่ต่างๆ ได้แล้วค่ะ\n\nมีอะไรให้ช่วยไหมคะ?',
          timestamp: new Date()
        }
      ];
      setMessages(welcomeMessage);
      localStorage.removeItem('chatbot_history');
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chatbot-widget">
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
                {msg.text.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex}>
                    {line.startsWith('**') && line.endsWith('**') ? (
                      <strong>{line.slice(2, -2)}</strong>
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </div>
              {msg.showPlaceButtons && msg.availablePlaces && (
                <div className="chatbot-place-buttons">
                  {msg.availablePlaces.slice(0, 6).map((place, btnIndex) => (
                    <button
                      key={btnIndex}
                      className="chatbot-place-btn"
                      onClick={() => handleDistanceComparison(place)}
                    >
                      📍 {place}
                    </button>
                  ))}
                </div>
              )}
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

      {/* Quick Suggestions - Compact */}
      <div className="chatbot-suggestions">
        <div className="suggestions-grid">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              className={`chatbot-suggestion ${suggestion.color}`}
              onClick={() => sendMessage(suggestion.text)}
              disabled={loading}
              title={suggestion.text}
            >
              <span className="suggestion-icon">{suggestion.icon}</span>
              <span className="suggestion-text">{suggestion.text}</span>
            </button>
          ))}
        </div>
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
    </div>
  );
}

export default ChatbotWidget;
