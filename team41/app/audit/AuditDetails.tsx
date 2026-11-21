// Bill-level detail for /audit (from the follow_the_rupee feed): the price
// chart, story cards per problem type, the officials' top-10 + CSV, and what
// is deliberately not flagged. Sits under the charts in WastedMoney.
import Link from "next/link";
import { MUTED } from "@/components/page-shell";
import { say, type Lang } from "@/lib/i18n";
import { fmt, inr, loadRupee, type Flag } from "@/lib/rupee";

const B = "font-[family-name:var(--font-bricolage)]";
const CARD = "rounded-2xl bg-white shadow-[0_0_0_1px_rgba(43,48,51,.12),0_18px_40px_-26px_rgba(0,0,0,.35)]";

type Say = ReturnType<typeof say>;

// The three checks, in plain words.
const types = (L: Say) => [
  { key: "Paid during DLP", slug: "warranty", icon: "₹",
    title: L("Paid for free repairs", "मुफ़्त मरम्मत का भुगतान", "मोफत दुरुस्तीचे पैसे दिले"),
    rule: L("The road was still under its guarantee, so the builder had to fix it for free. BMC paid anyway.", "सड़क अभी गारंटी में थी, इसलिए ठेकेदार को इसे मुफ़्त में ठीक करना था। फिर भी BMC ने भुगतान किया।", "रस्ता अजून हमी कालावधीत होता, त्यामुळे कंत्राटदाराने तो मोफत दुरुस्त करायला हवा होता. तरीही BMC ने पैसे दिले.") },
  { key: "Over-billed", slug: "overbilled", icon: "↑",
    title: L("Charged too much", "बहुत ज़्यादा बिल", "खूप जास्त बिल"),
    rule: L("The bill was well above the normal price for that job (more than 1.35 times).", "बिल उस काम के सामान्य दर से बहुत ज़्यादा था (1.35 गुना से अधिक)।", "बिल त्या कामाच्या सामान्य दरापेक्षा खूप जास्त होते (1.35 पटीपेक्षा अधिक).") },
  { key: "Possible double billing", slug: "double", icon: "×2",
    title: L("Billed twice?", "दो बार बिल?", "दोनदा बिल?"),
    rule: L("The same job on the same road by the same contractor was billed again a few days later, with no complaint behind it.", "उसी सड़क पर उसी ठेकेदार का वही काम कुछ दिन बाद फिर से बिल किया गया, बिना किसी शिकायत के।", "त्याच रस्त्यावर त्याच कंत्राटदाराचे तेच काम काही दिवसांनी पुन्हा बिल केले गेले, कोणतीही तक्रार नसताना.") },
];

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
const dateText = (lang: Lang, d?: string) => (d ? new Date(d.slice(0, 10)).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short", year: "numeric" }) : "");

// One flagged job told as a short story with a small picture, in plain words.
function Story({ f, D, lang }: { f: Flag; D: Awaited<ReturnType<typeof loadRupee>>; lang: Lang }) {
  const L = say(lang);
  const wo = D.W[f.work_order_id];
  const where = `${f.road_name}, ${L("ward", "वार्ड", "वॉर्ड")} ${f.ward_code}`;
  let title = "", body: React.ReactNode = null, picture: React.ReactNode = null;
  if (f.flag === "Over-billed") {
    const normal = f.expected_inr ?? 0, paid = f.cost_inr, top = Math.max(normal, paid);
    title = L(`Charged ${f.ratio}× the normal price`, `सामान्य दर का ${f.ratio}× बिल`, `सामान्य दराच्या ${f.ratio}× बिल`);
    body =
      lang === "hi" ? <>इस काम का सामान्य दर लगभग <b>{inr(normal)}</b> है। ठेकेदार को <b>{inr(paid)}</b> दिए गए।</>
      : lang === "mr" ? <>या कामाचा सामान्य दर सुमारे <b>{inr(normal)}</b> आहे. कंत्राटदाराला <b>{inr(paid)}</b> दिले गेले.</>
      : <>The normal price for this job is about <b>{inr(normal)}</b>. The contractor was paid <b>{inr(paid)}</b>.</>;
    picture = (
      <div className="space-y-1.5 text-sm">
        <div><div className="h-4 rounded bg-[#9fb3c8]" style={{ width: `${(100 * normal) / top}%` }} /><span className="text-[#4a4f52]">{L("Normal price", "सामान्य दर", "सामान्य दर")} {inr(normal)}</span></div>
        <div><div className="h-4 rounded bg-[#d03b3b]" style={{ width: "100%" }} /><span className="text-[#4a4f52]">{L("Paid", "भुगतान", "दिलेले")} {inr(paid)}</span></div>
      </div>
    );
  } else if (f.flag === "Possible double billing") {
    const twin = f.twin ? D.W[f.twin] : undefined;
    title = L("Same job, billed twice?", "एक ही काम, दो बार बिल?", "एकच काम, दोनदा बिल?");
    body =
      lang === "hi" ? <>उसी सड़क पर, उसी ठेकेदार का वही काम <b>{f.gap_days} दिन</b> बाद फिर से बिल किया गया। दूसरी बार किसी ने शिकायत नहीं की थी।</>
      : lang === "mr" ? <>त्याच रस्त्यावर, त्याच कंत्राटदाराचे तेच काम <b>{f.gap_days} दिवसांनी</b> पुन्हा बिल केले गेले. दुसऱ्या वेळी कोणीही तक्रार केली नव्हती.</>
      : <>The same work on the same road, by the same contractor, was billed again <b>{f.gap_days} days</b> later. Nobody had complained the second time.</>;
    picture = (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-[rgba(43,48,51,.2)] p-2"><div className="text-xs text-[#4a4f52]">{L("Bill 1", "बिल 1", "बिल 1")} · {dateText(lang, twin?.[5])}</div><div className={`${B} font-semibold`}>{inr(twin?.[4] ?? 0)}</div><div className="text-xs text-[#15803d]">{L("citizen complained", "नागरिक ने शिकायत की", "नागरिकाने तक्रार केली")}</div></div>
        <div className="rounded-lg border-2 border-[#d03b3b] p-2"><div className="text-xs text-[#4a4f52]">{L("Bill 2", "बिल 2", "बिल 2")} · {dateText(lang, wo?.[5])}</div><div className={`${B} font-semibold`}>{inr(f.cost_inr)}</div><div className="text-xs text-[#c2410c]">{L("no complaint", "कोई शिकायत नहीं", "तक्रार नाही")}</div></div>
      </div>
    );
  } else {
    title = L("Paid for a repair that should have been free", "जो मरम्मत मुफ़्त होनी चाहिए थी, उसका भुगतान", "जी दुरुस्ती मोफत व्हायला हवी होती, तिचे पैसे दिले");
    const relaid = dateText(lang, f.resurfaced ?? "");
    body =
      lang === "hi" ? <>यह सड़क <b>{relaid}</b> को दोबारा बनाई गई थी और अभी गारंटी में है, इसलिए ठेकेदार को इसे मुफ़्त में ठीक करना था। फिर भी BMC ने <b>{inr(f.cost_inr)}</b> का भुगतान किया।</>
      : lang === "mr" ? <>हा रस्ता <b>{relaid}</b> रोजी पुन्हा बांधला गेला आणि अजून हमी कालावधीत आहे, त्यामुळे कंत्राटदाराने तो मोफत दुरुस्त करायला हवा होता. तरीही BMC ने <b>{inr(f.cost_inr)}</b> दिले.</>
      : <>This road was relaid on <b>{relaid}</b> and is still under its guarantee, so the builder had to fix it for free. BMC paid <b>{inr(f.cost_inr)}</b> anyway.</>;
    picture = (
      <div className="flex items-center gap-2 text-sm">
        <span className="rounded-lg bg-[#e0f2fe] px-2 py-1 text-[#075985]">🛡 {L("Under guarantee", "गारंटी में", "हमी कालावधीत")}</span>
        <span className="text-[#4a4f52]">→</span>
        <span className="rounded-lg bg-[#fde8e1] px-2 py-1 font-semibold text-[#9a3412]">{L(`BMC paid ${inr(f.cost_inr)}`, `BMC ने ${inr(f.cost_inr)} दिए`, `BMC ने ${inr(f.cost_inr)} दिले`)}</span>
      </div>
    );
  }
  return (
    <div className={`${CARD} flex flex-col p-5`}>
      <div className={`${B} text-lg font-bold leading-tight tracking-[-.015em]`}>{title}</div>
      <div className="mt-0.5 text-sm text-[#4a4f52]">{where}</div>
      <div className="mt-4">{picture}</div>
      <p className="mt-4 flex-1 text-[15px] leading-relaxed">{body}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className={f.confidence === "High" ? "font-semibold text-[#c2410c]" : "font-semibold text-[#b45309]"}>{f.confidence === "High" ? L("Very likely", "बहुत संभव", "अत्यंत शक्य") : L("Worth checking", "जाँचने लायक", "तपासण्याजोगे")}</span>
        <Link href={`/track?q=${f.work_order_id}`} className="underline hover:text-[#ee7454]">{L("See the bill →", "बिल देखें →", "बिल पाहा →")}</Link>
      </div>
    </div>
  );
}

const H2 = `${B} text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-.035em]`;

export default async function AuditDetails({ sp, lang }: { sp: Record<string, string | string[] | undefined>; lang: Lang }) {
  const L = say(lang);
  const TYPES = types(L);
  const D = await loadRupee();
  const S = D.summary;
  const active = TYPES.find((t) => t.slug === sp.type);

  const list = D.flags
    .filter((f) => !active || f.flag === active.key)
    .sort((a, b) => b.inr_at_risk - a.inr_at_risk)
    .slice(0, 10);
  const examples = active
    ? list.slice(0, 3)
    : TYPES.map((t) => D.flags.filter((f) => f.flag === t.key).sort((a, b) => b.inr_at_risk - a.inr_at_risk)[0]).filter(Boolean);
  // Older feeds (seeded before these fields existed) lack the chart data: hide those parts instead of crashing.
  const hist = S.cost_ratio_hist ?? [];
  const peak = Math.max(1, ...hist.map((h) => h.jobs));
  const nf = S.not_flagged;
  const mid = hist.filter((h) => h.lo >= 1.3 && h.hi !== null).reduce((s, h) => s + h.jobs, 0);
  const tail = hist.length ? hist[hist.length - 1].jobs : 0;
  const wardWord = L("ward", "वार्ड", "वॉर्ड");
  const contractorsLink = <Link className="underline" href="/contractors">{L("Contractors", "ठेकेदार", "कंत्राटदार")}</Link>;

  return (
    <>
      {/* one chart: real problems vs normal variation */}
      {hist.length > 0 && nf && (
        <div className={`${CARD} mt-6 p-5`}>
          <div className={`${B} text-[20px] font-extrabold tracking-[-.025em]`}>{L("Real problems, not normal variation", "असली गड़बड़ी, सामान्य उतार-चढ़ाव नहीं", "खऱ्या समस्या, सामान्य चढउतार नव्हे")}</div>
          <p className={`mt-1 text-[15px] ${MUTED}`}>
            {lang === "hi"
              ? `हर बार कामों का एक समूह है, इस हिसाब से कि उनका बिल सामान्य दर से कैसे तुलना करता है। ज़्यादातर काम (${fmt(nf.normal_price_band)}) उससे 30% के भीतर हैं, जो सामान्य है। फिर संख्या अचानक गिर जाती है: 1.30× और 1.50× के बीच सिर्फ़ ${mid} काम, और 1.50× से ऊपर ${tail}। हम सामान्य दर से 1.35 गुना से ज़्यादा वाले बिल चिह्नित करते हैं।`
              : lang === "mr"
                ? `प्रत्येक पट्टी म्हणजे कामांचा एक गट, त्यांचे बिल सामान्य दराशी कसे तुलना करते त्यानुसार. बहुतेक कामे (${fmt(nf.normal_price_band)}) त्याच्या 30% आत आहेत, जे सामान्य आहे. मग संख्या एकदम घसरते: 1.30× ते 1.50× दरम्यान फक्त ${mid} कामे, आणि 1.50× पेक्षा जास्त ${tail}. सामान्य दराच्या 1.35 पटीपेक्षा जास्त बिले आम्ही चिन्हांकित करतो.`
                : `Each bar is a group of jobs, by how their bill compares with the normal price. Most jobs (${fmt(nf.normal_price_band)}) are within 30% of it, which is normal. Then it drops off a cliff: only ${mid} jobs between 1.30× and 1.50×, and ${tail} above 1.50×. We flag bills above 1.35 times the normal price.`}
          </p>
          <div className="mt-4 flex h-40 items-end gap-[3px]" role="img" aria-label={L("Chart of bills compared with the normal price", "सामान्य दर की तुलना में बिलों का चार्ट", "सामान्य दराच्या तुलनेत बिलांचा तक्ता")}>
            {hist.map((h) => {
              const flagged = h.lo >= 1.35;
              return (
                <div key={h.lo} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div className={`rounded-t ${flagged ? "bg-[#d03b3b]" : "bg-[#9fb3c8]"}`} style={{ height: `${Math.max(h.jobs ? 3 : 0, (100 * h.jobs) / peak)}%` }} />
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#2b3033] px-1.5 py-0.5 text-xs text-white group-hover:block">{fmt(h.jobs)} {L("jobs", "काम", "कामे")}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-[3px] text-[11px] text-[#4a4f52]">
            {hist.map((h) => <span key={h.lo} className="flex-1 text-center">{h.hi === null ? "1.5×+" : Number.isInteger(h.lo * 10) ? `${h.lo.toFixed(1)}×` : ""}</span>)}
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <span><i className="mr-1.5 inline-block size-2.5 rounded-sm bg-[#9fb3c8]" />{L("Normal price range", "सामान्य दर सीमा", "सामान्य दर मर्यादा")}</span>
            <span><i className="mr-1.5 inline-block size-2.5 rounded-sm bg-[#d03b3b]" />{L("Flagged as over-billed", "ज़्यादा बिल के रूप में चिह्नित", "जास्त बिल म्हणून चिन्हांकित")}</span>
          </div>
        </div>
      )}

      {/* real examples, told plainly, filterable by problem type */}
      <section id="bills" className="mt-12 scroll-mt-24">
        <h2 className={H2}>
          {active
            ? L(`The biggest “${active.title}” cases`, `“${active.title}” के सबसे बड़े मामले`, `“${active.title}” ची सर्वात मोठी प्रकरणे`)
            : L("The bills, in plain words", "बिल, सीधे शब्दों में", "बिले, सोप्या शब्दांत")}
        </h2>
        <p className={`mt-1 text-[14.5px] ${MUTED}`}>{L("A flag is a reason to check the work order, not proof of wrongdoing.", "चिह्न वर्क ऑर्डर जाँचने का कारण है, गड़बड़ी का सबूत नहीं।", "चिन्ह म्हणजे वर्क ऑर्डर तपासण्याचे कारण, गैरव्यवहाराचा पुरावा नव्हे.")}</p>
        <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label={L("Filter by problem", "समस्या के अनुसार छाँटें", "समस्येनुसार गाळा")}>
          {[{ slug: "", title: L("One of each", "हर तरह का एक", "प्रत्येकी एक") }, ...TYPES].map((t) => {
            const on = (active?.slug ?? "") === t.slug;
            return (
              <Link
                key={t.slug || "all"}
                href={t.slug ? `/audit?type=${t.slug}#bills` : "/audit#bills"}
                scroll={false}
                aria-current={on ? "true" : undefined}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${on ? "bg-[#2b3033] text-white" : "bg-white text-[#2b3033] shadow-[0_0_0_1px_rgba(43,48,51,.16)] hover:bg-[#fdeae4]"}`}
              >
                {t.title}
              </Link>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {examples.map((f) => <Story key={`${f.work_order_id}-${f.flag}`} f={f} D={D} lang={lang} />)}
        </div>
      </section>

      <details className={`${CARD} mt-5 p-5`}>
        <summary className={`${B} cursor-pointer font-bold`}>{L("For officials: the 10 largest flags", "अधिकारियों के लिए: 10 सबसे बड़े चिह्नित मामले", "अधिकाऱ्यांसाठी: 10 सर्वात मोठी चिन्हांकित प्रकरणे")}</summary>
        <ol className="mt-3 divide-y divide-[rgba(43,48,51,.1)] text-[15px]">
          {list.map((f, k) => (
            <li key={`${f.work_order_id}-${f.flag}`} className="flex items-baseline gap-3 py-2">
              <span className="w-5 flex-none text-[#4a4f52]">{k + 1}</span>
              <Link href={`/track?q=${f.work_order_id}`} className={`${B} flex-none font-bold hover:text-[#ee7454]`}>{f.work_order_id}</Link>
              <span className="min-w-0 flex-1 truncate text-[#4a4f52]">{f.road_name} · {wardWord} {f.ward_code} · {f.contractor_name.replace(" (synthetic)", "")}</span>
              <span className={`${B} flex-none font-bold tabular-nums`}>{inr(f.inr_at_risk)}</span>
            </li>
          ))}
        </ol>
        <a href="/audit/flags.csv" className="mt-3 inline-block text-sm font-semibold underline hover:text-[#ee7454]">
          {L(`Download all ${fmt(D.flags.length)} flags (CSV)`, `सभी ${fmt(D.flags.length)} चिह्नित मामले डाउनलोड करें (CSV)`, `सर्व ${fmt(D.flags.length)} चिन्हांकित प्रकरणे डाउनलोड करा (CSV)`)}
        </a>
      </details>

      {/* what we deliberately do not flag */}
      {nf && (
        <div className={`${CARD} mt-8 p-5`}>
          <div className={`${B} text-[20px] font-extrabold tracking-[-.025em]`}>{L("What we deliberately do not flag", "हम जानबूझकर क्या चिह्नित नहीं करते", "आम्ही मुद्दाम काय चिन्हांकित करत नाही")}</div>
          <ul className="mt-2 space-y-1.5 text-[15px]">
            {lang === "hi" ? (
              <>
                <li><b>{fmt(nf.normal_price_band)} काम</b> जिनका बिल सामान्य दर के 30% के भीतर है: यह सामान्य है।</li>
                <li><b>{fmt(nf.missed_deadlines)} चूकी समय-सीमाएँ</b>: बारिश, बाढ़-प्रवण वार्ड और कम टीमें इसकी बड़ी वजह हैं, इसलिए गति को {contractorsLink} पेज पर अपेक्षा के हिसाब से आँका जाता है, यहाँ चिह्नित नहीं किया जाता।</li>
                <li><b>{fmt(nf.failed_fixes)} मरम्मतें जो 30 दिनों में फिर टूट गईं</b>: यह गुणवत्ता का सवाल है, इसे भी {contractorsLink} पेज पर निष्पक्ष रूप से आँका जाता है।</li>
                <li><b>अपने सूचीबद्ध वार्ड के बाहर काम करने वाले ठेकेदार</b>: हर ठेकेदार के लगभग 80% कामों में ऐसा है, और गुणवत्ता में कोई फ़र्क नहीं, इसलिए यह डेटा की टिप्पणी है, ख़तरे का संकेत नहीं।</li>
              </>
            ) : lang === "mr" ? (
              <>
                <li><b>{fmt(nf.normal_price_band)} कामे</b> ज्यांचे बिल सामान्य दराच्या 30% आत आहे: हे सामान्य आहे.</li>
                <li><b>{fmt(nf.missed_deadlines)} चुकलेल्या मुदती</b>: पाऊस, पूरप्रवण वॉर्ड आणि कमी पथके हे मोठे कारण आहे, म्हणून वेग {contractorsLink} पानावर अपेक्षेनुसार मोजला जातो, इथे चिन्हांकित केला जात नाही.</li>
                <li><b>{fmt(nf.failed_fixes)} दुरुस्त्या ज्या 30 दिवसांत पुन्हा बिघडल्या</b>: हा गुणवत्तेचा प्रश्न आहे, तोही {contractorsLink} पानावर न्याय्य पद्धतीने मोजला जातो.</li>
                <li><b>आपल्या नोंदवलेल्या वॉर्डबाहेर काम करणारे कंत्राटदार</b>: प्रत्येक कंत्राटदाराच्या सुमारे 80% कामांमध्ये असे आहे, आणि गुणवत्तेत फरक नाही, म्हणून ही डेटाची नोंद आहे, धोक्याची सूचना नव्हे.</li>
              </>
            ) : (
              <>
                <li><b>{fmt(nf.normal_price_band)} jobs</b> billed within 30% of the normal price: that&apos;s normal.</li>
                <li><b>{fmt(nf.missed_deadlines)} missed deadlines</b>: rain, flood-prone wards and too few crews explain much of it, so speed is judged against what&apos;s expected on {contractorsLink}, not flagged here.</li>
                <li><b>{fmt(nf.failed_fixes)} fixes that failed within 30 days</b>: a quality question, also judged fairly on Contractors.</li>
                <li><b>Contractors working outside their listed wards</b>: true for about 80% of every contractor&apos;s jobs, with no difference in quality, so it is a data note, not a red flag.</li>
              </>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
