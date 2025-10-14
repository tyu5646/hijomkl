/**
 * ทดสอบการแยกความแตกต่างระหว่างคำถามราคา vs ระยะทาง
 * รันด้วย: node test-price-vs-distance.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// สีสำหรับ console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

async function testQuestion(question, expectedType) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}❓ คำถาม: "${question}"${colors.reset}`);
  console.log(`${colors.blue}📋 คาดหวัง: ${expectedType}${colors.reset}\n`);

  try {
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/chatbot`, {
      message: question
    });
    const duration = Date.now() - startTime;

    const answer = response.data.message;
    const source = response.data.source;

    // ตรวจสอบประเภทคำตอบ
    const isDistanceAnswer = answer.includes('🚶') || answer.includes('🚗') || answer.includes('กม.');
    const isPriceAnswer = answer.includes('ราคา') || answer.includes('฿') || answer.includes('บาท');
    
    let actualType = 'อื่นๆ';
    if (isDistanceAnswer) actualType = 'ระยะทาง';
    else if (isPriceAnswer) actualType = 'ราคา';

    console.log(`${colors.green}✅ ได้รับคำตอบ (${duration}ms):${colors.reset}`);
    console.log(`${colors.blue}┌─────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(answer.substring(0, 200) + (answer.length > 200 ? '...' : ''));
    console.log(`${colors.blue}└─────────────────────────────────────────────────────────┘${colors.reset}`);
    
    // แสดงผลการวิเคราะห์
    console.log(`\n${colors.magenta}📊 การวิเคราะห์:${colors.reset}`);
    console.log(`  🎯 ประเภทที่คาดหวัง: ${colors.yellow}${expectedType}${colors.reset}`);
    console.log(`  📍 ประเภทที่ได้จริง: ${colors.cyan}${actualType}${colors.reset}`);
    console.log(`  📡 Source: ${source}`);

    // ตรวจสอบความถูกต้อง
    if (actualType === expectedType) {
      console.log(`  ${colors.green}✓ ถูกต้อง!${colors.reset}`);
      return true;
    } else {
      console.log(`  ${colors.red}✗ ไม่ถูกต้อง - ควรเป็น ${expectedType} แต่ได้ ${actualType}${colors.reset}`);
      return false;
    }

  } catch (error) {
    console.log(`${colors.red}❌ เกิดข้อผิดพลาด:${colors.reset}`);
    console.log(error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  🧪 ทดสอบการแยกคำถามราคา vs ระยะทาง                       ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const testCases = [
    // กรณีทดสอบ: คำถามราคา (ไม่ควรคำนวณระยะทาง)
    {
      question: 'หอพักหญิงคุณย่า กับ ดิอินฟินิตโอพิวเลนส์ หอไหนราคาถูก',
      expected: 'ราคา'
    },
    {
      question: 'เปรียบเทียบราคาหอพักหญิงคุณย่ากับดิอินฟินิตโอพิวเลนส์',
      expected: 'ราคา'
    },
    {
      question: 'หอพักหญิงคุณย่าราคาเท่าไหร่',
      expected: 'ราคา'
    },
    {
      question: 'หอไหนถูกกว่ากัน หอพักหญิงคุณย่า หรือ ดิอินฟินิตโอพิวเลนส์',
      expected: 'ราคา'
    },

    // กรณีทดสอบ: คำถามระยะทาง (ควรคำนวณระยะทาง)
    {
      question: 'ระยะทางระหว่างหอพักหญิงคุณย่ากับดิอินฟินิตโอพิวเลนส์',
      expected: 'ระยะทาง'
    },
    {
      question: 'หอพักหญิงคุณย่าห่างจากดิอินฟินิตโอพิวเลนส์เท่าไหร่',
      expected: 'ระยะทาง'
    },
    {
      question: 'หอพักหญิงคุณย่ากับดิอินฟินิตโอพิวเลนส์ไกลกันไหม',
      expected: 'ระยะทาง'
    },
    {
      question: 'หอพักหญิงคุณย่าใกล้ดิอินฟินิตโอพิวเลนส์ไหม',
      expected: 'ระยะทาง'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await testQuestion(testCase.question, testCase.expected);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // รอสักครู่ระหว่างการทดสอบ
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // สรุปผลการทดสอบ
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  📊 สรุปผลการทดสอบ                                         ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`  ${colors.green}✓ ผ่าน: ${passed}/${testCases.length}${colors.reset}`);
  console.log(`  ${colors.red}✗ ไม่ผ่าน: ${failed}/${testCases.length}${colors.reset}`);
  
  const percentage = ((passed / testCases.length) * 100).toFixed(1);
  console.log(`  📈 อัตราความสำเร็จ: ${percentage}%\n`);

  if (failed === 0) {
    console.log(`${colors.green}🎉 ทุกการทดสอบผ่านหมด!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️ มีบางการทดสอบที่ไม่ผ่าน กรุณาตรวจสอบ${colors.reset}\n`);
  }
}

async function checkServer() {
  console.log(`${colors.blue}🔍 ตรวจสอบสถานะเซิร์ฟเวอร์...${colors.reset}`);
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log(`${colors.green}✅ เซิร์ฟเวอร์ทำงานปกติ${colors.reset}\n`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ เซิร์ฟเวอร์ไม่ตอบสนอง${colors.reset}`);
    console.log(`${colors.yellow}💡 กรุณาเริ่ม Backend ก่อนด้วย: cd Backend && node index.js${colors.reset}\n`);
    return false;
  }
}

async function main() {
  const serverOk = await checkServer();
  
  if (!serverOk) {
    return;
  }

  await runTests();
}

main().catch(error => {
  console.error(`${colors.red}เกิดข้อผิดพลาด:${colors.reset}`, error.message);
});
