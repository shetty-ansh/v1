"use client";

import { useMemo, useState } from "react";
import { say, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/lang-client";
import type { TrailIndexData, TrailRecord, TrailRoad } from "./trail";

export type TrailFocus = {
  type: "complaint" | "road";
  id: string;
  seq: number;
};

export type SearchHit =
  | { kind: "complaint"; record: TrailRecord; score: number; snippet: string }
  | { kind: "road"; road: TrailRoad; score: number };

const LANG_LABEL: Record<string, string> = {
  en: "EN",
  "hi-en": "HI-EN",
  mr: "MR",
  hi: "HI",
};

function norm(s: string): string {
  return s.toLowerCase().trim();
}

function scoreRecord(r: TrailRecord, q: string): number {
  const wo = r.work_order;
  if (
    r.complaint_id.toLowerCase() === q ||
    (wo && wo.work_order_id.toLowerCase() === q)
  ) {
    return 10;
  }
  if (r.complaint_id.toLowerCase().startsWith(q)) return 8;
  if (wo && wo.work_order_id.toLowerCase().startsWith(q)) return 7;
  let score = 0;
  if (norm(r.locality_text).includes(q)) score = Math.max(score, 4);
  if (wo && norm(wo.road_id).includes(q)) score = Math.max(score, 4);
  if (norm(r.ward_code).includes(q)) score = Math.max(score, 3);
  if (norm(r.assistant_commissioner_office).includes(q)) score = Math.max(score, 3);
  if (norm(r.category_reported).includes(q)) score = Math.max(score, 3);
  if (wo && norm(wo.contractor_name).includes(q)) score = Math.max(score, 3);
  if (norm(r.description).includes(q)) score = Math.max(score, 1.5);
  if (norm(r.photo_description).includes(q)) score = Math.max(score, 1);
  if (r.social_dispute && norm(r.social_dispute.text).includes(q)) score = Math.max(score, 1.5);
  if (score > 0 && r.social_dispute) score += 0.5;
  if (score > 0 && r.duplicate_count > 1) score += 0.2;
  return score;
}

// Show the text that actually matched, so it's obvious why a result came up.
// Preference: dispute post > description > area > photo note.
function pickSnippet(r: TrailRecord, q: string, areaWord = "Area"): string {
  const candidates = [
    r.social_dispute?.text,
    r.description,
    r.locality_text ? `${areaWord}: ${r.locality_text}` : "",
    r.photo_description,
  ].filter(Boolean) as string[];
  for (const t of candidates) {
    if (q && t.toLowerCase().includes(q)) return t;
  }
  return candidates[0] ?? "";
}

// Wraps the first occurrence of the query in a subtle highlight.
function Highlight({ text, q }: { text: string; q: string }) {
  const needle = q.trim();
  if (needle.length < 2) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-[#ffe9c7] px-0.5 text-inherit">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

// Universal search over the trail index: BMC25-/WO25- ids, localities, road
// names and keywords in English, Hinglish, Hindi and Marathi.
export default function SearchBar({
  trail,
  onPick,
  lang: langProp,
}: {
  trail: TrailIndexData | null;
  onPick: (hit: SearchHit) => void;
  lang?: Lang;
}) {
  const clientLang = useLang();
  const lang = langProp ?? clientLang;
  const L = say(lang);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { complaintHits, roadHits } = useMemo(() => {
    const q = norm(query);
    const areaWord = say(lang)("Area", "इलाका", "परिसर");
    if (!trail || q.length < 2) {
      return { complaintHits: [] as SearchHit[], roadHits: [] as SearchHit[] };
    }
    const complaints: SearchHit[] = [];
    for (const r of trail.complaints) {
      if (!r.ward_code) continue;
      const score = scoreRecord(r, q);
      if (score > 0)
        complaints.push({ kind: "complaint", record: r, score, snippet: pickSnippet(r, q, areaWord) });
    }
    complaints.sort(
      (a, b) =>
        b.score - a.score ||
        (b as { record: TrailRecord }).record.upvotes -
          (a as { record: TrailRecord }).record.upvotes,
    );
    const roads: SearchHit[] = [];
    // Prefer road segments that actually have indexed complaint trails.
    const complaintCountByRoad = new Map<string, number>();
    for (const r of trail.complaints) {
      const rid = r.work_order?.road_id;
      if (rid) complaintCountByRoad.set(rid, (complaintCountByRoad.get(rid) ?? 0) + 1);
    }
    for (const road of trail.roads) {
      if (norm(road.road_name).includes(q) || norm(road.road_id).includes(q)) {
        const bonus = Math.min(3, (complaintCountByRoad.get(road.road_id) ?? 0) * 0.5);
        roads.push({
          kind: "road",
          road,
          score: (norm(road.road_name) === q ? 6 : 2) + bonus,
        });
      }
    }
    roads.sort((a, b) => b.score - a.score);
    return { complaintHits: complaints.slice(0, 6), roadHits: roads.slice(0, 3) };
  }, [trail, query, lang]);

  const wardWord = L("Ward", "वार्ड", "वॉर्ड");
  const disputed = L("⚠ Disputed", "⚠ विवादित", "⚠ वादग्रस्त");
  const total = complaintHits.length + roadHits.length;
  const pick = (hit: SearchHit) => {
    onPick(hit);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_0_0_1px_rgba(43,48,51,.14)] focus-within:shadow-[0_0_0_1.5px_#ee7454]">
        <span aria-hidden="true" className="text-[15px] text-[#4a4f52]">
          ⌕
        </span>
        <input
          type="text"
          role="combobox"
          aria-expanded={open && total > 0}
          aria-controls="trail-search-results"
          aria-label={L("Search complaints, jobs, roads and areas", "शिकायतें, काम, सड़कें और इलाके खोजें", "तक्रारी, कामे, रस्ते आणि परिसर शोधा")}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={L(
            "Search a complaint, job, road or area — try “pothole”, “paani” or “खड्डा”",
            "शिकायत, काम, सड़क या इलाका खोजें — जैसे “pothole”, “paani” या “खड्डा”",
            "तक्रार, काम, रस्ता किंवा परिसर शोधा — उदा. “pothole”, “paani” किंवा “खड्डा”",
          )}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              setOpen(false);
            } else if (e.key === "Enter") {
              const first = complaintHits[0] ?? roadHits[0];
              if (first) pick(first);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[14.5px] text-[#2b3033] outline-none placeholder:text-[#4a4f52]/70"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="grid size-6 flex-none place-items-center rounded-full text-[15px] leading-none text-[#4a4f52] hover:bg-[rgba(43,48,51,.1)]"
            aria-label={L("Clear search", "खोज साफ़ करें", "शोध पुसा")}
          >
            ×
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-[1500] mt-1.5 overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_rgba(43,48,51,.18),0_18px_40px_-18px_rgba(0,0,0,.4)]">
          {!trail ? (
            <p className="px-3.5 py-3 text-[13px] text-[#4a4f52]">
              {L("Trail index not generated — run", "ट्रेल इंडेक्स नहीं बना है — चलाएँ", "ट्रेल इंडेक्स तयार झालेला नाही — चालवा")}{" "}
              <code className="rounded bg-[#faf3eb] px-1 py-0.5 text-[12px]">
                python scripts/build_trail_data.py
              </code>
            </p>
          ) : total === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-[#4a4f52]">
              {L(
                `Nothing matches “${query.trim()}” in the complaint records.`,
                `शिकायत रिकॉर्ड में “${query.trim()}” से कुछ नहीं मिला।`,
                `तक्रार नोंदींमध्ये “${query.trim()}” शी काहीही जुळले नाही.`,
              )}
            </p>
          ) : (
            <ul
              id="trail-search-results"
              role="listbox"
              aria-label={L("Search results", "खोज परिणाम", "शोध निकाल")}
              className="max-h-[340px] overflow-y-auto"
            >
              {complaintHits.map((hit) =>
                hit.kind === "complaint" ? (
                  <ResultRow
                    key={hit.record.complaint_id}
                    chip={hit.record.complaint_id}
                    title={
                      hit.record.category_reported +
                      (hit.record.locality_text ? ` · ${hit.record.locality_text}` : "")
                    }
                    snippet={hit.snippet}
                    wardCode={hit.record.ward_code}
                    badges={[
                      LANG_LABEL[hit.record.language] ?? hit.record.language.toUpperCase(),
                      ...(hit.record.social_dispute ? [disputed] : []),
                      ...(hit.record.duplicate_count > 1
                        ? [`×${hit.record.duplicate_count} ${L("repeat reports", "दोहराई गई शिकायतें", "पुन्हा आलेल्या तक्रारी")}`]
                        : []),
                      ...(hit.record.geocoded ? [L("area matched", "इलाका मिला", "परिसर जुळला")] : []),
                    ]}
                    highlight={query.trim()}
                    wardWord={wardWord}
                    disputed={disputed}
                    onPick={() => pick(hit)}
                  />
                ) : null,
              )}
              {roadHits.map((hit) =>
                hit.kind === "road" ? (
                  <ResultRow
                    key={`road-${hit.road.road_id}`}
                    chip={hit.road.road_id}
                    title={hit.road.road_name}
                    snippet={L("Road segment — see complaints about it", "सड़क का हिस्सा — इससे जुड़ी शिकायतें देखें", "रस्त्याचा भाग — त्याबद्दलच्या तक्रारी पाहा")}
                    wardCode={hit.road.ward_code}
                    badges={[L("Road", "सड़क", "रस्ता")]}
                    highlight={query.trim()}
                    wardWord={wardWord}
                    disputed={disputed}
                    onPick={() => pick(hit)}
                  />
                ) : null,
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  chip,
  title,
  snippet,
  wardCode,
  badges,
  highlight,
  wardWord,
  disputed,
  onPick,
}: {
  chip: string;
  title: string;
  snippet: string;
  wardCode: string;
  badges: string[];
  highlight: string;
  wardWord: string;
  disputed: string;
  onPick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault() /* keep input focus */}
        onClick={onPick}
        className="block w-full border-b border-dotted border-[rgba(43,48,51,.12)] px-3.5 py-2 text-left last:border-b-0 hover:bg-[#fff6ef] focus-visible:bg-[#fff6ef] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ee7454]"
      >
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#f4ede4] px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-[#4a4f52]">
            {chip}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#2b3033]">
            {title}
          </span>
          <span className="flex-none rounded-full bg-[#fdeae4] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#b23a1d]">
            {wardWord} {wardCode}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[12px] text-[#4a4f52]">
          <Highlight text={snippet} q={highlight} />
        </div>
        {badges.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${
                  b === disputed
                    ? "bg-[#fdeae4] text-[#b23a1d]"
                    : "bg-[#f4ede4] text-[#4a4f52]"
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </button>
    </li>
  );
}
