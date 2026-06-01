import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ListingForm from "@/components/ListingForm";

export default async function NewListingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/listings/new");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <ListingForm variant="create" />
    </div>
  );
}
