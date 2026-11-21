"use client";

import Link from "next/link";

// Landing-page feature cards: one short line + a small drawn visual each.
// Visuals carry no live numbers, so they never go stale.

const CARD =
  "group flex flex-col rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(43,48,51,.12),0_18px_40px_-26px_rgba(0,0,0,.35)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee7454]";
const KICK = "text-[11.5px] font-bold uppercase tracking-[.12em] text-[#ee7454]";
const TITLE = "mt-1.5 text-[22px] font-extrabold leading-tight tracking-[-.03em] text-[#2b3033]";
const DESC = "mt-1.5 text-[14.5px] leading-snug text-[#4a4f52]";
const GO = "mt-4 text-[13.5px] font-bold text-[#2b3033] group-hover:text-[#ee7454]";

function MapVisual() {
  // Ward blocks with a few coloured dots, one per layer.
  const dots: [number, number, string][] = [
    [18, 30, "#2a78d6"], [26, 62, "#2a78d6"], [44, 38, "#2a78d6"], [58, 70, "#eb6834"],
    [70, 30, "#1baf7a"], [82, 58, "#2a78d6"], [36, 80, "#eb6834"], [88, 20, "#1baf7a"],
  ];
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-[#efe7dd]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        <path d="M0 40 L30 35 L55 45 L100 30 M0 75 L40 70 L70 80 L100 72 M30 35 L40 70 M55 45 L70 80 M70 30 L70 80" stroke="#2b3033" strokeOpacity=".22" strokeWidth=".8" fill="none" />
      </svg>
      {dots.map(([x, y, c], i) => (
        <span key={i} className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white" style={{ left: `${x}%`, top: `${y}%`, background: c }} />
      ))}
    </div>
  );
}

function MoneyVisual() {
  return (
    <div className="h-28 rounded-xl bg-[#faf3eb] p-4">
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="h-4 w-full overflow-hidden rounded-[4px] bg-[rgba(43,48,51,.1)]">
          <div className="h-full w-[26%] rounded-[4px] bg-[#ee7454]" />
        </div>
        <div className="flex gap-1.5">
          {[0.9, 0.7, 0.5, 0.35, 0.25].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-[4px] bg-[#ee7454]" style={{ height: `${h * 44}px`, opacity: 0.35 + i * 0.13 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompareVisual() {
  const rows: [string, number, number][] = [
    ["Fixes that failed", 78, 40],
    ["Deadlines met", 62, 85],
    ["Over-billed", 30, 12],
  ];
  return (
    <div className="flex h-28 flex-col justify-center gap-2.5 rounded-xl bg-[#faf3eb] px-4">
      {rows.map(([label, a, b]) => (
        <div key={label}>
          <div className="text-[11px] font-semibold text-[#4a4f52]">{label}</div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <div className="h-2 rounded-full bg-[#2b3033]" style={{ width: `${a}%` }} />
            <div className="h-2 rounded-full bg-[#ee7454]" style={{ width: `${b}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NextVisual() {
  return (
    <div className="flex h-28 flex-col justify-center gap-2 rounded-xl bg-[#faf3eb] px-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-2.5">
          <span className="grid size-6 flex-none place-items-center rounded-full bg-[#2b3033] text-[11px] font-extrabold text-white">{n}</span>
          <span className="h-2.5 rounded-full bg-[#ee7454]" style={{ width: `${100 - (n - 1) * 22}%` }} />
        </div>
      ))}
    </div>
  );
}

function TrackVisual() {
  const steps = ["Reported", "Assigned", "Fixed", "Held"];
  return (
    <div className="flex h-28 items-center rounded-xl bg-[#faf3eb] px-4">
      <div className="relative flex w-full items-center justify-between">
        <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-[rgba(43,48,51,.18)]" />
        {steps.map((s, i) => (
          <div key={s} className="relative flex flex-col items-center gap-1">
            <span className={`size-3.5 rounded-full ring-4 ring-[#faf3eb] ${i < 3 ? "bg-[#ee7454]" : "bg-[#2b3033]"}`} />
            <span className="text-[10.5px] font-semibold text-[#4a4f52]">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="flex h-28 flex-col justify-center gap-2 rounded-xl bg-[#e9f7ef] px-4">
      <div className="ml-auto rounded-2xl rounded-br-sm bg-white px-3 py-1.5 text-[13px] font-semibold shadow-sm">Hi</div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-[12.5px] shadow-sm">
        <b>Ward K/E · Andheri East</b>
        <span className="block text-[#4a4f52]">Money leak report for your ward</span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    kick: "Map",
    title: "See every ward",
    desc: "Turn on complaints, accidents, flood spots, schools and roads, then click any ward.",
    href: "/map",
    go: "Open the map →",
    visual: <MapVisual />,
  },
  {
    kick: "Wasted money",
    title: "Where money was lost",
    desc: "Recoverable repair money, by ward, by reason and by contractor.",
    href: "/audit",
    go: "See the money →",
    visual: <MoneyVisual />,
  },
  {
    kick: "Contractors",
    title: "Compare contractors",
    desc: "Put up to four side by side: failed fixes, deadlines, billing and conditions.",
    href: "/contractors",
    go: "Compare them →",
    visual: <CompareVisual />,
  },
  {
    kick: "What's next",
    title: "The next rupee",
    desc: "The roads a ward should fix first, and why: complaints, ambulance routes, schools.",
    href: "/plan",
    go: "Plan a ward →",
    visual: <NextVisual />,
  },
  {
    kick: "Track",
    title: "Follow a complaint",
    desc: "Type a complaint or work order number and see it from report to repair.",
    href: "/track",
    go: "Track one →",
    visual: <TrackVisual />,
  },
  {
    kick: "WhatsApp",
    title: "Money leak report",
    desc: "Text Hi to +1 (555) 178-1985, then your ward's name, and get its money leak report.",
    href: null,
    go: null,
    visual: <ChatVisual />,
  },
];

// Six cards in a 3-column grid on desktop, 2 on tablet, 1 on mobile.
export default function HomeFeatures() {
  return (
    <section aria-labelledby="home-features-h" className="mx-auto w-full max-w-[1180px] px-5 pb-20 pt-16 sm:px-8">
      <h2 id="home-features-h" className="text-[clamp(28px,3.2vw,40px)] font-extrabold leading-tight tracking-[-.04em]">
        What you can do here
      </h2>
      <p className="mt-2 max-w-[38em] text-[15.5px] text-[#4a4f52]">Six views of the same data. Start with whichever question you have.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const body = (
            <>
              {f.visual}
              <div className={KICK + " mt-5"}>{f.kick}</div>
              <div className={TITLE}>{f.title}</div>
              <p className={DESC}>{f.desc}</p>
              {f.go && <span className={GO}>{f.go}</span>}
            </>
          );
          return f.href ? (
            <Link key={f.title} href={f.href} className={CARD}>
              {body}
            </Link>
          ) : (
            <div key={f.title} className={CARD}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
