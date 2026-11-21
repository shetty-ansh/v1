"use client";

import { useMemo, useState } from "react";
import type { AuditFlagsData } from "../map/audit";
import { formatInrShort } from "../map/format";
import { say, type Lang } from "@/lib/i18n";
import { Columns, HBars, ShareBar, type Datum } from "./charts";

const CARD =
  "rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(43,48,51,.14),0_18px_40px_-24px_rgba(0,0,0,.35)]";
const H = "font-[family-name:var(--font-bricolage)] text-[20px] font-extrabold leading-tight tracking-[-.025em]";
const SUB = "mt-1 mb-5 text-[14px] text-[#4a4f52]";
const NUM = "font-[family-name:var(--font-bricolage)] font-extrabold tabular-nums tracking-[-.03em]";

const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  hi: ["जन", "फ़र", "मार्च", "अप्रै", "मई", "जून", "जुला", "अग", "सितं", "अक्टू", "नवं", "दिसं"],
  mr: ["जाने", "फेब्रु", "मार्च", "एप्रि", "मे", "जून", "जुलै", "ऑग", "सप्टें", "ऑक्टो", "नोव्हें", "डिसें"],
};
const short = (n: string) => n.replace(" (synthetic)", "");
const axisCr = (v: number) => (v === 0 ? "0" : v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : `${Math.round(v / 1e5)}L`);

