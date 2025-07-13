import React, { useEffect, useState } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { FaBed, FaMoneyBillWave, FaMapMarkerAlt, FaCouch, FaLandmark, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function OwnerHomePage() {
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const navigate = useNavigate();

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
                      onClick={() => window.location.href = '/owner/dorm-manage'}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                      เพิ่มหอพักแรก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {dorms.map((dorm, index) => (
                    <div
                      key={dorm.id}
                      className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleOpenDorm(dorm)}
                    >
                      {/* Enhanced Image Section */}
                      <div className="relative overflow-hidden">
                        <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={
                              dorm.images && dorm.images.length > 0
                                ? (dorm.images[0].startsWith('http') ? dorm.images[0] : `http://localhost:3001${dorm.images[0]}`)
                                : '/no-image.png'
                            }
                            alt={dorm.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={e => { e.target.src = '/no-image.png'; }}
                          />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Image Count Badge */}
                          {dorm.images && dorm.images.length > 1 && (
                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-medium">
                              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093L6.455 10.5l-2.86-2.4a.5.5 0 0 0-.571-.094L1.002 9.4V3a1 1 0 0 1 1-1h12z"/>
                              </svg>
                              {dorm.images.length}
                            </div>
                          )}
                          
                          {/* Popular Badge */}
                          {index < 3 && (
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                              ⭐ ยอดนิยม
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                              <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-gray-800 shadow-lg">
                                🖱️ คลิกเพื่อดูรายละเอียด
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Content Section */}
                      <div className="p-6">
                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                          {dorm.name}
                        </h3>
                        
                        {/* Location */}
                        {dorm.location && (
                          <div className="flex items-start gap-2 mb-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                            <FaMapMarkerAlt className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2 leading-relaxed">{dorm.location}</span>
                          </div>
                        )}

                        {/* Facilities */}
                        {dorm.facilities && (
                          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 bg-orange-50 rounded-xl p-3">
                            <FaCouch className="text-orange-500 flex-shrink-0" />
                            <span className="line-clamp-1 font-medium">{dorm.facilities}</span>
                          </div>
                        )}

                        {/* Enhanced Price Section */}
                        <div className="space-y-2 mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                          <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                            <FaMoneyBillWave className="w-3 h-3" />
                            ราคาเช่า
                          </div>
                          {dorm.price_daily > 0 && (
                            <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2 shadow-sm">
                              <span className="text-gray-600 flex items-center gap-1 font-medium">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                รายวัน
                              </span>
                              <span className="font-bold text-green-600 text-base">฿{Number(dorm.price_daily).toLocaleString()}</span>
                            </div>
                          )}
                          {dorm.price_monthly > 0 && (
                            <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2 shadow-sm">
                              <span className="text-gray-600 flex items-center gap-1 font-medium">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                รายเดือน
                              </span>
                              <span className="font-bold text-blue-600 text-base">฿{Number(dorm.price_monthly).toLocaleString()}</span>
                            </div>
                          )}
                          {dorm.price_term > 0 && (
                            <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2 shadow-sm">
                              <span className="text-gray-600 flex items-center gap-1 font-medium">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                รายเทอม
                              </span>
                              <span className="font-bold text-purple-600 text-base">฿{Number(dorm.price_term).toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex justify-between items-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ ดำเนินการ
                          </span>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            จัดการ
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
        {/* Enhanced Modal */}
        {selectedDorm && modalVisible && (
          <div
            className={`fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 ${modalClosing ? 'animate-fadeOutModal' : 'animate-fadeInModal'}`}
            onClick={handleCloseDorm}
          >
            <div
              className={`bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative ${modalClosing ? 'animate-zoomOutModal' : 'animate-zoomInModal'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-6 py-4 rounded-t-3xl z-10 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                      <FaBed className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedDorm.name}</h2>
                      {selectedDorm.location && (
                        <div className="flex items-center gap-1 text-blue-100 mt-1">
                          <FaMapMarkerAlt className="text-blue-200 text-sm" />
                          <span className="text-sm">{selectedDorm.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-all backdrop-blur-sm"
                    onClick={handleCloseDorm}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col lg:flex-row">
                {/* Image Gallery */}
                <div className="lg:w-1/2 p-6">
                  <div className="relative">
                    {selectedDorm.images && selectedDorm.images.length > 0 ? (
                      <>
                        <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                          <img
                            src={selectedDorm.images[galleryIndex].startsWith('http') ? selectedDorm.images[galleryIndex] : `http://localhost:3001${selectedDorm.images[galleryIndex]}`}
                            alt={selectedDorm.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.src = '/no-image.png'; }}
                          />
                          {selectedDorm.images.length > 1 && (
                            <>
                              <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                                onClick={handlePrevImage}
                              >
                                <FaChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                                onClick={handleNextImage}
                              >
                                <FaChevronRight className="w-5 h-5" />
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
                        </div>
                      </>
                    ) : (
                      <div className="h-80 bg-gray-100 rounded-2xl flex items-center justify-center">
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

                {/* Property Details */}
                <div className="lg:w-1/2 p-6 lg:border-l border-gray-200">
                  {/* Price Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaMoneyBillWave className="text-green-500" />
                      ราคา
                    </h3>
                    <div className="space-y-3">
                      {selectedDorm.price_daily > 0 && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-gray-700">รายวัน</span>
                          </div>
                          <span className="text-xl font-bold text-green-600">฿{Number(selectedDorm.price_daily).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedDorm.price_monthly > 0 && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-gray-700">รายเดือน</span>
                          </div>
                          <span className="text-xl font-bold text-blue-600">฿{Number(selectedDorm.price_monthly).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedDorm.price_term > 0 && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="font-medium text-gray-700">รายเทอม</span>
                          </div>
                          <span className="text-xl font-bold text-purple-600">฿{Number(selectedDorm.price_term).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Facilities */}
                  {selectedDorm.facilities && (
                    <div className="bg-green-50 rounded-2xl p-6 mb-6 border border-green-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaCouch className="text-green-500" />
                        สิ่งอำนวยความสะดวก
                      </h3>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-gray-700 leading-relaxed">{selectedDorm.facilities}</p>
                      </div>
                    </div>
                  )}

                  {/* Nearby Places */}
                  {selectedDorm.near_places && (
                    <div className="bg-purple-50 rounded-2xl p-6 mb-6 border border-purple-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaLandmark className="text-purple-500" />
                        สถานที่ใกล้เคียง
                      </h3>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-gray-700 leading-relaxed">{selectedDorm.near_places}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={() => window.location.href = '/owner/dorm-manage'}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      จัดการหอพัก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OwnerHomePage;