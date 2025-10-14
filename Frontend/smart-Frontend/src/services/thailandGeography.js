/**
 * Thailand Geography API Service
 * ใช้ข้อมูลจาก thailand-geography-data (GitHub)
 * ข้อมูลครบถ้วน: 77 จังหวัด, 928 อำเภอ, 7,436 ตำบล
 */

const BASE_URL = 'https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/main/src';

// Cache สำหรับเก็บข้อมูลที่ดึงมาแล้ว
let cachedProvinces = null;
let cachedAmphures = null;
let cachedTambons = null;

/**
 * ดึงข้อมูลจังหวัดทั้งหมด (77 จังหวัด)
 * @returns {Promise<Array>} รายการจังหวัด
 */
export const getProvinces = async () => {
  if (cachedProvinces) {
    return cachedProvinces;
  }

  try {
    const response = await fetch(`${BASE_URL}/provinces.json`);
    if (!response.ok) throw new Error('Failed to fetch provinces');
    
    const data = await response.json();
    
    // แปลง format จาก GitHub API ให้ตรงกับที่ใช้ในโปรเจค
    cachedProvinces = data.map(province => ({
      id: province.id,
      name_th: province.provinceNameTh,
      name_en: province.provinceNameEn,
      code: province.provinceCode
    }));
    
    return cachedProvinces;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    // Fallback: ใช้ข้อมูล static
    return getFallbackProvinces();
  }
};

/**
 * ดึงข้อมูลอำเภอทั้งหมด (928 อำเภอ)
 * @param {number} provinceId - รหัสจังหวัด (ถ้าต้องการกรอง)
 * @returns {Promise<Array>} รายการอำเภอ
 */
export const getAmphures = async (provinceId = null) => {
  if (!cachedAmphures) {
    try {
      const response = await fetch(`${BASE_URL}/districts.json`);
      if (!response.ok) throw new Error('Failed to fetch amphures');
      
      const data = await response.json();
      
      cachedAmphures = data.map(amphure => ({
        id: amphure.id,
        name_th: amphure.districtNameTh,
        name_en: amphure.districtNameEn,
        province_id: amphure.id, // ใช้ id เป็น reference
        province_code: amphure.provinceCode,
        code: amphure.districtCode
      }));
    } catch (error) {
      console.error('Error fetching amphures:', error);
      cachedAmphures = getFallbackAmphures();
    }
  }

  // กรองตาม province_id ถ้ามี (ใช้ provinceCode จาก dropdown)
  if (provinceId) {
    const selectedProvince = cachedProvinces?.find(p => p.id === parseInt(provinceId));
    if (selectedProvince) {
      return cachedAmphures.filter(amphure => amphure.province_code === selectedProvince.code);
    }
  }

  return cachedAmphures;
};

/**
 * ดึงข้อมูลตำบลทั้งหมด (7,436 ตำบล)
 * @param {number} amphureId - รหัสอำเภอ (ถ้าต้องการกรอง)
 * @returns {Promise<Array>} รายการตำบล
 */
export const getTambons = async (amphureId = null) => {
  if (!cachedTambons) {
    try {
      const response = await fetch(`${BASE_URL}/subdistricts.json`);
      if (!response.ok) throw new Error('Failed to fetch tambons');
      
      const data = await response.json();
      
      cachedTambons = data.map(tambon => ({
        id: tambon.id,
        name_th: tambon.subdistrictNameTh,
        name_en: tambon.subdistrictNameEn,
        amphure_id: tambon.id, // ใช้ id เป็น reference
        district_code: tambon.districtCode,
        zip_code: tambon.postalCode
      }));
    } catch (error) {
      console.error('Error fetching tambons:', error);
      cachedTambons = getFallbackTambons();
    }
  }

  // กรองตาม amphure_id ถ้ามี (ใช้ districtCode จาก dropdown)
  if (amphureId) {
    const selectedAmphure = cachedAmphures?.find(a => a.id === parseInt(amphureId));
    if (selectedAmphure) {
      return cachedTambons.filter(tambon => tambon.district_code === selectedAmphure.code);
    }
  }

  return cachedTambons;
};

/**
 * ค้นหาจังหวัดจากชื่อ
 * @param {string} query - คำค้นหา
 * @returns {Promise<Array>} รายการจังหวัดที่ตรงกับคำค้นหา
 */
export const searchProvinces = async (query) => {
  const provinces = await getProvinces();
  const searchTerm = query.toLowerCase();
  
  return provinces.filter(province => 
    province.name_th.toLowerCase().includes(searchTerm) ||
    province.name_en.toLowerCase().includes(searchTerm)
  );
};

