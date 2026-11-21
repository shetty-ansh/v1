import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import PageShell, { LABEL, MUTED, Stat } from "@/components/page-shell";
import { logout } from "./actions";
import AdminWorkspace, { type AdminData } from "@/components/admin/workspace";
import { getUser } from "@/lib/auth";
import { say } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { inr, fmt, loadRupee, wardSlug } from "@/lib/rupee";

export const metadata = { title: "Officer dashboard · Follow the Rupee" };

async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const user = await getUser();
  if (!user) redirect("/admin/login");
  const [sp, D] = await Promise.all([searchParams, loadRupee()]);
  const L = say(await getLang(sp.lang));

  // Ward officers see only their ward; BMC admins can pick any ward (?ward=L).
  const wanted = String(sp.ward ?? "").replace("-", "/");
  const code = user.role === "ward_officer" ? user.ward! : D.wards.some((w) => w.ward_code === wanted) ? wanted : "";
  const w = D.wards.find((x) => x.ward_code === code);
  const flags = D.flags.filter((f) => !w || f.ward_code === code);
  const highRisk = new Set(flags.filter((f) => f.confidence === "High" && f.flag !== "Paid during DLP").map((f) => f.work_order_id));
  const spent = w ? w.spent_inr : D.summary.total_spend_inr;
  const budget = w ? w.budget_inr : D.summary.total_budget_inr;
  const open = w ? w.complaints_open_not_fixed : D.summary.complaints.open_not_fixed;
  const pending = w ? w.pending_accidents.length : D.summary.connections.accidents_while_pending;

  // Data for the editable workspace (contracts + complaints), scoped to the officer's ward if they have one.
  const roadSet = new Map<string, { ward: string; name: string }>();
  for (const x of Object.values(D.W)) roadSet.set(`${x[0]}|${x[1]}`, { ward: x[0], name: x[1] });
  const workspace: AdminData = {
    wards: D.wards.map((x) => ({ code: x.ward_code, name: x.ward_name })),
    contractors: D.contractors.map((c) => c.short),
    roads: [...roadSet.values()].sort((a, b) => a.name.localeCompare(b.name)),
    workTypes: ["Pothole", "Waterlogging", "Open or broken manhole", "Choked drain / nullah overflow", "Road cave-in", "Broken paver blocks"],
    complaints: Object.entries(D.C)
      .filter(([, c]) => !c[6] && (c[4] === "Open" || c[4] === "In Progress"))
      .map(([id, c]) => ({ id, ward: c[0], date: c[1], issue: c[2], text: c[5], status: c[4] }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    lockedWard: user.role === "ward_officer" ? user.ward : code || undefined,
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className={LABEL}>
            {user.role === "ward_officer" ? L("Ward officer", "वार्ड अधिकारी", "वॉर्ड अधिकारी") : L("BMC admin", "BMC प्रशासक", "BMC प्रशासक")} · {L("signed in as", "लॉग इन:", "लॉग इन:")} {user.username}
            {w ? ` · ${L("Ward", "वार्ड", "वॉर्ड")} ${w.ward_code}` : ""}
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-bricolage)] text-[clamp(26px,3.2vw,40px)] font-semibold leading-[1.05] tracking-[-.03em] [overflow-wrap:anywhere]">
            {w ? w.ward_name : L("All 24 wards", "सभी 24 वार्ड", "सर्व 24 वॉर्ड")}
          </h1>
          <p className={`mt-1 ${MUTED}`}>{user.name}</p>
        </div>
        <form action={logout} className="flex-none">
          <button className="whitespace-nowrap rounded-full px-5 py-2 font-[family-name:var(--font-bricolage)] font-semibold shadow-[0_0_0_1px_rgba(43,48,51,.2)] hover:text-[#ee7454]">{L("Log out", "लॉग आउट", "लॉग आउट")}</button>
        </form>
      </div>

      {user.role === "bmc_admin" && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          <Link href="/admin" className={`rounded-full px-3 py-1 font-[family-name:var(--font-bricolage)] text-sm font-medium shadow-[0_0_0_1px_rgba(43,48,51,.14)] ${!w ? "bg-[#ee7454] text-white" : "bg-white hover:text-[#ee7454]"}`}>{L("All", "सभी", "सर्व")}</Link>
          {D.wards.map((x) => (
            <Link key={x.ward_code} href={`/admin?ward=${wardSlug(x.ward_code)}`}
              className={`rounded-full px-3 py-1 font-[family-name:var(--font-bricolage)] text-sm font-medium shadow-[0_0_0_1px_rgba(43,48,51,.14)] ${x.ward_code === code ? "bg-[#ee7454] text-white" : "bg-white hover:text-[#ee7454]"}`}>
              {x.ward_code}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={inr(budget - spent)} label={L(`budget left of ${inr(budget)}`, `${inr(budget)} के बजट में से बाकी`, `${inr(budget)} बजेटपैकी शिल्लक`)} bad={budget - spent < 0} />
        <Stat value={fmt(highRisk.size)} label={L("high-confidence bills to review", "जाँचने लायक पक्के संदिग्ध बिल", "तपासण्याजोगी ठोस संशयित बिले")} bad={highRisk.size > 0} />
        <Stat value={fmt(open)} label={L("complaints still waiting", "शिकायतें अब भी लंबित", "तक्रारी अजून प्रलंबित")} />
        <Stat value={fmt(pending)} label={L("accidents while a repair waited", "मरम्मत के इंतज़ार में हुए हादसे", "दुरुस्तीच्या प्रतीक्षेत झालेले अपघात")} bad={pending > 0} />
      </div>

      <AdminWorkspace data={workspace} />
    </>
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <PageShell>
      <Suspense fallback={<div className="h-40" />}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </PageShell>
  );
}
