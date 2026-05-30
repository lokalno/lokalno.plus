import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SUPPORT_STATUSES } from "@/lib/constants";
import AdminSupportActions from "@/components/AdminSupportActions";

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, city: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const openCount = tickets.filter((t) => t.status === "OPEN").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>
      <h1 className="text-2xl font-bold mb-2">Підтримка користувачів</h1>
      <p className="text-sm text-gray-500 mb-6">
        Повідомлення від зареєстрованих користувачів ({openCount} нових)
      </p>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Повідомлень поки немає
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                ticket.status === "OPEN" ? "border-blue-200 bg-blue-50/30" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-blue-900">{ticket.subject}</p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{ticket.message}</p>
                <p className="text-xs text-gray-400 mt-3">
                  {ticket.user.name} · {ticket.user.email}
                  {ticket.phone ? ` · 📱 ${ticket.phone}` : ticket.user.phone ? ` · 📱 ${ticket.user.phone}` : ""}
                  {ticket.user.city ? ` · ${ticket.user.city}` : ""}
                </p>
                <p className="text-xs text-gray-400">
                  {SUPPORT_STATUSES[ticket.status] || ticket.status} · {formatDate(ticket.createdAt)}
                </p>
                {ticket.adminNote && (
                  <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
                    Нотатка: {ticket.adminNote}
                  </p>
                )}
              </div>
              <AdminSupportActions
                ticketId={ticket.id}
                status={ticket.status}
                adminNote={ticket.adminNote}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
