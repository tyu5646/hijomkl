// ตัวอย่างการใช้ Groq AI ใน Chatbot
require('dotenv').config();

async function callGroqAPI(userMessage, dormContext) {
  const API_KEY = process.env.GROQ_API_KEY;
  
  const systemPrompt = `คุณเป็นผู้ช่วยอัจฉริยะสำหรับระบบหอพัก Smart Dorm ตอบเป็นภาษาไทยอย่างเป็นกันเอง

ข้อมูลหอพักปัจจุบัน:
${dormContext}

หน้าที่ของคุณ:
- ช่วยแนะนำหอพักที่เหมาะสม
- ตอบคำถามเกี่ยวกับราคา สิ่งอำนวยความสะดวก
- เปรียบเทียบหอพักต่างๆ
- ใช้ emoji ให้เหมาะสม
- ตอบแบบเป็นมิตรและช่วยเหลือ`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: 'llama3-8b-8192',
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      throw new Error(`Groq API Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    return null;
  }
}

// ใช้ในฟังก์ชัน chatbot
async function generateAIResponse(userMessage, dormContext) {
  const aiResponse = await callGroqAPI(userMessage, dormContext);
  
  if (aiResponse) {
    return aiResponse;
  } else {
    // Fallback ไปใช้ rule-based
    return generateRuleBasedResponse(userMessage);
  }
}

module.exports = { callGroqAPI, generateAIResponse };
