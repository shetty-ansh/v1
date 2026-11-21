import { Suspense } from "react";
import { connection } from "next/server";
import PageShell from "@/components/page-shell";
import { inter } from "@/lib/fonts";
import { say } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { loadRupee } from "@/lib/rupee";
import ContractorsView from "./ContractorsView";

export const metadata = { title: "Contractors · Follow the Rupee" };

const ORDER = { A: 0, B: 1, C: 2, D: 3 };

async function Contractors({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const [lang, D] = await Promise.all([getLang(sp.lang), loadRupee()]);
  const L = say(lang);
  const ranked = [...D.contractors].sort(
    (a, b) => ORDER[a.grade] - ORDER[b.grade] || b.durability_vs_expected_pp - a.durability_vs_expected_pp,
  );
  return (
    <>
      <p className="text-[13px] font-bold uppercase tracking-[.14em] text-[#ee7454]">
        {L("Contractors · graded fairly", "ठेकेदार · निष्पक्ष ग्रेड", "कंत्राटदार · न्याय्य श्रेणी")}
      </p>
      <h1 className="mt-3 text-[clamp(36px,5.5vw,72px)] font-extrabold leading-[.95] tracking-[-.05em]">
        {L("Who did the work,", "काम किसने किया,", "काम कोणी केले,")}
        <span className="block text-[.62em] tracking-[-.04em]">{L("and did it last?", "और क्या वह टिका?", "आणि ते टिकले का?")}</span>
      </h1>

      <ContractorsView contractors={ranked} lang={lang} />

      <details className="mt-8 rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(43,48,51,.12)]">
        <summary className="cursor-pointer text-[16px] font-bold">{L("How the grade works", "ग्रेड कैसे तय होता है", "श्रेणी कशी ठरते")}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
          <li>
            <b>{L("Durability", "टिकाऊपन", "टिकाऊपणा")}</b>{" "}
            {L(
              "(fixes that last), against expected: 5+ points better = +2, 5+ worse = −2. Counts double: a failed fix is paid for twice.",
              "(टिकने वाली मरम्मत), अपेक्षा की तुलना में: 5+ अंक बेहतर = +2, 5+ बदतर = −2। इसका वज़न दोगुना है: टूटी मरम्मत का पैसा दो बार लगता है।",
              "(टिकणारी दुरुस्ती), अपेक्षेच्या तुलनेत: 5+ गुणांनी चांगले = +2, 5+ वाईट = −2. याचे वजन दुप्पट: तुटलेल्या दुरुस्तीचा पैसा दोनदा जातो.",
            )}
          </li>
          <li>
            <b>{L("Speed", "रफ़्तार", "वेग")}</b>{" "}
            {L(
              "(deadlines met), against expected: 5+ points better = +1, 5+ worse = −1.",
              "(समय पर काम), अपेक्षा की तुलना में: 5+ अंक बेहतर = +1, 5+ बदतर = −1।",
              "(वेळेत काम), अपेक्षेच्या तुलनेत: 5+ गुणांनी चांगले = +1, 5+ वाईट = −1.",
            )}
          </li>
          <li>
            <b>{L("Billing", "बिलिंग", "बिलिंग")}</b>
            {L(
              ": over-billed and repeat bills above 5% of jobs = −2, above 1% = −1.",
              ": ज़्यादा और दोहराए गए बिल कामों के 5% से ऊपर = −2, 1% से ऊपर = −1।",
              ": जास्त आणि दुबार बिले कामांच्या 5% पेक्षा जास्त = −2, 1% पेक्षा जास्त = −1.",
            )}
          </li>
          <li>
            {L(
              "2+ points = A, 0 to 1 = B, −1 to −2 = C, lower = D. Warranty (DLP) payments are BMC's decision, so they are not counted against contractors.",
              "2+ अंक = A, 0 से 1 = B, −1 से −2 = C, इससे कम = D। गारंटी (DLP) अवधि में भुगतान BMC का फ़ैसला है, इसलिए ठेकेदारों के ख़िलाफ़ नहीं गिना जाता।",
              "2+ गुण = A, 0 ते 1 = B, −1 ते −2 = C, त्याहून कमी = D. हमी (DLP) कालावधीतील पेमेंट हा BMC चा निर्णय आहे, म्हणून तो कंत्राटदारांविरुद्ध धरला जात नाही.",
            )}
          </li>
        </ul>
      </details>
    </>
  );
}

export default function ContractorsPage(props: PageProps<"/contractors">) {
  return (
    <PageShell current="contractors">
      {/* Plain sans for this page, same as /audit and /map. */}
      <div
        className={`${inter.variable} font-[family-name:var(--font-inter)] [--font-bricolage:var(--font-inter)] [--font-newsreader:var(--font-inter)]`}
      >
        <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-2xl bg-white/60" />}>
          <Contractors searchParams={props.searchParams} />
        </Suspense>
      </div>
    </PageShell>
  );
}