// Visual-first view of recoverable ("wasted") repair money. Audit simulation
// on synthetic data — numbers come from scripts/build_audit_data.py.
export default function WastedMoney({ audit, lang }: { audit: AuditFlagsData; lang: Lang }) {
  const L = say(lang);
  const { summary, flags } = audit;
  // Flag reasons in plain words (label + one-line help), per language.
  const REASON: Record<string, { label: string; help: string }> = {
    DLP_VIOLATION: { label: L("Warranty ignored", "वारंटी की अनदेखी", "हमीकडे दुर्लक्ष"), help: L("road still under warranty", "सड़क अभी वारंटी में थी", "रस्ता अजून हमी कालावधीत होता") },
    OVERBILLED: { label: L("Overcharged", "ज़्यादा बिल", "जास्त बिल"), help: L("well above the normal price", "सामान्य दर से बहुत ज़्यादा", "सामान्य दरापेक्षा खूप जास्त") },
    DOUBLE_BILLED: { label: L("Billed twice", "दो बार बिल", "दोनदा बिल"), help: L("same job billed again", "वही काम दोबारा बिल किया", "तेच काम पुन्हा बिल केले") },
  };
  const bills = (n: number) => `${n} ${L(n === 1 ? "bill" : "bills", "बिल", n === 1 ? "बिल" : "बिले")}`;
  const susp = (n: number) => `${n} ${L(n === 1 ? "suspicious bill" : "suspicious bills", "संदिग्ध बिल", n === 1 ? "संशयास्पद बिल" : "संशयास्पद बिले")}`;
  const [ward, setWard] = useState<string | null>(null);

  const scoped = useMemo(() => (ward ? flags.filter((f) => f.ward_code === ward) : flags), [flags, ward]);

  const reasons: Datum[] = useMemo(
    () =>
      (["DLP_VIOLATION", "OVERBILLED", "DOUBLE_BILLED"] as const).map((r) => {
        const hit = scoped.filter((f) => f.flag_reasons.includes(r));
        const v = hit.reduce((s, f) => s + f.recoverable_inr, 0);
        return {
          key: r,
          label: REASON[r].label,
          value: v,
          valueLabel: formatInrShort(v),
          detail: `${bills(hit.length)} · ${REASON[r].help}`,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoped, lang],
  );

  const wards: Datum[] = useMemo(
    () =>
      Object.entries(summary.by_ward)
        .sort((a, b) => b[1].total_recoverable_inr - a[1].total_recoverable_inr)
        .map(([code, w]) => ({
          key: code,
          label: code,
          value: w.total_recoverable_inr,
          valueLabel: formatInrShort(w.total_recoverable_inr),
          detail: susp(w.flagged_orders),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary, lang],
  );

  const months: Datum[] = useMemo(() => {
    const m = new Map<string, { v: number; n: number }>();
    for (const f of scoped) {
      const k = f.assigned_at?.slice(0, 7);
      if (!k) continue;
      const cur = m.get(k) ?? { v: 0, n: 0 };
      cur.v += f.recoverable_inr;
      cur.n += 1;
      m.set(k, cur);
    }
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, { v, n }]) => ({
        key: k,
        label: MONTHS[lang][Number(k.slice(5, 7)) - 1] ?? k,
        value: v,
        valueLabel: formatInrShort(v),
        detail: `${bills(n)} · ${k.slice(0, 4)}`,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, lang]);

  const contractors: Datum[] = useMemo(() => {
    const m = new Map<string, { name: string; v: number; n: number }>();
    for (const f of scoped) {
      const cur = m.get(f.contractor_id) ?? { name: short(f.contractor_name), v: 0, n: 0 };
      cur.v += f.recoverable_inr;
      cur.n += 1;
      m.set(f.contractor_id, cur);
    }
    return [...m.entries()]
      .sort((a, b) => b[1].v - a[1].v)
      .slice(0, 6)
      .map(([id, c]) => ({ key: id, label: c.name, value: c.v, valueLabel: formatInrShort(c.v), detail: susp(c.n) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, lang]);

  const total = summary.citywide_total_recoverable_inr;
  const share = summary.total_spend_inr > 0 ? (total / summary.total_spend_inr) * 100 : 0;
  const wardWord = L("Ward", "वार्ड", "वॉर्ड");
  const scopeLabel = ward ? `${wardWord} ${ward}` : L("all wards", "सभी वार्ड", "सर्व वॉर्ड");

  const emptyText = L("No suspicious bills here.", "यहाँ कोई संदिग्ध बिल नहीं।", "इथे कोणतेही संशयास्पद बिल नाही.");

  return (
    <>
      {/* Hero */}
      <p className="font-[family-name:var(--font-bricolage)] text-[13px] font-bold uppercase tracking-[.14em] text-[#ee7454]">
        {L("Wasted money · audit simulation", "बर्बाद पैसा · ऑडिट सिमुलेशन", "वाया गेलेला पैसा · ऑडिट सिम्युलेशन")}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-bricolage)] text-[clamp(40px,7vw,92px)] font-extrabold leading-[.92] tracking-[-.05em]">
        <span className="text-[#ee7454]">{formatInrShort(total)}</span>
        <span className="block text-[.55em] tracking-[-.04em]">{L("can be recovered.", "वसूल किए जा सकते हैं।", "वसूल करता येतील.")}</span>
      </h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tile value={wards[0] ? `${wardWord} ${wards[0].key}` : "—"} label={`${L("biggest leak", "सबसे बड़ा रिसाव", "सर्वात मोठी गळती")}${wards[0] ? ` · ${wards[0].valueLabel}` : ""}`} accent />
        <Tile value={`${summary.flagged_orders} / ${summary.total_work_orders.toLocaleString("en-IN")}`} label={L("repair bills flagged", "मरम्मत बिल चिह्नित", "दुरुस्ती बिले चिन्हांकित")} />
        <Tile value={`${share.toFixed(0)}%`} label={L("of all repair spend", "कुल मरम्मत खर्च का", "एकूण दुरुस्ती खर्चाचा")} />
      </div>
      <div className={`${CARD} mt-3`}>
        <ShareBar
          part={total}
          whole={summary.total_spend_inr}
          partLabel={`${L("Recoverable", "वसूली योग्य", "वसूल करण्याजोगे")} ${formatInrShort(total)}`}
          restLabel={`${L("Total spend", "कुल खर्च", "एकूण खर्च")} ${formatInrShort(summary.total_spend_inr)}`}
        />
      </div>

      {/* Where */}
      <section className={`${CARD} mt-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={H}>{L("Where · by ward", "कहाँ · वार्ड के अनुसार", "कुठे · वॉर्डनुसार")}</h2>
          {ward && (
            <button
              type="button"
              onClick={() => setWard(null)}
              className="rounded-full bg-[#2b3033] px-3 py-1 text-[12.5px] font-medium text-white hover:bg-[#ee7454]"
            >
              {wardWord} {ward} ✕
            </button>
          )}
        </div>
        <p className={SUB}>{L("Tap a ward to filter the whole page.", "पूरा पेज छाँटने के लिए किसी वार्ड पर टैप करें।", "संपूर्ण पान गाळण्यासाठी वॉर्डवर टॅप करा.")}</p>
        <Columns
          data={wards}
          height={200}
          axisFormat={axisCr}
          selected={ward}
          onSelect={(k) => setWard((w) => (w === k ? null : k))}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Why */}
        <section className={CARD}>
          <h2 className={H}>{L("Why", "क्यों", "का")} · {scopeLabel}</h2>
          <p className={SUB}>{L("A bill can break more than one rule.", "एक बिल एक से ज़्यादा नियम तोड़ सकता है।", "एक बिल एकापेक्षा जास्त नियम मोडू शकते.")}</p>
          <HBars data={reasons} />
        </section>

        {/* When */}
        <section className={CARD}>
          <h2 className={H}>{L("When", "कब", "कधी")} · {scopeLabel}</h2>
          <p className={SUB}>{L("By month the work was ordered.", "जिस महीने काम सौंपा गया, उसके अनुसार।", "काम ज्या महिन्यात दिले त्यानुसार.")}</p>
          {months.length ? <Columns data={months} height={150} axisFormat={axisCr} /> : <Empty text={emptyText} />}
        </section>
      </div>

      {/* Who */}
      <section className={`${CARD} mt-6`}>
        <h2 className={H}>{L("Who · top contractors", "कौन · प्रमुख ठेकेदार", "कोण · प्रमुख कंत्राटदार")}, {scopeLabel}</h2>
        <p className={SUB}>{L("Recoverable money on their bills.", "उनके बिलों पर वसूली योग्य पैसा।", "त्यांच्या बिलांवरील वसूल करण्याजोगा पैसा.")}</p>
        {contractors.length ? <HBars data={contractors} /> : <Empty text={emptyText} />}
      </section>

    </>
  );
}

function Tile({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-[0_0_0_1px_rgba(43,48,51,.10)]">
      <div className={`${NUM} text-[clamp(28px,3.2vw,40px)] leading-none ${accent ? "text-[#ee7454]" : "text-[#2b3033]"}`}>{value}</div>
      <div className="mt-2 font-[family-name:var(--font-bricolage)] text-[14px] font-medium uppercase tracking-[.06em] text-[#4a4f52]">{label}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-[14px] text-[#4a4f52]">{text}</p>;
}
