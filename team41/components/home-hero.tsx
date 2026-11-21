"use client";

import SketchCityHero from "@/components/ui/sketch-city-hero";
import SiteHeader from "@/components/site-header";
import HomeFeatures from "@/components/home-features";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/lang-client";

// Home = the shared header + menu bar, then the illustrated hero (one screen),
// then the feature cards. Only the hero's own top bar is hidden (CSS below).
// The hero's count-up stats line is hidden; the blurb carries the subtext.
export default function HomeHero() {
  const lang = useLang();
  const T = tr(lang);
  return (
    <div className="ftr-home flex w-full flex-col bg-[#faf3eb]">
      <style>{".ftr-home .sch-bar,.ftr-home .sch-stats{display:none!important}.ftr-home .sch-blurb{margin-top:clamp(20px,min(2.4cqw,3.8cqh),34px);color:#2b3033}"}</style>
      <SiteHeader />
      <div className="relative h-[calc(100dvh-112px)] min-h-[600px] w-full">
        <div className="absolute inset-0">
          <SketchCityHero
            key={lang}
            height="100%"
            brand={T("brand")}
            headline={[T("home_h1"), T("home_h2")]}
            stats={[]}
            blurb={T("home_blurb")}
            desktopSrc="/sketch-city-hero/mumbai-desktop.svg"
            mobileSrc="/sketch-city-hero/mumbai-mobile.svg"
          />
        </div>
      </div>
      <HomeFeatures />
    </div>
  );
}
