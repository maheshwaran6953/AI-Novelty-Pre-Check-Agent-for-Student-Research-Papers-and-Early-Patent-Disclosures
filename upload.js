const fs = require('fs');
const path = require('path');

async function uploadFile(filename) {
  const filePath = path.join(__dirname, filename);
  const fileData = fs.readFileSync(filePath);
  
  // Use native fetch in Node 18+
  const formData = new FormData();
  formData.append('file', new Blob([fileData]), filename);

  const res = await fetch('http://localhost:3000/api/v1/jobs', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  console.log(`Uploaded ${filename}:`, json);
  return json.jobId;
}

async function run() {
  const jobId = await uploadFile('large_test.txt');
  
  // wait a bit for pipeline to process
  await new Promise(r => setTimeout(r, 2000));
  
  // check status
  const statusRes = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`);
  const statusJson = await statusRes.json();
  console.log('Status after 2s:', statusJson);
}

run().catch(console.error);
