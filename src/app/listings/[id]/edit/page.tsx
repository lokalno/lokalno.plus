import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePhotos } from "@/lib/utils";
import ListingForm from "@/components/ListingForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) redirect("/login");

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) notFound();
  if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Редагувати оголошення</h1>
      <ListingForm
        initial={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
          city: listing.city,
          photos: parsePhotos(listing.photos),
        }}
      />
    </div>
  );
}
