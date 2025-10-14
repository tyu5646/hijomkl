/**
 * ทดสอบคำถามระยะทางที่เป็นปัญหา
 * รันด้วย: node test-specific-distance.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

// สีสำหรับ console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testSpecificQuestion() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  🧪 ทดสอบคำถามระยะทางที่มีปัญหา                           ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const testCases = [
    // คำถามที่เป็นปัญหา
    "หอดิอินฟินิตโอพิวเลนส์ห่างกับหอพักสตรีศุุภลักษณ์เท่าไหร่",
    
    // รูปแบบอื่นๆ ที่อาจใช้
    "ระยะทางระหว่างหอดิอินฟินิตโอพิวเลนส์กับหอพักสตรีศุุภลักษณ์",
    "หอ ดิอินฟินิตโอพิวเลนส์ กับ หอพัก สตรีศุุภลักษณ์ ไกลกันไหม",
    "ดิอินฟินิตโอพิวเลนส์ ห่างจาก สตรีศุุภลักษณ์ กี่กิโล",
    
    // ทดสอบกับหอพักอื่นๆ (ถ้ามี)
    "ระยะทางระหว่างหอพักมหาสารคามกับหอพักธรรมศาสตร์"
  ];

  for (let i = 0; i < testCases.length; i++) {
    const question = testCases[i];
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}📝 ทดสอบ #${i + 1}${colors.reset}`);
    console.log(`${colors.yellow}❓ คำถาม: "${question}"${colors.reset}\n`);

    try {
      const startTime = Date.now();
      const response = await axios.post(`${BASE_URL}/chatbot`, {
        message: question
      });
      const duration = Date.now() - startTime;

      console.log(`${colors.green}✅ ได้รับคำตอบ (${duration}ms):${colors.reset}`);
      console.log(`${colors.blue}┌─────────────────────────────────────────────────────────┐${colors.reset}`);
      console.log(response.data.message);
      console.log(`${colors.blue}└─────────────────────────────────────────────────────────┘${colors.reset}`);
      console.log(`${colors.cyan}📊 Source: ${response.data.source}${colors.reset}\n`);

      // ตรวจสอบว่าได้ระยะทางจริงหรือไม่
      const hasDistance = response.data.message.includes('🚶') || 
                         response.data.message.includes('🚗') ||
                         response.data.message.includes('กม.');
      
      if (hasDistance) {
        console.log(`${colors.green}✓ ระบบคำนวณระยะทางสำเร็จ!${colors.reset}\n`);
      } else if (response.data.message.includes('ไม่พบชื่อหอพัก') || 
                 response.data.message.includes('พบหอพัก')) {
        console.log(`${colors.yellow}⚠️ ระบบตอบกลับแต่ยังไม่ได้คำนวณระยะทาง${colors.reset}\n`);
      } else {
        console.log(`${colors.red}✗ คำตอบไม่มีข้อมูลระยะทาง${colors.reset}\n`);
      }

    } catch (error) {
      console.log(`${colors.red}❌ เกิดข้อผิดพลาด:${colors.reset}`);
      console.log(error.response?.data || error.message);
      console.log();
    }
  }

  console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  ✅ การทดสอบเสร็จสิ้น                                       ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
}

async function checkDormNames() {
  console.log(`${colors.blue}🔍 ตรวจสอบชื่อหอพักในระบบ...${colors.reset}\n`);

  try {
    const response = await axios.get(`${BASE_URL}/dorms`);
    const dorms = response.data;

    console.log(`${colors.green}📊 พบหอพักทั้งหมด: ${dorms.length} แห่ง${colors.reset}\n`);

    // หาหอพักที่ชื่อคล้ายกับที่ถาม
    const searchTerms = ['ดิอินฟินิต', 'โอพิวเลนส์', 'infinite', 'opulence', 'สตรี', 'ศุภลักษณ์'];
    
    console.log(`${colors.yellow}🔎 ค้นหาหอพักที่เกี่ยวข้อง:${colors.reset}`);
    
    searchTerms.forEach(term => {
      const matched = dorms.filter(d => 
        d.name.toLowerCase().includes(term.toLowerCase())
      );
      
      if (matched.length > 0) {
        console.log(`\n${colors.cyan}คำค้นหา: "${term}"${colors.reset}`);
        matched.forEach(d => {
          console.log(`  ${colors.green}✓${colors.reset} ID: ${d.id} - ชื่อ: ${d.name}`);
        });
      }
    });

    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  } catch (error) {
    console.log(`${colors.red}❌ ไม่สามารถดึงข้อมูลหอพักได้:${colors.reset}`, error.message);
  }
}

async function main() {
  // ตรวจสอบชื่อหอพักในระบบก่อน
  await checkDormNames();
  
  // ทดสอบคำถาม
  await testSpecificQuestion();
}

main().catch(error => {
  console.error(`${colors.red}เกิดข้อผิดพลาด:${colors.reset}`, error.message);
});