/**
 * ค้นหาอำเภอจากชื่อ
 * @param {string} query - คำค้นหา
 * @param {number} provinceId - รหัสจังหวัด (ถ้าต้องการจำกัดขอบเขต)
 * @returns {Promise<Array>} รายการอำเภอที่ตรงกับคำค้นหา
 */
export const searchAmphures = async (query, provinceId = null) => {
  const amphures = await getAmphures(provinceId);
  const searchTerm = query.toLowerCase();
  
  return amphures.filter(amphure => 
    amphure.name_th.toLowerCase().includes(searchTerm) ||
    amphure.name_en.toLowerCase().includes(searchTerm)
  );
};

/**
 * ค้นหาตำบลจากชื่อ
 * @param {string} query - คำค้นหา
 * @param {number} amphureId - รหัสอำเภอ (ถ้าต้องการจำกัดขอบเขต)
 * @returns {Promise<Array>} รายการตำบลที่ตรงกับคำค้นหา
 */
export const searchTambons = async (query, amphureId = null) => {
  const tambons = await getTambons(amphureId);
  const searchTerm = query.toLowerCase();
  
  return tambons.filter(tambon => 
    tambon.name_th.toLowerCase().includes(searchTerm) ||
    tambon.name_en.toLowerCase().includes(searchTerm)
  );
};

/**
 * ล้าง Cache (ใช้เมื่อต้องการ refresh ข้อมูล)
 */
export const clearCache = () => {
  cachedProvinces = null;
  cachedAmphures = null;
  cachedTambons = null;
};

// ============================================
// Fallback Data (ใช้เมื่อ API ไม่ตอบสนอง)
// ============================================

