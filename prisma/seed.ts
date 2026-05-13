import { prisma } from "../src/lib/prisma";
import { seedDefaultData } from "../src/lib/seed";

async function main() {
  await seedDefaultData();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
