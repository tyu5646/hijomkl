// ข้อมูลจังหวัด อำเภอ ตำบล สำหรับประเทศไทย
// เนื่องจาก API เดิมไม่ทำงาน จึงสร้างข้อมูลแบบ static

export const provinces = [
  { id: 1, name_th: 'กรุงเทพมหานคร' },
  { id: 2, name_th: 'กระบี่' },
  { id: 3, name_th: 'กาญจนบุรี' },
  { id: 4, name_th: 'กาฬสินธุ์' },
  { id: 5, name_th: 'กำแพงเพชร' },
  { id: 6, name_th: 'ขอนแก่น' },
  { id: 7, name_th: 'จันทบุรี' },
  { id: 8, name_th: 'ฉะเชิงเทรา' },
  { id: 9, name_th: 'ชลบุรี' },
  { id: 10, name_th: 'ชัยนาท' },
  { id: 11, name_th: 'ชัยภูมิ' },
  { id: 12, name_th: 'ชุมพร' },
  { id: 13, name_th: 'เชียงราย' },
  { id: 14, name_th: 'เชียงใหม่' },
  { id: 15, name_th: 'ตรัง' },
  { id: 16, name_th: 'ตราด' },
  { id: 17, name_th: 'ตาก' },
  { id: 18, name_th: 'นครนายก' },
  { id: 19, name_th: 'นครปฐม' },
  { id: 20, name_th: 'นครพนม' },
  { id: 21, name_th: 'นครราชสีมา' },
  { id: 22, name_th: 'นครศรีธรรมราช' },
  { id: 23, name_th: 'นครสวรรค์' },
  { id: 24, name_th: 'นนทบุรี' },
  { id: 25, name_th: 'นราธิวาส' },
  { id: 26, name_th: 'น่าน' },
  { id: 27, name_th: 'บุรีรัมย์' },
  { id: 28, name_th: 'บึงกาฬ' },
  { id: 29, name_th: 'ปทุมธานี' },
  { id: 30, name_th: 'ประจวบคีรีขันธ์' },
  { id: 31, name_th: 'ปราจีนบุรี' },
  { id: 32, name_th: 'ปัตตานี' },
  { id: 33, name_th: 'พระนครศรีอยุธยา' },
  { id: 34, name_th: 'พะเยา' },
  { id: 35, name_th: 'พังงา' },
  { id: 36, name_th: 'พัทลุง' },
  { id: 37, name_th: 'พิจิตร' },
  { id: 38, name_th: 'พิษณุโลก' },
  { id: 39, name_th: 'เพชรบุรี' },
  { id: 40, name_th: 'เพชรบูรณ์' },
  { id: 41, name_th: 'แพร่' },
  { id: 42, name_th: 'ภูเก็ต' },
  { id: 43, name_th: 'มหาสารคาม' },
  { id: 44, name_th: 'มุกดาหาร' },
  { id: 45, name_th: 'แม่ฮ่องสอน' },
  { id: 46, name_th: 'ยะลา' },
  { id: 47, name_th: 'ยโซธร' },
  { id: 48, name_th: 'ร้อยเอ็ด' },
  { id: 49, name_th: 'ระนอง' },
  { id: 50, name_th: 'ระยอง' },
  { id: 51, name_th: 'ราชบุรี' },
  { id: 52, name_th: 'ลพบุรี' },
  { id: 53, name_th: 'ลำปาง' },
  { id: 54, name_th: 'ลำพูน' },
  { id: 55, name_th: 'เลย' },
  { id: 56, name_th: 'ศรีสะเกษ' },
  { id: 57, name_th: 'สกลนคร' },
  { id: 58, name_th: 'สงขลา' },
  { id: 59, name_th: 'สตูล' },
  { id: 60, name_th: 'สมุทรปราการ' },
  { id: 61, name_th: 'สมุทรสงคราม' },
  { id: 62, name_th: 'สมุทรสาคร' },
  { id: 63, name_th: 'สระแก้ว' },
  { id: 64, name_th: 'สระบุรี' },
  { id: 65, name_th: 'สิงห์บุรี' },
  { id: 66, name_th: 'สุโขทัย' },
  { id: 67, name_th: 'สุพรรณบุรี' },
  { id: 68, name_th: 'สุราษฎร์ธานี' },
  { id: 69, name_th: 'สุรินทร์' },
  { id: 70, name_th: 'หนองคาย' },
  { id: 71, name_th: 'หนองบัวลำภู' },
  { id: 72, name_th: 'อ่างทอง' },
  { id: 73, name_th: 'อำนาจเจริญ' },
  { id: 74, name_th: 'อุดรธานี' },
  { id: 75, name_th: 'อุตราดิตถ์' },
  { id: 76, name_th: 'อุทัยธานี' },
  { id: 77, name_th: 'อุบลราชธานี' }
];

