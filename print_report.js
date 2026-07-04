async function run() {
  const { PrismaClient } = require('./backend/node_modules/@prisma/client');
  const prisma = new PrismaClient();
  const jobData = await prisma.job.findUnique({ where: { id: '469d6e5e-ef0a-4508-bae0-b6b47b11e703' } });
  console.log("\n--- NOVELTY REPORT (JSON) ---");
  console.log(JSON.stringify(jobData.report, null, 2));
  await prisma.$disconnect();
}
run().catch(console.error);
