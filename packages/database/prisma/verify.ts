import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stages = await prisma.pipelineStage.findMany();
  console.log("Pipeline stages:", stages.length);

  const rules = await prisma.scoringRule.findMany();
  console.log("Scoring rules:", rules.length);

  const businesses = await prisma.business.count();
  console.log("Businesses:", businesses);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });