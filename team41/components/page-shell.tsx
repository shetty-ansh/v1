import { Suspense } from "react";
import SiteHeader from "@/components/site-header";
import { say, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { fontVars } from "@/lib/fonts";

export const H1 =
  "font-[family-name:var(--font-bricolage)] text-[clamp(30px,4.4vw,54px)] font-semibold leading-[.98] tracking-[-.035em]";
export const H2 =
  "mt-12 mb-3 font-[family-name:var(--font-bricolage)] text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-.02em]";
export const CARD =
  "rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(43,48,51,.14),0_18px_40px_-24px_rgba(0,0,0,.35)]";
export const LABEL = "font-[family-name:var(--font-bricolage)] text-xs font-medium uppercase tracking-[.08em] text-[#ee7454]";
export const MUTED = "text-[#4a4f52]";
export const NUM = "font-[family-name:var(--font-bricolage)] font-semibold tabular-nums";

export default function PageShell({
  current,
  children,
}: {
  current?: "map" | "contractors" | "track" | "ward";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${fontVars} flex min-h-dvh w-full flex-col bg-[#faf3eb] font-[family-name:var(--font-newsreader)] text-[17px] leading-[1.55] text-[#2b3033]`}
    >
      <SiteHeader current={current} />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 pb-20 pt-8 sm:px-8">{children}</main>
      <Suspense fallback={<FooterText lang="en" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

// Footer in the saved language (cookie); English while it loads.
async function Footer() {
  return <FooterText lang={await getLang()} />;
}

function FooterText({ lang }: { lang: Lang }) {
  const L = say(lang);
  return (
    <footer className="mx-auto w-full max-w-[1180px] px-5 pb-10 text-sm text-[#4a4f52] sm:px-8">
      {L(
        "Synthetic data from the Claude Impact Lab Mumbai dataset (CC BY 4.0). Not BMC data; every contractor is fictional. Checks run in Python; scorecard text written by Claude.",
        "Claude Impact Lab Mumbai डेटासेट (CC BY 4.0) का कृत्रिम डेटा। यह BMC का डेटा नहीं है; सभी ठेकेदार काल्पनिक हैं। जाँच Python में होती है; स्कोरकार्ड का पाठ Claude ने लिखा है।",
        "Claude Impact Lab Mumbai डेटासेटमधील (CC BY 4.0) कृत्रिम डेटा. हा BMC चा डेटा नाही; सर्व कंत्राटदार काल्पनिक आहेत. तपासणी Python मध्ये होते; स्कोरकार्डचा मजकूर Claude ने लिहिला आहे.",
      )}
    </footer>
  );
}

export function Stat({ value, label, bad }: { value: string; label: string; bad?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-[0_0_0_1px_rgba(43,48,51,.10)]">
      <div className={`${NUM} text-[clamp(24px,2.6vw,32px)] leading-none ${bad ? "text-[#c2410c]" : "text-[#2b3033]"}`}>{value}</div>
      <div className="mt-2 text-[15px] leading-snug text-[#4a4f52]">{label}</div>
    </div>
  );
}

export function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "red" | "amber" | "blue" | "green" | "plain" }) {
  const t = {
    red: "bg-[#fde8e1] text-[#9a3412]",
    amber: "bg-[#fef3c7] text-[#92400e]",
    blue: "bg-[#e0f2fe] text-[#075985]",
    green: "bg-[#dcfce7] text-[#166534]",
    plain: "bg-[rgba(43,48,51,.08)] text-[#4a4f52]",
  }[tone];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-[family-name:var(--font-bricolage)] text-xs font-medium ${t}`}>
      {children}
    </span>
  );
}

export const flagTone = (f: string) => (f.startsWith("Over") ? "red" : f.startsWith("Possible") ? "amber" : "blue") as "red" | "amber" | "blue";
