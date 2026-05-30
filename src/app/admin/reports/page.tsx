import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { REPORT_STATUSES } from "@/lib/constants";
import AdminReportActions from "@/components/AdminReportActions";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const reports = await prisma.report.findMany({
    include: {
      listing: { select: { id: true, title: true, status: true } },
      reporter: { select: { name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        Скарги ({reports.filter((r) => r.status === "PENDING").length} нових)
      </h1>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Скарг поки немає
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                report.status === "PENDING" ? "border-red-200 bg-red-50/30" : ""
              }`}
            >
              <div>
                <p className="font-medium">{report.listing.title}</p>
                <p className="text-sm text-red-700 font-medium mt-1">{report.reason}</p>
                {report.comment && (
                  <p className="text-sm text-gray-600 mt-1">&quot;{report.comment}&quot;</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Від: {report.reporter.name} ({report.reporter.email}) ·{" "}
                  {formatDate(report.createdAt)} ·{" "}
                  {REPORT_STATUSES[report.status] || report.status}
                </p>
              </div>
              {report.status === "PENDING" && (
                <AdminReportActions reportId={report.id} listingId={report.listing.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
