const fs = require('fs');
const path = require('path');

async function uploadFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }

  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(filePath)]), filename);

  try {
    const res = await fetch('http://localhost:3000/api/v1/jobs', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`Upload failed for ${filename}:`, data);
      return null;
    }
    console.log(`Uploaded ${filename} -> Job ID: ${data.jobId}`);
    return data.jobId;
  } catch (err) {
    console.error(`Error uploading ${filename}:`, err.message);
    return null;
  }
}

async function pollJob(jobId) {
  return new Promise((resolve) => {
    console.log(`Polling status for ${jobId}...`);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`);
        const data = await res.json();
        
        process.stdout.write(`\rStatus: ${data.status} | Stage: ${data.stage} | ${data.progressMessage}`);
        
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(interval);
          console.log('\nDone!');
          resolve(data.status === 'COMPLETED');
        }
      } catch (err) {
        clearInterval(interval);
        console.error('\nError polling:', err.message);
        resolve(false);
      }
    }, 2000);
  });
}

async function run() {
  console.log('\n--- Testing Real Adam Paper Abstract ---');
  const id = await uploadFile('test_real.txt');
  if (id && await pollJob(id)) {
    const { PrismaClient } = require('./backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    const jobData = await prisma.job.findUnique({ where: { id } });
    console.log("\n--- NOVELTY REPORT (JSON) ---");
    console.log(JSON.stringify(jobData.report, null, 2));
    await prisma.$disconnect();
  }
}

run().catch(console.error);
