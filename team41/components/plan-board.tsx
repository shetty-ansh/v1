"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WardMap from "@/app/map/WardMap";
import type { Ward as MapWard } from "@/app/map/data";
import { method, say, type Lang } from "@/lib/i18n";
import type { PlanItem } from "@/lib/rupee";

// Next rupee for one ward: one answer, one money + budget card, the top 3 roads (rest on demand).

const B = "font-[family-name:var(--font-bricolage)]";
const CARD = "rounded-2xl bg-white shadow-[0_0_0_1px_rgba(43,48,51,.12),0_18px_40px_-26px_rgba(0,0,0,.35)]";
const inr = (n: number) => (Math.abs(n) >= 1e7 ? `₹${(n / 1e7).toFixed(2)} cr` : Math.abs(n) >= 1e5 ? `₹${(n / 1e5).toFixed(1)} lakh` : `₹${Math.round(n).toLocaleString("en-IN")}`);

function action(lang: Lang, i: PlanItem) {
  const L = say(lang);
  if (i.act === "dlp")
    return L("Send back to the original contractor: still under warranty, ₹0", "मूल ठेकेदार को वापस भेजें: अभी गारंटी में है, ₹0", "मूळ कंत्राटदाराकडे परत पाठवा: अजून हमी कालावधीत, ₹0");
  if (i.act === "resurface")
    return L(
      `Patch now, then resurface: fixed ${i.failed_before}× before and it kept failing`,
      `अभी पैच करें, फिर नई सतह: पहले ${i.failed_before}× मरम्मत हुई और बार-बार टूटी`,
      `आता पॅच करा, मग नवा थर: आधी ${i.failed_before}× दुरुस्ती झाली आणि वारंवार तुटली`,
    );
  const m = method(lang, i.method);
  return L(EN_ACTION[i.method] ?? `Fix with ${m.toLowerCase()}`, `${m} से मरम्मत करें`, `${m} ने दुरुस्ती करा`);
}

// Repair methods as instructions, in plain English (method names in the data are past-tense labels).
const EN_ACTION: Record<string, string> = {
  "Cold mix patch": "Patch with cold mix",
  "Hot mix patch": "Patch with hot mix",
  "Mastic asphalt": "Fix with mastic asphalt",
  "Paver blocks relaid": "Relay the paver blocks",
  "Dewatering pump deployed": "Pump out the water",
  "Drain desilting": "Clear the silt from the drain",
  "Pump + debris removal": "Pump out the water and clear debris",
  "Manhole cover replaced + grating": "Replace the manhole cover and grating",
  "Excavation, pipeline repair, PQC patch": "Dig up, repair the pipeline and patch with concrete",
  "Desilting and garbage removal": "Clear the silt and garbage",
};

// The one or two reasons that matter most, in plain words.
function why(lang: Lang, i: PlanItem): string {
  const L = say(lang);
  const r: string[] = [];
  if (i.emergency) r.push(L("ambulance route to an emergency hospital", "इमरजेंसी अस्पताल तक एम्बुलेंस का रास्ता", "आपत्कालीन रुग्णालयाकडे जाणारा रुग्णवाहिका मार्ग"));
  if (i.accidents_pending) r.push(L("an accident happened while the complaint waited", "शिकायत लंबित रहते हादसा हुआ", "तक्रार प्रलंबित असताना अपघात झाला"));
  if (r.length < 2 && i.flood_spot) r.push(L(`next to the ${i.flood_spot} flood spot`, `${i.flood_spot} जलभराव स्थल के पास`, `${i.flood_spot} पूरप्रवण ठिकाणाजवळ`));
  if (r.length < 2 && i.failed_before >= 3) r.push(L(`failed ${i.failed_before}× before`, `पहले ${i.failed_before}× टूटी`, `आधी ${i.failed_before}× तुटली`));
  if (r.length < 2 && i.school) r.push(L("main road to a school", "स्कूल तक जाने वाली मुख्य सड़क", "शाळेकडे जाणारा मुख्य रस्ता"));
  if (r.length < 2)
    r.push(L(`${i.open_complaints} open complaint${i.open_complaints === 1 ? "" : "s"}`, `${i.open_complaints} खुली शिकायत${i.open_complaints === 1 ? "" : "ें"}`, `${i.open_complaints} प्रलंबित तक्रार${i.open_complaints === 1 ? "" : "ी"}`));
  return r.slice(0, 2).join(" · ");
}

