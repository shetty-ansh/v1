import { Suspense } from "react";
import { connection } from "next/server";
import SiteHeader from "@/components/site-header";
import { getLang } from "@/lib/i18n-server";
import { fontVars, inter } from "@/lib/fonts";
import { loadAuditFlags } from "./audit";
import { loadRoads, loadWardOutlines, loadWards } from "./data";
import MapExperience from "./MapExperience";
import { loadTrailIndex } from "./trail";

export const metadata = {
  title: "Ward map · Follow the Rupee",
  description:
    "Mumbai BMC ward map: complaints, accidents, flood spots, schools, hospitals and roads as layers; click a ward to open it (synthetic data)",
};

// Static shell — the data-dependent body streams in via Suspense so the route
// can still prerender its frame (Next 16 blocking-prerender-dynamic).
export default function MapPage(props: PageProps<"/map">) {
  return (
    <div
      className={`${fontVars} ${inter.variable} flex min-h-dvh w-full flex-col gap-3 bg-[#faf3eb] text-[#2b3033] lg:h-dvh lg:min-h-0`}
    >
      <SiteHeader current="map" />
      {/* Plain sans below the header, same as /audit: font vars resolve to Inter. */}
      <div className="contents font-[family-name:var(--font-inter)] [--font-bricolage:var(--font-inter)] [--font-newsreader:var(--font-inter)]">
        <Suspense fallback={<MapFallback />}>
          <MapBody searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function MapBody({ searchParams }: { searchParams: PageProps<"/map">["searchParams"] }) {
  // Query Postgres per request rather than at build time.
  await connection();
  const [wards, outlines, roads, audit, trail, sp] = await Promise.all([
    loadWards(),
    loadWardOutlines(),
    loadRoads(),
    loadAuditFlags(),
    loadTrailIndex(),
    searchParams,
  ]);
  const lang = await getLang(sp.lang);

  return <MapExperience wards={wards} outlines={outlines} roads={roads} audit={audit} trail={trail} lang={lang} />;
}

function MapFallback() {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-5 pt-3 sm:px-[max(20px,6%)]">
      <div className="h-[110px] flex-none animate-pulse rounded-2xl bg-white/70" />
      <div className="h-[68dvh] animate-pulse rounded-2xl bg-white/70 lg:h-auto lg:flex-1" />
    </main>
  );
}
