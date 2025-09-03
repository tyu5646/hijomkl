const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GROQ_API_KEY;

console.log('🔍 Testing Groq API...');
console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Not found');

if (!API_KEY) {
  console.log('❌ GROQ_API_KEY not found in environment variables');
  process.exit(1);
}

const data = JSON.stringify({
  messages: [{ 
    role: 'user', 
    content: 'สวัสดี ทดสอบ API' 
  }],
  model: 'llama3-8b-8192',
  max_tokens: 100
});

const options = {
  hostname: 'api.groq.com',
  port: 443,
  path: '/openai/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const response = JSON.parse(body);
        console.log('✅ Groq API is working!');
        console.log('🤖 Model:', response.model);
        console.log('💬 Response:', response.choices[0].message.content);
        console.log('⚡ Usage:', response.usage);
      } else if (res.statusCode === 401) {
        console.log('❌ API Key is invalid or expired');
        console.log('📝 Response:', body);
      } else if (res.statusCode === 429) {
        console.log('⏰ Rate limit exceeded');
        console.log('📝 Response:', body);
      } else {
        console.log(`❌ Error: Status ${res.statusCode}`);
        console.log('📝 Response:', body);
      }
    } catch (e) {
      console.log('❌ JSON Parse Error:', e.message);
      console.log('📝 Raw response:', body);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Network Error:', e.message);
});

req.write(data);
req.end();

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Request timeout');
  req.destroy();
  process.exit(1);
}, 10000);