// ตัวอย่างอำเภอสำหรับจังหวัดที่ใช้บ่อย
export const amphures = [
  // กรุงเทพมหานคร
  { id: 1001, province_id: 1, name_th: 'พระนคร' },
  { id: 1002, province_id: 1, name_th: 'ดุสิต' },
  { id: 1003, province_id: 1, name_th: 'หนองจอก' },
  { id: 1004, province_id: 1, name_th: 'บางรัก' },
  { id: 1005, province_id: 1, name_th: 'บางเขน' },
  { id: 1006, province_id: 1, name_th: 'บางกะปิ' },
  { id: 1007, province_id: 1, name_th: 'ปทุมวัน' },
  { id: 1008, province_id: 1, name_th: 'ป้อมปราบศัตรูพ่าย' },
  { id: 1009, province_id: 1, name_th: 'พระโขนง' },
  { id: 1010, province_id: 1, name_th: 'มีนบุรี' },
  { id: 1011, province_id: 1, name_th: 'ลาดกระบัง' },
  { id: 1012, province_id: 1, name_th: 'ยานนาวา' },
  { id: 1013, province_id: 1, name_th: 'สัมพันธวงศ์' },
  { id: 1014, province_id: 1, name_th: 'พญาไท' },
  { id: 1015, province_id: 1, name_th: 'ธนบุรี' },
  { id: 1016, province_id: 1, name_th: 'บางกอกใหญ่' },
  { id: 1017, province_id: 1, name_th: 'ห้วยขวง' },
  { id: 1018, province_id: 1, name_th: 'คลองสาน' },
  { id: 1019, province_id: 1, name_th: 'ตลิ่งชัน' },
  { id: 1020, province_id: 1, name_th: 'บางกอกน้อย' },
  { id: 1021, province_id: 1, name_th: 'บางขุนเทียน' },
  { id: 1022, province_id: 1, name_th: 'ภาษีเจริญ' },
  { id: 1023, province_id: 1, name_th: 'หนองแขม' },
  { id: 1024, province_id: 1, name_th: 'ราษฎร์บูรณะ' },
  { id: 1025, province_id: 1, name_th: 'บางพลัด' },
  { id: 1026, province_id: 1, name_th: 'ดินแดง' },
  { id: 1027, province_id: 1, name_th: 'บึงกุ่ม' },
  { id: 1028, province_id: 1, name_th: 'สาทร' },
  { id: 1029, province_id: 1, name_th: 'บางซื่อ' },
  { id: 1030, province_id: 1, name_th: 'จตุจักร' },
  { id: 1031, province_id: 1, name_th: 'บางคอแหลม' },
  { id: 1032, province_id: 1, name_th: 'ประเวศ' },
  { id: 1033, province_id: 1, name_th: 'คลองเตย' },
  { id: 1034, province_id: 1, name_th: 'สวนหลวง' },
  { id: 1035, province_id: 1, name_th: 'จอมทอง' },
  { id: 1036, province_id: 1, name_th: 'ดอนเมือง' },
  { id: 1037, province_id: 1, name_th: 'ราชเทวี' },
  { id: 1038, province_id: 1, name_th: 'ลาดพร้าว' },
  { id: 1039, province_id: 1, name_th: 'วัฒนา' },
  { id: 1040, province_id: 1, name_th: 'บางแค' },
  { id: 1041, province_id: 1, name_th: 'หลักสี่' },
  { id: 1042, province_id: 1, name_th: 'สายไหม' },
  { id: 1043, province_id: 1, name_th: 'คันนายาว' },
  { id: 1044, province_id: 1, name_th: 'สะพานพุทธ' },
  { id: 1045, province_id: 1, name_th: 'วังทองหลาง' },
  { id: 1046, province_id: 1, name_th: 'คลองสามวา' },
  { id: 1047, province_id: 1, name_th: 'บางนา' },
  { id: 1048, province_id: 1, name_th: 'ทวีวัฒนา' },
  { id: 1049, province_id: 1, name_th: 'ทุ่งครุ' },
  { id: 1050, province_id: 1, name_th: 'บางบอน' },

  // นนทบุรี
  { id: 2401, province_id: 24, name_th: 'เมืองนนทบุรี' },
  { id: 2402, province_id: 24, name_th: 'บางกรวย' },
  { id: 2403, province_id: 24, name_th: 'บงใหญ่' },
  { id: 2404, province_id: 24, name_th: 'บางยาง' },
  { id: 2405, province_id: 24, name_th: 'ปากเกร็ด' },
  { id: 2406, province_id: 24, name_th: 'ไทรน้อย' },

  // ปทุมธานี
  { id: 2901, province_id: 29, name_th: 'เมืองปทุมธานี' },
  { id: 2902, province_id: 29, name_th: 'คลองหลวง' },
  { id: 2903, province_id: 29, name_th: 'ธัญบุรี' },
  { id: 2904, province_id: 29, name_th: 'หนองเสือ' },
  { id: 2905, province_id: 29, name_th: 'ลาดหลุมแก้ว' },
  { id: 2906, province_id: 29, name_th: 'ลำลูกกา' },
  { id: 2907, province_id: 29, name_th: 'สามโคก' },

  // ชลบุรี
  { id: 901, province_id: 9, name_th: 'เมืองชลบุรี' },
  { id: 902, province_id: 9, name_th: 'บางละมุง' },
  { id: 903, province_id: 9, name_th: 'พานทอง' },
  { id: 904, province_id: 9, name_th: 'พนัสนิคม' },
  { id: 905, province_id: 9, name_th: 'ศรีราชา' },
  { id: 906, province_id: 9, name_th: 'เกาะสีชัง' },
  { id: 907, province_id: 9, name_th: 'บ่อทอง' },
  { id: 908, province_id: 9, name_th: 'บ้านบึง' },
  { id: 909, province_id: 9, name_th: 'หนองใหญ่' },
  { id: 910, province_id: 9, name_th: 'สัตหีบ' },
  { id: 911, province_id: 9, name_th: 'เกาะจันทร์' },

  // เพิ่มอำเภอสำหรับจังหวัดอื่นๆ
  // กระบี่
  { id: 201, province_id: 2, name_th: 'เมืองกระบี่' },
  { id: 202, province_id: 2, name_th: 'เขาพนม' },
  { id: 203, province_id: 2, name_th: 'เกาะลันตา' },
  { id: 204, province_id: 2, name_th: 'คลองท่อม' },
  { id: 205, province_id: 2, name_th: 'อ่าวลึก' },
  { id: 206, province_id: 2, name_th: 'ปลายพระยา' },
  { id: 207, province_id: 2, name_th: 'ลำทับ' },
  { id: 208, province_id: 2, name_th: 'เหนือคลอง' },

  // กาญจนบุรี
  { id: 301, province_id: 3, name_th: 'เมืองกาญจนบุรี' },
  { id: 302, province_id: 3, name_th: 'ไทรโยค' },
  { id: 303, province_id: 3, name_th: 'บ่อพลอย' },
  { id: 304, province_id: 3, name_th: 'ศรีสวัสดิ์' },
  { id: 305, province_id: 3, name_th: 'ท่ามะกา' },
  { id: 306, province_id: 3, name_th: 'ท่าม่วง' },
  { id: 307, province_id: 3, name_th: 'ทองผาภูมิ' },
  { id: 308, province_id: 3, name_th: 'สังขละบุรี' },

  // เชียงใหม่
  { id: 1401, province_id: 14, name_th: 'เมืองเชียงใหม่' },
  { id: 1402, province_id: 14, name_th: 'ดอยสะเก็ด' },
  { id: 1403, province_id: 14, name_th: 'แม่แตง' },
  { id: 1404, province_id: 14, name_th: 'เชียงดาว' },
  { id: 1405, province_id: 14, name_th: 'ฝาง' },
  { id: 1406, province_id: 14, name_th: 'ไชยปราการ' },
  { id: 1407, province_id: 14, name_th: 'แม่แจ่ม' },
  { id: 1408, province_id: 14, name_th: 'แม่วง' },

  // ภูเก็ต
  { id: 4201, province_id: 42, name_th: 'เมืองภูเก็ต' },
  { id: 4202, province_id: 42, name_th: 'กะทู้' },
  { id: 4203, province_id: 42, name_th: 'ถลาง' },

  // นครราชสีมา
  { id: 2101, province_id: 21, name_th: 'เมืองนครราชสีมา' },
  { id: 2102, province_id: 21, name_th: 'ขามทะเลสอ' },
  { id: 2103, province_id: 21, name_th: 'คง' },
  { id: 2104, province_id: 21, name_th: 'บัวใหญ่' },
  { id: 2105, province_id: 21, name_th: 'ประทาย' },
  { id: 2106, province_id: 21, name_th: 'ปากช่อง' }
];

