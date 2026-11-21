"use client";

import Link from "next/link";
import { say, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/lang-client";
import type { AuditFlagsData, WardSimulatorEntry } from "./audit";
import { formatInrShort } from "./format";

const TILE = "rounded-2xl bg-white px-4 pt-3 pb-4 shadow-[0_0_0_1px_rgba(43,48,51,.12)]";
const LABEL = "text-[11.5px] font-semibold uppercase tracking-[.08em] text-[#4a4f52]";
const BIG = "text-[clamp(22px,2.2vw,30px)] font-extrabold leading-none tracking-[-.035em] tabular-nums";

// Header stat tiles: recoverable money, spend vs budget, suspicious bills —
// citywide or for the selected ward. Audit simulation on synthetic data.
export default function KpiTicker({
  audit,
  wardSim,
  wardName,
  lang: langProp,
}: {
  audit: AuditFlagsData | null;
  wardSim: WardSimulatorEntry | null;
  wardName?: string;
  lang?: Lang;
}) {
  const clientLang = useLang();
  const L = say(langProp ?? clientLang);
  if (!audit) {
    return <div className={`${TILE} flex-none text-[14px] text-[#4a4f52]`}>{L("Audit data isn't in the database yet.", "ऑडिट डेटा अभी डेटाबेस में नहीं है।", "ऑडिट डेटा अजून डेटाबेसमध्ये नाही.")}</div>;
  }

  const recoverable = wardSim
    ? audit.summary.by_ward[wardSim.ward_code]?.total_recoverable_inr ?? 0
    : audit.summary.citywide_total_recoverable_inr;
  const flagged = wardSim
    ? audit.summary.by_ward[wardSim.ward_code]?.flagged_orders ?? 0
    : audit.summary.flagged_orders;
  const budget = wardSim ? wardSim.monsoon_budget_inr_2025 : audit.summary.total_budget_inr;
  const spend = wardSim ? wardSim.spend_to_date_inr : audit.summary.total_spend_inr;
  const spentPct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0;
  const scope = wardName ? `${L("Ward", "वार्ड", "वॉर्ड")} ${wardName}` : L("All wards", "सभी वार्ड", "सर्व वॉर्ड");

  return (
    <div className="grid flex-none grid-cols-2 gap-2 lg:grid-cols-[1fr_1.5fr_1fr]">
      <Link
        href="/audit"
        className={`${TILE} group transition-shadow hover:shadow-[0_0_0_2px_#ee7454] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee7454]`}
      >
        <div className={LABEL}>
          {L("Recoverable", "वसूली योग्य", "वसूल करण्याजोगे")} · {scope} <span className="text-[#ee7454] transition-transform group-hover:translate-x-0.5">→</span>
        </div>
        <div className={`${BIG} mt-1.5 text-[#ee7454]`}>{formatInrShort(recoverable)}</div>
      </Link>

      <div className={`${TILE} relative order-last col-span-2 lg:order-none lg:col-span-1`}>
        <div className="flex items-baseline justify-between gap-2">
          <span className={LABEL}>{L("Spent of budget", "बजट में से खर्च", "बजेटपैकी खर्च")} · {scope}</span>
          <span className="text-[13px] font-semibold tabular-nums text-[#4a4f52]">{spentPct.toFixed(0)}%</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className={BIG}>{formatInrShort(spend)}</span>
          <span className="text-[14px] font-medium tabular-nums text-[#4a4f52]">/ {formatInrShort(budget)}</span>
        </div>
        <div className="absolute inset-x-4 bottom-2 h-1.5 overflow-hidden rounded-[4px] bg-[#efe7dd]">
          <div className="h-full rounded-[4px] bg-[#2b3033] transition-[width] duration-700" style={{ width: `${spentPct}%` }} />
        </div>
      </div>

      <div className={TILE}>
        <div className={LABEL}>{L("Suspicious bills", "संदिग्ध बिल", "संशयास्पद बिले")} · {scope}</div>
        <div className={`${BIG} mt-1.5`}>{flagged}</div>
      </div>
    </div>
  );
}
