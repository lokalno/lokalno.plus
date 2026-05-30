import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
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

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Підтримка</h1>
      <p className="text-sm text-gray-600 mb-6">
        Напишіть нам — повідомлення з&apos;явиться в адмін-панелі.
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

      <div className="mt-6 bg-gray-50 rounded-xl border p-4 text-sm text-gray-600">
        <p>
          <span className="font-medium">Email:</span>{" "}
          <a href={`mailto:${settings.supportEmail}`} className="text-brand-700 hover:underline">
            {settings.supportEmail}
          </a>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Для скарг на оголошення використовуйте кнопку «Поскаржитися» на сторінці товару.
        </p>
      </div>
    </div>
  );
}
