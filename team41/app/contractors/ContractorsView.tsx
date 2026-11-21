"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EndorseButton from "@/components/endorse-button";
import { say, type Lang } from "@/lib/i18n";
import type { Contractor } from "@/lib/rupee";

const CARD = "rounded-2xl bg-white shadow-[0_0_0_1px_rgba(43,48,51,.12),0_18px_40px_-26px_rgba(0,0,0,.35)]";
const H2 = "text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-.035em]";
const SUB = "mt-1 text-[14.5px] text-[#4a4f52]";
const GRADE_BG = { A: "bg-[#15803d]", B: "bg-[#65a30d]", C: "bg-[#b45309]", D: "bg-[#c2410c]" } as const;
const GRADE_WORD: Record<Lang, Record<"A" | "B" | "C" | "D", string>> = {
  en: { A: "Good", B: "Okay", C: "Needs work", D: "Poor" },
  hi: { A: "अच्छा", B: "ठीक-ठाक", C: "सुधार ज़रूरी", D: "ख़राब" },
  mr: { A: "चांगले", B: "ठीक", C: "सुधारणा हवी", D: "वाईट" },
};

// Scorecard text (analysis/scorecard_text.py) in Hindi and Marathi, keyed by short name. English comes from the data.
const SCORE_TEXT: Record<string, { hi: string; mr: string }> = {
  "Deccan Paving Solutions": {
    hi: "शहर में सबसे टिकाऊ काम: इसकी सिर्फ़ 9% मरम्मत एक महीने में फिर टूटी, जबकि ऐसे ही कामों में लगभग 24% की अपेक्षा थी। इसने 60% कामों में समय-सीमा पूरी की, अपेक्षित 49% से बेहतर, और इसकी दरें रेट कार्ड के बराबर हैं। सुधार: बिना शिकायत के बिल किए गए 5 दोहराए कामों का कारण बताए।",
    mr: "शहरातील सर्वात टिकाऊ काम: याच्या फक्त 9% दुरुस्त्या महिन्याभरात पुन्हा तुटल्या, तर अशाच कामांसाठी सुमारे 24% अपेक्षित होते. याने 60% कामांत मुदत पाळली, अपेक्षित 49% पेक्षा चांगले, आणि याचे दर रेट कार्डनुसारच आहेत. सुधारणा: तक्रार नसताना बिल केलेल्या 5 दुबार कामांचे स्पष्टीकरण द्यावे.",
  },
  "Sahyadri Infra Works": {
    hi: "तेज़ और टिकाऊ। इसने 62% समय-सीमाएँ पूरी कीं (अपेक्षित 50%) और इसकी सिर्फ़ 14% मरम्मत 30 दिनों में टूटी (अपेक्षित 25%)। दरें रेट कार्ड के क़रीब हैं। सुधार: 8 काम उसी सड़क पर वैसे ही काम के कुछ दिन बाद, बिना किसी शिकायत के बिल किए गए; इनके अलग काम होने के काग़ज़ चाहिए।",
    mr: "वेगवान आणि टिकाऊ. याने 62% मुदती पाळल्या (अपेक्षित 50%) आणि याच्या फक्त 14% दुरुस्त्या 30 दिवसांत तुटल्या (अपेक्षित 25%). दर रेट कार्डच्या जवळ आहेत. सुधारणा: 8 कामे त्याच रस्त्यावरील तशाच कामानंतर काही दिवसांनी, कोणतीही तक्रार नसताना बिल झाली; ती वेगळी कामे होती याचे कागदोपत्री पुरावे हवेत.",
  },
  "Mithi Infra Projects": {
    hi: "मरम्मत अच्छी टिकती है: 12% एक महीने में टूटी, अपेक्षित दर का लगभग आधा। समय-सीमा का पालन औसत है। सुधार: 10 काम रेट कार्ड के 1.35 गुना से ज़्यादा पर बिल हुए, इन्हें मौके पर माप से जाँचना चाहिए।",
    mr: "दुरुस्त्या चांगल्या टिकतात: 12% महिन्याभरात तुटल्या, अपेक्षित दराच्या सुमारे निम्म्या. मुदतपालन सरासरी आहे. सुधारणा: 10 कामे रेट कार्डच्या 1.35 पटीपेक्षा जास्त दराने बिल झाली; ती जागेवरील मोजमापांशी तपासावीत.",
  },
  "Konkan Roadcon Pvt Ltd": {
    hi: "बिल की गई रक़म के हिसाब से सबसे बड़ा ठेकेदार। इसकी रफ़्तार और टिकाऊपन इसके कामों के हिसाब से अपेक्षा के क़रीब हैं (46% समय-सीमाएँ पूरी, 27% मरम्मत टूटी)। सुधार: कुछ ज़्यादा और दोहराए बिल, और अपेक्षा से थोड़ी ज़्यादा टूटी मरम्मत।",
    mr: "बिल केलेल्या रकमेनुसार सर्वात मोठा कंत्राटदार. याचा वेग आणि टिकाऊपणा याच्या कामांनुसार अपेक्षेच्या जवळ आहे (46% मुदती पाळल्या, 27% दुरुस्त्या तुटल्या). सुधारणा: काही जास्त आणि दुबार बिले, आणि अपेक्षेपेक्षा थोड्या जास्त तुटलेल्या दुरुस्त्या.",
  },
  "Shivneri Construction": {
    hi: "दिए गए काम के हिसाब से रफ़्तार और टिकाऊपन दोनों औसत। सुधार: 8 काम दोहराए बिल जैसे लगते हैं (वही सड़क, वही तरीका, कुछ दिनों के अंतर पर, कोई शिकायत नहीं), जो इसके आकार के हिसाब से बड़ा हिस्सा है।",
    mr: "दिलेल्या कामानुसार वेग आणि टिकाऊपणा दोन्ही सरासरी. सुधारणा: 8 कामे दुबार बिलांसारखी दिसतात (तोच रस्ता, तीच पद्धत, काही दिवसांच्या अंतराने, तक्रार नाही), जे याच्या आकाराच्या मानाने मोठे प्रमाण आहे.",
  },
  "Western Coast Asphalt Co": {
    hi: "दरें ज़्यादातर उचित हैं, पर इसकी मरम्मत टिकती नहीं: 39% 30 दिनों में टूटी, जबकि उन्हीं तरीकों, वार्डों और बारिश में 25% की अपेक्षा थी। यानी शहर ने कई सड़कों के लिए दो बार पैसा दिया। सुधार: टिकाऊपन, शुरुआत उन सड़कों से जहाँ इसके पैच एक से ज़्यादा बार टूटे।",
    mr: "दर बहुतांशी योग्य आहेत, पण याच्या दुरुस्त्या टिकत नाहीत: 39% 30 दिवसांत तुटल्या, तर त्याच पद्धती, वॉर्ड आणि पावसात 25% अपेक्षित होते. म्हणजे शहराने अनेक रस्त्यांसाठी दोनदा पैसे दिले. सुधारणा: टिकाऊपणा, सुरुवात ज्या रस्त्यांवर याचे पॅच एकापेक्षा जास्त वेळा तुटले तिथून.",
  },
  "Arabian Sea Engineering": {
    hi: "अपेक्षा से धीमा (44% समय-सीमाएँ पूरी, अपेक्षित 53%) और कम टिकाऊ (32% मरम्मत टूटी, अपेक्षित 25%)। 38 काम रेट कार्ड के 1.35 गुना से ज़्यादा पर बिल हुए। सुधार: पहले बिलिंग की शुद्धता, फिर मरम्मत की गुणवत्ता।",
    mr: "अपेक्षेपेक्षा संथ (44% मुदती पाळल्या, अपेक्षित 53%) आणि कमी टिकाऊ (32% दुरुस्त्या तुटल्या, अपेक्षित 25%). 38 कामे रेट कार्डच्या 1.35 पटीपेक्षा जास्त दराने बिल झाली. सुधारणा: आधी बिलिंगची अचूकता, मग दुरुस्तीचा दर्जा.",
  },
  "Mahalaxmi Civil Contractors": {
    hi: "इस डेटा में सबसे कमज़ोर रिकॉर्ड। इसने 39% समय-सीमाएँ पूरी कीं (अपेक्षित 52%), इसकी 38% मरम्मत एक महीने में टूटी (अपेक्षित 25%), और 44 काम रेट कार्ड से काफ़ी ऊपर बिल हुए, साथ में 10 संभावित दोहराए बिल। सुधार: आगे कोई भुगतान करने से पहले हर चिह्नित काम की जाँच हो।",
    mr: "या डेटामधील सर्वात कमकुवत नोंद. याने 39% मुदती पाळल्या (अपेक्षित 52%), याच्या 38% दुरुस्त्या महिन्याभरात तुटल्या (अपेक्षित 25%), आणि 44 कामे रेट कार्डपेक्षा बरीच जास्त बिल झाली, शिवाय 10 संभाव्य दुबार बिले. सुधारणा: पुढील कोणतेही पेमेंट करण्यापूर्वी प्रत्येक चिन्हांकित काम तपासावे.",
  },
};
const scoreText = (lang: Lang, c: Contractor) => (lang === "en" ? c.text : SCORE_TEXT[c.short]?.[lang] ?? c.text);
const MAX_COMPARE = 4;

