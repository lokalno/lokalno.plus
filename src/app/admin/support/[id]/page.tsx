import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { getSupportTicketForViewer } from "@/lib/support-chat";
import { formatDate } from "@/lib/utils";
import { SUPPORT_STATUSES } from "@/lib/constants";
import SupportTicketChat from "@/components/SupportTicketChat";
import AdminSupportActions from "@/components/AdminSupportActions";

type Params = { params: Promise<{ id: string }> };

export default async function AdminSupportTicketPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const ticket = await getSupportTicketForViewer(id, session.user.id, true);
  if (!ticket) redirect("/admin/support");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/admin/support" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Усі звернення
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ticket.user.name} · {ticket.user.email}
            {ticket.phone ? ` · 📱 ${ticket.phone}` : ticket.user.phone ? ` · 📱 ${ticket.user.phone}` : ""}
            {ticket.user.city ? ` · ${ticket.user.city}` : ""}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {SUPPORT_STATUSES[ticket.status] || ticket.status} · {formatDate(ticket.createdAt)}
          </p>
        </div>
        <AdminSupportActions
          ticketId={ticket.id}
          status={ticket.status}
          adminNote={ticket.adminNote}
        />
      </div>

      <SupportTicketChat
        ticketId={ticket.id}
        initialTicket={ticket}
        currentUserId={session.user.id}
        isAdminView
      />
    </div>
  );
}
