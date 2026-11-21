import { Suspense } from "react";
import { connection } from "next/server";
import PageShell from "@/components/page-shell";
import { inter } from "@/lib/fonts";
import { say } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { loadAuditFlags } from "../map/audit";
import AuditDetails from "./AuditDetails";
import WastedMoney from "./WastedMoney";

export const metadata = {
  title: "Wasted money · Follow the Rupee",
  description: "Recoverable road-repair money across Mumbai wards (audit simulation, synthetic data)",
};

async function Body({ searchParams }: { searchParams: PageProps<"/audit">["searchParams"] }) {
  // Re-read the feeds per request.
  await connection();
  const [audit, sp] = await Promise.all([loadAuditFlags(), searchParams]);
  const lang = await getLang(sp.lang);
  const L = say(lang);
  return (
    <>
      {audit ? (
        <WastedMoney audit={audit} lang={lang} />
      ) : (
        <p className="rounded-2xl bg-white p-6 text-lg shadow-[0_0_0_1px_rgba(43,48,51,.14)]">
          {L("Audit data isn't in the database yet.", "ऑडिट डेटा अभी डेटाबेस में नहीं है।", "ऑडिट डेटा अजून डेटाबेसमध्ये नाही.")}
        </p>
      )}
      <AuditDetails sp={sp} lang={lang} />
    </>
  );
}

export default function Page(props: PageProps<"/audit">) {
  return (
    <PageShell>
      {/* Plain sans for this page: every font var below resolves to Inter. */}
      <div
        className={`${inter.variable} font-[family-name:var(--font-inter)] [--font-bricolage:var(--font-inter)] [--font-newsreader:var(--font-inter)]`}
      >
        <Suspense fallback={<p className="text-[#4a4f52]">…</p>}>
          <Body searchParams={props.searchParams} />
        </Suspense>
      </div>
    </PageShell>
  );
}
