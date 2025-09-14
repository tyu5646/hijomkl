import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

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
