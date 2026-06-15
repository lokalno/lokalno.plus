import type { PrismaClient } from "@prisma/client";
import { deleteListingById } from "@/lib/delete-listing";

export type PurgePendingListingsResult = {
  deleted: number;
  skipped: number;
  skippedIds: string[];
  errors: string[];
};

/** Видаляє всі оголошення зі статусом PENDING (лише для адмінки). */
export async function purgePendingListings(
  prisma: PrismaClient
): Promise<PurgePendingListingsResult> {
  const pending = await prisma.listing.findMany({
    where: { status: "PENDING" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  let deleted = 0;
  let skipped = 0;
  const skippedIds: string[] = [];
  const errors: string[] = [];

  for (const listing of pending) {
    const result = await deleteListingById(prisma, listing.id);
    if (result.ok) {
      deleted += 1;
      continue;
    }

    skipped += 1;
    skippedIds.push(listing.id);
    errors.push(`«${listing.title}»: ${result.error}`);
  }

  return { deleted, skipped, skippedIds, errors };
}
