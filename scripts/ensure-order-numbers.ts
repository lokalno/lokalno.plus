import { PrismaClient } from "@prisma/client";

const ORDER_NUMBER_START = 10001;
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, orderNumber: true },
  });

  let nextNumber = ORDER_NUMBER_START;

  for (const order of orders) {
    if (order.orderNumber == null || order.orderNumber < ORDER_NUMBER_START) {
      await prisma.order.update({
        where: { id: order.id },
        data: { orderNumber: nextNumber },
      });
      nextNumber += 1;
      continue;
    }

    nextNumber = Math.max(nextNumber, order.orderNumber + 1);
  }

  const sequenceNext = Math.max(nextNumber, ORDER_NUMBER_START);

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Order"', 'orderNumber'),
      GREATEST(${sequenceNext}, ${ORDER_NUMBER_START}),
      false
    );
  `);
}

main()
  .catch((error) => {
    console.error("ensure-order-numbers failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
