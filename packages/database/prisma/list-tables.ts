import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log("Tables in database:");
  for (const t of tables) {
    const count = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*) FROM "${t.table_name}"`
    );
    console.log(`  ${t.table_name}: ${count[0]?.count || 0}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });