import { PrismaClient } from "@prisma/client";
import {
  findPendingListingDuplicateGroups,
  getDuplicateReasonLabel,
} from "../src/lib/admin-listing-duplicates";

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.listing.findMany({
    where: { status: "PENDING" },
    select: {
      id: true,
      title: true,
      price: true,
      sellerId: true,
      photos: true,
      status: true,
      createdAt: true,
      promImportKey: true,
      promUniqueId: true,
      promProductId: true,
      promSku: true,
      city: true,
      seller: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const report = findPendingListingDuplicateGroups(pending);

  const statusCounts = await prisma.listing.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const examples = report.groups.slice(0, 10).map((group) => ({
    reason: getDuplicateReasonLabel(group.reason),
    count: group.listingIds.length,
    listings: group.listingIds.map((id) => {
      const listing = pending.find((item) => item.id === id);
      return {
        id,
        title: listing?.title ?? id,
        price: listing?.price,
        promImportKey: listing?.promImportKey,
        promSku: listing?.promSku,
        seller: listing?.seller.name,
      };
    }),
  }));

  console.log(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        totalPending: report.totalPending,
        duplicateListingCount: report.duplicateListingCount,
        duplicateGroupCount: report.duplicateGroupCount,
        allStatusCounts: statusCounts,
        pendingStillPending: pending.every((item) => item.status === "PENDING"),
        examples,
      },
      null,
      2
    )
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
