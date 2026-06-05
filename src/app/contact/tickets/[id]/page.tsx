import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupportTicketForViewer } from "@/lib/support-chat";
import { formatDate } from "@/lib/utils";
import { SUPPORT_STATUSES } from "@/lib/constants";
import SupportTicketChat from "@/components/SupportTicketChat";

type Params = { params: Promise<{ id: string }> };

export default async function UserSupportTicketPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/contact/tickets/${id}`)}`);
  }

  const ticket = await getSupportTicketForViewer(id, session.user.id, false);
  if (!ticket) redirect("/contact");

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/contact" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Підтримка
      </Link>

      <h1 className="text-xl font-bold mb-1">{ticket.subject}</h1>
      <p className="text-xs text-gray-400 mb-4">
        {SUPPORT_STATUSES[ticket.status] || ticket.status} · {formatDate(ticket.createdAt)}
      </p>

      {ticket.status === "RESOLVED" && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
          Звернення позначено як вирішене. Якщо питання залишилось — напишіть нижче, і ми відкриємо
          діалог знову.
        </p>
      )}

      <SupportTicketChat
        ticketId={ticket.id}
        initialTicket={ticket}
        currentUserId={session.user.id}
        isAdminView={false}
      />
    </div>
  );
}
