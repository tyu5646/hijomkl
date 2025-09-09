// ฟังก์ชันปรับปรุงสำหรับตอบคำถามหาหอพักราคาถูกที่สุด

// Helper: ตอบแบบ rule-based สำหรับคำถามราคาถูกที่สุด
function answerCheapestDormQuery(message, dorms) {
  const msg = message.toLowerCase();
  
  // คำถามหาหอพักราคาถูกที่สุด
  if (/ราคาถูก|ถูกที่สุด|ถูกสุด|ราคาต่ำ|ราคาน้อย/.test(msg) && /หอ/.test(msg)) {
    // เรียงลำดับหอพักตามราคาจากถูกไปแพง (ใช้ราคารายเดือนเป็นหลัก)
    const sortedDorms = [...dorms].sort((a, b) => {
      // ฟังก์ชันคำนวณราคาเปรียบเทียบ (ใช้รายเดือนเป็นหลัก หากไม่มีใช้รายวัน)
      const getComparablePrice = (dorm) => {
        const monthly = dorm.price_monthly && Number(dorm.price_monthly) > 0 ? Number(dorm.price_monthly) : null;
        const daily = dorm.price_daily && Number(dorm.price_daily) > 0 ? Number(dorm.price_daily) * 30 : null; // แปลงรายวันเป็นรายเดือน
        
        // ใช้ราคารายเดือนก่อน หากไม่มีใช้รายวัน*30
        return monthly || daily || Infinity;
      };
      
      const priceA = getComparablePrice(a);
      const priceB = getComparablePrice(b);
      
      return priceA - priceB;
    });

    const cheapestDorms = sortedDorms.slice(0, 3).filter(d => {
      // ต้องมีราคารายเดือนหรือรายวัน
      const hasMonthly = d.price_monthly && Number(d.price_monthly) > 0;
      const hasDaily = d.price_daily && Number(d.price_daily) > 0;
      return hasMonthly || hasDaily;
    });

    if (cheapestDorms.length > 0) {
      let response = `🏠 หอพักราคาถูกที่สุด 3 อันดับแรก:\n\n`;
      
      cheapestDorms.forEach((dorm, index) => {
        const prices = [];
        // แสดงเฉพาะราคาที่มีและมากกว่า 0
        if (dorm.price_daily && Number(dorm.price_daily) > 0) {
          prices.push(`รายวัน ฿${Number(dorm.price_daily).toLocaleString()}`);
        }
        if (dorm.price_monthly && Number(dorm.price_monthly) > 0) {
          prices.push(`รายเดือน ฿${Number(dorm.price_monthly).toLocaleString()}`);
        }
        if (dorm.price_term && Number(dorm.price_term) > 0) {
          prices.push(`รายเทอม ฿${Number(dorm.price_term).toLocaleString()}`);
        }
        
        response += `${index + 1}. **${dorm.name}**\n`;
        response += `   💰 ราคา: ${prices.join(' | ')}\n`;
        if (dorm.near_places) response += `   📍 ใกล้: ${dorm.near_places}\n`;
        if (dorm.contact_phone) response += `   📞 ติดต่อ: ${dorm.contact_phone}\n`;
        response += `\n`;
      });
      
      response += `💡 หมายเหตุ: ราคาเรียงจากถูกไปแพงตามราคารายเดือน (หากไม่มีใช้รายวัน×30)`;
      return response;
    }
  }
  
  return null; // ไม่ใช่คำถามราคาถูกที่สุด
}

module.exports = { answerCheapestDormQuery };
