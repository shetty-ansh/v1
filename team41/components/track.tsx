import Link from "next/link";
import { flagName, issue, method, say, t, type Lang } from "@/lib/i18n";
import { inr, wardSlug, type Complaint, type Flag, type Rupee, type WO } from "@/lib/rupee";

// Visual pieces for /track: story cards, a repair journey, and a road's history strip.
const CARD = "rounded-2xl bg-white shadow-[0_0_0_1px_rgba(43,48,51,.12),0_18px_40px_-26px_rgba(0,0,0,.35)]";
const B = "font-[family-name:var(--font-bricolage)]";
const GREEN = "#0ca30c", ORANGE = "#ec835a", RED = "#d03b3b", BLUE = "#2a78d6", GREY = "#9aa3ad";

// One rule for a work order's status, used by the road strip dots and the journey banner alike:
// any audit flag wins (red), then a fix that failed within 30 days (orange), else it lasted (green).
export type Outcome = "flagged" | "failed" | "held";
export const outcomeOf = (w: WO): Outcome => (w[8] ? "flagged" : w[7] === "Y" ? "failed" : "held");
const OUTCOME_COLOUR: Record<Outcome, string> = { flagged: RED, failed: ORANGE, held: GREEN };

/* ---------- story cards (the showcase) ---------- */
export function StoryCards({ D, lang }: { D: Rupee; lang: Lang }) {
  const over = D.flags.find((f) => f.work_order_id === "WO25-01005");
  const sv = Object.values(D.W).filter((w) => w[1] === "SV Road");
  const svFailed = sv.filter((w) => w[7] === "Y").length;
  const stories: { q: string; key: Parameters<typeof t>[1]; color: string; icon: string; sub: string }[] = [
    { q: "BMC25-000276", key: "ex_held", color: GREEN, icon: "✓", sub: "Andheri East · खड्डा" },
    { q: "BMC25-000295", key: "ex_failed", color: ORANGE, icon: "↺", sub: "SV Road · खड्डे पुन्हा उखडले" },
    { q: "BMC25-000254", key: "ex_never", color: GREY, icon: "…", sub: "Malad West · पानी भर गया" },
    { q: "WO25-02462", key: "ex_double", color: RED, icon: "×2", sub: `Powai · ${inr(D.flags.find((f) => f.work_order_id === "WO25-02462")?.cost_inr ?? 0)}` },
    { q: "WO25-01005", key: "ex_over", color: RED, icon: `${over?.ratio ?? 3}×`, sub: "Marve Road · " + inr(over?.cost_inr ?? 0) },
    { q: "SV Road", key: "ex_road", color: BLUE, icon: "▦", sub: `SV Road · ${sv.length} · ${inr(sv.reduce((x, w) => x + w[4], 0))} · ${svFailed} ↺` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {stories.map((s) => (
        <Link key={s.q} href={`/track?q=${encodeURIComponent(s.q)}`}
          className={`${CARD} group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5`}>
          <span className={`${B} grid size-11 flex-none place-items-center rounded-xl text-lg font-semibold text-white`} style={{ background: s.color }}>{s.icon}</span>
          <span className="min-w-0">
            <span className={`${B} block font-semibold leading-tight group-hover:text-[#ee7454]`}>{t(lang, s.key)}</span>
            <span className="block truncate text-sm text-[#4a4f52]">{s.sub}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ---------- the journey of one complaint / work order ---------- */
function hoursBetween(a: string, b: string) {
  return (new Date(b.replace(" ", "T")).getTime() - new Date(a.replace(" ", "T")).getTime()) / 36e5;
}

export function Journey({ lang, complaint, cid, woId, wo, flags = [] }: { lang: Lang; complaint?: Complaint; cid?: string; woId?: string; wo?: WO; flags?: Flag[] }) {
  const T = (k: Parameters<typeof t>[1]) => t(lang, k);
  // verdict
  let verdict: string, color: string, icon: string;
  let outcomeNote = "";
  if (wo) {
    const failed = wo[7] === "Y";
    verdict = failed ? T("v_failed") : T("v_held"); icon = failed ? "↺" : "✓";
    color = OUTCOME_COLOUR[outcomeOf(wo)];
    // A billing problem is the real story, so it leads (English only; translations come later).
    const dbl = flags.find((f) => f.flag === "Possible double billing");
    const over = flags.find((f) => f.flag === "Over-billed");
    const dlp = flags.find((f) => f.flag === "Paid during DLP");
    const L = say(lang);
    if (dbl) { verdict = L(`Possible double bill: same job as ${dbl.twin}, ${dbl.gap_days} day${dbl.gap_days === 1 ? "" : "s"} apart`, `संभावित दोहरा बिल: ${dbl.twin} जैसा ही काम, ${dbl.gap_days} दिन के अंतर पर`, `संभाव्य दुहेरी बिल: ${dbl.twin} सारखेच काम, ${dbl.gap_days} दिवसांच्या अंतराने`); icon = "×2"; }
    else if (over) { verdict = L(`Billed ${over.ratio}× the rate card (expected about ${inr(over.expected_inr ?? 0)})`, `सामान्य दर से ${over.ratio}× बिल (अपेक्षित लगभग ${inr(over.expected_inr ?? 0)})`, `सामान्य दराच्या ${over.ratio}× बिल (अपेक्षित सुमारे ${inr(over.expected_inr ?? 0)})`); icon = `${over.ratio}×`; }
    else if (dlp) { verdict = L(`BMC paid ${inr(wo[4])} while the road was under warranty`, `सड़क गारंटी में थी, फिर भी BMC ने ${inr(wo[4])} चुकाए`, `रस्ता हमी कालावधीत असताना BMC ने ${inr(wo[4])} दिले`); icon = "₹"; }
    else if (wo[8]) { verdict = L(`Flagged: ${wo[8]}`, `संदिग्ध: ${wo[8]}`, `संशयास्पद: ${wo[8]}`); icon = "!"; }
    if (wo[8]) outcomeNote = failed
      ? L("The repair itself failed within 30 days.", "मरम्मत खुद 30 दिन में टूट गई।", "दुरुस्ती स्वतः 30 दिवसांत तुटली.")
      : L("The repair itself lasted 30+ days.", "मरम्मत खुद 30+ दिन टिकी।", "दुरुस्ती स्वतः 30+ दिवस टिकली.");
  } else {
    const st = complaint?.[4] ?? "";
    verdict = st.startsWith("Closed - Duplicate") ? T("v_dup") : st.startsWith("Forwarded") || st.startsWith("Rejected") ? T("v_fwd") : T("v_never");
    color = GREY; icon = "…";
  }
  const steps: { label: string; when?: string; state: "done" | "good" | "bad" | "todo" }[] = [];
  const firstC = complaint?.[1] ?? wo?.[9];
  if (firstC) steps.push({ label: T("st_complaint"), when: firstC.slice(0, 10), state: "done" });
  else if (wo) steps.push({ label: say(lang)("No complaint behind this job", "इस काम के पीछे कोई शिकायत नहीं", "या कामामागे कोणतीही तक्रार नाही"), state: "bad" });
  if (wo) {
    steps.push({ label: T("st_assigned"), when: wo[10].slice(0, 10), state: "done" });
    steps.push({ label: T("st_started"), when: wo[11].slice(0, 10), state: "done" });
    steps.push({ label: wo[6] === "Y" ? T("st_done") : `${T("st_done")} ${say(lang)("(late)", "(देर से)", "(उशिरा)")}`, when: wo[12].slice(0, 10), state: wo[6] === "Y" ? "good" : "bad" });
    steps.push({ label: T("st_30"), state: wo[7] === "Y" ? "bad" : "good" });
  } else {
    [T("st_assigned"), T("st_done"), T("st_30")].forEach((l) => steps.push({ label: l, state: "todo" }));
  }
  const dot = { done: BLUE, good: GREEN, bad: RED, todo: "#d6dadd" };
  const took = wo ? hoursBetween(wo[9] || wo[10], wo[12]) : 0;
  const photo = wo?.[13] && wo[13] !== "nan" ? wo[13] : "";

  return (
    <div className={`${CARD} overflow-hidden`}>
      {/* verdict banner */}
      <div className="flex items-center gap-4 px-5 py-4 text-white" style={{ background: color }}>
        <span className={`${B} grid size-12 flex-none place-items-center rounded-full bg-white/25 text-2xl font-semibold`}>{icon}</span>
        <div className="min-w-0">
          <div className={`${B} text-[clamp(20px,2.4vw,28px)] font-semibold leading-tight`}>{verdict}</div>
          <div className="text-sm text-white/90">
            {cid && <>{cid} · </>}{woId && <>{woId} · </>}{t(lang, "ward")} {complaint?.[0] || wo?.[0]}
            {(complaint?.[2]) && <> · {issue(lang, complaint[2])}</>}
            {outcomeNote && <> · {outcomeNote}</>}
          </div>
        </div>
      </div>

      <div className="p-5">
        {complaint && <p className="text-[19px] leading-snug">“{complaint[5]}”</p>}

        {/* stepper */}
        <ol className="mt-5 grid grid-flow-col auto-cols-fr">
          {steps.map((s, i) => (
            <li key={i} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className="absolute right-1/2 top-[13px] h-[3px] w-full" style={{ background: s.state === "todo" ? "#e5e7ea" : dot[steps[i - 1].state === "todo" ? "todo" : "done"] }} aria-hidden="true" />}
              <span className="relative z-10 grid size-7 place-items-center rounded-full text-xs font-bold text-white ring-4 ring-white" style={{ background: dot[s.state] }}>
                {s.state === "good" ? "✓" : s.state === "bad" ? "!" : s.state === "done" ? i + 1 : ""}
              </span>
              <span className={`${B} mt-2 text-[13px] font-semibold leading-tight sm:text-sm`}>{s.label}</span>
              {s.when && <span className="text-xs text-[#4a4f52]">{s.when}</span>}
            </li>
          ))}
        </ol>

        {wo ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Fact label={T("fx_contractor")} value={wo[3]} />
              <Fact label={T("fx_cost")} value={inr(wo[4])} />
              <Fact label={T("fx_took")} value={took >= 24 ? `${(took / 24).toFixed(1)} ${T("days")}` : `${Math.round(took)} ${T("hours")}`} />
              <Fact label={T("fx_ontime")} value={wo[6] === "Y" ? T("yes") : T("no")} tone={wo[6] === "Y" ? "good" : "bad"} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {photo && <Note icon="📷" label={T("fx_photo")} text={photo} />}
              {wo[15] && <Note icon="🛠" label={T("fx_remark")} text={`“${wo[15]}” · ${method(lang, wo[2])}`} />}
            </div>
            {wo[8] && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#fde8e1] px-4 py-3 text-[#9a3412]">
                <b className={B}>⚠ {T("audit")}:</b>
                {wo[8].split(", ").map((f) => <span key={f} className="rounded-full bg-white/70 px-2.5 py-0.5 text-sm">{flagName(lang, f)}</span>)}
                {flags.find((f) => f.twin) && (
                  <Link className="ml-auto text-sm font-semibold underline" href={`/track?q=${flags.find((f) => f.twin)!.twin}`}>{say(lang)("Open the original job", "मूल काम खोलें", "मूळ काम उघडा")} {flags.find((f) => f.twin)!.twin} →</Link>
                )}
                <Link className={`${flags.find((f) => f.twin) ? "" : "ml-auto "}text-sm underline`} href={`/ward/${wardSlug(wo[0])}`}>{T("ward_report")} →</Link>
              </div>
            )}
          </>
        ) : (
          <p className="mt-6 rounded-xl bg-[#faf3eb] px-4 py-3">{T("never_do")}</p>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-xl bg-[#faf3eb] px-4 py-3">
      <div className="text-xs uppercase tracking-[.06em] text-[#4a4f52]">{label}</div>
      <div className={`${B} mt-1 font-semibold leading-tight ${tone === "good" ? "text-[#15803d]" : tone === "bad" ? "text-[#c2410c]" : ""}`}>{value}</div>
    </div>
  );
}
function Note({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-dashed border-[rgba(43,48,51,.2)] px-4 py-3">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <div><div className="text-xs uppercase tracking-[.06em] text-[#4a4f52]">{label}</div><div className="text-[15px]">{text}</div></div>
    </div>
  );
}

/* ---------- a road's history as a strip of dots ---------- */
export function RoadStory({ D, lang, road, ids }: { D: Rupee; lang: Lang; road: string; ids: string[] }) {
  const T = (k: Parameters<typeof t>[1]) => t(lang, k);
  const jobs = ids.map((id) => ({ id, w: D.W[id] })).sort((a, b) => a.w[12].localeCompare(b.w[12]));
  const start = new Date("2025-06-01").getTime(), end = new Date("2025-10-16").getTime();
  const pos = (d: string) => Math.min(100, Math.max(0, ((new Date(d.slice(0, 10)).getTime() - start) / (end - start)) * 100));
  const colorOf = (w: WO) => OUTCOME_COLOUR[outcomeOf(w)];
  const lasted = jobs.filter((j) => j.w[7] === "N").length;
  const flagged = jobs.filter((j) => j.w[8]).length;
  const months = T("months").split("|");
  const rowOf = new Map<string, number>();
  const lastX: number[] = [];
  for (const j of jobs) { const x = pos(j.w[12]); let r = 0; while (lastX[r] !== undefined && x - lastX[r] < 1.6) r++; lastX[r] = x; rowOf.set(j.id, r); }
  const rows = Math.max(1, ...[...rowOf.values()].map((r) => r + 1));
  return (
    <div className={`${CARD} p-5`}>
      <h2 className={`${B} text-[clamp(22px,2.6vw,32px)] font-semibold tracking-[-.02em]`}>{road}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Fact label={T("r_jobs")} value={String(jobs.length)} />
        <Fact label={T("r_spent")} value={inr(jobs.reduce((s, j) => s + j.w[4], 0))} />
        <Fact label={T("r_lasted")} value={`${Math.round((100 * lasted) / Math.max(1, jobs.length))}%`} tone={lasted / jobs.length >= 0.75 ? "good" : "bad"} />
        <Fact label={T("r_flagged")} value={String(flagged)} tone={flagged ? "bad" : undefined} />
      </div>
      <div className="mt-6 text-sm text-[#4a4f52]">{T("r_strip")}</div>
      <div className="relative mt-2 rounded-xl bg-[#faf3eb] px-3" style={{ height: 28 + rows * 22 }}>
        {jobs.map((j) => (
          <Link key={j.id} href={`/track?q=${j.id}`} title={`${j.id} · ${method(lang, j.w[2])} · ${inr(j.w[4])}`}
            className="absolute size-4 -translate-x-1/2 rounded-full ring-2 ring-white transition-transform hover:scale-150"
            style={{ left: `calc(12px + (100% - 24px) * ${pos(j.w[12]) / 100})`, top: 12 + (rowOf.get(j.id) ?? 0) * 22, background: colorOf(j.w) }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between px-3 text-xs text-[#4a4f52]">{months.map((m) => <span key={m}>{m}</span>)}</div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span><i className="mr-1 inline-block size-2.5 rounded-full" style={{ background: GREEN }} />{t(lang, "w_held")}</span>
        <span><i className="mr-1 inline-block size-2.5 rounded-full" style={{ background: ORANGE }} />{t(lang, "w_failed_s")}</span>
        <span><i className="mr-1 inline-block size-2.5 rounded-full" style={{ background: RED }} />{t(lang, "w_flagged_s")}</span>
        <span className="text-[#4a4f52]">· {T("r_click")}</span>
      </div>
    </div>
  );
}
