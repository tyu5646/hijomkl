require('dotenv').config();

async function testGroqAPI() {
  const API_KEY = process.env.GROQ_API_KEY;
  
  console.log('🔍 Testing Groq API...');
  console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Not found');
  
  if (!API_KEY) {
    console.log('❌ GROQ_API_KEY not found');
    return;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello, can you respond in Thai? สวัสดี'
          }
        ],
        model: 'llama3-8b-8192',
        max_tokens: 100
      })
    });

    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Groq API is working!');
      console.log('🤖 Model:', data.model);
      console.log('💬 Response:', data.choices[0].message.content);
      console.log('⚡ Usage:', data.usage);
    } else {
      const error = await response.text();
      console.log('❌ API Error:', error);
      
      if (response.status === 401) {
        console.log('🔑 API Key is invalid or expired');
      } else if (response.status === 429) {
        console.log('⏰ Rate limit exceeded');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testGroqAPI();
