require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'TePresamos API is running' });
});

async function getDevicePriceFromLLM(deviceModel) {
  const prompt = `What is the current market price in Mexican Pesos (MXN) for the Android device model: ${deviceModel}? Please respond with just the numeric price value in MXN, for example: 15000`;
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const priceText = response.data.choices[0].message.content.trim();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    
    return isNaN(price) ? 10000 : price;
  } catch (error) {
    console.error('Error getting price from LLM:', error.message);
    return 10000;
  }
}

function calculateMaxLoan(devicePrice) {
  const loanPercentage = 0.7;
  return Math.floor(devicePrice * loanPercentage);
}

app.post('/api/loan-estimate', async (req, res) => {
  try {
    const { deviceModel } = req.body;
    
    if (!deviceModel) {
      return res.status(400).json({
        error: 'Device model is required',
        message: 'Please provide the Android device model in the request body'
      });
    }

    console.log(`Processing loan estimate for device: ${deviceModel}`);
    
    const devicePrice = await getDevicePriceFromLLM(deviceModel);
    const maxLoanAmount = calculateMaxLoan(devicePrice);
    
    res.json({
      deviceModel,
      estimatedPriceMXN: devicePrice,
      maxLoanAmountMXN: maxLoanAmount,
      loanPercentage: 70,
      currency: 'MXN'
    });
    
  } catch (error) {
    console.error('Error processing loan estimate:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process loan estimate'
    });
  }
});

app.listen(PORT, () => {
  console.log(`TePresamos API server running on port ${PORT}`);
});