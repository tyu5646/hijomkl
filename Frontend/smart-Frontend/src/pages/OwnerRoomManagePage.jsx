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
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [utilityHistory, setUtilityHistory] = useState([]);
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

  const [utilityForm, setUtilityForm] = useState({
    electricity_meter_old: '',
    electricity_meter_new: '',
    water_meter_old: '',
    water_meter_new: '',
    electricity_rate: '', // อัตราค่าไฟ (บาท/หน่วย)
    water_rate: '', // อัตราค่าน้ำ (บาท/หน่วย)
    electricity_notes: '',
    water_notes: '',
    meter_reading_date: new Date().toISOString().split('T')[0]
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

  // อัปเดตข้อมูลการใช้สาธารณูปโภค
  const handleUpdateUtilities = async (roomId) => {
    const token = sessionStorage.getItem('token');
    
    try {
      // เตรียมข้อมูลที่จะส่งไป Backend (ไม่รวม rate ที่มาจากการตั้งค่าหอพัก)
      const utilityUpdateData = {
        electricity_meter_old: utilityForm.electricity_meter_old,
        electricity_meter_new: utilityForm.electricity_meter_new,
        water_meter_old: utilityForm.water_meter_old,
        water_meter_new: utilityForm.water_meter_new,
        electricity_notes: utilityForm.electricity_notes,
        water_notes: utilityForm.water_notes,
        meter_reading_date: utilityForm.meter_reading_date
      };

      const response = await fetch(`http://localhost:3001/dorms/${dormId}/rooms/${roomId}/utilities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(utilityUpdateData)
      });

      if (response.ok) {
        alert('อัปเดตข้อมูลการใช้สาธารณูปโภคเรียบร้อยแล้ว!');
        
        // เก็บค่าเรทปัจจุบันไว้ก่อนรีเซ็ต
        const currentElectricityRate = utilityForm.electricity_rate;
        const currentWaterRate = utilityForm.water_rate;
        const newElectricityOld = utilityForm.electricity_meter_new;
        const newWaterOld = utilityForm.water_meter_new;
        
        // โหลดข้อมูลใหม่จาก API เพื่อให้แน่ใจว่าข้อมูลเป็นปัจจุบัน
        await fetchDormAndRooms(token);
        
        // เซ็ตค่ามิเตอร์ใหม่เป็นมิเตอร์เก่าสำหรับการอัปเดตครั้งต่อไป
        setUtilityForm({
          electricity_meter_old: newElectricityOld || '',
          electricity_meter_new: '',
          water_meter_old: newWaterOld || '',
          water_meter_new: '',
          electricity_rate: currentElectricityRate || '',
          water_rate: currentWaterRate || '',
          electricity_notes: '',
          water_notes: '',
          meter_reading_date: new Date().toISOString().split('T')[0]
        });
        
        setShowUtilityModal(false);
      } else {
        const err = await response.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      console.error('Error updating utilities:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // แสดงใบเช็ครายเดือน (แบบไม่ต้องดึงข้อมูลจาก API)
  const showBillForRoom = (room) => {
    console.log('=== SHOW BILL FOR ROOM ===');
    console.log('Room:', room);
    
    setSelectedRoom(room);
    
    // สร้างข้อมูลตัวอย่างสำหรับใบเช็ค
    const sampleHistory = [
      {
        reading_date: new Date().toISOString(),
        electricity_meter_old: room.electricity_meter_old || 0,
        electricity_meter_new: room.electricity_meter_new || 0,
        electricity_rate: dorm?.electricity_cost || 5,
        water_meter_old: room.water_meter_old || 0,
        water_meter_new: room.water_meter_new || 0,
        water_rate: dorm?.water_cost || 18,
        electricity_notes: '',
        water_notes: '',
        created_by: 'เจ้าของหอพัก',
        created_at: new Date().toISOString()
      }
    ];
    
    setUtilityHistory(sampleHistory);
    setShowBillModal(true);
  };

  // ดึงประวัติการใช้สาธารณูปโภค (สำรองไว้) 
  // eslint-disable-next-line no-unused-vars
  const fetchUtilityHistory = async (roomId) => {
    console.log('=== FETCH UTILITY HISTORY ===');
    console.log('Room ID:', roomId);
    console.log('Dorm ID:', dormId);
    
    const token = sessionStorage.getItem('token');
    console.log('Token available:', !!token);
    
    try {
      const url = `http://localhost:3001/dorms/${dormId}/rooms/${roomId}/utilities/history`;
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const history = await response.json();
        console.log('History data:', history);
        setUtilityHistory(history);
        setSelectedRoom(rooms.find(r => r.id === roomId));
        setShowBillModal(true);
      } else {
        // ถ้า API ล้มเหลว ให้ใช้ฟังก์ชันสำรอง
        console.log('API failed, using fallback...');
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          showBillForRoom(room);
        } else {
          alert('ไม่พบข้อมูลห้องพัก');
        }
      }
    } catch (error) {
      console.error('Error fetching utility history:', error);
      // ถ้าเกิด error ให้ใช้ฟังก์ชันสำรอง
      console.log('Using fallback due to error...');
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        showBillForRoom(room);
      } else {
        alert('ไม่พบข้อมูลห้องพัก');
      }
    }
  };

  // เปิดโมดอลอัปเดตสาธารณูปโภค
  const handleOpenUtilityModal = (room) => {
    setSelectedRoom(room);
    
    // Format date from ISO to yyyy-MM-dd for HTML date input
    const formatDate = (dateString) => {
      if (!dateString) return new Date().toISOString().split('T')[0];
      try {
        return new Date(dateString).toISOString().split('T')[0];
      } catch {
        return new Date().toISOString().split('T')[0];
      }
    };
    
    setUtilityForm({
      electricity_meter_old: room.electricity_meter_old || '',
      electricity_meter_new: room.electricity_meter_new || '',
      water_meter_old: room.water_meter_old || '',
      water_meter_new: room.water_meter_new || '',
      electricity_rate: (dorm && dorm.electricity_cost) ? dorm.electricity_cost.toString() : '',
      water_rate: (dorm && dorm.water_cost) ? dorm.water_cost.toString() : '',
      electricity_notes: room.electricity_notes || '',
      water_notes: room.water_notes || '',
      meter_reading_date: formatDate(room.meter_reading_date)
    });
    setShowUtilityModal(true);
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
                  className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 ${
                    room.is_occupied 
                      ? 'bg-red-50 border-red-200 hover:border-red-300' 
                      : 'bg-green-50 border-green-200 hover:border-green-300'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header - หมายเลขห้องและสถานะ */}
                  <div className={`p-4 ${room.is_occupied ? 'bg-red-100' : 'bg-green-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          room.is_occupied ? 'bg-red-500' : 'bg-green-500'
                        }`}>
                          <FaDoorOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">ห้อง {room.room_number}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <FaBuilding className="w-3 h-3" />
                            ชั้นที่ {room.floor}
                          </p>
                        </div>
                      </div>
                      
                      {/* สถานะการเข้าพัก */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        room.is_occupied 
                          ? 'bg-red-500 text-white' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {room.is_occupied ? (
                          <>
                            <FaUser className="w-4 h-4" />
                            มีผู้เช่า
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="w-4 h-4" />
                            ห้องว่าง
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content - ข้อมูลหลัก */}
                  <div className="p-4">
                    {/* ประเภทห้องและราคา */}
                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        {/* ประเภทห้อง */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">ประเภทห้อง</label>
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                            room.room_type === 'air_conditioner' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {room.room_type === 'air_conditioner' ? (
                              <>
                                <FaSnowflake className="w-4 h-4" />
                                ห้องแอร์
                              </>
                            ) : (
                              <>
                                <FaFan className="w-4 h-4" />
                                ห้องพัดลม
                              </>
                            )}
                          </div>
                        </div>

                        {/* ราคาหลัก */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">ราคาห้อง</label>
                          <div className="space-y-1">
                            {room.price_monthly && Number(room.price_monthly) > 0 && (
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-semibold text-green-600">
                                  ฿{Number(room.price_monthly).toLocaleString()}/เดือน
                                </span>
                              </div>
                            )}
                            {room.price_daily && Number(room.price_daily) > 0 && (
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-semibold text-blue-600">
                                  ฿{Number(room.price_daily).toLocaleString()}/วัน
                                </span>
                              </div>
                            )}
                            {room.price_term && Number(room.price_term) > 0 && (
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-semibold text-purple-600">
                                  ฿{Number(room.price_term).toLocaleString()}/เทอม
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Utilities Usage */}
                    {room.is_occupied && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FaCalculator className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-700">การใช้สาธารณูปโภค</span>
                        </div>
                        
                        {/* แสดงข้อมูลมิเตอร์ไฟ */}
                        {(room.electricity_meter_old || room.electricity_meter_new) && (
                          <div className="bg-yellow-50 rounded-lg p-2 mb-2">
                            <div className="flex items-center gap-1 mb-1">
                              <FaBolt className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-700">ไฟฟ้า</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {room.electricity_meter_old && (
                                <div>มิเตอร์เก่า: {parseFloat(room.electricity_meter_old).toLocaleString()} หน่วย</div>
                              )}
                              {room.electricity_meter_new && (
                                <div>มิเตอร์ใหม่: {parseFloat(room.electricity_meter_new).toLocaleString()} หน่วย</div>
                              )}
                              {room.electricity_meter_old && room.electricity_meter_new && (
                                <div className="font-semibold text-yellow-700">
                                  ใช้งาน: {(parseFloat(room.electricity_meter_new) - parseFloat(room.electricity_meter_old)).toLocaleString()} หน่วย
                                  {dorm && dorm.electricity_cost && (
                                    <span className="ml-1">
                                      (฿{((parseFloat(room.electricity_meter_new) - parseFloat(room.electricity_meter_old)) * parseFloat(dorm.electricity_cost)).toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* แสดงข้อมูลมิเตอร์น้ำ */}
                        {(room.water_meter_old || room.water_meter_new) && (
                          <div className="bg-blue-50 rounded-lg p-2 mb-2">
                            <div className="flex items-center gap-1 mb-1">
                              <FaTint className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-medium text-blue-700">น้ำ</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {room.water_meter_old && (
                                <div>มิเตอร์เก่า: {parseFloat(room.water_meter_old).toLocaleString()} หน่วย</div>
                              )}
                              {room.water_meter_new && (
                                <div>มิเตอร์ใหม่: {parseFloat(room.water_meter_new).toLocaleString()} หน่วย</div>
                              )}
                              {room.water_meter_old && room.water_meter_new && (
                                <div className="font-semibold text-blue-700">
                                  ใช้งาน: {(parseFloat(room.water_meter_new) - parseFloat(room.water_meter_old)).toLocaleString()} หน่วย
                                  {dorm && dorm.water_cost && (
                                    <span className="ml-1">
                                      (฿{((parseFloat(room.water_meter_new) - parseFloat(room.water_meter_old)) * parseFloat(dorm.water_cost)).toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ถ้าไม่มีข้อมูลมิเตอร์ แสดงข้อความเริ่มต้น */}
                        {!(room.electricity_meter_old || room.electricity_meter_new || room.water_meter_old || room.water_meter_new) && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            ยังไม่มีข้อมูลมิเตอร์
                          </div>
                        )}
                        {room.meter_reading_date && (
                          <div className="mt-2 text-xs text-gray-500">
                            อัปเดตล่าสุด: {new Date(room.meter_reading_date).toLocaleDateString('th-TH')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tenant Info */}
                    {room.is_occupied && (
                      <div className="bg-white rounded-lg p-3 mb-4 border border-red-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">ข้อมูลผู้เช่า</h4>
                        {room.tenant_name && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">ชื่อ:</span> {room.tenant_name}
                          </p>
                        )}
                        {room.tenant_phone && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">เบอร์:</span> {room.tenant_phone}
                          </p>
                        )}
                        {room.move_in_date && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">เข้าพัก:</span> {new Date(room.move_in_date).toLocaleDateString('th-TH')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {room.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4">
                        <p className="text-xs text-yellow-800">
                          <span className="font-medium">หมายเหตุ:</span> {room.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-1 text-xs"
                          onClick={() => handleEditClick(room)}
                        >
                          <FaEdit className="w-3 h-3" />
                          แก้ไข
                        </button>
                        <button
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-1 text-xs"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <FaTrashAlt className="w-3 h-3" />
                          ลบ
                        </button>
                      </div>
                      
                      {/* Utility Management Buttons */}
                      {room.is_occupied && (
                        <div className="flex gap-2">
                          <button
                            className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-1 text-xs"
                            onClick={() => handleOpenUtilityModal(room)}
                          >
                            <FaCalculator className="w-3 h-3" />
                            อัปเดตมิเตอร์
                          </button>
                          <button
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-1 text-xs"
                            onClick={() => {
                              console.log('=== BILL BUTTON CLICKED ===');
                              console.log('Room:', room);
                              showBillForRoom(room);
                            }}
                          >
                            <FaFileInvoiceDollar className="w-3 h-3" />
                            ใบเช็ค
                          </button>
                        </div>
                      )}
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

        {/* Modal อัปเดตข้อมูลสาธารณูปโภค */}
        {showUtilityModal && selectedRoom && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <FaCalculator className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">อัปเดตการใช้สาธารณูปโภค</h3>
                      <p className="text-indigo-100">ห้อง {selectedRoom.room_number}</p>
                    </div>
                  </div>
                  <button
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
                    onClick={() => setShowUtilityModal(false)}
                  >
                    <FaTimesCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* ข้อมูลปัจจุบัน */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">ข้อมูลมิเตอร์ปัจจุบัน</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FaBolt className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">ไฟฟ้า</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>มิเตอร์เก่า: {selectedRoom.electricity_meter_old || 'ยังไม่มีข้อมูล'}</div>
                        <div>มิเตอร์ใหม่: {selectedRoom.electricity_meter_new || 'ยังไม่มีข้อมูล'}</div>
                        {selectedRoom.electricity_meter_old && selectedRoom.electricity_meter_new && (
                          <div className="font-semibold text-yellow-700">
                            การใช้งาน: {(parseFloat(selectedRoom.electricity_meter_new) - parseFloat(selectedRoom.electricity_meter_old)).toLocaleString()} หน่วย
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FaTint className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">น้ำ</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>มิเตอร์เก่า: {selectedRoom.water_meter_old || 'ยังไม่มีข้อมูล'}</div>
                        <div>มิเตอร์ใหม่: {selectedRoom.water_meter_new || 'ยังไม่มีข้อมูล'}</div>
                        {selectedRoom.water_meter_old && selectedRoom.water_meter_new && (
                          <div className="font-semibold text-blue-700">
                            การใช้งาน: {(parseFloat(selectedRoom.water_meter_new) - parseFloat(selectedRoom.water_meter_old)).toLocaleString()} หน่วย
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ฟอร์มอัปเดต */}
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateUtilities(selectedRoom.id); }}>
                  
                  {/* อัตราค่าบริการ */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-blue-700 mb-3">
                      อัตราค่าบริการ (บาท/หน่วย) 
                      <span className="text-xs font-normal text-blue-600 ml-2">ค่าคงที่จากการตั้งค่าหอพัก</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm text-gray-600">อัตราค่าไฟฟ้า</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                            placeholder="ไม่ได้กำหนด"
                            value={utilityForm.electricity_rate}
                            readOnly
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs text-gray-500">บาท/หน่วย</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">💡 ปรับแต่งได้ในหน้าจัดการหอพัก</p>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm text-gray-600">อัตราค่าน้ำ</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                            placeholder="ไม่ได้กำหนด"
                            value={utilityForm.water_rate}
                            readOnly
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs text-gray-500">บาท/ลบ.ม.</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">💧 ปรับแต่งได้ในหน้าจัดการหอพัก</p>
                      </div>
                    </div>
                  </div>

                  {/* มิเตอร์ไฟฟ้า */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaBolt className="w-4 h-4" />
                        มิเตอร์ไฟฟ้า
                      </div>
                      {selectedRoom.electricity_meter_new && (
                        <button
                          type="button"
                          onClick={() => {
                            setUtilityForm({
                              ...utilityForm, 
                              electricity_meter_old: selectedRoom.electricity_meter_new
                            });
                          }}
                          className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <FaCopy className="w-3 h-3" />
                          คัดลอกจากมิเตอร์ใหม่
                        </button>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm text-gray-600">เลขมิเตอร์เก่า</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                          placeholder="เช่น 3450.50"
                          value={utilityForm.electricity_meter_old}
                          onChange={(e) => setUtilityForm({...utilityForm, electricity_meter_old: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm text-gray-600">เลขมิเตอร์ใหม่</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                          placeholder="เช่น 3520.75"
                          value={utilityForm.electricity_meter_new}
                          onChange={(e) => setUtilityForm({...utilityForm, electricity_meter_new: e.target.value})}
                        />
                      </div>
                    </div>
                    {/* คำเตือนเมื่อมิเตอร์ใหม่น้อยกว่าเก่า - ไฟฟ้า */}
                    {utilityForm.electricity_meter_old && utilityForm.electricity_meter_new && 
                     parseFloat(utilityForm.electricity_meter_new) < parseFloat(utilityForm.electricity_meter_old) && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                          <FaExclamationTriangle className="w-4 h-4" />
                          <span className="text-sm font-semibold">เตือน: เลขมิเตอร์ใหม่ต้องมากกว่าเลขมิเตอร์เก่า</span>
                        </div>
                      </div>
                    )}
                    {/* แสดงการคำนวณไฟฟ้า */}
                    {utilityForm.electricity_meter_old && utilityForm.electricity_meter_new && utilityForm.electricity_rate && 
                     parseFloat(utilityForm.electricity_meter_new) >= parseFloat(utilityForm.electricity_meter_old) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border">
                        <div className="text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>การใช้งาน:</span>
                            <span className="font-semibold">
                              {(parseFloat(utilityForm.electricity_meter_new) - parseFloat(utilityForm.electricity_meter_old)).toFixed(2)} หน่วย
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>ค่าไฟรวม:</span>
                            <span className="font-bold text-yellow-600">
                              ฿{((parseFloat(utilityForm.electricity_meter_new) - parseFloat(utilityForm.electricity_meter_old)) * parseFloat(utilityForm.electricity_rate)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* มิเตอร์น้ำ */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaTint className="w-4 h-4" />
                        มิเตอร์น้ำ
                      </div>
                      {selectedRoom.water_meter_new && (
                        <button
                          type="button"
                          onClick={() => {
                            setUtilityForm({
                              ...utilityForm, 
                              water_meter_old: selectedRoom.water_meter_new
                            });
                          }}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <FaCopy className="w-3 h-3" />
                          คัดลอกจากมิเตอร์ใหม่
                        </button>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm text-gray-600">เลขมิเตอร์เก่า</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="เช่น 1250.25"
                          value={utilityForm.water_meter_old}
                          onChange={(e) => setUtilityForm({...utilityForm, water_meter_old: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm text-gray-600">เลขมิเตอร์ใหม่</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="เช่น 1280.50"
                          value={utilityForm.water_meter_new}
                          onChange={(e) => setUtilityForm({...utilityForm, water_meter_new: e.target.value})}
                        />
                      </div>
                    </div>
                    {/* คำเตือนเมื่อมิเตอร์ใหม่น้อยกว่าเก่า - น้ำ */}
                    {utilityForm.water_meter_old && utilityForm.water_meter_new && 
                     parseFloat(utilityForm.water_meter_new) < parseFloat(utilityForm.water_meter_old) && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                          <FaExclamationTriangle className="w-4 h-4" />
                          <span className="text-sm font-semibold">เตือน: เลขมิเตอร์ใหม่ต้องมากกว่าเลขมิเตอร์เก่า</span>
                        </div>
                      </div>
                    )}
                    {/* แสดงการคำนวณน้ำ */}
                    {utilityForm.water_meter_old && utilityForm.water_meter_new && utilityForm.water_rate && 
                     parseFloat(utilityForm.water_meter_new) >= parseFloat(utilityForm.water_meter_old) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border">
                        <div className="text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>การใช้งาน:</span>
                            <span className="font-semibold">
                              {(parseFloat(utilityForm.water_meter_new) - parseFloat(utilityForm.water_meter_old)).toFixed(2)} หน่วย
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>ค่าน้ำรวม:</span>
                            <span className="font-bold text-blue-600">
                              ฿{((parseFloat(utilityForm.water_meter_new) - parseFloat(utilityForm.water_meter_old)) * parseFloat(utilityForm.water_rate)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">วันที่อ่านมิเตอร์</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        value={utilityForm.meter_reading_date}
                        onChange={(e) => setUtilityForm({...utilityForm, meter_reading_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">หมายเหตุไฟฟ้า</label>
                      <textarea
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="หมายเหตุเกี่ยวกับการใช้ไฟฟ้า"
                        value={utilityForm.electricity_notes}
                        onChange={(e) => setUtilityForm({...utilityForm, electricity_notes: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">หมายเหตุน้ำ</label>
                      <textarea
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="หมายเหตุเกี่ยวกับการใช้น้ำ"
                        value={utilityForm.water_notes}
                        onChange={(e) => setUtilityForm({...utilityForm, water_notes: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* สรุปยอดรวม */}
                  {utilityForm.electricity_meter_old && utilityForm.electricity_meter_new && 
                   utilityForm.water_meter_old && utilityForm.water_meter_new &&
                   utilityForm.electricity_rate && utilityForm.water_rate &&
                   parseFloat(utilityForm.electricity_meter_new) >= parseFloat(utilityForm.electricity_meter_old) &&
                   parseFloat(utilityForm.water_meter_new) >= parseFloat(utilityForm.water_meter_old) && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mt-6">
                      <h4 className="text-lg font-semibold text-purple-700 mb-3 flex items-center gap-2">
                        <FaCalculator className="w-5 h-5" />
                        สรุปค่าใช้จ่ายทั้งหมด
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center gap-2 mb-2">
                            <FaBolt className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium text-gray-700">ค่าไฟฟ้า</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">การใช้งาน:</span>
                              <span className="font-semibold">
                                {(parseFloat(utilityForm.electricity_meter_new) - parseFloat(utilityForm.electricity_meter_old)).toFixed(2)} หน่วย
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">อัตรา:</span>
                              <span>฿{parseFloat(utilityForm.electricity_rate).toFixed(2)}/หน่วย</span>
                            </div>
                            <div className="flex justify-between font-bold text-yellow-600 pt-1 border-t">
                              <span>รวม:</span>
                              <span>฿{((parseFloat(utilityForm.electricity_meter_new) - parseFloat(utilityForm.electricity_meter_old)) * parseFloat(utilityForm.electricity_rate)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center gap-2 mb-2">
                            <FaTint className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-700">ค่าน้ำ</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">การใช้งาน:</span>
                              <span className="font-semibold">
                                {(parseFloat(utilityForm.water_meter_new) - parseFloat(utilityForm.water_meter_old)).toFixed(2)} หน่วย
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">อัตรา:</span>
                              <span>฿{parseFloat(utilityForm.water_rate).toFixed(2)}/หน่วย</span>
                            </div>
                            <div className="flex justify-between font-bold text-blue-600 pt-1 border-t">
                              <span>รวม:</span>
                              <span>฿{((parseFloat(utilityForm.water_meter_new) - parseFloat(utilityForm.water_meter_old)) * parseFloat(utilityForm.water_rate)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">ยอดรวมทั้งหมด:</span>
                          <span className="text-2xl font-bold">
                            ฿{(
                              ((parseFloat(utilityForm.electricity_meter_new) - parseFloat(utilityForm.electricity_meter_old)) * parseFloat(utilityForm.electricity_rate)) +
                              ((parseFloat(utilityForm.water_meter_new) - parseFloat(utilityForm.water_meter_old)) * parseFloat(utilityForm.water_rate))
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200"
                      onClick={() => setShowUtilityModal(false)}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !utilityForm.electricity_meter_old || !utilityForm.electricity_meter_new ||
                        !utilityForm.water_meter_old || !utilityForm.water_meter_new ||
                        !utilityForm.electricity_rate || !utilityForm.water_rate ||
                        parseFloat(utilityForm.electricity_meter_new) < parseFloat(utilityForm.electricity_meter_old) ||
                        parseFloat(utilityForm.water_meter_new) < parseFloat(utilityForm.water_meter_old)
                      }
                      className={`flex-1 py-3 px-6 rounded-lg font-semibold shadow-lg transition-all duration-200 ${
                        !utilityForm.electricity_meter_old || !utilityForm.electricity_meter_new ||
                        !utilityForm.water_meter_old || !utilityForm.water_meter_new ||
                        !utilityForm.electricity_rate || !utilityForm.water_rate ||
                        parseFloat(utilityForm.electricity_meter_new) < parseFloat(utilityForm.electricity_meter_old) ||
                        parseFloat(utilityForm.water_meter_new) < parseFloat(utilityForm.water_meter_old)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'
                      }`}
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal ใบเช็ครายเดือน */}
        {showBillModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <FaFileInvoiceDollar className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">ใบเช็ครายเดือน</h3>
                      <p className="text-green-100">รายการค่าใช้จ่ายทั้งหมดที่ผู้เช่าต้องชำระ</p>
                    </div>
                  </div>
                  <button
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
                    onClick={() => setShowBillModal(false)}
                  >
                    <FaTimesCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {utilityHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FaFileInvoiceDollar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">ยังไม่มีข้อมูลการใช้สาธารณูปโภค</h3>
                    <p className="text-gray-400">เริ่มต้นบันทึกการใช้ไฟฟ้าและน้ำเพื่อสร้างใบเช็ครายเดือน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {utilityHistory.map((record, index) => {
                      // คำนวณค่าไฟและค่าน้ำ
                      const electricityUsage = (record.electricity_meter_new || 0) - (record.electricity_meter_old || 0);
                      const waterUsage = (record.water_meter_new || 0) - (record.water_meter_old || 0);
                      const electricityCost = electricityUsage * (record.electricity_rate || 0);
                      const waterCost = waterUsage * (record.water_rate || 0);
                      
                      // ค่าห้องพัก (ใช้ค่าจาก selectedRoom)
                      const roomRent = selectedRoom?.price_monthly || 0;
                      
                      // ยอดรวมทั้งหมด
                      const totalAmount = roomRent + electricityCost + waterCost;
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border-2 border-green-200 overflow-hidden">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-lg font-bold">ใบเช็ครายเดือน</h3>
                                <p className="text-green-100">ห้อง {selectedRoom?.room_number}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-green-100">วันที่ออกบิล</div>
                                <div className="font-semibold">{new Date(record.reading_date).toLocaleDateString('th-TH')}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Bill Details */}
                          <div className="p-6">
                            <div className="space-y-4">
                              {/* ค่าห้องพัก */}
                              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                  <FaHome className="w-5 h-5 text-gray-600" />
                                  <div>
                                    <div className="font-medium text-gray-900">ค่าห้องพัก</div>
                                    <div className="text-sm text-gray-500">รายเดือน</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg">฿{roomRent.toLocaleString()}</div>
                                </div>
                              </div>
                              
                              {/* ค่าไฟฟ้า */}
                              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                  <FaBolt className="w-5 h-5 text-yellow-500" />
                                  <div>
                                    <div className="font-medium text-gray-900">ค่าไฟฟ้า</div>
                                    <div className="text-sm text-gray-500">
                                      {electricityUsage.toLocaleString()} หน่วย × ฿{(record.electricity_rate || 0).toLocaleString()}/หน่วย
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg text-yellow-600">฿{electricityCost.toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">
                                    {(record.electricity_meter_old || 0).toLocaleString()} → {(record.electricity_meter_new || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              
                              {/* ค่าน้ำประปา */}
                              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                  <FaTint className="w-5 h-5 text-blue-500" />
                                  <div>
                                    <div className="font-medium text-gray-900">ค่าน้ำประปา</div>
                                    <div className="text-sm text-gray-500">
                                      {waterUsage.toLocaleString()} ลบ.ม. × ฿{(record.water_rate || 0).toLocaleString()}/ลบ.ม.
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg text-blue-600">฿{waterCost.toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">
                                    {(record.water_meter_old || 0).toLocaleString()} → {(record.water_meter_new || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* ยอดรวม */}
                            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-lg font-bold text-gray-900">ยอดรวมที่ต้องชำระ</div>
                                  <div className="text-sm text-gray-600">
                                    บันทึกโดย: {record.created_by || 'เจ้าของหอพัก'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-green-600">฿{totalAmount.toLocaleString()}</div>
                                  <div className="text-sm text-gray-500">บาท</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* หมายเหตุ */}
                            {(record.electricity_notes || record.water_notes) && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-2">หมายเหตุ:</div>
                                {record.electricity_notes && (
                                  <div className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">ไฟฟ้า:</span> {record.electricity_notes}
                                  </div>
                                )}
                                {record.water_notes && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">น้ำประปา:</span> {record.water_notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OwnerRoomManagePage;
