require('dotenv').config({ path: require('path').join(__dirname, '.env') });
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: "Hello" }] }
    })
  });
  console.log(res.status, await res.text());
}
test();
