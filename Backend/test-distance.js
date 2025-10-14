/**
 * ไฟล์ทดสอบระบบคำนวณระยะทาง
 * รันด้วย: node test-distance.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

// สีสำหรับ console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testDistanceBetweenDorms() {
  console.log(`\n${colors.blue}🧪 ทดสอบ API: /distance-between-dorms${colors.reset}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/distance-between-dorms`, {
      dorm1_id: 1,
      dorm2_id: 2
    });

    console.log(`${colors.green}✅ สำเร็จ!${colors.reset}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`${colors.red}❌ ล้มเหลว:${colors.reset}`, error.response?.data || error.message);
  }
}

async function testDistanceToDorm() {
  console.log(`\n${colors.blue}🧪 ทดสอบ API: /distance-to-dorm${colors.reset}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/distance-to-dorm`, {
      latitude: 16.246847,
      longitude: 103.251831,
      dorm_id: 1,
      mode: 'foot-walking'
    });

    console.log(`${colors.green}✅ สำเร็จ!${colors.reset}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`${colors.red}❌ ล้มเหลว:${colors.reset}`, error.response?.data || error.message);
  }
}

async function testChatbot() {
  console.log(`\n${colors.blue}🧪 ทดสอบ Chatbot - คำถามระยะทาง${colors.reset}`);
  
  const questions = [
    "ระยะทางระหว่างหอพักมหาสารคามกับหอพักธรรมศาสตร์เท่าไหร์",
    "หอพักมหาสารคามห่างจากหอพักธรรมศาสตร์กี่กิโล",
    "หอพักมหาสารคามกับหอพักธรรมศาสตร์ไกลกันไหม"
  ];

  for (const question of questions) {
    console.log(`\n${colors.yellow}❓ คำถาม: "${question}"${colors.reset}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/chatbot`, {
        message: question
      });

      console.log(`${colors.green}✅ คำตอบ:${colors.reset}`);
      console.log(response.data.message);
      console.log(`${colors.blue}Source: ${response.data.source}${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}❌ ล้มเหลว:${colors.reset}`, error.response?.data || error.message);
    }
  }
}

async function checkServerHealth() {
  console.log(`${colors.blue}🔍 ตรวจสอบสถานะเซิร์ฟเวอร์...${colors.reset}`);
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log(`${colors.green}✅ เซิร์ฟเวอร์ทำงานปกติ${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ เซิร์ฟเวอร์ไม่ตอบสนอง${colors.reset}`);
    console.log(`${colors.yellow}💡 กรุณาเริ่ม Backend ก่อนด้วย: cd Backend && node index.js${colors.reset}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  🧪 ทดสอบระบบคำนวณระยะทาง Smart Dorm  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}`);

  const serverOk = await checkServerHealth();
  
  if (!serverOk) {
    return;
  }

  // Test 1: Distance Between Dorms API
  await testDistanceBetweenDorms();
  
  // Test 2: Distance To Dorm API
  await testDistanceToDorm();
  
  // Test 3: Chatbot Integration
  await testChatbot();

  console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║          ✅ ทดสอบเสร็จสิ้น             ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);
}

// รันการทดสอบ
runAllTests().catch(error => {
  console.error(`${colors.red}เกิดข้อผิดพลาด:${colors.reset}`, error);
});
