import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import PageShell, { H1, LABEL, MUTED } from "@/components/page-shell";
import PlanBoard, { PlanWardMap } from "@/components/plan-board";
import { loadRoads, loadWardOutlines, loadWards } from "@/app/map/data";
import { method, say } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { inr, loadRupee, wardFromSlug, wardSlug } from "@/lib/rupee";

export const metadata = { title: "Next rupee · Follow the Rupee" };

const B = "font-[family-name:var(--font-bricolage)]";
const CARD = "rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(43,48,51,.12),0_18px_40px_-26px_rgba(0,0,0,.35)]";

async function Plan({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const [sp, D, outlines, mapWards, roads] = await Promise.all([searchParams, loadRupee(), loadWardOutlines(), loadWards(), loadRoads()]);
  const lang = await getLang(sp.lang);
  const L = say(lang);
  const wardWord = L("Ward", "वार्ड", "वॉर्ड");
  const wanted = wardFromSlug(String(sp.ward ?? "L"));
  const w = D.wards.find((x) => x.ward_code === wanted) ?? D.wards.find((x) => x.ward_code === "L")!;
  const p = w.next_rupee;

  // city view: who is short and who has money to spare
  const city = D.wards
    .map((x) => {
      const have = Math.max(x.next_rupee.budget_left_inr, 0) + x.next_rupee.recoverable_inr;
      return { code: x.ward_code, name: x.ward_name, have, need: x.next_rupee.plan_total_inr, gap: have - x.next_rupee.plan_total_inr, over: x.next_rupee.budget_left_inr < 0 };
    })
    .sort((a, b) => a.gap - b.gap);
  const pothole = D.summary.method_economics?.["Pothole"] ?? [];
  const water = D.summary.method_economics?.["Waterlogging"] ?? [];

  return (
    <>
      <h1 className={`${H1}`}>{L("Where should the next rupee go?", "अगला रुपया कहाँ जाए?", "पुढचा रुपया कुठे जावा?")}</h1>

      <div className="relative mt-5 h-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(43,48,51,.14),0_18px_40px_-24px_rgba(0,0,0,.35)]">
        <PlanWardMap wards={mapWards} outlines={outlines} roads={roads} selected={w.ward_code} />
      </div>
      <p className={`mt-2 text-sm ${MUTED}`}>{L("Click a ward on the map.", "नक्शे पर किसी वार्ड पर क्लिक करें।", "नकाशावरील वॉर्डवर क्लिक करा.")}</p>

      <div className="mx-auto mt-8 max-w-[820px]">
        <div className={LABEL}>{wardWord} {w.ward_code}</div>
        <h2 className={`${B} mt-1 mb-3 text-[clamp(24px,2.8vw,34px)] font-semibold leading-tight tracking-[-.02em] [overflow-wrap:anywhere]`}>{w.ward_name}</h2>
        <PlanBoard key={w.ward_code} ward={`${wardWord} ${w.ward_code}`} lang={lang} items={p.items} left={p.budget_left_inr} recoverable={p.recoverable_inr} />

        <div className="mt-8 space-y-3">
          <details className={`${CARD} group`}>
            <summary className={`${B} cursor-pointer list-none font-semibold`}>{L("Why these repair methods?", "मरम्मत के यही तरीके क्यों?", "दुरुस्तीच्या याच पद्धती का?")} <span className={`font-normal ${MUTED}`}>{L("(cost per fix that lasts)", "(टिकने वाली हर मरम्मत की लागत)", "(टिकणाऱ्या प्रत्येक दुरुस्तीचा खर्च)")}</span></summary>
            <p className={`mt-2 text-sm ${MUTED}`}>{L("Average cost ÷ share of jobs that did not fail within 30 days.", "औसत लागत ÷ उन कामों का हिस्सा जो 30 दिनों में नहीं टूटे।", "सरासरी खर्च ÷ 30 दिवसांत न तुटलेल्या कामांचा वाटा.")}</p>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {[[L("Potholes", "गड्ढे", "खड्डे"), pothole], [L("Waterlogging", "जलभराव", "पाणी साचणे"), water]].map(([label, rows]) => (
                <table key={label as string} className="w-full text-sm">
                  <caption className="pb-1 text-left text-sm font-semibold">{label as string}</caption>
                  <tbody>
                    {(rows as typeof pothole).map((r, k) => (
                      <tr key={r.method} className="border-t border-[rgba(43,48,51,.1)]">
                        <td className="py-1.5 pr-2">{k === 0 && "✓ "}{method(lang, r.method)}</td>
                        <td className={`whitespace-nowrap py-1.5 pr-2 text-right text-xs ${MUTED}`}>{r.fail_pct}% {L("fail", "टूटे", "तुटल्या")}</td>
                        <td className={`${B} whitespace-nowrap py-1.5 text-right font-semibold tabular-nums ${k === 0 ? "text-[#15803d]" : ""}`}>{inr(r.cost_per_lasting_fix_inr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
            <p className={`mt-3 text-sm ${MUTED}`}>{L("Cold mix is cheapest per lasting pothole fix, but fails more often. On ambulance, flood-prone and busy roads a failure costs more than money, so the plan uses the most durable method.", "टिकने वाली गड्ढा-मरम्मत के हिसाब से कोल्ड मिक्स सबसे सस्ता है, पर ज़्यादा बार टूटता है। एम्बुलेंस, बाढ़-प्रवण और व्यस्त सड़कों पर टूटने की क़ीमत पैसे से ज़्यादा है, इसलिए योजना सबसे टिकाऊ तरीका अपनाती है।", "टिकणाऱ्या खड्डा-दुरुस्तीच्या हिशोबाने कोल्ड मिक्स सर्वात स्वस्त आहे, पण जास्त वेळा तुटतो. रुग्णवाहिका, पूरप्रवण आणि वर्दळीच्या रस्त्यांवर तुटण्याची किंमत पैशांपेक्षा जास्त आहे, म्हणून योजना सर्वात टिकाऊ पद्धत वापरते.")}</p>
          </details>

          <details className={CARD}>
            <summary className={`${B} cursor-pointer list-none font-semibold`}>{L("Which wards are short?", "किन वार्डों में पैसा कम है?", "कोणत्या वॉर्डांत पैसा कमी आहे?")} <span className={`font-normal ${MUTED}`}>({city.filter((c) => c.gap < 0).length} {L("of", "/", "/")} 24)</span></summary>
            <ul className="mt-2">
              {city.slice(0, 5).map((c) => (
                <li key={c.code} className="flex items-center justify-between gap-2 border-t border-[rgba(43,48,51,.1)] py-1.5 text-sm">
                  <Link href={`/plan?ward=${wardSlug(c.code)}`} scroll={false} className="min-w-0 truncate hover:text-[#ee7454]">{c.code} · {c.name}</Link>
                  <span className={`${B} flex-none font-semibold tabular-nums ${c.gap < 0 ? "text-[#c2410c]" : "text-[#15803d]"}`}>{c.gap < 0 ? `−${inr(-c.gap)}` : `+${inr(c.gap)}`}</span>
                </li>
              ))}
            </ul>
            <p className={`mt-2 text-sm ${MUTED}`}>{L("Most room:", "सबसे ज़्यादा गुंजाइश:", "सर्वाधिक वाव:")} {city.slice(-3).reverse().map((c) => `${c.code} (+${inr(c.gap)})`).join(", ")}.</p>
          </details>
        </div>
      </div>
    </>
  );
}

export default function PlanPage(props: PageProps<"/plan">) {
  return (
    <PageShell>
      <Suspense fallback={<div className="h-40" />}>
        <Plan searchParams={props.searchParams} />
      </Suspense>
    </PageShell>
  );
}
