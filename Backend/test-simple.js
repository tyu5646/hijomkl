// Simple test server
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('Health check called');
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/owner/dorms', (req, res) => {
  console.log('Add dorm endpoint called');
  console.log('Body:', req.body);
  res.json({ success: true, message: 'Test endpoint working' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
});