// ตัวอย่างตำบลสำหรับอำเภอที่ใช้บ่อย
export const tambons = [
  // กรุงเทพมหานคร - เขตพระนคร
  { id: 100101, amphure_id: 1001, name_th: 'พระบรมมหาราชวัง', zip_code: '10200' },
  { id: 100102, amphure_id: 1001, name_th: 'วัดราชบพิธ', zip_code: '10200' },
  { id: 100103, amphure_id: 1001, name_th: 'สำราญราช', zip_code: '10200' },
  { id: 100104, amphure_id: 1001, name_th: 'ศิริราช', zip_code: '10700' },
  { id: 100105, amphure_id: 1001, name_th: 'บวรนิเวศ', zip_code: '10200' },
  { id: 100106, amphure_id: 1001, name_th: 'ตลาดยอด', zip_code: '10200' },
  { id: 100107, amphure_id: 1001, name_th: 'ชนะสงคราม', zip_code: '10200' },
  { id: 100108, amphure_id: 1001, name_th: 'บางยี่ขัน', zip_code: '10600' },
  { id: 100109, amphure_id: 1001, name_th: 'วัดโบสถ์', zip_code: '10200' },
  { id: 100110, amphure_id: 1001, name_th: 'หลวงพ่อโต', zip_code: '10600' },
  { id: 100111, amphure_id: 1001, name_th: 'วัดราชนาดดา', zip_code: '10200' },
  { id: 100112, amphure_id: 1001, name_th: 'เสาชิงช้า', zip_code: '10200' },

  // เขตดุสิต
  { id: 100201, amphure_id: 1002, name_th: 'ดุสิต', zip_code: '10300' },
  { id: 100202, amphure_id: 1002, name_th: 'วชิรพยาบาล', zip_code: '10300' },
  { id: 100203, amphure_id: 1002, name_th: 'สวนจิตรลดา', zip_code: '10300' },
  { id: 100204, amphure_id: 1002, name_th: 'สี่แยกมหานาค', zip_code: '10300' },
  { id: 100205, amphure_id: 1002, name_th: 'ถนนนครไชยศรี', zip_code: '10300' },

  // เขตบางรัก
  { id: 100401, amphure_id: 1004, name_th: 'มหาพฤฒาราม', zip_code: '10500' },
  { id: 100402, amphure_id: 1004, name_th: 'สีลม', zip_code: '10500' },
  { id: 100403, amphure_id: 1004, name_th: 'สุริยวงศ์', zip_code: '10500' },
  { id: 100404, amphure_id: 1004, name_th: 'บางรัก', zip_code: '10500' },

  // เขตปทุมวัน
  { id: 100701, amphure_id: 1007, name_th: 'ปทุมวัน', zip_code: '10330' },
  { id: 100702, amphure_id: 1007, name_th: 'ลุมพินี', zip_code: '10330' },
  { id: 100703, amphure_id: 1007, name_th: 'รองเมือง', zip_code: '10330' },
  { id: 100704, amphure_id: 1007, name_th: 'วังใหม่', zip_code: '10330' },

  // นนทบุรี - เมืองนนทบุรี
  { id: 240101, amphure_id: 2401, name_th: 'สวนใหญ่', zip_code: '11000' },
  { id: 240102, amphure_id: 2401, name_th: 'ตลาดขวัญ', zip_code: '11000' },
  { id: 240103, amphure_id: 2401, name_th: 'บางเขน', zip_code: '11000' },
  { id: 240104, amphure_id: 2401, name_th: 'บางกระสอ', zip_code: '11000' },
  { id: 240105, amphure_id: 2401, name_th: 'ท่าทราย', zip_code: '11000' },
  { id: 240106, amphure_id: 2401, name_th: 'บางสี่ทอง', zip_code: '11000' },
  { id: 240107, amphure_id: 2401, name_th: 'บางกรวย', zip_code: '11130' },

  // ปทุมธานี - เมืองปทุมธานี
  { id: 290101, amphure_id: 2901, name_th: 'บางปรอก', zip_code: '12000' },
  { id: 290102, amphure_id: 2901, name_th: 'บ้านกลาง', zip_code: '12000' },
  { id: 290103, amphure_id: 2901, name_th: 'บางพูน', zip_code: '12000' },
  { id: 290104, amphure_id: 2901, name_th: 'มหาชัย', zip_code: '12000' },
  { id: 290105, amphure_id: 2901, name_th: 'หลักหก', zip_code: '12000' },

  // ชลบุรี - เมืองชลบุรี
  { id: 90101, amphure_id: 901, name_th: 'เสม็ด', zip_code: '20000' },
  { id: 90102, amphure_id: 901, name_th: 'ชลบุรี', zip_code: '20000' },
  { id: 90103, amphure_id: 901, name_th: 'ห้วยกะปิ', zip_code: '20000' },
  { id: 90104, amphure_id: 901, name_th: 'อ่างศิลา', zip_code: '20000' },
  { id: 90105, amphure_id: 901, name_th: 'นาเกลือ', zip_code: '20000' },
  { id: 90106, amphure_id: 901, name_th: 'บางสมัคร', zip_code: '20000' },
  { id: 90107, amphure_id: 901, name_th: 'เทพประสิทธิ์', zip_code: '20000' },
  { id: 90108, amphure_id: 901, name_th: 'หนองรี', zip_code: '20000' },
  { id: 90109, amphure_id: 901, name_th: 'บ้านสวน', zip_code: '20000' },
  { id: 90110, amphure_id: 901, name_th: 'มาบโป่ง', zip_code: '20180' },
  { id: 90111, amphure_id: 901, name_th: 'ดอนหัวฬ่อ', zip_code: '20000' },
  { id: 90112, amphure_id: 901, name_th: 'บึง', zip_code: '20170' },
  { id: 90113, amphure_id: 901, name_th: 'หนองขาม', zip_code: '20000' },
  { id: 90114, amphure_id: 901, name_th: 'โบ่งข่า', zip_code: '20000' },
  { id: 90115, amphure_id: 901, name_th: 'คลองตำหรุ', zip_code: '20000' },

  // เพิ่มตำบลสำหรับอำเภอใหม่
  // กระบี่ - เมืองกระบี่
  { id: 20101, amphure_id: 201, name_th: 'ปากน้ำ', zip_code: '81000' },
  { id: 20102, amphure_id: 201, name_th: 'กระบี่ใหญ่', zip_code: '81000' },
  { id: 20103, amphure_id: 201, name_th: 'กระบี่น้อย', zip_code: '81000' },
  { id: 20104, amphure_id: 201, name_th: 'ไสไทย', zip_code: '81000' },

  // กาญจนบุรี - เมืองกาญจนบุรี
  { id: 30101, amphure_id: 301, name_th: 'ปากแพรก', zip_code: '71000' },
  { id: 30102, amphure_id: 301, name_th: 'บ้านเก่า', zip_code: '71000' },
  { id: 30103, amphure_id: 301, name_th: 'บ้านใหม่', zip_code: '71000' },
  { id: 30104, amphure_id: 301, name_th: 'ท่ามะขาม', zip_code: '71000' },

  // เชียงใหม่ - เมืองเชียงใหม่
  { id: 140101, amphure_id: 1401, name_th: 'ศรีภูมิ', zip_code: '50200' },
  { id: 140102, amphure_id: 1401, name_th: 'พระสิงห์', zip_code: '50200' },
  { id: 140103, amphure_id: 1401, name_th: 'หายยา', zip_code: '50100' },
  { id: 140104, amphure_id: 1401, name_th: 'ช้างเมื่อ', zip_code: '50300' },

  // ภูเก็ต - เมืองภูเก็ต
  { id: 420101, amphure_id: 4201, name_th: 'ตลาดใหญ่', zip_code: '83000' },
  { id: 420102, amphure_id: 4201, name_th: 'ตลาดเหนือ', zip_code: '83000' },
  { id: 420103, amphure_id: 4201, name_th: 'เกาะแก้ว', zip_code: '83000' },
  { id: 420104, amphure_id: 4201, name_th: 'รัษฎา', zip_code: '83000' },

  // นครราชสีมา - เมืองนครราชสีมา
  { id: 210101, amphure_id: 2101, name_th: 'ในเมือง', zip_code: '30000' },
  { id: 210102, amphure_id: 2101, name_th: 'โพธิ์กลาง', zip_code: '30000' },
  { id: 210103, amphure_id: 2101, name_th: 'หนองบัว', zip_code: '30000' },
  { id: 210104, amphure_id: 2101, name_th: 'สุรนารี', zip_code: '30000' }
];

// ฟังก์ชันช่วยเหลือ
export const getAmphuresByProvinceId = (provinceId) => {
  return amphures.filter(amphure => amphure.province_id === parseInt(provinceId));
};

export const getTambonsByAmphureId = (amphureId) => {
  return tambons.filter(tambon => tambon.amphure_id === parseInt(amphureId));
};

export const getProvinceById = (provinceId) => {
  return provinces.find(province => province.id === parseInt(provinceId));
};

export const getAmphureById = (amphureId) => {
  return amphures.find(amphure => amphure.id === parseInt(amphureId));
};

export const getTambonById = (tambonId) => {
  return tambons.find(tambon => tambon.id === parseInt(tambonId));
};