require('dotenv').config({ path: './backend/.env' });
const { GoogleGenAI } = require('@google/genai');

async function testEmbeddings() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY not found in backend/.env");
    console.error("Please add your Gemini key back as GEMINI_API_KEY=your_key in backend/.env to run this test.");
    process.exit(1);
  }

  console.log("Found GEMINI_API_KEY. Testing text-embedding-004 endpoint...");
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'This is a test of the Gemini embedding model.',
    });

    console.log("SUCCESS!");
    console.log("Embeddings generated successfully. Dimensions:", response.embeddings?.[0]?.values?.length);
    console.log("First 5 values:", response.embeddings?.[0]?.values?.slice(0, 5));
  } catch (err) {
    console.error("\nFAILED! Error calling Gemini Embeddings:");
    console.error(err.message || err);
    if (err.status) console.error("HTTP Status:", err.status);
    console.log("\nIf this is a 429 quota error, the free tier for embeddings is also blocked.");
  }
}

testEmbeddings();