const getFallbackProvinces = () => [
  { id: 1, name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok', code: '10', geography_id: 2 },
  { id: 2, name_th: 'สมุทรปราการ', name_en: 'Samut Prakan', code: '11', geography_id: 2 },
  { id: 3, name_th: 'นนทบุรี', name_en: 'Nonthaburi', code: '12', geography_id: 2 },
  { id: 4, name_th: 'ปทุมธานี', name_en: 'Pathum Thani', code: '13', geography_id: 2 },
  { id: 5, name_th: 'พระนครศรีอยุธยา', name_en: 'Phra Nakhon Si Ayutthaya', code: '14', geography_id: 2 },
  { id: 6, name_th: 'อ่างทอง', name_en: 'Ang Thong', code: '15', geography_id: 2 },
  { id: 7, name_th: 'ลพบุรี', name_en: 'Loburi', code: '16', geography_id: 2 },
  { id: 8, name_th: 'สิงห์บุรี', name_en: 'Sing Buri', code: '17', geography_id: 2 },
  { id: 9, name_th: 'ชัยนาท', name_en: 'Chai Nat', code: '18', geography_id: 2 },
  { id: 10, name_th: 'สระบุรี', name_en: 'Saraburi', code: '19', geography_id: 2 },
  { id: 11, name_th: 'ชลบุรี', name_en: 'Chon Buri', code: '20', geography_id: 5 },
  { id: 12, name_th: 'ระยอง', name_en: 'Rayong', code: '21', geography_id: 5 },
  { id: 13, name_th: 'จันทบุรี', name_en: 'Chanthaburi', code: '22', geography_id: 5 },
  { id: 14, name_th: 'ตราด', name_en: 'Trat', code: '23', geography_id: 5 },
  { id: 15, name_th: 'ฉะเชิงเทรา', name_en: 'Chachoengsao', code: '24', geography_id: 5 },
  { id: 16, name_th: 'ปราจีนบุรี', name_en: 'Prachin Buri', code: '25', geography_id: 5 },
  { id: 17, name_th: 'นครนายก', name_en: 'Nakhon Nayok', code: '26', geography_id: 2 },
  { id: 18, name_th: 'สระแก้ว', name_en: 'Sa Kaeo', code: '27', geography_id: 5 },
  { id: 19, name_th: 'นครราชสีมา', name_en: 'Nakhon Ratchasima', code: '30', geography_id: 3 },
  { id: 20, name_th: 'บุรีรัมย์', name_en: 'Buri Ram', code: '31', geography_id: 3 },
  { id: 21, name_th: 'สุรินทร์', name_en: 'Surin', code: '32', geography_id: 3 },
  { id: 22, name_th: 'ศรีสะเกษ', name_en: 'Si Sa Ket', code: '33', geography_id: 3 },
  { id: 23, name_th: 'อุบลราชธานี', name_en: 'Ubon Ratchathani', code: '34', geography_id: 3 },
  { id: 24, name_th: 'ยโสธร', name_en: 'Yasothon', code: '35', geography_id: 3 },
  { id: 25, name_th: 'ชัยภูมิ', name_en: 'Chaiyaphum', code: '36', geography_id: 3 },
  { id: 26, name_th: 'อำนาจเจริญ', name_en: 'Amnat Charoen', code: '37', geography_id: 3 },
  { id: 27, name_th: 'หนองบัวลำภู', name_en: 'Nong Bua Lam Phu', code: '39', geography_id: 3 },
  { id: 28, name_th: 'ขอนแก่น', name_en: 'Khon Kaen', code: '40', geography_id: 3 },
  { id: 29, name_th: 'อุดรธานี', name_en: 'Udon Thani', code: '41', geography_id: 3 },
  { id: 30, name_th: 'เลย', name_en: 'Loei', code: '42', geography_id: 3 },
  { id: 31, name_th: 'หนองคาย', name_en: 'Nong Khai', code: '43', geography_id: 3 },
  { id: 32, name_th: 'มหาสารคาม', name_en: 'Maha Sarakham', code: '44', geography_id: 3 },
  { id: 33, name_th: 'ร้อยเอ็ด', name_en: 'Roi Et', code: '45', geography_id: 3 },
  { id: 34, name_th: 'กาฬสินธุ์', name_en: 'Kalasin', code: '46', geography_id: 3 },
  { id: 35, name_th: 'สกลนคร', name_en: 'Sakon Nakhon', code: '47', geography_id: 3 },
  { id: 36, name_th: 'นครพนม', name_en: 'Nakhon Phanom', code: '48', geography_id: 3 },
  { id: 37, name_th: 'มุกดาหาร', name_en: 'Mukdahan', code: '49', geography_id: 3 },
  { id: 38, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', code: '50', geography_id: 1 },
  { id: 39, name_th: 'ลำพูน', name_en: 'Lamphun', code: '51', geography_id: 1 },
  { id: 40, name_th: 'ลำปาง', name_en: 'Lampang', code: '52', geography_id: 1 },
  { id: 41, name_th: 'อุตรดิตถ์', name_en: 'Uttaradit', code: '53', geography_id: 1 },
  { id: 42, name_th: 'แพร่', name_en: 'Phrae', code: '54', geography_id: 1 },
  { id: 43, name_th: 'น่าน', name_en: 'Nan', code: '55', geography_id: 1 },
  { id: 44, name_th: 'พะเยา', name_en: 'Phayao', code: '56', geography_id: 1 },
  { id: 45, name_th: 'เชียงราย', name_en: 'Chiang Rai', code: '57', geography_id: 1 },
  { id: 46, name_th: 'แม่ฮ่องสอน', name_en: 'Mae Hong Son', code: '58', geography_id: 1 },
  { id: 47, name_th: 'นครสวรรค์', name_en: 'Nakhon Sawan', code: '60', geography_id: 2 },
  { id: 48, name_th: 'อุทัยธานี', name_en: 'Uthai Thani', code: '61', geography_id: 2 },
  { id: 49, name_th: 'กำแพงเพชร', name_en: 'Kamphaeng Phet', code: '62', geography_id: 2 },
  { id: 50, name_th: 'ตาก', name_en: 'Tak', code: '63', geography_id: 4 },
  { id: 51, name_th: 'สุโขทัย', name_en: 'Sukhothai', code: '64', geography_id: 2 },
  { id: 52, name_th: 'พิษณุโลก', name_en: 'Phitsanulok', code: '65', geography_id: 2 },
  { id: 53, name_th: 'พิจิตร', name_en: 'Phichit', code: '66', geography_id: 2 },
  { id: 54, name_th: 'เพชรบูรณ์', name_en: 'Phetchabun', code: '67', geography_id: 2 },
  { id: 55, name_th: 'ราชบุรี', name_en: 'Ratchaburi', code: '70', geography_id: 4 },
  { id: 56, name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi', code: '71', geography_id: 4 },
  { id: 57, name_th: 'สุพรรณบุรี', name_en: 'Suphan Buri', code: '72', geography_id: 2 },
  { id: 58, name_th: 'นครปฐม', name_en: 'Nakhon Pathom', code: '73', geography_id: 2 },
  { id: 59, name_th: 'สมุทรสาคร', name_en: 'Samut Sakhon', code: '74', geography_id: 2 },
  { id: 60, name_th: 'สมุทรสงคราม', name_en: 'Samut Songkhram', code: '75', geography_id: 2 },
  { id: 61, name_th: 'เพชรบุรี', name_en: 'Phetchaburi', code: '76', geography_id: 4 },
  { id: 62, name_th: 'ประจวบคีรีขันธ์', name_en: 'Prachuap Khiri Khan', code: '77', geography_id: 4 },
  { id: 63, name_th: 'นครศรีธรรมราช', name_en: 'Nakhon Si Thammarat', code: '80', geography_id: 6 },
  { id: 64, name_th: 'กระบี่', name_en: 'Krabi', code: '81', geography_id: 6 },
  { id: 65, name_th: 'พังงา', name_en: 'Phangnga', code: '82', geography_id: 6 },
  { id: 66, name_th: 'ภูเก็ต', name_en: 'Phuket', code: '83', geography_id: 6 },
  { id: 67, name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani', code: '84', geography_id: 6 },
  { id: 68, name_th: 'ระนอง', name_en: 'Ranong', code: '85', geography_id: 6 },
  { id: 69, name_th: 'ชุมพร', name_en: 'Chumphon', code: '86', geography_id: 6 },
  { id: 70, name_th: 'สงขลา', name_en: 'Songkhla', code: '90', geography_id: 6 },
  { id: 71, name_th: 'สตูล', name_en: 'Satun', code: '91', geography_id: 6 },
  { id: 72, name_th: 'ตรัง', name_en: 'Trang', code: '92', geography_id: 6 },
  { id: 73, name_th: 'พัทลุง', name_en: 'Phatthalung', code: '93', geography_id: 6 },
  { id: 74, name_th: 'ปัตตานี', name_en: 'Pattani', code: '94', geography_id: 6 },
  { id: 75, name_th: 'ยะลา', name_en: 'Yala', code: '95', geography_id: 6 },
  { id: 76, name_th: 'นราธิวาส', name_en: 'Narathiwat', code: '96', geography_id: 6 },
  { id: 77, name_th: 'บึงกาฬ', name_en: 'buogkan', code: '38', geography_id: 3 }
];

const getFallbackAmphures = () => [
  // อำเภอในกรุงเทพฯ (50 เขต)
  { id: 1001, name_th: 'พระนคร', name_en: 'Phra Nakhon', province_id: 1, code: '1001' },
  { id: 1002, name_th: 'ดุสิต', name_en: 'Dusit', province_id: 1, code: '1002' },
  { id: 1003, name_th: 'หนองจอก', name_en: 'Nong Chok', province_id: 1, code: '1003' },
  { id: 1004, name_th: 'บางรัก', name_en: 'Bang Rak', province_id: 1, code: '1004' },
  { id: 1005, name_th: 'บางเขน', name_en: 'Bang Khen', province_id: 1, code: '1005' },
  // อำเภอมหาสารคาม
  { id: 3201, name_th: 'เมืองมหาสารคาม', name_en: 'Mueang Maha Sarakham', province_id: 32, code: '4401' },
  { id: 3202, name_th: 'กันทรวิชัย', name_en: 'Kantharawichai', province_id: 32, code: '4402' },
  { id: 3203, name_th: 'แกดำ', name_en: 'Kae Dam', province_id: 32, code: '4403' },
  { id: 3204, name_th: 'โกสุมพิสัย', name_en: 'Kosum Phisai', province_id: 32, code: '4404' },
  { id: 3205, name_th: 'พยัคฆภูมิพิสัย', name_en: 'Phayakkhaphum Phisai', province_id: 32, code: '4405' }
];

const getFallbackTambons = () => [
  // ตำบลในเขตพระนคร
  { id: 100101, name_th: 'พระบรมมหาราชวัง', name_en: 'Phra Borom Maha Ratchawang', amphure_id: 1001, zip_code: '10200' },
  { id: 100102, name_th: 'วังบูรพาภิรมย์', name_en: 'Wang Burapha Phirom', amphure_id: 1001, zip_code: '10200' },
  // ตำบลในเมืองมหาสารคาม
  { id: 320101, name_th: 'ตลาด', name_en: 'Talat', amphure_id: 3201, zip_code: '44000' },
  { id: 320102, name_th: 'เขวา', name_en: 'Khwao', amphure_id: 3201, zip_code: '44000' },
  { id: 320103, name_th: 'ท่าตูม', name_en: 'Tha Tum', amphure_id: 3201, zip_code: '44000' },
  { id: 320104, name_th: 'แก่งเลิงจาน', name_en: 'Kaeng Loeng Chan', amphure_id: 3201, zip_code: '44000' },
  { id: 320105, name_th: 'ดอนหว่าน', name_en: 'Don Wan', amphure_id: 3201, zip_code: '44000' }
];
