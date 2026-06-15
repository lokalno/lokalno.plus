import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.listing.groupBy({
    by: ["sellerId"],
    where: {
      status: "ACTIVE",
      category: { startsWith: "Одяг і взуття" },
    },
    _count: { id: true },
  });

  rows.sort((a, b) => b._count.id - a._count.id);
  const top = rows[0];
  if (!top) {
    console.log("NO_SELLER");
    return;
  }

  const seller = await prisma.user.findUnique({
    where: { id: top.sellerId },
    select: { id: true, storeName: true, name: true, banned: true },
  });

  const total = await prisma.listing.count({
    where: { sellerId: top.sellerId, status: "ACTIVE" },
  });

  const clothing = await prisma.listing.count({
    where: {
      sellerId: top.sellerId,
      status: "ACTIVE",
      OR: [
        { category: "Одяг і взуття" },
        { category: { startsWith: "Одяг і взуття >" } },
      ],
    },
  });

  const zhinoche = await prisma.listing.count({
    where: {
      sellerId: top.sellerId,
      status: "ACTIVE",
      OR: [
        { category: "Одяг і взуття > Жіноче" },
        { category: { startsWith: "Одяг і взуття > Жіноче >" } },
      ],
    },
  });

  const zhinocheVzuttia = await prisma.listing.count({
    where: {
      sellerId: top.sellerId,
      status: "ACTIVE",
      OR: [
        { category: "Одяг і взуття > Жіноче > Взуття" },
        { category: { startsWith: "Одяг і взуття > Жіноче > Взуття >" } },
      ],
    },
  });

  console.log(
    JSON.stringify(
      {
        seller,
        counts: { total, clothing, zhinoche, zhinocheVzuttia },
      },
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
