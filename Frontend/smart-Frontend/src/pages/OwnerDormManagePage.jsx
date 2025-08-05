import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerSidebar from '../components/OwnerSidebar';
import { 
  FaHome, 
  FaMoneyBillWave, 
  FaUniversity, 
  FaDoorOpen, 
  FaMapMarkerAlt, 
  FaWifi, 
  FaLandmark, 
  FaEdit, 
  FaTrashAlt, 
  FaPlusCircle, 
  FaTimesCircle, 
  FaImages, 
  FaTags, 
  FaChartLine, 
  FaPhoneAlt,
  FaStar,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

function OwnerDormManagePage({ roomManageMode = false }) {
  const navigate = useNavigate();
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price_daily: '',
    price_monthly: '',
    price_term: '',
    floor_count: '',
    room_count: '',
    address_detail: '', // เปลี่ยนจาก location เป็น address_detail
    water_cost: '', // เพิ่มค่าน้ำ
    electricity_cost: '', // เพิ่มค่าไฟ
    deposit: '', // เพิ่มเงินมัดจำ
    contact_phone: '', // เพิ่มเบอร์โทร
    facilities: '',
    near_places: '',
    latitude: '', // เพิ่มละติจูด
    longitude: '', // เพิ่มลองติจูด
    images: []
  });
  const [editId, setEditId] = useState(null);
  const [editImages, setEditImages] = useState([]); // สำหรับ preview รูปเดิม (url)
  const fileInputRef = useRef();
  const editFileInputRef = useRef();

  // รายการสิ่งอำนวยความสะดวก
  const facilitiesOptions = [
    'เครื่องปรับอากาศ',
    'ที่จอดรถ',
    'เฟอร์นิเจอร์',
    'บริการเครื่องซักผ้า',
    'เครื่องทำน้ำอุ่น',
    'ลิฟต์',
    'พัดลม',
    'สระว่ายน้ำ',
    'โรงยิม',
    'ตู้เย็น',
    'ระบบรักษาความปลอดภัย',
    'กล้องวงจรปิด',
    'รปภ.',
    'อินเตอร์เน็ต',
    'อนุญาตให้เลี้ยงสัตว์'
  ];

  // รายการสถานที่ใกล้เคียง
  const nearPlacesOptions = [
    'ม.มหาสารคาม',
    'ม.มหาสารคาม(ม.เก่า)',
    'ม.ราชภัฏมหาสารคาม',
    'เสริมไทย คอมเพล็กซ์',
    'เสริมไทย พลาซ่า',
    'วิทยาลัยเทคนิคมหาสารคาม',
    'วิทยาลัยพยาบาลศรีมหาสารคาม',
    'แม็คโครมหาสารคาม',
    'โรงพยาบาลสุทธาเวช',
    'โรงพยาบาลมหาสารคาม',
    'สถานีขนส่งมหาสารคาม',
    'สถานีตำรวจภูธรเมืองมหาสารคาม'
  ];

  // ฟังก์ชันช่วยในการจัดการสิ่งอำนวยความสะดวก
  const getFacilitiesArray = (facilitiesString) => {
    if (!facilitiesString) return [];
    return facilitiesString.split(',').map(f => f.trim()).filter(f => f);
  };

  const isFacilitySelected = (facility, facilitiesString) => {
    const currentFacilities = getFacilitiesArray(facilitiesString);
    return currentFacilities.includes(facility);
  };

  const toggleFacility = (facility, currentFacilities) => {
    const facilitiesArray = getFacilitiesArray(currentFacilities);
    if (facilitiesArray.includes(facility)) {
      const newFacilities = facilitiesArray.filter(f => f !== facility);
      return newFacilities.join(', ');
    } else {
      const newFacilities = [...facilitiesArray, facility];
      return newFacilities.join(', ');
    }
  };

  // ฟังก์ชันช่วยในการจัดการสถานที่ใกล้เคียง
  const getNearPlacesArray = (nearPlacesString) => {
    if (!nearPlacesString) return [];
    return nearPlacesString.split(',').map(p => p.trim()).filter(p => p);
  };

  const isNearPlaceSelected = (place, nearPlacesString) => {
    const currentPlaces = getNearPlacesArray(nearPlacesString);
    return currentPlaces.includes(place);
  };

  const toggleNearPlace = (place, currentNearPlaces) => {
    const placesArray = getNearPlacesArray(currentNearPlaces);
    if (placesArray.includes(place)) {
      const newPlaces = placesArray.filter(p => p !== place);
      return newPlaces.join(', ');
    } else {
      const newPlaces = [...placesArray, place];
      return newPlaces.join(', ');
    }
  };

  useEffect(() => {
    // ตรวจสอบ token ก่อน fetchDorms (ใช้ sessionStorage แบบเดียวกับ LoginPage)
    const token = sessionStorage.getItem('token');
    if (!token) {
      alert('กรุณาเข้าสู่ระบบใหม่ (ไม่พบ token)');
      setDorms([]);
      setLoading(false);
      return;
    }
    fetchDorms(token);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDorms = (token) => {
    setLoading(true);
    fetch('http://localhost:3001/owner/dorms', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async res => {
        // ถ้า token หมดอายุหรือผิด จะได้ 401
        if (!res.ok) {
          if (res.status === 401) {
            alert('กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุหรือไม่ถูกต้อง)');
            setDorms([]);
            setLoading(false);
            return;
          }
          // กรณี error อื่น ๆ
          const err = await res.json();
          alert(err.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
          setDorms([]);
          setLoading(false);
          return;
        }
        return res.json();
      })
      .then(data => {
        console.log('🔍 Debug - ข้อมูลหอพักที่ได้รับจาก API:', data);
        if (Array.isArray(data)) {
          // เช็คข้อมูลแต่ละหอพัก
          data.forEach((dorm, index) => {
            console.log(`🏠 หอพัก ${index + 1}: ${dorm.name}`, {
              latitude: dorm.latitude,
              longitude: dorm.longitude,
              coordinates: dorm.coordinates
            });
          });
          setDorms(data);
          // ซิงค์จำนวนห้องพักหลังจากโหลดข้อมูลหอพัก
          syncRoomCount(token);
        } else {
          setDorms([]);
        }
        setLoading(false);
      })
      .catch(() => {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        setDorms([]);
        setLoading(false);
      });
  };

  // ฟังก์ชันซิงค์จำนวนห้องพัก
  const syncRoomCount = (token) => {
    fetch('http://localhost:3001/admin/sync-room-count', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.ok) {
          console.log('Room count synced successfully');
          // โหลดข้อมูลหอพักใหม่เพื่อแสดงจำนวนห้องที่ถูกต้อง
          setTimeout(() => {
            fetchDormsOnly(token);
          }, 500);
        }
      })
      .catch(err => {
        console.error('Error syncing room count:', err);
      });
  };

  // ฟังก์ชันโหลดข้อมูลหอพักอย่างเดียว (ไม่ซิงค์)
  const fetchDormsOnly = (token) => {
    fetch('http://localhost:3001/owner/dorms', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDorms(data);
        }
      })
      .catch(err => {
        console.error('Error fetching dorms:', err);
      });
  };

  // เพิ่มหอพักใหม่
  const handleAddDorm = async (e) => {
    e.preventDefault();
    
    console.log('🔧 Debug - เริ่มต้นการเพิ่มหอพัก');
    console.log('🔧 Debug - Form data:', {
      name: form.name,
      latitude: form.latitude,
      longitude: form.longitude,
      images: form.images?.length || 0
    });
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!form.name || !form.latitude || !form.longitude) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, ที่อยู่, พิกัด)');
      return;
    }
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price_daily', form.price_daily);
    formData.append('price_monthly', form.price_monthly);
    formData.append('price_term', form.price_term);
    formData.append('floor_count', form.floor_count);
    formData.append('room_count', form.room_count);
    formData.append('address_detail', form.address_detail); // เปลี่ยนจาก location
    formData.append('water_cost', form.water_cost);
    formData.append('electricity_cost', form.electricity_cost);
    formData.append('deposit', form.deposit);
    formData.append('contact_phone', form.contact_phone);
    formData.append('facilities', form.facilities);
    formData.append('near_places', form.near_places);
    formData.append('latitude', form.latitude); // เพิ่มละติจูด
    formData.append('longitude', form.longitude); // เพิ่มลองติจูด
    for (const file of form.images) {
      formData.append('images', file);
    }
    
    console.log('🔧 Debug - FormData prepared, sending request...');
    
    try {
      const res = await fetch('http://localhost:3001/owner/dorms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });
      
      console.log('🔧 Debug - Response status:', res.status);
      console.log('🔧 Debug - Response ok:', res.ok);
      
      if (res.ok) {
        const responseData = await res.json();
        console.log('🔧 Debug - Response data:', responseData);
        alert('เพิ่มหอพักเรียบร้อยแล้ว! \nหอพักของคุณอยู่ในสถานะรออนุมัติจากผู้ดูแลระบบ \nจะแสดงในหน้าหลักหลังจากได้รับการอนุมัติ');
        setShowAddModal(false);
        setForm({ name: '', price_daily: '', price_monthly: '', price_term: '', floor_count: '', room_count: '', address_detail: '', water_cost: '', electricity_cost: '', deposit: '', contact_phone: '', facilities: '', near_places: '', latitude: '', longitude: '', images: [] });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDorms(sessionStorage.getItem('token'));
      } else {
        console.log('🔧 Debug - Error response status:', res.status);
        try {
          const err = await res.json();
          console.log('🔧 Debug - Error response:', err);
          alert(err.error || 'เกิดข้อผิดพลาดในการเพิ่มหอพัก');
        } catch (parseError) {
          console.log('🔧 Debug - Failed to parse error response:', parseError);
          alert(`เกิดข้อผิดพลาด: HTTP ${res.status} ${res.statusText}`);
        }
      }
    } catch (error) {
      console.error('🔧 Debug - Network/Fetch Error:', error);
      console.error('🔧 Debug - Error message:', error.message);
      console.error('🔧 Debug - Error stack:', error.stack);
      alert(`เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${error.message}`);
    }
  };

  // เตรียมข้อมูลสำหรับแก้ไข
  const handleEditClick = (dorm) => {
    console.log('🔧 Debug - ข้อมูลหอพักที่จะแก้ไข:', dorm);
    console.log('📍 Debug - พิกัดหอพัก:', {
      latitude: dorm.latitude,
      longitude: dorm.longitude,
      coordinates: dorm.coordinates
    });
    
    // หาพิกัดหอพักจาก coordinates array ถ้าไม่มีใน dorm.latitude/longitude
    let dormLat = dorm.latitude || '';
    let dormLng = dorm.longitude || '';
    
    if ((!dormLat || !dormLng) && dorm.coordinates && Array.isArray(dorm.coordinates)) {
      const dormLocation = dorm.coordinates.find(coord => coord.location_type === 'dorm_location');
      if (dormLocation) {
        dormLat = dormLocation.latitude || '';
        dormLng = dormLocation.longitude || '';
        console.log('🎯 พบพิกัดใน coordinates array:', { dormLat, dormLng });
      }
    }
    
    setEditId(dorm.id);
    setForm({
      name: dorm.name || '',
      price_daily: dorm.price_daily || '',
      price_monthly: dorm.price_monthly || '',
      price_term: dorm.price_term || '',
      floor_count: dorm.floor_count || '',
      room_count: dorm.room_count || '',
      address_detail: dorm.address_detail || '', // เปลี่ยนจาก location
      water_cost: dorm.water_cost || '',
      electricity_cost: dorm.electricity_cost || '',
      deposit: dorm.deposit || '',
      contact_phone: dorm.contact_phone || '',
      facilities: dorm.facilities || '',
      near_places: dorm.near_places || '',
      latitude: dormLat, // ใช้พิกัดที่หาได้
      longitude: dormLng, // ใช้พิกัดที่หาได้
      images: []
    });
    
    console.log('📝 Debug - Form ที่ set:', {
      latitude: dormLat,
      longitude: dormLng
    });
    
    setEditImages(dorm.images ? [...dorm.images] : []);
    setShowEditModal(true);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  // ลบรูปเดิม (url)
  const handleRemoveEditImage = (idx) => {
    setEditImages(prev => prev.filter((_, i) => i !== idx));
  };
  // ลบรูปใหม่ (File)
  const handleRemoveNewImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  // เพิ่มรูปใหม่ (Add/Edit)
  const handleAddImages = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (isEdit) {
      setForm(f => ({ ...f, images: [...f.images, ...files] }));
    } else {
      setForm(f => ({ ...f, images: [...f.images, ...files] }));
    }
    e.target.value = '';
  };

  // แก้ไขหอพัก
  const handleEditDorm = async (e) => {
    e.preventDefault();
    
    console.log('🔧 Debug - ข้อมูลที่จะส่งไปแก้ไข:', {
      latitude: form.latitude,
      longitude: form.longitude,
      name: form.name,
      near_places: form.near_places
    });
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price_daily', form.price_daily);
    formData.append('price_monthly', form.price_monthly);
    formData.append('price_term', form.price_term);
    formData.append('floor_count', form.floor_count);
    formData.append('room_count', form.room_count);
    formData.append('address_detail', form.address_detail); // เปลี่ยนจาก location
    formData.append('water_cost', form.water_cost);
    formData.append('electricity_cost', form.electricity_cost);
    formData.append('deposit', form.deposit);
    formData.append('contact_phone', form.contact_phone);
    formData.append('facilities', form.facilities);
    formData.append('near_places', form.near_places);
    formData.append('latitude', form.latitude); // เพิ่มละติจูด
    formData.append('longitude', form.longitude); // เพิ่มลองติจูด
    // ส่งเฉพาะไฟล์ใหม่
    for (const file of form.images) {
      formData.append('images', file);
    }
    // ส่งรายชื่อรูปเดิมที่เหลือ (หลังลบ) เพื่อ backend จะเก็บไว้
    formData.append('existingImages', JSON.stringify(editImages));
    try {
      const res = await fetch(`http://localhost:3001/owner/dorms/${editId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
        return;
      }
      setShowEditModal(false);
      setEditId(null);
      setForm({ name: '', price_daily: '', price_monthly: '', price_term: '', floor_count: '', room_count: '', address_detail: '', water_cost: '', electricity_cost: '', deposit: '', contact_phone: '', facilities: '', near_places: '', latitude: '', longitude: '', images: [] });
      setEditImages([]);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
      fetchDorms(sessionStorage.getItem('token'));
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // ลบหอพัก
  const handleDelete = (id) => {
    if (window.confirm('ต้องการลบหอพักนี้ใช่หรือไม่?')) {
      fetch(`http://localhost:3001/dorms/${id}`, { method: 'DELETE' })
        .then(async res => {
          if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            return;
          }
          fetchDorms(sessionStorage.getItem('token'));
        })
        .catch(() => {
          alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <OwnerSidebar />
      <main className="flex-1 p-6 bg-gradient-to-br from-orange-50 to-blue-100 min-h-screen">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
            
            {/* Content */}
            <div className="relative px-8 py-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <FaHome className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {roomManageMode ? 'เลือกหอพักเพื่อจัดการห้องพัก' : 'จัดการหอพัก'}
                  </h1>
                  <p className="text-orange-100 mt-1">
                    {roomManageMode ? 'เลือกหอพักที่ต้องการจัดการห้องพัก' : 'เพิ่ม แก้ไข และจัดการหอพักของคุณ'}
                  </p>
                </div>
              </div>
              
              {/* Add Button & Statistics */}
              <div className="flex items-center gap-6">
                <div className="hidden md:flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {dorms.length}
                    </div>
                    <div className="text-orange-200 text-xs">หอพักทั้งหมด</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {dorms.reduce((sum, d) => sum + (parseInt(d.room_count) || 0), 0)}
                    </div>
                    <div className="text-orange-200 text-xs">ห้องทั้งหมด</div>
                  </div>
                </div>
                {!roomManageMode && (
                  <button
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 text-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                    onClick={() => setShowAddModal(true)}
                  >
                    <FaPlusCircle className="w-5 h-5" />
                    เพิ่มหอพัก
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : dorms.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaHome className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {roomManageMode ? 'ยังไม่มีหอพัก' : 'ยังไม่มีหอพัก'}
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {roomManageMode ? 'คุณต้องมีหอพักก่อนจึงจะสามารถจัดการห้องพักได้' : 'เริ่มต้นสร้างธุรกิจหอพักของคุณโดยเพิ่มหอพักแรก'}
                </p>
                {!roomManageMode && (
                  <button
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                    onClick={() => setShowAddModal(true)}
                  >
                    <FaPlusCircle className="w-5 h-5" />
                    เพิ่มหอพักแรก
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {dorms.map((dorm, index) => (
                <div
                  key={dorm.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image Section */}
                  <div className="relative">
                    <img
                      src={
                        dorm.images && dorm.images.length > 0
                          ? (dorm.images[0].startsWith('http')
                              ? dorm.images[0]
                              : `http://localhost:3001${dorm.images[0]}`)
                          : '/no-image.png'
                      }
                      alt={dorm.name}
                      onError={e => { e.target.onerror = null; e.target.src = '/no-image.png'; }}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Image overlay */}
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Image Count Badge */}
                    {dorm.images && dorm.images.length > 1 && (
                      <div className="absolute top-4 left-4">
                        <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                          <FaImages className="w-4 h-4" />
                          <span className="font-medium">{dorm.images.length} รูป</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {roomManageMode ? (
                        <>
                          <button
                            className="bg-green-500/90 backdrop-blur-sm hover:bg-green-600 text-white p-2 rounded-lg shadow-lg transition-all duration-200"
                            onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms`)}
                            title="เลือกหอพักนี้"
                          >
                            <FaDoorOpen className="w-4 h-4" />
                          </button>
                          <button
                            className="bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600 text-white p-2 rounded-lg shadow-lg transition-all duration-200"
                            onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms?addRoom=true`)}
                            title="เพิ่มห้องพัก"
                          >
                            <FaPlusCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600 text-white p-2 rounded-lg shadow-lg transition-all duration-200"
                            onClick={() => handleEditClick(dorm)}
                            title="แก้ไขข้อมูล"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            className="bg-red-500/90 backdrop-blur-sm hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-all duration-200"
                            onClick={() => handleDelete(dorm.id)}
                            title="ลบหอพัก"
                          >
                            <FaTrashAlt className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    {/* Header - ชื่อหอพักและที่อยู่ */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {dorm.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaMapMarkerAlt className="w-4 h-4 text-orange-500" />
                        <span className="text-sm line-clamp-1">{dorm.address_detail || 'ไม่ระบุตำแหน่ง'}</span>
                      </div>
                      {/* แสดงพิกัด GPS */}
                      {(dorm.latitude && dorm.longitude) && (
                        <div className="flex items-center gap-2 text-gray-500 mt-1">
                          <FaMapMarkerAlt className="w-3 h-3 text-blue-500" />
                          <span className="text-xs">
                            GPS: {parseFloat(dorm.latitude).toFixed(6)}, {parseFloat(dorm.longitude).toFixed(6)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${dorm.latitude},${dorm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-xs"
                          >
                            เปิดแผนที่
                          </a>
                        </div>
                      )}
                    </div>

                    {/* ข้อมูลพื้นฐาน */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">จำนวนชั้น</label>
                          <div className="flex items-center gap-2">
                            <FaUniversity className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-semibold text-gray-800">{dorm.floor_count || 0} ชั้น</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">จำนวนห้อง</label>
                          <div className="flex items-center gap-2">
                            <FaDoorOpen className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-semibold text-gray-800">{dorm.room_count || 0} ห้อง</span>
                          </div>
                        </div>
                        {dorm.contact_phone && (
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">เบอร์ติดต่อ</label>
                            <div className="flex items-center gap-2">
                              <FaPhoneAlt className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-gray-800">{dorm.contact_phone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ราคาห้องพัก */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-3">ราคาห้องพัก</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <FaMoneyBillWave className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-gray-600">รายวัน</span>
                          </div>
                          <div className="font-bold text-green-600 text-sm">
                            {dorm.price_daily ? `฿${parseInt(dorm.price_daily).toLocaleString()}` : '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <FaMoneyBillWave className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-gray-600">รายเดือน</span>
                          </div>
                          <div className="font-bold text-blue-600 text-sm">
                            {dorm.price_monthly ? `฿${parseInt(dorm.price_monthly).toLocaleString()}` : '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <FaMoneyBillWave className="w-3 h-3 text-purple-500" />
                            <span className="text-xs text-gray-600">รายเทอม</span>
                          </div>
                          <div className="font-bold text-purple-600 text-sm">
                            {dorm.price_term ? `฿${parseInt(dorm.price_term).toLocaleString()}` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ค่าใช้จ่ายเพิ่มเติม */}
                    {(dorm.water_cost || dorm.electricity_cost || dorm.deposit) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-3">ค่าใช้จ่ายเพิ่มเติม</label>
                        <div className="space-y-2">
                          {dorm.water_cost && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm text-gray-700">ค่าน้ำ</span>
                              </div>
                              <span className="text-sm font-semibold text-cyan-600">
                                ฿{parseInt(dorm.water_cost).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {dorm.electricity_cost && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-gray-700">ค่าไฟ</span>
                              </div>
                              <span className="text-sm font-semibold text-yellow-600">
                                ฿{parseFloat(dorm.electricity_cost).toLocaleString()}/หน่วย
                              </span>
                            </div>
                          )}
                          {dorm.deposit && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="w-4 h-4 text-purple-500" />
                                <span className="text-sm text-gray-700">เงินมัดจำ</span>
                              </div>
                              <span className="text-sm font-semibold text-purple-600">
                                ฿{parseInt(dorm.deposit).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* สิ่งอำนวยความสะดวก */}
                    {dorm.facilities && (
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-2">สิ่งอำนวยความสะดวก</label>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <FaWifi className="w-4 h-4 text-purple-500 mt-0.5" />
                            <span className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                              {dorm.facilities}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons (Mobile) */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                        onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms`)}
                      >
                        <FaDoorOpen className="w-4 h-4" />
                        {roomManageMode ? 'เลือกหอพักนี้' : 'จัดการห้องพัก'}
                      </button>
                      {roomManageMode && (
                        <button
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                          onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms?addRoom=true`)}
                        >
                          <FaPlusCircle className="w-4 h-4" />
                          เพิ่มห้องพัก
                        </button>
                      )}
                      {!roomManageMode && (
                        <>
                          <button
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            onClick={() => handleEditClick(dorm)}
                          >
                            <FaEdit className="w-4 h-4" />
                            แก้ไข
                          </button>
                          <button
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            onClick={() => handleDelete(dorm.id)}
                          >
                            <FaTrashAlt className="w-4 h-4" />
                            ลบ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Modal เพิ่มหอพัก */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <FaPlusCircle className="text-white w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">เพิ่มหอพักใหม่</h3>
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
              <form onSubmit={handleAddDorm} className="p-6 space-y-6">
                {/* รูปภาพ */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaImages className="text-orange-500" />
                    รูปภาพหอพัก
                  </label>
                  <div className="flex gap-3 flex-wrap items-center">
                    {form.images.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-24 h-20 object-cover rounded-lg border-2 border-orange-200 shadow-md"
                        />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg group-hover:scale-110 transition-transform"
                          onClick={() => handleRemoveNewImage(idx)}
                        >
                          <FaTimesCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="w-24 h-20 flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-lg cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors relative">
                      <FaPlusCircle className="text-orange-400 text-xl mb-1" />
                      <span className="text-xs text-orange-600">เพิ่มรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        onChange={e => handleAddImages(e, false)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* ข้อมูลพื้นฐาน */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                      <FaHome className="text-orange-500" />
                      ชื่อหอพัก *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="กรุณาใส่ชื่อหอพัก"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                      <FaMapMarkerAlt className="text-orange-500" />
                      ที่อยู่/ทำเล *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="ที่อยู่หรือทำเลที่ตั้ง"
                      value={form.address_detail}
                      onChange={e => setForm({ ...form, address_detail: e.target.value })}
                      required
                    />
                  </div>

                  {/* ฟิลด์พิกัด GPS */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaMapMarkerAlt className="text-blue-500" />
                        ละติจูด (Latitude)
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="16.246825"
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={e => setForm({ ...form, latitude: e.target.value })}
                      />
                      <span className="text-xs text-gray-500 mt-1">ตัวอย่าง: 16.246825</span>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaMapMarkerAlt className="text-green-500" />
                        ลองติจูด (Longitude)
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="103.255025"
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={e => setForm({ ...form, longitude: e.target.value })}
                      />
                      <span className="text-xs text-gray-500 mt-1">ตัวอย่าง: 103.255025</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <strong>วิธีหาพิกัด GPS:</strong> เปิด Google Maps → คลิกขวาที่ตำแหน่ง → คัดลอกพิกัด → วางในช่องด้านบน
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaUniversity className="text-orange-500" />
                        จำนวนชั้น
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="ชั้น"
                        type="number"
                        min="1"
                        value={form.floor_count}
                        onChange={e => setForm({ ...form, floor_count: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaDoorOpen className="text-orange-500" />
                        จำนวนห้อง
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="ห้อง"
                        type="number"
                        min="1"
                        value={form.room_count}
                        onChange={e => setForm({ ...form, room_count: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* ราคา */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaMoneyBillWave className="text-orange-500" />
                    ราคาค่าเช่า
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ราคารายวัน (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={form.price_term}
                        onChange={e => setForm({ ...form, price_term: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* ค่าใช้จ่ายเพิ่มเติม */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaMoneyBillWave className="text-orange-500" />
                    ค่าใช้จ่ายเพิ่มเติม
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ค่าน้ำ (บาท/เดือน)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="เช่น 300"
                        type="number"
                        min="0"
                        value={form.water_cost}
                        onChange={e => setForm({ ...form, water_cost: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ค่าไฟ (บาท/หน่วย)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="เช่น 7"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.electricity_cost}
                        onChange={e => setForm({ ...form, electricity_cost: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">เงินมัดจำ (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="เช่น 5000"
                        type="number"
                        min="0"
                        value={form.deposit}
                        onChange={e => setForm({ ...form, deposit: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">เบอร์โทรติดต่อ</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="เช่น 02-123-4567"
                        type="tel"
                        value={form.contact_phone}
                        onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* สิ่งอำนวยความสะดวก */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaWifi className="text-orange-500" />
                    สิ่งอำนวยความสะดวก
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      {facilitiesOptions.map((facility) => (
                        <label key={facility} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-2 transition-colors">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            checked={isFacilitySelected(facility, form.facilities)}
                            onChange={() => {
                              const newFacilities = toggleFacility(facility, form.facilities);
                              setForm({ ...form, facilities: newFacilities });
                            }}
                          />
                          <span className="text-sm text-gray-700">{facility}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* แสดงสิ่งอำนวยความสะดวกที่ไม่ใช่ตัวเลือกมาตรฐาน */}
                    {(() => {
                      const currentFacilities = getFacilitiesArray(form.facilities);
                      const customFacilities = currentFacilities.filter(f => !facilitiesOptions.includes(f));
                      
                      if (customFacilities.length > 0) {
                        return (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-600 mb-2">สิ่งอำนวยความสะดวกอื่น ๆ:</p>
                            <div className="flex flex-wrap gap-2">
                              {customFacilities.map((facility, index) => (
                                <div key={index} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                  <span>{facility}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFacilities = toggleFacility(facility, form.facilities);
                                      setForm({ ...form, facilities: newFacilities });
                                    }}
                                    className="text-orange-500 hover:text-orange-700 transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {form.facilities && (
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">สิ่งอำนวยความสะดวกที่เลือก:</p>
                      <p className="text-sm text-orange-700 font-medium">{form.facilities}</p>
                    </div>
                  )}
                </div>

                {/* สถานที่ใกล้เคียง */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaLandmark className="text-orange-500" />
                    สถานที่ใกล้เคียง
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-1 gap-3">
                      {nearPlacesOptions.map((place) => (
                        <label key={place} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-2 transition-colors">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            checked={isNearPlaceSelected(place, form.near_places)}
                            onChange={() => {
                              setForm({
                                ...form,
                                near_places: toggleNearPlace(place, form.near_places)
                              });
                            }}
                          />
                          <span className="text-sm text-gray-700">{place}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* แสดงสถานที่ใกล้เคียงที่ไม่ใช่ตัวเลือกมาตรฐาน */}
                    {(() => {
                      const currentPlaces = getNearPlacesArray(form.near_places);
                      const customPlaces = currentPlaces.filter(place => !nearPlacesOptions.includes(place));
                      if (customPlaces.length > 0) {
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="text-sm font-medium text-gray-600 mb-2">สถานที่ใกล้เคียงอื่น ๆ:</p>
                            <div className="flex flex-wrap gap-2">
                              {customPlaces.map((place, idx) => (
                                <div key={idx} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                  <span>{place}</span>
                                  <button
                                    type="button"
                                    className="text-orange-600 hover:text-orange-800 font-bold"
                                    onClick={() => {
                                      setForm({
                                        ...form,
                                        near_places: toggleNearPlace(place, form.near_places)
                                      });
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {form.near_places && (
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">สถานที่ใกล้เคียงที่เลือก:</p>
                      <p className="text-sm text-orange-700 font-medium">{form.near_places}</p>
                    </div>
                  )}
                  
                  {/* เพิ่มข้อความเพิ่มเติม */}
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-2">หรือเพิ่มสถานที่อื่น ๆ (คั่นด้วยเครื่องหมายจุลภาค)</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="เช่น ห้างเดอะมอลล์, ตลาดนัด, BTS"
                      rows="2"
                      onChange={(e) => {
                        const customPlaces = e.target.value;
                        if (customPlaces.trim()) {
                          const currentSelected = getNearPlacesArray(form.near_places).filter(p => nearPlacesOptions.includes(p));
                          const newCustomPlaces = customPlaces.split(',').map(p => p.trim()).filter(p => p);
                          const allPlaces = [...currentSelected, ...newCustomPlaces];
                          setForm({ ...form, near_places: allPlaces.join(', ') });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* ปุ่มบันทึก */}
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
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all duration-200"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal แก้ไขข้อมูลหอพัก */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <FaEdit className="text-white w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">แก้ไขข้อมูลหอพัก</h3>
                  </div>
                  <button
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditId(null);
                      setForm({ name: '', price_daily: '', price_monthly: '', price_term: '', floor_count: '', room_count: '', address_detail: '', water_cost: '', electricity_cost: '', deposit: '', contact_phone: '', facilities: '', near_places: '', latitude: '', longitude: '', images: [] });
                      setEditImages([]);
                    }}
                  >
                    <FaTimesCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleEditDorm} className="p-6 space-y-6">
                {/* รูปภาพ */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaImages className="text-blue-500" />
                    รูปภาพหอพัก
                  </label>
                  <div className="flex gap-3 flex-wrap items-center">
                    {editImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.startsWith('http') ? img : `http://localhost:3001${img}`}
                          alt="preview"
                          className="w-24 h-20 object-cover rounded-lg border-2 border-blue-200 shadow-md"
                        />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg group-hover:scale-110 transition-transform"
                          onClick={() => handleRemoveEditImage(idx)}
                        >
                          <FaTimesCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {form.images.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-24 h-20 object-cover rounded-lg border-2 border-blue-200 shadow-md"
                        />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg group-hover:scale-110 transition-transform"
                          onClick={() => handleRemoveNewImage(idx)}
                        >
                          <FaTimesCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="w-24 h-20 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors relative">
                      <FaPlusCircle className="text-blue-400 text-xl mb-1" />
                      <span className="text-xs text-blue-600">เพิ่มรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={editFileInputRef}
                        onChange={e => handleAddImages(e, true)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* ข้อมูลพื้นฐาน */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                      <FaHome className="text-blue-500" />
                      ชื่อหอพัก *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="กรุณาใส่ชื่อหอพัก"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                      <FaMapMarkerAlt className="text-blue-500" />
                      ที่อยู่/ทำเล *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="ที่อยู่หรือทำเลที่ตั้ง"
                      value={form.address_detail}
                      onChange={e => setForm({ ...form, address_detail: e.target.value })}
                      required
                    />
                  </div>

                  {/* ฟิลด์พิกัด GPS */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaMapMarkerAlt className="text-blue-500" />
                        ละติจูด (Latitude)
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="16.246825"
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={e => setForm({ ...form, latitude: e.target.value })}
                      />
                      <span className="text-xs text-gray-500 mt-1">ตัวอย่าง: 16.246825</span>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaMapMarkerAlt className="text-green-500" />
                        ลองติจูด (Longitude)
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="103.255025"
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={e => setForm({ ...form, longitude: e.target.value })}
                      />
                      <span className="text-xs text-gray-500 mt-1">ตัวอย่าง: 103.255025</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <strong>วิธีหาพิกัด GPS:</strong> เปิด Google Maps → คลิกขวาที่ตำแหน่ง → คัดลอกพิกัด → วางในช่องด้านบน
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaUniversity className="text-blue-500" />
                        จำนวนชั้น
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="ชั้น"
                        type="number"
                        min="1"
                        value={form.floor_count}
                        onChange={e => setForm({ ...form, floor_count: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <FaDoorOpen className="text-blue-500" />
                        จำนวนห้อง
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="ห้อง"
                        type="number"
                        min="1"
                        value={form.room_count}
                        onChange={e => setForm({ ...form, room_count: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* ราคา */}
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

                {/* ค่าใช้จ่ายเพิ่มเติม */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaMoneyBillWave className="text-blue-500" />
                    ค่าใช้จ่ายเพิ่มเติม
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ค่าน้ำ (บาท/เดือน)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="เช่น 300"
                        type="number"
                        min="0"
                        value={form.water_cost}
                        onChange={e => setForm({ ...form, water_cost: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">ค่าไฟ (บาท/หน่วย)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="เช่น 7"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.electricity_cost}
                        onChange={e => setForm({ ...form, electricity_cost: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">เงินมัดจำ (บาท)</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="เช่น 5000"
                        type="number"
                        min="0"
                        value={form.deposit}
                        onChange={e => setForm({ ...form, deposit: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-600">เบอร์โทรติดต่อ</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="เช่น 02-123-4567"
                        type="tel"
                        value={form.contact_phone}
                        onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* สิ่งอำนวยความสะดวก */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaWifi className="text-blue-500" />
                    สิ่งอำนวยความสะดวก
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      {facilitiesOptions.map((facility) => (
                        <label key={facility} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-2 transition-colors">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            checked={isFacilitySelected(facility, form.facilities)}
                            onChange={() => {
                              const newFacilities = toggleFacility(facility, form.facilities);
                              setForm({ ...form, facilities: newFacilities });
                            }}
                          />
                          <span className="text-sm text-gray-700">{facility}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* แสดงสิ่งอำนวยความสะดวกที่ไม่ใช่ตัวเลือกมาตรฐาน */}
                    {(() => {
                      const currentFacilities = getFacilitiesArray(form.facilities);
                      const customFacilities = currentFacilities.filter(f => !facilitiesOptions.includes(f));
                      
                      if (customFacilities.length > 0) {
                        return (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-600 mb-2">สิ่งอำนวยความสะดวกอื่น ๆ:</p>
                            <div className="flex flex-wrap gap-2">
                              {customFacilities.map((facility, index) => (
                                <div key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                  <span>{facility}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFacilities = toggleFacility(facility, form.facilities);
                                      setForm({ ...form, facilities: newFacilities });
                                    }}
                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {form.facilities && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">สิ่งอำนวยความสะดวกที่เลือก:</p>
                      <p className="text-sm text-blue-700 font-medium">{form.facilities}</p>
                    </div>
                  )}
                </div>

                {/* สถานที่ใกล้เคียง */}
                <div>
                  <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-700">
                    <FaLandmark className="text-blue-500" />
                    สถานที่ใกล้เคียง
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-1 gap-3">
                      {nearPlacesOptions.map((place) => (
                        <label key={place} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-2 transition-colors">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            checked={isNearPlaceSelected(place, form.near_places)}
                            onChange={() => {
                              setForm({
                                ...form,
                                near_places: toggleNearPlace(place, form.near_places)
                              });
                            }}
                          />
                          <span className="text-sm text-gray-700">{place}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* แสดงสถานที่ใกล้เคียงที่ไม่ใช่ตัวเลือกมาตรฐาน */}
                    {(() => {
                      const currentPlaces = getNearPlacesArray(form.near_places);
                      const customPlaces = currentPlaces.filter(place => !nearPlacesOptions.includes(place));
                      if (customPlaces.length > 0) {
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="text-sm font-medium text-gray-600 mb-2">สถานที่ใกล้เคียงอื่น ๆ:</p>
                            <div className="flex flex-wrap gap-2">
                              {customPlaces.map((place, idx) => (
                                <div key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                  <span>{place}</span>
                                  <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-800 font-bold"
                                    onClick={() => {
                                      setForm({
                                        ...form,
                                        near_places: toggleNearPlace(place, form.near_places)
                                      });
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {form.near_places && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">สถานที่ใกล้เคียงที่เลือก:</p>
                      <p className="text-sm text-blue-700 font-medium">{form.near_places}</p>
                    </div>
                  )}
                  
                  {/* เพิ่มข้อความเพิ่มเติม */}
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-2">หรือเพิ่มสถานที่อื่น ๆ (คั่นด้วยเครื่องหมายจุลภาค)</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="เช่น ห้างเดอะมอลล์, ตลาดนัด, BTS"
                      rows="2"
                      onChange={(e) => {
                        const customPlaces = e.target.value;
                        if (customPlaces.trim()) {
                          const currentSelected = getNearPlacesArray(form.near_places).filter(p => nearPlacesOptions.includes(p));
                          const newCustomPlaces = customPlaces.split(',').map(p => p.trim()).filter(p => p);
                          const allPlaces = [...currentSelected, ...newCustomPlaces];
                          setForm({ ...form, near_places: allPlaces.join(', ') });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* ปุ่มบันทึก */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditId(null);
                      setForm({ name: '', price_daily: '', price_monthly: '', price_term: '', floor_count: '', room_count: '', address_detail: '', water_cost: '', electricity_cost: '', deposit: '', contact_phone: '', facilities: '', near_places: '', latitude: '', longitude: '', images: [] });
                      setEditImages([]);
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all duration-200"
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

export default OwnerDormManagePage;