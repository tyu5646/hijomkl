import React from 'react';
import ReactDOM from 'react-dom';
import { FaSignOutAlt, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  const handleLogout = () => {
    // ลบข้อมูลการเข้าสู่ระบบ
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    // เรียก callback function
    onConfirm();
    
    // รีไดเรกต์ไปหน้าหลัก
    window.location.href = '/';
  };

  // Create a div for the modal and ensure it's positioned correctly
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        margin: 0,
        padding: '16px',
        boxSizing: 'border-box'
      }}
      className="animate-fadeInModal"
      onClick={onCancel}
    >
      {/* Modal Container */}
      <div
        style={{
          position: 'relative',
          maxWidth: '400px',
          width: '100%',
          maxHeight: '90vh',
          margin: 0,
          padding: 0,
          transform: 'none'
        }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-zoomInModal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 px-6 py-4 relative">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
          
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <FaTimes className="w-4 h-4 text-white" />
          </button>
          
          {/* Header Content */}
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-3">
              <FaExclamationTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">ยืนยันการออกจากระบบ</h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg font-medium mb-2">
              คุณแน่ใจหรือไม่ที่จะออกจากระบบ?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
            >
              <FaTimes className="w-4 h-4" />
              ยกเลิก
            </button>
            
            {/* Confirm Button */}
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-105"
            >
              <FaSignOutAlt className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use Portal to render modal at body level
  return ReactDOM.createPortal(modalContent, document.body);
};

export default LogoutConfirmModal;
