const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✓ Health check:', healthResponse.data);
    
    console.log('\nTesting loan estimate endpoint...');
    const loanResponse = await axios.post(`${baseURL}/api/loan-estimate`, {
      deviceModel: 'Samsung Galaxy S23'
    });
    console.log('✓ Loan estimate:', loanResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else {
      console.error('Connection Error:', error.message);
    }
  }
}

testAPI();