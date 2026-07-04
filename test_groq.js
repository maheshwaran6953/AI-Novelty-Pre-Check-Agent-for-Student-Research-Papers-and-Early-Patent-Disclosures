const { PrismaClient } = require('./backend/node_modules/@prisma/client');

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY || 'gsk_...'; // I will just require dotenv from backend
  require('dotenv').config({ path: './backend/.env' });
  const key = process.env.GROQ_API_KEY;
  if(!key) { console.error("No key"); return; }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'You are a test.' }],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });
    
    if(!response.ok) {
      console.error(await response.text());
    } else {
      console.log(await response.json());
    }
  } catch(e) {
    console.error(e);
  }
}
testGroq();
