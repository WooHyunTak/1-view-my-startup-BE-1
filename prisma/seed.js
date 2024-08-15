import { PrismaClient } from "@prisma/client";

import { COMPANY } from "./mock.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient();

async function main() {
  // await prisma.category.deleteMany();

  await prisma.company.deleteMany();

  // await prisma.category.createMany({
  //   data: CATEGORY,
  //   skipDuplicates: true,
  // });
  await Promise.all(
    COMPANY.map(async (company) => {
      await prisma.company.create({
        data: {
          ...company,
          categories: {
            connect: company.categories.map((category) => ({
              id: category.id,
            })),
          },
          investments: {
            create: company.investments.map((investment) => ({
              ...investment,
            })),
          },
        },
      });
    })
  );
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
