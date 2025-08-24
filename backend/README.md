# TePresamos Backend API

A simple API that estimates loan amounts based on Android device models by using an LLM to find device prices in Mexico.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to the `.env` file:
```
OPENAI_API_KEY=your_actual_api_key_here
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Loan Estimate
```
POST /api/loan-estimate
Content-Type: application/json

{
  "deviceModel": "Samsung Galaxy S23"
}
```

Response:
```json
{
  "deviceModel": "Samsung Galaxy S23",
  "estimatedPriceMXN": 25000,
  "maxLoanAmountMXN": 17500,
  "loanPercentage": 70,
  "currency": "MXN"
}
```

## Testing

Run the test script:
```bash
node test.js
```

Note: Make sure the server is running on port 3000 before running tests.