import { PrismaClient } from "@prisma/client";
import { COMPANY, CATEGORY, INVESTMENT } from "./mock.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.company.deleteMany();
  await prisma.category.deleteMany();
  await prisma.investment.deleteMany();

  await prisma.company.createMany({
    data: COMPANY,
    skipDuplicates: true,
  });

  await prisma.category.createMany({
    data: CATEGORY,
    skipDuplicates: true,
  });

  await prisma.investment.createMany({
    data: INVESTMENT,
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
