import Link from "next/link";
import { getAllLeads, type Lead } from "@/lib/db";
import { markLeadFollowedUp } from "./actions";

// This dashboard reads directly from the on-disk SQLite file and is mutated
// via a Server Action (markLeadFollowedUp), so it must always render fresh —
// never cached/statically generated.
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const FOLLOW_UP_THRESHOLD_DAYS = 3;

const INTEREST_STYLES: Record<string, string> = {
  "Web Development":
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
  "Mobile App":
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
  "Automation / Workflow":
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
  Consulting:
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
  Other:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const EMAIL_STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  simulated:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
  failed:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  pending:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

interface AdminPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const sort: "asc" | "desc" = params.sort === "asc" ? "asc" : "desc";
  const leads = getAllLeads(sort);

  // This is a Server Component computing a point-in-time "days since" value
  // for display, not a memoized/reactive computation — the react-compiler
  // purity rule's Date.now() restriction targets client render purity and
  // does not apply to this server-side, request-time calculation.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const rows = leads.map((lead) => {
    const daysSince = Math.floor(
      (now - new Date(lead.created_at).getTime()) / DAY_MS
    );
    const needsFollowUp =
      daysSince > FOLLOW_UP_THRESHOLD_DAYS && !lead.followed_up;
    return { lead, daysSince, needsFollowUp };
  });

  const totalLeads = rows.length;
  const needsFollowUpCount = rows.filter((r) => r.needsFollowUp).length;
  const nextSort = sort === "asc" ? "desc" : "asc";

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Admin dashboard
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Lead Dashboard
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Track incoming inquiries and stay on top of follow-ups before
            they go cold.
          </p>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total leads" value={totalLeads} />
          <StatCard
            label="Needs follow-up"
            value={needsFollowUpCount}
            tone={needsFollowUpCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Phone
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Interest
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    <Link
                      href={`/admin?sort=${nextSort}`}
                      className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      Submitted
                      <SortIcon direction={sort} />
                    </Link>
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Email Status
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Follow-up
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map(({ lead, daysSince, needsFollowUp }) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    daysSince={daysSince}
                    needsFollowUp={needsFollowUp}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No leads yet. New submissions will show up here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  const isWarning = tone === "warning";
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm shadow-slate-200/50 dark:shadow-none ${
        isWarning
          ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div
        className={`text-sm font-medium ${
          isWarning
            ? "text-amber-700 dark:text-amber-400"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1.5 text-3xl font-semibold tracking-tight ${
          isWarning
            ? "text-amber-700 dark:text-amber-300"
            : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  daysSince,
  needsFollowUp,
}: {
  lead: Lead;
  daysSince: number;
  needsFollowUp: boolean;
}) {
  const interestClasses =
    (lead.interest && INTEREST_STYLES[lead.interest]) ||
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  const statusClasses =
    EMAIL_STATUS_STYLES[lead.email_status] || EMAIL_STATUS_STYLES.pending;

  const { date, relative } = formatSubmitted(lead.created_at, daysSince);

  return (
    <tr
      className={
        needsFollowUp
          ? "bg-amber-50/70 dark:bg-amber-950/20"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
      }
    >
      <td
        className={`px-5 py-4 align-top border-l-4 ${
          needsFollowUp
            ? "border-l-amber-500"
            : "border-l-transparent"
        }`}
      >
        <div className="font-medium text-slate-900 dark:text-white">
          {lead.name}
        </div>
        {needsFollowUp && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Needs follow-up
          </span>
        )}
      </td>
      <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-400">
        {lead.email}
      </td>
      <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-400">
        {lead.phone || "—"}
      </td>
      <td className="px-5 py-4 align-top">
        {lead.interest ? (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${interestClasses}`}
          >
            {lead.interest}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>
      <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-400">
        <div className="text-slate-900 dark:text-white">{date}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          {relative}
        </div>
      </td>
      <td className="px-5 py-4 align-top">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusClasses}`}
        >
          {lead.email_status}
        </span>
      </td>
      <td className="px-5 py-4 align-top">
        {lead.followed_up ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
            Followed up
          </span>
        ) : (
          <form action={markLeadFollowedUp.bind(null, lead.id)}>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Mark followed up
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}

function SortIcon({ direction }: { direction: "asc" | "desc" }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${
        direction === "asc" ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.19l3.72-3.72a.75.75 0 111.06 1.06l-5 5a.75.75 0 01-1.06 0l-5-5a.75.75 0 111.06-1.06l3.72 3.72V3.75A.75.75 0 0110 3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatSubmitted(
  isoDate: string,
  daysSince: number
): { date: string; relative: string } {
  const date = new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let relative: string;
  if (daysSince <= 0) {
    relative = "Today";
  } else if (daysSince === 1) {
    relative = "1 day ago";
  } else {
    relative = `${daysSince} days ago`;
  }

  return { date, relative };
}
