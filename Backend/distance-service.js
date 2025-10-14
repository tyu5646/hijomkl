const axios = require('axios');

// OpenRouteService API Key
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA2MzA3MGQ1ZWVjMDRiZDJhYmEzYzk4MjExNjgxYmZjIiwiaCI6Im11cm11cjY0In0=';

/**
 * คำนวณระยะทางระหว่าง 2 จุด ตามเส้นทางถนนจริง
 * @param {number} lat1 - Latitude จุดเริ่มต้น
 * @param {number} lon1 - Longitude จุดเริ่มต้น
 * @param {number} lat2 - Latitude จุดปลายทาง
 * @param {number} lon2 - Longitude จุดปลายทาง
 * @param {string} mode - โหมดการเดินทาง: 'foot-walking', 'driving-car', 'cycling-regular'
 * @returns {Promise<Object>} ข้อมูลระยะทางและเวลา
 */
async function calculateRoadDistance(lat1, lon1, lat2, lon2, mode = 'foot-walking') {
  try {
    console.log(`🗺️ Calculating distance: (${lat1},${lon1}) → (${lat2},${lon2}) [${mode}]`);
    
    const response = await axios.get(
      `https://api.openrouteservice.org/v2/directions/${mode}`,
      {
        params: {
          api_key: ORS_API_KEY,
          start: `${lon1},${lat1}`,  // OpenRouteService ใช้ lon,lat
          end: `${lon2},${lat2}`
        },
        timeout: 10000
      }
    );

    const route = response.data.features[0];
    const distance_m = route.properties.segments[0].distance; // เมตร
    const duration_s = route.properties.segments[0].duration; // วินาที

    const result = {
      distance_km: (distance_m / 1000).toFixed(2),
      distance_m: Math.round(distance_m),
      duration_min: Math.round(duration_s / 60),
      duration_text: formatDuration(duration_s),
      mode_th: mode === 'foot-walking' ? 'เดิน' : mode === 'driving-car' ? 'ขับรถ' : 'ปั่นจักรยาน',
      mode: mode
    };

    console.log('✅ Distance calculated:', result);
    return result;
    
  } catch (error) {
    console.error('❌ ORS API Error:', error.message);
    
    // Fallback: ใช้ Haversine (ระยะทางเส้นตรง)
    const distance_km = haversineDistance(lat1, lon1, lat2, lon2);
    return {
      distance_km: distance_km.toFixed(2),
      distance_m: Math.round(distance_km * 1000),
      duration_min: Math.round(distance_km * 12), // สมมติเดิน ~5 km/h
      duration_text: formatDuration(distance_km * 12 * 60),
      mode_th: 'โดยประมาณ (เส้นตรง)',
      mode: mode,
      isFallback: true
    };
  }
}

/**
 * คำนวณระยะทางแบบเส้นตรง (Haversine Formula)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลก (กม.)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ชม. ${minutes} นาที`;
  }
  return `${minutes} นาที`;
}

/**
 * คำนวณระยะทางระหว่างหอพัก 2 หอ
 */
async function calculateDistanceBetweenDorms(dorm1, dorm2) {
  if (!dorm1.coordinates?.[0] || !dorm2.coordinates?.[0]) {
    throw new Error('ไม่พบข้อมูลพิกัดของหอพัก');
  }

  const lat1 = parseFloat(dorm1.coordinates[0].latitude);
  const lon1 = parseFloat(dorm1.coordinates[0].longitude);
  const lat2 = parseFloat(dorm2.coordinates[0].latitude);
  const lon2 = parseFloat(dorm2.coordinates[0].longitude);

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    throw new Error('พิกัดไม่ถูกต้อง');
  }

  // คำนวณทั้ง 2 โหมด: เดิน และ ขับรถ
  const [walking, driving] = await Promise.all([
    calculateRoadDistance(lat1, lon1, lat2, lon2, 'foot-walking'),
    calculateRoadDistance(lat1, lon1, lat2, lon2, 'driving-car')
  ]);

  return {
    dorm1_name: dorm1.name,
    dorm2_name: dorm2.name,
    walking,
    driving,
    success: true
  };
}

/**
 * หาหอพักที่ใกล้ที่สุดกับสถานที่
 */
async function findNearestDormsToLocation(targetLat, targetLon, dorms, limit = 5) {
  const distances = await Promise.all(
    dorms.map(async (dorm) => {
      try {
        if (!dorm.coordinates?.[0]) return null;
        
        const lat = parseFloat(dorm.coordinates[0].latitude);
        const lon = parseFloat(dorm.coordinates[0].longitude);
        
        if (isNaN(lat) || isNaN(lon)) return null;
        
        const result = await calculateRoadDistance(targetLat, targetLon, lat, lon, 'foot-walking');
        
        return {
          dorm,
          ...result
        };
      } catch (error) {
        console.error(`Error calculating distance for dorm ${dorm.name}:`, error.message);
        return null;
      }
    })
  );

  return distances
    .filter(d => d !== null)
    .sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km))
    .slice(0, limit);
}

module.exports = {
  calculateRoadDistance,
  calculateDistanceBetweenDorms,
  findNearestDormsToLocation,
  haversineDistance
};
