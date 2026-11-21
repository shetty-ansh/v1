"use client";

import { useRouter } from "next/navigation";
import { say, type Lang } from "@/lib/i18n";
import type { AuditFlagsData } from "./audit";
import type { Ward } from "./data";
import type { SearchHit } from "./SearchBar";
import type { TrailIndexData } from "./trail";
import KpiTicker from "./KpiTicker";
import SearchBar from "./SearchBar";
import WardMap from "./WardMap";

// The /map experience: title + universal search, citywide stat tiles, and a
// full-width Leaflet map. Layers (roads, complaints, accidents, flood spots,
// schools & hospitals) toggle on the map; clicking a ward opens its page.
export default function MapExperience({
  wards,
  outlines,
  roads,
  audit,
  trail,
  lang,
}: {
  wards: Ward[];
  outlines: unknown;
  roads: unknown;
  audit: AuditFlagsData | null;
  trail: TrailIndexData | null;
  lang: Lang;
}) {
  const router = useRouter();
  const L = say(lang);

  // A search pick goes straight to the record: complaints to their trail,
  // roads to the ward they're in.
  const handleSearchPick = (hit: SearchHit) => {
    if (hit.kind === "complaint") {
      router.push(`/track?q=${encodeURIComponent(hit.record.complaint_id)}`);
    } else if (hit.road.ward_code) {
      router.push(`/ward/${hit.road.ward_code.replace("/", "-")}`);
    }
  };

  return (
    <>
      <div className="flex flex-none flex-col gap-3 px-5 pt-3 sm:px-[max(20px,6%)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex-none">
            <h1 className="text-[clamp(28px,3vw,40px)] font-extrabold leading-none tracking-[-.04em]">{L("Ward map", "वार्ड नक्शा", "वॉर्ड नकाशा")}</h1>
            <p className="mt-1 text-[14px] text-[#4a4f52]">{L(
                "Click a ward to open it. Turn on layers to see what's where.",
                "किसी वार्ड को खोलने के लिए उस पर क्लिक करें। क्या कहाँ है, यह देखने के लिए लेयर चालू करें।",
                "वॉर्ड उघडण्यासाठी त्यावर क्लिक करा. काय कुठे आहे ते पाहण्यासाठी स्तर चालू करा.",
              )}
            </p>
          </div>
          <div className="min-w-0 lg:flex-1">
            <SearchBar trail={trail} onPick={handleSearchPick} lang={lang} />
          </div>
        </div>
        <KpiTicker audit={audit} wardSim={null} lang={lang} />
      </div>

      <main className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-1 sm:px-[max(20px,6%)]">
        <div className="relative h-[68dvh] flex-none overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(43,48,51,.14),0_18px_40px_-24px_rgba(0,0,0,.35)] lg:h-auto lg:min-h-0 lg:flex-1">
          <WardMap wards={wards} outlines={outlines} roads={roads} lang={lang} />
        </div>
      </main>
    </>
  );
}
