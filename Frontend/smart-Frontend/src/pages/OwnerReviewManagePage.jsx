import React, { useEffect, useState } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { 
  FaStar, 
  FaComment, 
  FaUserCircle, 
  FaCalendarAlt, 
  FaHome,
  FaChartLine,
  FaThumbsUp,
  FaEye,
  FaFilter,
  FaUsers
} from 'react-icons/fa';

function OwnerReviewManagePage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingBreakdown: {}
  });

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch('http://localhost:3001/owner/reviews', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setReviews(Array.isArray(data) ? data : []);
        // คำนวณสถิติ
        if (Array.isArray(data) && data.length > 0) {
          const avgRating = data.reduce((sum, r) => sum + (r.rating || 0), 0) / data.length;
          const breakdown = {};
          data.forEach(r => {
            const rating = r.rating || 0;
            breakdown[rating] = (breakdown[rating] || 0) + 1;
          });
          setReviewStats({
            totalReviews: data.length,
            averageRating: avgRating,
            ratingBreakdown: breakdown
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reviews:', err);
        setReviews([]);
        setLoading(false);
      });
  }, []);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
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
                  <FaComment className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    จัดการรีวิวหอพัก
                  </h1>
                  <p className="text-blue-100 mt-1">
                    ดูและติดตามความคิดเห็นจากลูกค้า
                  </p>
                </div>
              </div>
              
              {/* Statistics */}
              <div className="hidden md:flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {reviewStats.totalReviews}
                  </div>
                  <div className="text-blue-200 text-xs">รีวิวทั้งหมด</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-blue-200 text-xs">คะแนนเฉลี่ย</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Content */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 font-medium">กำลังโหลดรีวิว...</p>
              </div>
            </div>
          ) : (
            <>
              {reviews.length === 0 ? (
                <div className="text-center py-20">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaComment className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">ยังไม่มีรีวิว</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      เมื่อลูกค้าเขียนรีวิวหอพักของคุณ จะแสดงที่นี่
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {reviews.map((review, index) => (
                    <div
                      key={review.id || index}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Header - ข้อมูลลูกค้าและคะแนน */}
                      <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              {review.customerAvatar ? (
                                <img 
                                  src={`http://localhost:3001${review.customerAvatar}`} 
                                  alt={review.customerName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <FaUserCircle className="text-white w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{review.customerName || 'ลูกค้า'}</h3>
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating || 0)}
                                <span className="text-sm font-bold text-gray-700 ml-1">
                                  {review.rating || 0}/5
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* คะแนนรวม */}
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white ${
                              (review.rating || 0) >= 4 ? 'bg-green-500' :
                              (review.rating || 0) >= 3 ? 'bg-yellow-500' :
                              (review.rating || 0) >= 2 ? 'bg-orange-500' : 'bg-red-500'
                            }`}>
                              {review.rating || 0}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">คะแนน</div>
                          </div>
                        </div>
                      </div>

                      {/* ข้อมูลหลัก */}
                      <div className="p-6">
                        {/* ข้อมูลหอพักและวันที่ */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">หอพัก</label>
                              <div className="flex items-center gap-2">
                                <FaHome className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-semibold text-gray-800">
                                  {review.dormName || 'ไม่ระบุหอพัก'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">วันที่รีวิว</label>
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-semibold text-gray-800">
                                  {review.created_at ? new Date(review.created_at).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'ไม่ระบุ'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ข้อความรีวิว */}
                        {review.comment && (
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 mb-2">ความคิดเห็น</label>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-gray-700 leading-relaxed text-sm">
                                "{review.comment}"
                              </p>
                            </div>
                          </div>
                        )}

                        {/* คะแนนแต่ละหมวด */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <label className="block text-xs font-medium text-gray-500 mb-3">คะแนนรายละเอียด</label>
                          <div className="space-y-3">
                            {[
                              { key: 'cleanliness_rating', label: 'ความสะอาด', icon: '🧽', color: 'text-blue-600' },
                              { key: 'location_rating', label: 'ทำเลที่ตั้ง', icon: '📍', color: 'text-green-600' },
                              { key: 'value_rating', label: 'คุณค่าต่อราคา', icon: '💰', color: 'text-yellow-600' },
                              { key: 'service_rating', label: 'การบริการ', icon: '👥', color: 'text-purple-600' }
                            ].map(item => (
                              review[item.key] && (
                                <div key={item.key} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{item.icon}</span>
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      {renderStars(review[item.key] || 0)}
                                    </div>
                                    <span className={`font-bold text-lg ${item.color}`}>
                                      {review[item.key] || 0}
                                    </span>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>

                        {/* สถิติรีวิว */}
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FaThumbsUp className="w-3 h-3" />
                            <span>รีวิวที่ {index + 1}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FaEye className="w-3 h-3" />
                            <span>ID: {review.id || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default OwnerReviewManagePage;