const inrShort = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`;
const firstSentence = (t: string) => (t.match(/^.*?[.!?।](\s|$)/)?.[0] ?? t).trim();
const billingIssues = (c: Contractor) => (c.flags["Over-billed"] ?? 0) + (c.flags["Possible double billing"] ?? 0);

// A row in the compare table. `better` decides which column gets the "Best" mark.
type Metric = {
  label: string;
  hint?: string;
  value: (c: Contractor) => number;
  show: (c: Contractor) => React.ReactNode;
  better?: "low" | "high";
  bar?: { max: number; expected?: (c: Contractor) => number };
};

export default function ContractorsView({ contractors, lang }: { contractors: Contractor[]; lang: Lang }) {
  const L = say(lang);
  // Default compare: the best- and worst-graded contractors.
  const [picked, setPicked] = useState<string[]>(() =>
    contractors.length > 1 ? [contractors[0].contractor_id, contractors[contractors.length - 1].contractor_id] : [],
  );
  const [diffOnly, setDiffOnly] = useState(false);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_COMPARE ? p : [...p, id]));

  const cols = useMemo(
    () => picked.map((id) => contractors.find((c) => c.contractor_id === id)).filter((c): c is Contractor => !!c),
    [picked, contractors],
  );

  const pctMax = Math.max(...contractors.map((c) => Math.max(c.reopen_pct, c.reopen_expected_pct, c.sla_met_pct, c.sla_expected_pct)), 1);
  const billedMax = Math.max(...contractors.map((c) => c.billed_inr), 1);

  const metrics: { group: string; rows: Metric[] }[] = [
    {
      group: L("Quality", "गुणवत्ता", "दर्जा"),
      rows: [
        {
          label: L("Fixes that failed in 30 days", "30 दिनों में टूटी मरम्मत", "30 दिवसांत तुटलेल्या दुरुस्त्या"),
          hint: L("| marks what's expected for the same jobs", "| ऐसे ही कामों की अपेक्षा दिखाता है", "| अशाच कामांसाठी अपेक्षित दाखवते"),
          value: (c) => c.reopen_pct,
          show: (c) => <Pct v={c.reopen_pct} exp={c.reopen_expected_pct} vs={L("vs", "बनाम", "विरुद्ध")} lowerIsBetter />,
          better: "low",
          bar: { max: pctMax, expected: (c) => c.reopen_expected_pct },
        },
        {
          label: L("Deadlines met", "समय-सीमा पूरी", "मुदत पाळली"),
          hint: L("| marks what's expected", "| अपेक्षा दिखाता है", "| अपेक्षित दाखवते"),
          value: (c) => c.sla_met_pct,
          show: (c) => <Pct v={c.sla_met_pct} exp={c.sla_expected_pct} vs={L("vs", "बनाम", "विरुद्ध")} />,
          better: "high",
          bar: { max: pctMax, expected: (c) => c.sla_expected_pct },
        },
      ],
    },
    {
      group: L("Money", "पैसा", "पैसा"),
      rows: [
        { label: L("Total billed", "कुल बिल", "एकूण बिल"), value: (c) => c.billed_inr, show: (c) => inrShort(c.billed_inr), bar: { max: billedMax } },
        { label: L("Money flagged on their bills", "उनके बिलों पर चिह्नित पैसा", "त्यांच्या बिलांवरील चिन्हांकित पैसा"), value: (c) => c.inr_flagged ?? 0, show: (c) => inrShort(c.inr_flagged ?? 0), better: "low" },
        { label: L("Typical cost vs rate card", "आम लागत बनाम रेट कार्ड", "सामान्य खर्च विरुद्ध रेट कार्ड"), value: (c) => c.median_cost_ratio, show: (c) => `${c.median_cost_ratio.toFixed(2)}×`, better: "low" },
        {
          label: L("Over-billed or repeat bills", "ज़्यादा या दोहराए बिल", "जास्त किंवा दुबार बिले"),
          value: (c) => billingIssues(c) / Math.max(1, c.jobs),
          show: (c) => (
            <>
              {billingIssues(c)} <span className="font-normal text-[#4a4f52]">{L(`of ${c.jobs}`, `/ ${c.jobs}`, `/ ${c.jobs}`)}</span>
            </>
          ),
          better: "low",
        },
        {
          label: L("Paid while under warranty", "गारंटी अवधि में भुगतान", "हमी कालावधीत पेमेंट"),
          hint: L("BMC's call, not counted in the grade", "BMC का फ़ैसला, ग्रेड में नहीं गिना जाता", "BMC चा निर्णय, श्रेणीत धरला जात नाही"),
          value: (c) => c.flags["Paid during DLP"] ?? 0,
          show: (c) => c.flags["Paid during DLP"] ?? 0,
        },
      ],
    },
    {
      group: L("Workload & conditions", "काम का बोझ और हालात", "कामाचा भार आणि परिस्थिती"),
      rows: [
        { label: L("Jobs", "काम", "कामे"), value: (c) => c.jobs, show: (c) => c.jobs },
        { label: L("Wards worked in", "जिन वार्डों में काम किया", "ज्या वॉर्डांत काम केले"), value: (c) => c.wards.length, show: (c) => c.wards.length },
        { label: L("Jobs outside listed wards", "सूचीबद्ध वार्डों के बाहर काम", "नोंदवलेल्या वॉर्डांबाहेरील कामे"), value: (c) => c.outside_listed_pct, show: (c) => `${c.outside_listed_pct}%` },
        { label: L("Jobs in flood-prone wards", "बाढ़-प्रवण वार्डों में काम", "पूरप्रवण वॉर्डांतील कामे"), value: (c) => c.low_lying_share_pct, show: (c) => `${c.low_lying_share_pct}%` },
        { label: L("Jobs with heavy rain that week", "उस हफ़्ते भारी बारिश वाले काम", "त्या आठवड्यात मुसळधार पावसातील कामे"), value: (c) => c.heavy_rain_share_pct, show: (c) => `${c.heavy_rain_share_pct}%` },
        { label: L("Cold-mix patches", "कोल्ड-मिक्स पैच", "कोल्ड-मिक्स पॅच"), value: (c) => c.cold_mix_share_pct, show: (c) => `${c.cold_mix_share_pct}%` },
        { label: L("Empanelled since", "सूचीबद्ध होने का वर्ष", "नोंदणी झाल्यापासून"), value: (c) => c.empanelled_since, show: (c) => c.empanelled_since },
      ],
    },
  ];

  const bestOf = (m: Metric) => {
    if (!m.better || cols.length < 2) return null;
    const vals = cols.map(m.value);
    const best = m.better === "low" ? Math.min(...vals) : Math.max(...vals);
    if (vals.every((v) => v === best)) return null;
    return best;
  };
  const differs = (m: Metric) => new Set(cols.map(m.value)).size > 1;

  const gradeCounts = (["A", "B", "C", "D"] as const).map((g) => [g, contractors.filter((c) => c.grade === g).length] as const);
  const better = contractors.filter((c) => c.reopen_pct <= c.reopen_expected_pct - 5).length;
  const worse = contractors.filter((c) => c.reopen_pct >= c.reopen_expected_pct + 5).length;
  const scale = Math.max(...contractors.map((c) => Math.max(c.reopen_pct, c.reopen_expected_pct))) + 5;

  return (
    <>
      {/* Grade tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {gradeCounts.map(([g, n]) => (
          <div key={g} className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-[0_0_0_1px_rgba(43,48,51,.10)]">
            <span className={`grid size-11 flex-none place-items-center rounded-xl text-xl font-extrabold text-white ${GRADE_BG[g]}`}>{g}</span>
            <div>
              <div className="text-[28px] font-extrabold leading-none tracking-[-.03em] tabular-nums">{n}</div>
              <div className="mt-1 text-[12.5px] font-semibold uppercase tracking-[.06em] text-[#4a4f52]">{GRADE_WORD[lang][g]}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[15px] text-[#4a4f52]">
        <b className="text-[#15803d]">{better}</b>{" "}
        {L("last longer than expected for the same work", "की मरम्मत ऐसे ही काम में अपेक्षा से ज़्यादा टिकती है", "यांच्या दुरुस्त्या अशाच कामात अपेक्षेपेक्षा जास्त टिकतात")} ·{" "}
        <b className="text-[#c2410c]">{worse}</b>{" "}
        {L("fail clearly more often.", "की मरम्मत साफ़ तौर पर ज़्यादा टूटती है।", "यांच्या दुरुस्त्या स्पष्टपणे जास्त तुटतात.")}
      </p>

      {/* Compare */}
      <section className="mt-10" aria-labelledby="compare-h">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="compare-h" className={H2}>{L("Compare", "तुलना करें", "तुलना करा")}</h2>
            <p className={SUB}>{L(`Pick up to ${MAX_COMPARE} contractors.`, `ज़्यादा से ज़्यादा ${MAX_COMPARE} ठेकेदार चुनें।`, `जास्तीत जास्त ${MAX_COMPARE} कंत्राटदार निवडा.`)}</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[14px]">
            <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="size-4 accent-[#ee7454]" />
            {L("Only rows that differ", "सिर्फ़ अलग पंक्तियाँ", "फक्त वेगळ्या ओळी")}
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={L("Contractors to compare", "तुलना के लिए ठेकेदार", "तुलनेसाठी कंत्राटदार")}>
          {contractors.map((c) => {
            const on = picked.includes(c.contractor_id);
            const full = !on && picked.length >= MAX_COMPARE;
            return (
              <button
                key={c.contractor_id}
                type="button"
                aria-pressed={on}
                disabled={full}
                onClick={() => toggle(c.contractor_id)}
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee7454] disabled:cursor-not-allowed disabled:opacity-40 ${
                  on ? "bg-[#2b3033] text-white" : "bg-white text-[#2b3033] shadow-[0_0_0_1px_rgba(43,48,51,.16)] hover:bg-[#fdeae4]"
                }`}
              >
                <span className={`grid size-6 place-items-center rounded-full text-[12px] font-extrabold text-white ${GRADE_BG[c.grade]}`}>{c.grade}</span>
                {c.short}
                <span aria-hidden="true" className={on ? "text-white/70" : "text-[#ee7454]"}>{on ? "✕" : "+"}</span>
              </button>
            );
          })}
        </div>

        {cols.length < 2 ? (
          <p className={`${CARD} mt-4 px-5 py-8 text-center text-[15px] text-[#4a4f52]`}>{L("Pick at least two contractors to compare.", "तुलना के लिए कम से कम दो ठेकेदार चुनें।", "तुलनेसाठी किमान दोन कंत्राटदार निवडा.")}</p>
        ) : (
          <div className={`${CARD} mt-4 overflow-x-auto`}>
            <table className="w-full min-w-[640px] border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b border-[rgba(43,48,51,.12)]">
                  <th scope="col" className="sticky left-0 z-10 w-[230px] bg-white px-5 py-4 text-left align-bottom text-[12px] font-semibold uppercase tracking-[.08em] text-[#4a4f52]">
                    {L("Metric", "पैमाना", "निकष")}
                  </th>
                  {cols.map((c) => (
                    <th key={c.contractor_id} scope="col" className="px-4 py-4 text-left align-bottom">
                      <div className="flex items-start gap-2.5">
                        <span className={`grid size-9 flex-none place-items-center rounded-lg text-[17px] font-extrabold text-white ${GRADE_BG[c.grade]}`}>{c.grade}</span>
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold leading-tight">{c.short}</div>
                          <button
                            type="button"
                            onClick={() => toggle(c.contractor_id)}
                            className="mt-0.5 text-[12px] font-medium text-[#4a4f52] underline decoration-dotted hover:text-[#ee7454]"
                          >
                            {L("Remove", "हटाएँ", "काढा")}
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              {metrics.map(({ group, rows }) => {
                const shown = diffOnly ? rows.filter(differs) : rows;
                if (!shown.length) return null;
                return (
                  <tbody key={group}>
                    <tr>
                      <th colSpan={cols.length + 1} scope="colgroup" className="sticky left-0 bg-[#faf3eb] px-5 py-2 text-left text-[12px] font-bold uppercase tracking-[.1em] text-[#ee7454]">
                        {group}
                      </th>
                    </tr>
                    {shown.map((m) => {
                      const best = bestOf(m);
                      return (
                        <tr key={m.label} className="border-t border-[rgba(43,48,51,.08)]">
                          <th scope="row" className="sticky left-0 z-10 bg-white px-5 py-3 text-left align-top font-semibold">
                            <span className="block">{m.label}</span>
                            {m.hint && <span className="mt-0.5 block text-[12px] font-normal text-[#4a4f52]">{m.hint}</span>}
                          </th>
                          {cols.map((c) => {
                            const isBest = best != null && m.value(c) === best;
                            return (
                              <td key={c.contractor_id} className="px-4 py-3 align-top">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold tabular-nums">{m.show(c)}</span>
                                  {isBest && (
                                    <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[.05em] text-[#166534]">✓ {L("Best", "सबसे अच्छा", "सर्वोत्तम")}</span>
                                  )}
                                </div>
                                {m.bar && <MiniBar v={m.value(c)} max={m.bar.max} expected={m.bar.expected?.(c)} />}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })}
              <tbody>
                <tr className="border-t border-[rgba(43,48,51,.12)]">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-5 py-3 text-left align-top font-semibold">{L("In short", "संक्षेप में", "थोडक्यात")}</th>
                  {cols.map((c) => (
                    <td key={c.contractor_id} className="px-4 py-3 align-top text-[13.5px] leading-snug text-[#4a4f52]">
                      {firstSentence(scoreText(lang, c))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ranking */}
      <section className="mt-12" aria-labelledby="rank-h">
        <h2 id="rank-h" className={H2}>{L("Ranking", "रैंकिंग", "क्रमवारी")}</h2>
        <p className={SUB}>{L("Each contractor against what an average contractor gets on the same jobs.", "हर ठेकेदार की तुलना, ऐसे ही कामों पर औसत ठेकेदार के नतीजे से।", "प्रत्येक कंत्राटदाराची तुलना, अशाच कामांवर सरासरी कंत्राटदाराच्या निकालाशी.")}</p>
        <div className={`${CARD} mt-4 divide-y divide-[rgba(43,48,51,.1)]`}>
          {contractors.map((c, i) => {
            const diff = c.reopen_pct - c.reopen_expected_pct;
            const tone = diff >= 5 ? "bad" : diff <= -5 ? "good" : "normal";
            const on = picked.includes(c.contractor_id);
            return (
              <div key={c.contractor_id} id={c.contractor_id} className="scroll-mt-24 px-5 py-4">
                <div className="grid grid-cols-[28px_44px_1fr] items-center gap-3 sm:grid-cols-[28px_44px_1fr_minmax(200px,280px)_124px]">
                  <span className="text-[15px] font-bold tabular-nums text-[#4a4f52]">{i + 1}</span>
                  <span className={`grid size-11 place-items-center rounded-xl text-xl font-extrabold text-white ${GRADE_BG[c.grade]}`}>{c.grade}</span>
                  <div className="min-w-0">
                    <div className="text-[17px] font-bold leading-tight tracking-[-.01em]">{c.short}</div>
                    <div className="mt-0.5 text-[13px] text-[#4a4f52]">
                      {L(`${c.jobs} jobs · ${inrShort(c.billed_inr)} billed`, `${c.jobs} काम · ${inrShort(c.billed_inr)} बिल`, `${c.jobs} कामे · ${inrShort(c.billed_inr)} बिल`)}
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <div className="relative h-2.5 rounded-[4px] bg-[rgba(43,48,51,.08)]">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-[4px] ${tone === "bad" ? "bg-[#d03b3b]" : tone === "good" ? "bg-[#0ca30c]" : "bg-[#d9a441]"}`}
                        style={{ width: `${(100 * c.reopen_pct) / scale}%` }}
                      />
                      <div className="absolute -inset-y-1 w-[3px] rounded bg-[#2b3033]" style={{ left: `${(100 * c.reopen_expected_pct) / scale}%` }} title={L("Expected", "अपेक्षित", "अपेक्षित")} />
                    </div>
                    <div className="mt-1 text-[13px]">
                      <b className={tone === "bad" ? "text-[#c2410c]" : tone === "good" ? "text-[#15803d]" : "text-[#92400e]"}>{c.reopen_pct}% {L("failed", "टूटी", "तुटल्या")}</b>
                      <span className="text-[#4a4f52]"> · {c.reopen_expected_pct}% {L("expected", "अपेक्षित", "अपेक्षित")}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(c.contractor_id)}
                    disabled={!on && picked.length >= MAX_COMPARE}
                    aria-pressed={on}
                    className={`col-span-3 justify-self-start rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-40 sm:col-span-1 sm:justify-self-end ${
                      on ? "bg-[#2b3033] text-white" : "bg-white text-[#2b3033] shadow-[0_0_0_1px_rgba(43,48,51,.18)] hover:bg-[#fdeae4]"
                    }`}
                  >
                    {on ? `✓ ${L("Comparing", "तुलना में", "तुलनेत")}` : `+ ${L("Compare", "तुलना करें", "तुलना करा")}`}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 sm:pl-[84px]">
                  {(c.grade === "A" || c.grade === "B") && <EndorseButton id={c.contractor_id} />}
                  <details className="text-[14px]">
                    <summary className="cursor-pointer font-medium text-[#4a4f52] underline decoration-dotted">{L("Show evidence", "सबूत देखें", "पुरावा पाहा")}</summary>
                    <div className="mt-2 max-w-[60em] space-y-1.5 rounded-xl bg-[#faf3eb] p-3">
                      <p>{scoreText(lang, c)}</p>
                      {c.evidence.length > 0 && (
                        <p>
                          {L("Flagged work orders:", "चिह्नित वर्क ऑर्डर:", "चिन्हांकित वर्क ऑर्डर:")}{" "}
                          {c.evidence.map((id, j) => (
                            <span key={id}>
                              {j > 0 && ", "}
                              <Link className="font-semibold underline hover:text-[#ee7454]" href={`/track?q=${id}`}>{id}</Link>
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Pct({ v, exp, vs, lowerIsBetter }: { v: number; exp: number; vs: string; lowerIsBetter?: boolean }) {
  const d = v - exp;
  const good = lowerIsBetter ? d <= -5 : d >= 5;
  const bad = lowerIsBetter ? d >= 5 : d <= -5;
  return (
    <>
      <span className={good ? "text-[#15803d]" : bad ? "text-[#c2410c]" : ""}>{v}%</span>{" "}
      <span className="font-normal text-[#4a4f52]">{vs} {exp}%</span>
    </>
  );
}

function MiniBar({ v, max, expected }: { v: number; max: number; expected?: number }) {
  return (
    <div className="relative mt-1.5 h-1.5 w-full max-w-[180px] rounded-[4px] bg-[rgba(43,48,51,.08)]" aria-hidden="true">
      <div className="absolute inset-y-0 left-0 rounded-[4px] bg-[#ee7454]" style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
      {expected != null && (
        <div className="absolute -inset-y-1 w-[2px] rounded bg-[#2b3033]" style={{ left: `${Math.min(100, (expected / max) * 100)}%` }} />
      )}
    </div>
  );
}
