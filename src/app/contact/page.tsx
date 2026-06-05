import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { formatDate } from "@/lib/utils";
import { SUPPORT_STATUSES } from "@/lib/constants";
import SupportForm from "@/components/SupportForm";

export default async function ContactPage() {
  const session = await getServerSession(authOptions);
  const settings = await getSiteSettings();

  const user =
    session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true, phone: true },
        })
      : null;

  const tickets =
    session?.user?.id
      ? await prisma.supportTicket.findMany({
          where: { userId: session.user.id },
          include: { replies: { orderBy: { createdAt: "desc" }, take: 1 } },
          orderBy: { updatedAt: "desc" },
        })
      : [];

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Підтримка</h1>
      <p className="text-sm text-gray-600 mb-6">
        Напишіть нам — ви зможете переписуватися з адміністратором прямо тут.
      </p>

      {user ? (
        <SupportForm userName={user.name} userEmail={user.email} userPhone={user.phone} />
      ) : (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <p className="text-gray-700">
            Щоб написати в підтримку, спочатку увійдіть або зареєструйтесь.
          </p>
          <div className="flex gap-3">
            <Link href="/login" className="bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700">
              Увійти
            </Link>
            <Link href="/register" className="border px-4 py-2 rounded-xl hover:bg-gray-50">
              Реєстрація
            </Link>
          </div>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Мої звернення</h2>
          <div className="space-y-2">
            {tickets.map((ticket) => {
              const lastText = ticket.replies[0]?.content || ticket.message;
              const preview =
                lastText.length > 100 ? `${lastText.slice(0, 100)}…` : lastText;

              return (
                <Link
                  key={ticket.id}
                  href={`/contact/tickets/${ticket.id}`}
                  className={`block bg-white rounded-xl border p-4 hover:border-brand-300 transition-colors ${
                    ticket.userUnread ? "border-brand-200 bg-brand-50/30" : ""
                  }`}
                >
                  <p className="font-medium flex items-center gap-2">
                    {ticket.subject}
                    {ticket.userUnread && (
                      <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">
                        відповідь
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{preview}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {SUPPORT_STATUSES[ticket.status] || ticket.status} · {formatDate(ticket.updatedAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 bg-gray-50 rounded-xl border p-4 text-sm text-gray-600">
        <p>
          <span className="font-medium">Email:</span>{" "}
          <a href={`mailto:${settings.supportEmail}`} className="text-brand-700 hover:underline">
            {settings.supportEmail}
          </a>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Реквізити оператора платформи — у{" "}
          <Link href="/privacy" className="text-brand-700 hover:underline">
            політиці конфіденційності
          </Link>
          . Для скарг на оголошення використовуйте кнопку «Поскаржитися» на сторінці товару.
        </p>
      </div>
    </div>
  );
}