export default function PlanBoard({ ward, items, left, recoverable, lang }: { ward: string; items: PlanItem[]; left: number; recoverable: number; lang: Lang }) {
  const L = say(lang);
  const planCost = items.reduce((s, i) => s + i.est_cost_inr, 0);
  const base = Math.max(left, 0);
  const max = Math.max(planCost, base + recoverable, 1);
  const [budget, setBudget] = useState(base + recoverable);
  const [all, setAll] = useState(false);

  // which items fit in the chosen budget, in priority order; ₹0 warranty items always count as funded
  const { funded } = items.reduce(
    (acc, i) => {
      if (!i.est_cost_inr) { acc.funded.push(true); return acc; }
      acc.run += i.est_cost_inr;
      acc.funded.push(acc.run <= budget);
      return acc;
    },
    { run: 0, funded: [] as boolean[] },
  );
  const fundedCount = funded.filter(Boolean).length;
  const cutAt = funded.findIndex((f, k) => !f && items[k].est_cost_inr > 0);
  const gap = base + recoverable - planCost;
  const pctOf = (v: number) => `${Math.min(100, (100 * v) / max)}%`;
  const shown = all ? items : items.slice(0, 3);

  const answer = !items.length
    ? L(`${ward} has no open, unfixed road problems mapped right now.`, `${ward} में अभी कोई खुली, बिना मरम्मत की सड़क समस्या दर्ज नहीं है।`, `${ward} मध्ये सध्या कोणतीही प्रलंबित, दुरुस्त न झालेली रस्ता समस्या नोंदलेली नाही.`)
    : gap >= 0
      ? L(
          `${ward} can fix all ${items.length} risky roads (${inr(planCost)}) and still have ${inr(gap)} spare.`,
          `${ward} सभी ${items.length} जोखिम वाली सड़कें (${inr(planCost)}) ठीक कर सकता है और फिर भी ${inr(gap)} बचेंगे।`,
          `${ward} सर्व ${items.length} धोकादायक रस्ते (${inr(planCost)}) दुरुस्त करू शकतो आणि तरीही ${inr(gap)} शिल्लक राहतील.`,
        )
      : L(
          `${ward} is ${inr(-gap)} short of fixing its ${items.length} risky roads.`,
          `${ward} को अपनी ${items.length} जोखिम वाली सड़कें ठीक करने के लिए ${inr(-gap)} कम पड़ रहे हैं।`,
          `${ward} ला आपले ${items.length} धोकादायक रस्ते दुरुस्त करण्यासाठी ${inr(-gap)} कमी पडत आहेत.`,
        );

  return (
    <div className="space-y-5">
      <p className={`${B} text-[clamp(20px,2.2vw,26px)] font-semibold leading-snug`}>{answer}</p>

      {/* money + what-if, one card */}
      <div className={`${CARD} p-5`}>
        <div className="relative h-5 overflow-hidden rounded-full bg-[rgba(43,48,51,.08)]">
          <div className="absolute inset-y-0 left-0 bg-[#0ca30c]" style={{ width: pctOf(base) }} />
          <div className="absolute inset-y-0 border-l-2 border-white bg-[#2a78d6]" style={{ left: pctOf(base), width: pctOf(recoverable) }} />
          <div className="absolute inset-y-0 w-[3px] bg-[#2b3033]" style={{ left: `calc(${pctOf(planCost)} - 1.5px)` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#4a4f52]">
          <span><i className="mr-1.5 inline-block size-2.5 rounded-full bg-[#0ca30c]" />{L("Budget left", "बचा बजट", "उरलेले बजेट")} {inr(base)}</span>
          <span><i className="mr-1.5 inline-block size-2.5 rounded-full bg-[#2a78d6]" />{L("Recoverable from flagged bills", "चिह्नित बिलों से वसूली योग्य", "चिन्हांकित बिलांतून वसूल करण्याजोगे")} {inr(recoverable)}</span>
          <span><i className="mr-1.5 inline-block h-2.5 w-[3px] bg-[#2b3033] align-middle" /> {L("Plan", "योजना", "योजना")} {inr(planCost)}</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label htmlFor="budget" className="text-sm font-semibold">{L("Try a budget", "बजट आज़माएँ", "बजेट वापरून पाहा")}</label>
          <input id="budget" type="range" min={0} max={max} step={Math.max(1000, Math.round(max / 200))} value={budget}
            onChange={(e) => setBudget(Number(e.target.value))} className="min-w-[160px] flex-1 accent-[#ee7454]" />
          <span className={`${B} w-28 text-right text-lg font-semibold tabular-nums`}>{inr(budget)}</span>
        </div>
        <p className="mt-1 text-[15px]">
          {lang === "en" && "Fixes "}
          <b>{L(`${fundedCount} of ${items.length}`, `${items.length} में से ${fundedCount}`, `${items.length} पैकी ${fundedCount}`)}</b>
          {L(" roads", " सड़कें ठीक होंगी", " रस्ते दुरुस्त होतील")}
          {fundedCount < items.length
            ? L(`; ${items.length - fundedCount} wait for the next allocation.`, `; ${items.length - fundedCount} अगले आवंटन का इंतज़ार करेंगी।`, `; ${items.length - fundedCount} पुढील निधीची वाट पाहतील.`)
            : L(".", "।", ".")}
        </p>
      </div>

      {/* the roads */}
      <ol className="space-y-2.5">
        {shown.map((i, k) => (
          <li key={i.road_id}>
            {all && k === cutAt && (
              <div className="my-2 flex items-center gap-3 text-sm font-semibold text-[#c2410c]"><span className="h-[2px] flex-1 bg-[#c2410c]" />{L("Budget runs out here", "बजट यहाँ ख़त्म", "बजेट इथे संपते")}<span className="h-[2px] flex-1 bg-[#c2410c]" /></div>
            )}
            <div className={`${CARD} flex items-start gap-4 p-4 ${funded[k] ? "" : "opacity-55"}`}>
              <span className={`${B} grid size-9 flex-none place-items-center rounded-xl font-semibold ${funded[k] ? "bg-[#ee7454] text-white" : "bg-[rgba(43,48,51,.1)]"}`}>{k + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/track?q=${encodeURIComponent(i.road.replace(/ \(seg \d+\)$/, ""))}`} className={`${B} min-w-0 font-semibold leading-tight hover:text-[#ee7454]`}>{i.road}</Link>
                  <span className={`${B} flex-none font-semibold tabular-nums`}>{i.est_cost_inr ? inr(i.est_cost_inr) : "₹0"}</span>
                </div>
                <div className="mt-0.5 text-[15px]">{action(lang, i)}</div>
                <div className="mt-0.5 text-sm text-[#4a4f52]">{L("Why first:", "पहले क्यों:", "आधी का:")} {why(lang, i)}</div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {items.length > 3 && (
        <button onClick={() => setAll(!all)} className={`${B} rounded-full px-4 py-2 font-semibold shadow-[0_0_0_1px_rgba(43,48,51,.2)] hover:text-[#ee7454]`}>
          {all ? L("Show top 3", "शीर्ष 3 दिखाएँ", "पहिले 3 दाखवा") : L(`Show all ${items.length} roads`, `सभी ${items.length} सड़कें दिखाएँ`, `सर्व ${items.length} रस्ते दाखवा`)}
        </button>
      )}
    </div>
  );
}

// The team's ward map (app/map/WardMap), used as-is: clicking a ward opens that ward's plan.
export function PlanWardMap({ wards, outlines, roads, selected }: { wards: MapWard[]; outlines: unknown; roads: unknown; selected: string }) {
  const router = useRouter();
  return (
    <WardMap
      wards={wards}
      outlines={outlines}
      roads={roads}
      selectedCode={selected}
      onWardSelect={(code) => router.push(`/plan?ward=${code.replace("/", "-")}`, { scroll: false })}
    />
  );
}
