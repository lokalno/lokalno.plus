import { PrismaClient } from "@prisma/client";
import { purgeDemoListings } from "../src/lib/purge-demo-listings";

const prisma = new PrismaClient();

purgeDemoListings(prisma)
  .then((result) => {
    console.log("Demo listings purge completed:");
    console.log(`  Demo sellers found: ${result.sellers}`);
    console.log(`  Listings deleted:   ${result.listings}`);
    console.log(`  Orders deleted:     ${result.orders}`);
    console.log(`  Messages deleted:   ${result.messages}`);
    console.log(`  Reviews deleted:    ${result.reviews}`);
    console.log(`  Price offers:       ${result.priceOffers}`);
  })
  .catch((error) => {
    console.error("Purge failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
