import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaMapMarkerAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUniversity, 
  FaHospital, 
  FaShoppingCart, 
  FaBus, 
  FaStore, 
  FaBuilding,
  FaSave,
  FaTimes
} from 'react-icons/fa';

const LOCATION_TYPES = {
  'dorm': { icon: FaBuilding, label: 'หอพัก', color: 'bg-blue-500' },
  'university': { icon: FaUniversity, label: 'มหาวิทยาลัย', color: 'bg-green-500' },
  'school': { icon: FaUniversity, label: 'โรงเรียน', color: 'bg-yellow-500' },
  'hospital': { icon: FaHospital, label: 'โรงพยาบาล', color: 'bg-red-500' },
  'market': { icon: FaStore, label: 'ตลาด', color: 'bg-orange-500' },
  'shopping': { icon: FaShoppingCart, label: 'ศูนย์การค้า', color: 'bg-purple-500' },
  'transport': { icon: FaBus, label: 'สถานีขนส่ง', color: 'bg-gray-500' },
  'other': { icon: FaMapMarkerAlt, label: 'อื่นๆ', color: 'bg-indigo-500' }
};

function NearbyLocationManager({ dormId, isOpen, onClose }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form, setForm] = useState({
    location_type: 'university',
    location_name: '',
    latitude: '',
    longitude: '',
    description: '',
    distance_km: ''
  });

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/dorms/${dormId}/nearby-locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        console.error('Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  }, [dormId]);

  useEffect(() => {
    if (isOpen && dormId) {
      fetchLocations();
    }
  }, [isOpen, dormId, fetchLocations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const url = editingLocation 
        ? `http://localhost:3001/nearby-locations/${editingLocation.id}`
        : `http://localhost:3001/dorms/${dormId}/nearby-locations`;
      
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        await fetchLocations();
        resetForm();
        alert(editingLocation ? 'แก้ไขสถานที่ใกล้เคียงสำเร็จ' : 'เพิ่มสถานที่ใกล้เคียงสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setForm({
      location_type: location.location_type,
      location_name: location.location_name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      description: location.description || '',
      distance_km: location.distance_km?.toString() || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (locationId) => {
    if (!confirm('ต้องการลบสถานที่นี้หรือไม่?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:3001/nearby-locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchLocations();
        alert('ลบสถานที่สำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const resetForm = () => {
    setForm({
      location_type: 'university',
      location_name: '',
      latitude: '',
      longitude: '',
      description: '',
      distance_km: ''
    });
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้');
        }
      );
    } else {
      alert('เบราว์เซอร์ไม่รองรับการหาตำแหน่ง');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaMapMarkerAlt className="text-blue-500" />
            จัดการสถานที่ใกล้เคียง
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* ปุ่มเพิ่มสถานที่ใหม่ */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <FaPlus /> เพิ่มสถานที่ใหม่
            </button>
          </div>

          {/* ฟอร์มเพิ่ม/แก้ไขสถานที่ */}
          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingLocation ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}
              </h3>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ประเภทสถานที่</label>
                  <select
                    value={form.location_type}
                    onChange={(e) => setForm({...form, location_type: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    {Object.entries(LOCATION_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อสถานที่</label>
                  <input
                    type="text"
                    value={form.location_name}
                    onChange={(e) => setForm({...form, location_name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="เช่น มหาวิทยาลัยมหาสารคาม"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ละติจูด (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({...form, latitude: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="16.246825"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ลองติจูด (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({...form, longitude: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="103.255025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ระยะทาง (กิโลเมตร)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.distance_km}
                    onChange={(e) => setForm({...form, distance_km: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="1.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="รายละเอียดเพิ่มเติม"
                  />
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <FaMapMarkerAlt /> ใช้ตำแหน่งปัจจุบัน
                  </button>
                  
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <FaSave /> บันทึก
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* รายการสถานที่ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">สถานที่ใกล้เคียงทั้งหมด</h3>
            
            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : locations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ยังไม่มีสถานที่ใกล้เคียง</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((location) => {
                  const LocationIcon = LOCATION_TYPES[location.location_type]?.icon || FaMapMarkerAlt;
                  const colorClass = LOCATION_TYPES[location.location_type]?.color || 'bg-gray-500';
                  
                  return (
                    <div key={location.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`${colorClass} text-white p-2 rounded-full`}>
                            <LocationIcon size={16} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{location.location_name}</h4>
                            <span className="text-sm text-gray-500">
                              {LOCATION_TYPES[location.location_type]?.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(location.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>ตำแหน่ง:</strong> {location.latitude}, {location.longitude}</p>
                        {location.distance_km && (
                          <p><strong>ระยะทาง:</strong> {location.distance_km} กม.</p>
                        )}
                        {location.description && (
                          <p><strong>รายละเอียด:</strong> {location.description}</p>
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
    </div>
  );
}

export default NearbyLocationManager;
