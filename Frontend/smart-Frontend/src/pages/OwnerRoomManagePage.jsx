import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OwnerSidebar from '../components/OwnerSidebar';
import { 
  FaDoorOpen, 
  FaMoneyBillWave, 
  FaSnowflake,
  FaFan,
  FaEdit, 
  FaTrashAlt, 
  FaPlusCircle, 
  FaTimesCircle, 
  FaChartLine, 
  FaUser,
  FaUserSlash,
  FaArrowLeft,
  FaBuilding,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserPlus,
  FaHome,
  FaSearch,
  FaFilter,
  FaBolt,
  FaTint,
  FaHistory,
  FaCalculator,
  FaCopy,
  FaFileInvoiceDollar
} from 'react-icons/fa';

function OwnerRoomManagePage() {
  const { dormId } = useParams();
  const navigate = useNavigate();
  const [dorm, setDorm] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, occupied
  const [filterType, setFilterType] = useState('all'); // all, air_conditioner, fan
  const [searchRoom, setSearchRoom] = useState('');
  
  const [form, setForm] = useState({
    room_number: '',
    floor: '',
    price_daily: '',
    price_monthly: '',
    price_term: '',
    room_type: 'air_conditioner', // air_conditioner, fan
    is_occupied: false,
    tenant_name: '',
    tenant_phone: '',
    move_in_date: '',
    notes: ''
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      alert('กรุณาเข้าสู่ระบบใหม่');
      navigate('/login');
      return;
    }

    // ตรวจสอบ URL parameter สำหรับเปิด modal เพิ่มห้องพัก
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShowAddModal = urlParams.get('addRoom') === 'true';
    
    const initializePage = async () => {
      // ซิงค์จำนวนห้องพักก่อนโหลดข้อมูล
      await syncRoomCount(token);
      // โหลดข้อมูลหอพักและห้องพัก
      await fetchDormAndRooms(token);
      
      // เปิด modal เพิ่มห้องพักถ้ามี parameter
      if (shouldShowAddModal) {
        setShowAddModal(true);
        // ลบ parameter ออกจาก URL
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }
    };

    initializePage();
  }, [dormId, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ฟังก์ชันซิงค์จำนวนห้องพัก
  const syncRoomCount = async (token) => {
    try {
      await fetch(`http://localhost:3001/dorms/${dormId}/sync-room-count`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Room count synced for dorm:', dormId);
    } catch (error) {
      console.error('Error syncing room count:', error);
    }
  };

  // ฟังก์ชันโหลดข้อมูลหอพักและห้องพัก
  const fetchDormAndRooms = async (token) => {
    setLoading(true);
    try {
      // ดึงข้อมูลหอพัก
      const dormRes = await fetch(`http://localhost:3001/dorms/${dormId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (dormRes.ok) {
        const dormData = await dormRes.json();
        setDorm(dormData);
      }

      // ดึงข้อมูลห้องพัก
      const roomsRes = await fetch(`http://localhost:3001/dorms/${dormId}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      } else if (roomsRes.status === 404) {
        // ยังไม่มีห้องพัก
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มห้องพักใหม่
  const handleAddRoom = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:3001/dorms/${dormId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert('เพิ่มห้องพักเรียบร้อยแล้ว!');
        setShowAddModal(false);
        setForm({
          room_number: '',
          floor: '',
          price_daily: '',
          price_monthly: '',
          price_term: '',
          room_type: 'air_conditioner',
          is_occupied: false,
          tenant_name: '',
          tenant_phone: '',
          move_in_date: '',
          notes: ''
        });
        // ซิงค์จำนวนห้องพักและโหลดข้อมูลใหม่
        await syncRoomCount(token);
        fetchDormAndRooms(token);
      } else {
        const err = await response.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการเพิ่มห้องพัก');
      }
    } catch (error) {
      console.error('Error adding room:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // แก้ไขห้องพัก
  const handleEditRoom = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:3001/dorms/${dormId}/rooms/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert('แก้ไขห้องพักเรียบร้อยแล้ว!');
        setShowEditModal(false);
        setEditId(null);
        setForm({
          room_number: '',
          floor: '',
          price_daily: '',
          price_monthly: '',
          price_term: '',
          room_type: 'air_conditioner',
          is_occupied: false,
          tenant_name: '',
          tenant_phone: '',
          move_in_date: '',
          notes: ''
        });
        // ซิงค์จำนวนห้องพักและโหลดข้อมูลใหม่
        await syncRoomCount(token);
        fetchDormAndRooms(token);
      } else {
        const err = await response.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการแก้ไขห้องพัก');
      }
    } catch (error) {
      console.error('Error editing room:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // ลบห้องพัก
  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('ต้องการลบห้องพักนี้ใช่หรือไม่?')) {
      const token = sessionStorage.getItem('token');
      
      try {
        const response = await fetch(`http://localhost:3001/dorms/${dormId}/rooms/${roomId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          alert('ลบห้องพักเรียบร้อยแล้ว!');
          // ซิงค์จำนวนห้องพักและโหลดข้อมูลใหม่
          await syncRoomCount(token);
          fetchDormAndRooms(token);
        } else {
          const err = await response.json();
          alert(err.error || 'เกิดข้อผิดพลาดในการลบห้องพัก');
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    }
  };

  // เตรียมข้อมูลสำหรับแก้ไข
  const handleEditClick = (room) => {
    setEditId(room.id);
    setForm({
      room_number: room.room_number || '',
      floor: room.floor || '',
      price_daily: room.price_daily || '',
      price_monthly: room.price_monthly || '',
      price_term: room.price_term || '',
      room_type: room.room_type || 'air_conditioner',
      is_occupied: room.is_occupied || false,
      tenant_name: room.tenant_name || '',
      tenant_phone: room.tenant_phone || '',
      move_in_date: room.move_in_date || '',
      notes: room.notes || ''
    });
    setShowEditModal(true);
  };

  // กรองห้องพัก
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchRoom.toLowerCase()) ||
                         (room.tenant_name && room.tenant_name.toLowerCase().includes(searchRoom.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'occupied' && room.is_occupied) ||
                         (filterStatus === 'available' && !room.is_occupied);
    
    const matchesType = filterType === 'all' || room.room_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // สถิติห้องพัก
  const roomStats = {
    total: rooms.length,
    occupied: rooms.filter(r => r.is_occupied).length,
    available: rooms.filter(r => !r.is_occupied).length,
    airConditioner: rooms.filter(r => r.room_type === 'air_conditioner').length,
    fan: rooms.filter(r => r.room_type === 'fan').length
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <OwnerSidebar />
      <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
            
            {/* Content */}
            <div className="relative px-8 py-8">
              {/* Back Button */}
              <button
                onClick={() => navigate('/owner/dorms')}
                className="mb-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                กลับไปจัดการหอพัก
              </button>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <FaDoorOpen className="text-white w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      จัดการห้องพัก
                    </h1>
                    <p className="text-blue-100 mt-1">
                      {dorm?.name || 'กำลังโหลด...'}
                    </p>
                  </div>
                </div>
                
                {/* Statistics */}
                <div className="hidden md:flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {roomStats.total}
                    </div>
                    <div className="text-blue-200 text-xs">ห้องทั้งหมด</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-300">
                      {roomStats.available}
                    </div>
                    <div className="text-blue-200 text-xs">ห้องว่าง</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-300">
                      {roomStats.occupied}
                    </div>
                    <div className="text-blue-200 text-xs">มีผู้เช่า</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาหมายเลขห้องหรือชื่อผู้เช่า..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchRoom}
                  onChange={(e) => setSearchRoom(e.target.value)}
                />
              </div>

              {/* Filter Status */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="available">ห้องว่าง</option>
                <option value="occupied">มีผู้เช่า</option>
              </select>

              {/* Filter Type */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">ประเภททั้งหมด</option>
                <option value="air_conditioner">ห้องแอร์</option>
                <option value="fan">ห้องพัดลม</option>
              </select>
            </div>

            {/* Add Room Button */}
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlusCircle className="w-5 h-5" />
              เพิ่มห้องพัก
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaDoorOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {searchRoom || filterStatus !== 'all' || filterType !== 'all' 
                    ? 'ไม่พบห้องพักที่ตรงกับเงื่อนไข' 
                    : 'ยังไม่มีห้องพัก'}
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {searchRoom || filterStatus !== 'all' || filterType !== 'all'
                    ? 'ลองค้นหาด้วยคำอื่นหรือเปลี่ยนตัวกรอง'
                    : 'เริ่มต้นเพิ่มห้องพักในหอพักของคุณ'}
                </p>
                {!(searchRoom || filterStatus !== 'all' || filterType !== 'all') && (
                  <button
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                    onClick={() => setShowAddModal(true)}
                  >
                    <FaPlusCircle className="w-5 h-5" />
                    เพิ่มห้องพักแรก
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRooms.map((room, index) => (
                <div
                  key={room.id}
                  className={`rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 flex flex-col h-full ${
                    room.is_occupied 
                      ? 'bg-red-50 border-red-200 hover:border-red-300' 
                      : 'bg-green-50 border-green-200 hover:border-green-300'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header - หมายเลขห้องและสถานะ */}
                  <div className={`p-4 ${room.is_occupied ? 'bg-red-100' : 'bg-green-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          room.is_occupied ? 'bg-red-500' : 'bg-green-500'
                        }`}>
                          <FaDoorOpen className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">ห้อง {room.room_number}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <FaBuilding className="w-3 h-3" />
                            ชั้นที่ {room.floor}
                          </p>
                        </div>
                      </div>
                      
                      {/* สถานะการเข้าพัก */}
                      <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        room.is_occupied 
                          ? 'bg-red-500 text-white' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {room.is_occupied ? (
                          <>
                            <FaUser className="w-3 h-3" />
                            มีผู้เช่า
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="w-3 h-3" />
                            ห้องว่าง
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content - ข้อมูลหลัก */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      {/* ประเภทห้องและราคา */}
                      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                        <div className="grid grid-cols-2 gap-3">
                          {/* ประเภทห้อง */}
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">ประเภทห้อง</label>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm ${
                              room.room_type === 'air_conditioner' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {room.room_type === 'air_conditioner' ? (
                                <>
                                  <FaSnowflake className="w-3 h-3" />
                                  ห้องแอร์
                                </>
                              ) : (
                                <>
                                  <FaFan className="w-3 h-3" />
                                  ห้องพัดลม
                                </>
                              )}
                            </div>
                          </div>

                          {/* ราคาหลัก */}
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">ราคาห้อง</label>
                            <div className="space-y-1.5">
                              {room.price_monthly && Number(room.price_monthly) > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <FaMoneyBillWave className="w-3 h-3 text-green-500" />
                                  <span className="text-sm font-semibold text-green-600">
                                    ฿{Number(room.price_monthly).toLocaleString()}/เดือน
                                  </span>
                                </div>
                              )}
                              {room.price_daily && Number(room.price_daily) > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <FaMoneyBillWave className="w-3 h-3 text-blue-500" />
                                  <span className="text-sm font-semibold text-blue-600">
                                    ฿{Number(room.price_daily).toLocaleString()}/วัน
                                  </span>
                                </div>
                              )}
                              {room.price_term && Number(room.price_term) > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <FaMoneyBillWave className="w-3 h-3 text-purple-500" />
                                  <span className="text-sm font-semibold text-purple-600">
                                    ฿{Number(room.price_term).toLocaleString()}/เทอม
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tenant Info */}
                      {room.is_occupied && (
                        <div className="bg-white rounded-lg p-3 mb-3 border border-red-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">ข้อมูลผู้เช่า</h4>
                          {room.tenant_name && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">ชื่อ:</span> {room.tenant_name}
                            </p>
                          )}
                          {room.move_in_date && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">เข้าพัก:</span> {new Date(room.move_in_date).toLocaleDateString('th-TH')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {room.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 mb-3">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">หมายเหตุ:</span> {room.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - อยู่ด้านล่างสุดเสมอ */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                          onClick={() => handleEditClick(room)}
                        >
                          <FaEdit className="w-3 h-3" />
                          แก้ไข
                        </button>
                        <button
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <FaTrashAlt className="w-3 h-3" />
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal เพิ่มห้องพัก */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <FaPlusCircle className="text-white w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">เพิ่มห้องพักใหม่</h3>
                  </div>
                  <button
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
                    onClick={() => setShowAddModal(false)}
                  >
                    <FaTimesCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleAddRoom} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      หมายเลขห้อง *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="เช่น 101, A01"
                      value={form.room_number}
                      onChange={e => setForm({ ...form, room_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      ชั้น *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="เช่น 1, 2, 3"
                      type="number"
                      min="1"
                      value={form.floor}
                      onChange={e => setForm({ ...form, floor: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Room Type */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    ประเภทห้อง *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      form.room_type === 'air_conditioner' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        name="room_type"
                        value="air_conditioner"
                        checked={form.room_type === 'air_conditioner'}
                        onChange={e => setForm({ ...form, room_type: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <FaSnowflake className="w-6 h-6 text-blue-500" />
                        <div>
                          <div className="font-semibold text-gray-900">ห้องแอร์</div>
                          <div className="text-sm text-gray-600">เครื่องปรับอากาศ</div>
                        </div>
                      </div>
                    </label>

                    <label className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      form.room_type === 'fan' 
                        ? 'border-gray-500 bg-gray-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="room_type"
                        value="fan"
                        checked={form.room_type === 'fan'}
                        onChange={e => setForm({ ...form, room_type: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <FaFan className="w-6 h-6 text-gray-500" />
                        <div>
                          <div className="font-semibold text-gray-900">ห้องพัดลม</div>
                          <div className="text-sm text-gray-600">พัดลมธรรมดา</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Prices */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaMoneyBillWave className="text-blue-500" />
                    ราคาค่าเช่า
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายวัน (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={form.price_daily}
                        onChange={e => setForm({ ...form, price_daily: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเดือน (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={form.price_monthly}
                        onChange={e => setForm({ ...form, price_monthly: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเทอม (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={form.price_term}
                        onChange={e => setForm({ ...form, price_term: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Occupancy Status */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaUser className="text-blue-500" />
                    สถานะการเข้าพัก
                  </label>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_occupied}
                        onChange={e => setForm({ ...form, is_occupied: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">มีผู้เช่าอยู่แล้ว</span>
                    </label>

                    {form.is_occupied && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block mb-2 text-sm text-gray-600">ชื่อผู้เช่า</label>
                          <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="ชื่อ-นามสกุล"
                            value={form.tenant_name}
                            onChange={e => setForm({ ...form, tenant_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm text-gray-600">เบอร์โทร</label>
                          <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="08x-xxx-xxxx"
                            type="tel"
                            value={form.tenant_phone}
                            onChange={e => setForm({ ...form, tenant_phone: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-2 text-sm text-gray-600">วันที่เข้าพัก</label>
                          <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            type="date"
                            value={form.move_in_date}
                            onChange={e => setForm({ ...form, move_in_date: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    หมายเหตุ
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                    rows="3"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200"
                    onClick={() => setShowAddModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all duration-200"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal แก้ไขห้องพัก */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <FaEdit className="text-white w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">แก้ไขห้องพัก</h3>
                  </div>
                  <button
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditId(null);
                      setForm({
                        room_number: '',
                        floor: '',
                        price_daily: '',
                        price_monthly: '',
                        price_term: '',
                        room_type: 'air_conditioner',
                        is_occupied: false,
                        tenant_name: '',
                        tenant_phone: '',
                        move_in_date: '',
                        notes: ''
                      });
                    }}
                  >
                    <FaTimesCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content - Same as Add Modal but with green theme */}
              <form onSubmit={handleEditRoom} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      หมายเลขห้อง *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="เช่น 101, A01"
                      value={form.room_number}
                      onChange={e => setForm({ ...form, room_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      ชั้น *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="เช่น 1, 2, 3"
                      type="number"
                      min="1"
                      value={form.floor}
                      onChange={e => setForm({ ...form, floor: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Room Type */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    ประเภทห้อง *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      form.room_type === 'air_conditioner' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-green-300'
                    }`}>
                      <input
                        type="radio"
                        name="room_type"
                        value="air_conditioner"
                        checked={form.room_type === 'air_conditioner'}
                        onChange={e => setForm({ ...form, room_type: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <FaSnowflake className="w-6 h-6 text-blue-500" />
                        <div>
                          <div className="font-semibold text-gray-900">ห้องแอร์</div>
                          <div className="text-sm text-gray-600">เครื่องปรับอากาศ</div>
                        </div>
                      </div>
                    </label>

                    <label className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      form.room_type === 'fan' 
                        ? 'border-gray-500 bg-gray-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="room_type"
                        value="fan"
                        checked={form.room_type === 'fan'}
                        onChange={e => setForm({ ...form, room_type: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <FaFan className="w-6 h-6 text-gray-500" />
                        <div>
                          <div className="font-semibold text-gray-900">ห้องพัดลม</div>
                          <div className="text-sm text-gray-600">พัดลมธรรมดา</div>
                        </div>
                      </div>
                    </label>
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
                        type="number"
                        min="0"
                        value={form.price_daily}
                        onChange={e => setForm({ ...form, price_daily: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเดือน (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={form.price_monthly}
                        onChange={e => setForm({ ...form, price_monthly: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายเทอม (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={form.price_term}
                        onChange={e => setForm({ ...form, price_term: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Occupancy Status */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaUser className="text-green-500" />
                    สถานะการเข้าพัก
                  </label>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_occupied}
                        onChange={e => setForm({ ...form, is_occupied: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">มีผู้เช่าอยู่แล้ว</span>
                    </label>

                    {form.is_occupied && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block mb-2 text-sm text-gray-600">ชื่อผู้เช่า</label>
                          <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="ชื่อ-นามสกุล"
                            value={form.tenant_name}
                            onChange={e => setForm({ ...form, tenant_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm text-gray-600">เบอร์โทร</label>
                          <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="08x-xxx-xxxx"
                            type="tel"
                            value={form.tenant_phone}
                            onChange={e => setForm({ ...form, tenant_phone: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-2 text-sm text-gray-600">วันที่เข้าพัก</label>
                          <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            type="date"
                            value={form.move_in_date}
                            onChange={e => setForm({ ...form, move_in_date: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    หมายเหตุ
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                    rows="3"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditId(null);
                      setForm({
                        room_number: '',
                        floor: '',
                        price_daily: '',
                        price_monthly: '',
                        price_term: '',
                        room_type: 'air_conditioner',
                        is_occupied: false,
                        tenant_name: '',
                        tenant_phone: '',
                        move_in_date: '',
                        notes: ''
                      });
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all duration-200"
                  >
                    บันทึกการแก้ไข
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

export default OwnerRoomManagePage;
