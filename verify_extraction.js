const fs = require('fs');
const path = require('path');

async function uploadFile(filename) {
  const filePath = path.join(__dirname, filename);
  const fileData = fs.readFileSync(filePath);
  
  const formData = new FormData();
  formData.append('file', new Blob([fileData]), filename);

  const res = await fetch('http://localhost:3000/api/v1/jobs', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    console.error(`Upload failed for ${filename}:`, await res.text());
    return null;
  }
  
  const json = await res.json();
  console.log(`Uploaded ${filename}, Job ID:`, json.jobId);
  return json.jobId;
}

async function pollJob(jobId) {
  process.stdout.write(`Polling job ${jobId} `);
  while (true) {
    const res = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`);
    const json = await res.json();
    
    if (json.status === 'COMPLETED') {
      console.log(`\nJob ${jobId} COMPLETED.`);
      break;
    }
    
    if (json.status === 'FAILED') {
      console.log(`\nJob ${jobId} FAILED. Error: ${json.errorMessage}`);
      return false;
    }
    
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
  }
  return true;
}

async function getReport(jobId) {
  const res = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/report`);
  const json = await res.json();
  return json;
}

async function run() {
  console.log('--- Testing Short Text ---');
  const id1 = await uploadFile('test_short.txt');
  if (id1 && await pollJob(id1)) {
    const report1 = await getReport(id1);
    console.log("Status check:", await (await fetch(`http://localhost:3000/api/v1/jobs/${id1}`)).json());
    console.log("Placeholder Report returned.");
    
    // To see the claims, we can fetch from the DB directly since report is stubbed, 
    // or just let the user view it in Prisma Studio. But to make it easy, let's fetch the full job from DB:
    const { PrismaClient } = require('./backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    const jobData = await prisma.job.findUnique({ where: { id: id1 } });
    console.log("\nEXTRACTED CLAIMS (Short Text):\n", JSON.stringify(jobData.claims, null, 2));
    await prisma.$disconnect();
  }

  console.log('\n--- Testing Realistic Abstract ---');
  const id2 = await uploadFile('test_abstract.txt');
  if (id2 && await pollJob(id2)) {
    const { PrismaClient } = require('./backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    const jobData = await prisma.job.findUnique({ where: { id: id2 } });
    console.log("\nEXTRACTED CLAIMS (Abstract):\n", JSON.stringify(jobData.claims, null, 2));
    await prisma.$disconnect();
  }
}

run().catch(console.error);
