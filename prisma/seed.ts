import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/lib/seed-database";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((result) => {
    console.log("Seed completed.");
    console.log(`Added ${result.listings} listings.`);
    console.log(`Admin:  ${result.accounts.admin}`);
    console.log(`Demo:   ${result.accounts.demo}`);
    console.log(`Seller: ${result.accounts.seller}`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
