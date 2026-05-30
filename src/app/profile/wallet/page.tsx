import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import WalletPanel from "@/components/WalletPanel";

export default async function WalletPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Мій баланс</h1>
        <Link href="/profile" className="text-sm text-brand-700 hover:underline">
          ← Мій профіль
        </Link>
      </div>
      <WalletPanel />
    </div>
  );
}
