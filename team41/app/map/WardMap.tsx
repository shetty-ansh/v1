"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { say, t, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/lang-client";
import type { Ward } from "./data";
import type { PointLayerKey, PointRow } from "./points";

type Outlines = GeoJSON.FeatureCollection<GeoJSON.Polygon, { ward_code: string }>;
type RoadProps = { road_id: string; road_name: string; ward_code: string; road_type: string; surface: string };
type Roads = GeoJSON.FeatureCollection<GeoJSON.LineString, RoadProps>;

// Line weight by road type, widest first.
const ROAD_WEIGHTS: [string, number][] = [
  ["Highway", 5],
  ["Arterial", 3.5],
  ["Main", 2.5],
  ["Local", 1.5],
];

const INK = "#2b3033";
const CORAL = "#ee7454";
const BASE = { color: INK, weight: 1.25, opacity: 0.55, fillColor: CORAL, fillOpacity: 0.07 };
const HOVER = { color: CORAL, weight: 2.5, opacity: 1, fillOpacity: 0.22 };
const SELECTED = { color: CORAL, weight: 3, opacity: 1, fillOpacity: 0.3 };

// Layer toggles. Dot hues are the first three validated categorical slots;
// facilities are ink squares, so shape (not just colour) tells them apart.
type LayerKey = "roads" | PointLayerKey;
// Labels are [English, Hindi, Marathi].
type Words = [string, string, string];
type Say = ReturnType<typeof say>;
const LAYERS: { key: LayerKey; label: Words; color: string; square?: boolean; line?: boolean }[] = [
  { key: "roads", label: ["Roads", "सड़कें", "रस्ते"], color: INK, line: true },
  { key: "complaints", label: ["Complaints", "शिकायतें", "तक्रारी"], color: "#2a78d6" },
  { key: "accidents", label: ["Accidents", "दुर्घटनाएँ", "अपघात"], color: "#eb6834" },
  { key: "floods", label: ["Flood spots", "जलभराव स्थल", "पूरप्रवण ठिकाणे"], color: "#1baf7a" },
  { key: "facilities", label: ["Schools & hospitals", "स्कूल और अस्पताल", "शाळा आणि रुग्णालये"], color: INK, square: true },
];
const COLOR = Object.fromEntries(LAYERS.map((l) => [l.key, l.color])) as Record<LayerKey, string>;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const slug = (code: string) => code.replace("/", "-");
const wardLink = (code: unknown, L: Say) =>
  code ? `<a class="pt-link" href="/ward/${esc(slug(String(code)))}">${L("Ward", "वार्ड", "वॉर्ड")} ${esc(code)} →</a>` : "";

// Popup HTML per layer; row layouts are documented in ./points.ts.
// Built when a popup opens, so it follows the current language.
function popupHtml(layer: PointLayerKey, r: PointRow, L: Say): string {
  switch (layer) {
    case "complaints": {
      const [, , id, cat, status, date, loc, up, text, ward] = r;
      return `<div class="pt-kicker" style="color:${COLOR.complaints}">${L("Complaint", "शिकायत", "तक्रार")} · ${esc(status)}</div>
        <strong>${esc(cat)}</strong><div class="pt-meta">${esc(loc)}${loc ? " · " : ""}${esc(date)}${Number(up) ? ` · ▲ ${esc(up)}` : ""}</div>
        ${text ? `<p class="pt-text">“${esc(text)}”</p>` : ""}
        <div class="pt-links"><a class="pt-link" href="/track?q=${esc(id)}">${L("Follow it →", "ट्रैक करें →", "मागोवा घ्या →")}</a>${wardLink(ward, L)}</div>`;
    }
    case "accidents": {
      const [, , , sev, vehicle, cause, date, ward] = r;
      return `<div class="pt-kicker" style="color:${COLOR.accidents}">${L("Accident", "दुर्घटना", "अपघात")}</div>
        <strong>${esc(sev)}</strong><div class="pt-meta">${esc(vehicle)} · ${esc(cause)}</div>
        <div class="pt-meta">${esc(date)}</div><div class="pt-links">${wardLink(ward, L)}</div>`;
    }
    case "floods": {
      const [, , name, th, tide, pump, years, depth, ward] = r;
      return `<div class="pt-kicker" style="color:#128a5f">${L("Flood spot", "जलभराव स्थल", "पूरप्रवण ठिकाण")}</div>
        <strong>${esc(name)}</strong>
        <div class="pt-years">${Array.from({ length: 5 }, (_, i) => `<i class="${i < Number(years) ? "on" : ""}"></i>`).join("")}<span>${L(`flooded ${esc(years)} of last 5 years`, `पिछले 5 में से ${esc(years)} साल पानी भरा`, `गेल्या 5 पैकी ${esc(years)} वर्षे पाणी साचले`)}</span></div>
        <div class="pt-meta">${L(`Floods above ${esc(th)} mm/day · ~${esc(depth)} cm deep`, `${esc(th)} मिमी/दिन से ज़्यादा बारिश पर पानी भरता है · ~${esc(depth)} सेमी गहरा`, `${esc(th)} मिमी/दिवसपेक्षा जास्त पावसात पाणी साचते · ~${esc(depth)} सेमी खोल`)}</div>
        <div class="pt-meta">${tide ? `${L("Tide-sensitive", "ज्वार से प्रभावित", "भरती-संवेदनशील")} · ` : ""}${pump ? L("Pumping station nearby", "पास में पंपिंग स्टेशन", "जवळ पंपिंग स्टेशन") : `<b>${L("No pumping station nearby", "पास में कोई पंपिंग स्टेशन नहीं", "जवळ पंपिंग स्टेशन नाही")}</b>`}</div>
        <div class="pt-links">${wardLink(ward, L)}</div>`;
    }
    case "facilities": {
      const [, , name, type, n, emergency, ward] = r;
      const kind = type === "Hospital" ? L("Hospital", "अस्पताल", "रुग्णालय") : type === "School" ? L("School", "स्कूल", "शाळा") : String(type ?? "");
      return `<div class="pt-kicker">${esc(kind)}</div><strong>${esc(name)}</strong>
        <div class="pt-meta">${Number(n).toLocaleString("en-IN")} ${type === "Hospital" ? L("beds", "बिस्तर", "खाटा") : L("students", "छात्र", "विद्यार्थी")}${emergency ? ` · ${L("Emergency services", "आपातकालीन सेवाएँ", "आपत्कालीन सेवा")}` : ""}</div>
        <div class="pt-links">${wardLink(ward, L)}</div>`;
    }
  }
}

// Ward map: outlines (click opens the ward page), optional roads, and
// toggleable clickable dot layers fetched on first use from /map/points/<layer>.
export default function WardMap({
  wards,
  outlines,
  roads,
  selectedCode,
  onWardSelect,
  lang: langProp,
}: {
  wards: Ward[];
  outlines: unknown;
  roads: unknown;
  // Optional: highlight a ward, and handle ward clicks yourself (default: open /ward/<code>).
  selectedCode?: string | null;
  onWardSelect?: (wardCode: string) => void;
  // Optional: page language from the server; falls back to the saved choice.
  lang?: Lang;
}) {
  const router = useRouter();
  const clientLang = useLang();
  const lang = langProp ?? clientLang;
  const L = say(lang);
  // Tooltips/popups read this when they open, so the map isn't rebuilt on a language change.
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  const selectedRef = useRef(selectedCode ?? null);
  const onSelectRef = useRef(onWardSelect);
  useEffect(() => {
    onSelectRef.current = onWardSelect;
  }, [onWardSelect]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const layerObjs = useRef(new Map<LayerKey, Leaflet.Layer>());
  const polys = useRef(new Map<string, Leaflet.Path>());
  const located = useRef<string | null>(null);
  const styleForRef = useRef<((code: string) => Leaflet.PathOptions) | null>(null);
  const userLayer = useRef<Leaflet.LayerGroup | null>(null);

  const [on, setOn] = useState<Set<LayerKey>>(new Set());
  const onRef = useRef(on);
  const [counts, setCounts] = useState<Partial<Record<LayerKey, number>>>({});
  const [loading, setLoading] = useState<Set<LayerKey>>(new Set());
  const [ready, setReady] = useState(false);

  const [locStatus, setLocStatus] = useState<"idle" | "locating" | "ok" | "denied" | "unavailable" | "unsupported">("idle");
  const [locWard, setLocWard] = useState<Ward | null>(null);

  // Build the map once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let map: Leaflet.Map | undefined;
    let cancelled = false;
    let resizeObs: ResizeObserver | undefined;
    const polyMap = polys.current;
    const objs = layerObjs.current;

    // Leaflet reads `window` on import, so load it only in the browser.
    import("leaflet").then((L) => {
      if (cancelled) return;
      LRef.current = L;
      const byCode = new Map(wards.map((w) => [w.ward_code, w]));
      // One shared canvas: clicks hit the topmost shape, so a dot's popup
      // wins over the ward underneath it.
      const theMap = L.map(el, { scrollWheelZoom: true, zoomSnap: 0.25, preferCanvas: true }).setView([19.07, 72.88], 11);
      map = theMap;
      mapRef.current = theMap;
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 17,
        attribution: "Tiles &copy; Esri",
      }).addTo(theMap);

      const styleFor = (code: string) => (located.current === code || selectedRef.current === code ? SELECTED : BASE);
      styleForRef.current = styleFor;
      const wardsLayer = L.geoJSON(outlines as Outlines, {
        style: BASE,
        onEachFeature: (feature, item) => {
          const poly = item as Leaflet.Path;
          const code = feature.properties.ward_code;
          const w = byCode.get(code);
          polyMap.set(code, poly);
          poly.bindTooltip(() => `<strong>${esc(code)}</strong>${w ? ` · ${esc(w.ward_name)}` : ""}<br><span style="opacity:.75">${say(langRef.current)("Click to open the ward", "वार्ड खोलने के लिए क्लिक करें", "वॉर्ड उघडण्यासाठी क्लिक करा")}</span>`, {
            sticky: true,
            className: "ward-tip",
          });
          poly.on({
            mouseover: () => poly.setStyle(HOVER),
            mouseout: () => poly.setStyle(styleFor(code)),
            click: () => (onSelectRef.current ? onSelectRef.current(code) : router.push(`/ward/${slug(code)}`)),
          });
        },
      }).addTo(theMap);
      polyMap.forEach((poly, code) => poly.setStyle(styleFor(code)));

      const cityBounds = wardsLayer.getBounds();
      const fit = () => theMap.fitBounds(cityBounds, { paddingTopLeft: [16, 64], paddingBottomRight: [16, 16], animate: false });
      fit();
      resizeObs = new ResizeObserver(() => {
        theMap.invalidateSize();
        if (!located.current) fit();
      });
      resizeObs.observe(el);

      // Roads are built up front (small) and only added when toggled on.
      const weights = new Map(ROAD_WEIGHTS);
      const roadLayer = L.geoJSON(roads as Roads, {
        style: (f) => ({ color: INK, weight: weights.get(f?.properties.road_type ?? "") ?? 1.5, opacity: 0.8, lineCap: "round" }),
        onEachFeature: (f, item) => {
          const p = f.properties;
          const line = item as Leaflet.Path;
          line.bindPopup(() => {
            const Lr = say(langRef.current);
            return `<div class="pt-kicker">${Lr("Road", "सड़क", "रस्ता")} · ${esc(p.road_type)}</div><strong>${esc(p.road_name)}</strong><div class="pt-meta">${esc(p.surface)} · ${esc(p.road_id)}</div><div class="pt-links">${wardLink(p.ward_code, Lr)}</div>`;
          });
          line.on({
            mouseover: () => line.setStyle({ color: CORAL, opacity: 1 }),
            mouseout: () => roadLayer.resetStyle(line),
          });
        },
      });
      objs.set("roads", roadLayer);
      setReady(true);
    });

    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      map?.remove();
      mapRef.current = null;
      LRef.current = null;
      userLayer.current = null;
      polyMap.clear();
      objs.clear();
    };
  }, [wards, outlines, roads, router]);

  // Build a point layer from its rows.
  const buildPoints = (L: typeof Leaflet, key: PointLayerKey, rows: PointRow[]): Leaflet.Layer => {
    const group = L.layerGroup();
    const color = COLOR[key];
    for (const r of rows) {
      const latlng: [number, number] = [Number(r[0]), Number(r[1])];
      let m: Leaflet.Layer;
      if (key === "facilities") {
        m = L.marker(latlng, {
          icon: L.divIcon({ className: "pt-square", iconSize: [11, 11], html: r[3] === "Hospital" ? "<span>+</span>" : "" }),
          keyboard: false,
        });
      } else {
        const radius =
          key === "accidents" ? (r[3] === "Fatal" ? 7.5 : r[3] === "Grievous" ? 6 : 4.5)
          : key === "floods" ? 7 + Number(r[6] ?? 0) * 1.2
          : 4;
        m = L.circleMarker(latlng, { radius, color: "#fff", weight: 1, fillColor: color, fillOpacity: key === "complaints" ? 0.75 : 0.9 });
      }
      (m as Leaflet.Marker).bindPopup(() => popupHtml(key, r, say(langRef.current)), { className: "pt-popup", maxWidth: 260 });
      group.addLayer(m);
    }
    return group;
  };

  // Keep the map in step with the toggles (and the highlighted ward).
  useEffect(() => {
    onRef.current = on;
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const { key } of LAYERS) {
      const obj = layerObjs.current.get(key);
      if (!obj) continue;
      if (on.has(key) && !map.hasLayer(obj)) obj.addTo(map);
      else if (!on.has(key) && map.hasLayer(obj)) obj.remove();
    }
  }, [on, ready]);

  useEffect(() => {
    selectedRef.current = selectedCode ?? null;
    const styleFor = styleForRef.current;
    if (styleFor) polys.current.forEach((poly, code) => poly.setStyle(styleFor(code)));
  }, [selectedCode, ready]);

  // Toggle a layer; a point layer is downloaded the first time it's switched on.
  const toggle = (key: LayerKey) => {
    const turningOn = !on.has(key);
    setOn((s) => {
      const n = new Set(s);
      if (turningOn) n.add(key);
      else n.delete(key);
      return n;
    });
    const L = LRef.current;
    if (!turningOn || key === "roads" || !L || layerObjs.current.has(key) || loading.has(key)) return;
    setLoading((s) => new Set(s).add(key));
    fetch(`/map/points/${key}`)
      .then((res) => (res.ok ? (res.json() as Promise<PointRow[]>) : Promise.reject(res.status)))
      .then((rows) => {
        const layer = buildPoints(L, key, rows);
        layerObjs.current.set(key, layer);
        setCounts((c) => ({ ...c, [key]: rows.length }));
        if (onRef.current.has(key) && mapRef.current) layer.addTo(mapRef.current);
      })
      .catch(() =>
        setOn((s) => {
          const n = new Set(s);
          n.delete(key);
          return n;
        }),
      )
      .finally(() =>
        setLoading((s) => {
          const n = new Set(s);
          n.delete(key);
          return n;
        }),
      );
  };

  // "My location": centre, drop a marker, highlight the ward you're in
  // (nearest centroid — the outlines are a Voronoi approximation).
  function locateMe() {
    if (!navigator.geolocation) return setLocStatus("unsupported");
    setLocStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const map = mapRef.current;
        const L = LRef.current;
        if (map && L) {
          userLayer.current ??= L.layerGroup().addTo(map);
          userLayer.current.clearLayers();
          L.circle([lat, lng], { radius: accuracy, color: CORAL, weight: 1, fillColor: CORAL, fillOpacity: 0.12, interactive: false }).addTo(userLayer.current);
          L.circleMarker([lat, lng], { radius: 7, color: "#fff", weight: 3, fillColor: CORAL, fillOpacity: 1, interactive: false }).addTo(userLayer.current);
          map.flyTo([lat, lng], 14, { duration: 1.2 });
        }
        let best: Ward | null = null;
        let bestD = Infinity;
        for (const w of wards) {
          const dLat = w.centroid_lat - lat;
          const dLon = (w.centroid_lon - lng) * Math.cos((lat * Math.PI) / 180);
          const d = dLat * dLat + dLon * dLon;
          if (d < bestD) [bestD, best] = [d, w];
        }
        const prev = located.current;
        if (prev) polys.current.get(prev)?.setStyle(BASE);
        located.current = best?.ward_code ?? null;
        if (best) polys.current.get(best.ward_code)?.setStyle(SELECTED);
        setLocWard(best);
        setLocStatus("ok");
      },
      (err) => setLocStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  const chip =
    "flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#2b3033] shadow-[0_0_0_1px_rgba(43,48,51,.14),0_10px_24px_-12px_rgba(0,0,0,.35)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee7454]";

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex flex-col items-start gap-2 pl-11">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2" role="group" aria-label={L("Map layers", "नक्शे की लेयर", "नकाशाचे स्तर")}>
          {LAYERS.map((l) => {
            const active = on.has(l.key);
            const n = counts[l.key];
            return (
              <button
                key={l.key}
                type="button"
                aria-pressed={active}
                disabled={!ready}
                onClick={() => toggle(l.key)}
                className={`${chip} ${active ? "!bg-[#2b3033] !text-white" : "hover:bg-[#fdeae4]"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex-none ${l.line ? "h-[3px] w-4 rounded-full" : l.square ? "size-2.5 rounded-[2px]" : "size-2.5 rounded-full"} ${active && l.color === INK ? "ring-1 ring-white" : ""}`}
                  style={{ background: l.color === INK && active ? "#fff" : l.color }}
                />
                {L(...l.label)}
                {loading.has(l.key) ? (
                  <span className="text-[11px] font-medium opacity-70">…</span>
                ) : active && n != null ? (
                  <span className="text-[11px] font-medium tabular-nums opacity-70">{n.toLocaleString("en-IN")}</span>
                ) : null}
              </button>
            );
          })}
          <button type="button" onClick={locateMe} disabled={locStatus === "locating"} className={`${chip} hover:text-[#ee7454] disabled:opacity-60`}>
            <svg viewBox="0 0 20 20" className="size-4 flex-none" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="10" cy="10" r="3.2" />
              <path d="M10 1.8v3M10 15.2v3M1.8 10h3M15.2 10h3" />
            </svg>
            {t(lang, locStatus === "locating" ? "map_locating" : "map_locate")}
          </button>
        </div>
        {locStatus !== "idle" && locStatus !== "locating" && (
          <p role="status" className="pointer-events-auto rounded-xl bg-white px-3 py-2 text-[13px] shadow-[0_0_0_1px_rgba(43,48,51,.14),0_10px_24px_-12px_rgba(0,0,0,.35)]">
            {locStatus === "ok" && locWard ? (
              <>
                {L("You're in", "आप यहाँ हैं:", "तुम्ही येथे आहात:")} <b>{L("Ward", "वार्ड", "वॉर्ड")} {locWard.ward_code}</b> · {locWard.ward_name}.{" "}
                <a className="font-semibold text-[#ee7454] underline" href={`/ward/${slug(locWard.ward_code)}`}>{L("Open ward →", "वार्ड खोलें →", "वॉर्ड उघडा →")}</a>
              </>
            ) : locStatus === "denied" ? (
              L("Location is blocked. Allow it for this site in your browser settings.", "लोकेशन ब्लॉक है। ब्राउज़र सेटिंग्स में इस साइट के लिए अनुमति दें।", "ठिकाण ब्लॉक आहे. ब्राउझर सेटिंग्जमध्ये या साइटसाठी परवानगी द्या.")
            ) : locStatus === "unsupported" ? (
              L("This browser can't share its location.", "यह ब्राउज़र लोकेशन साझा नहीं कर सकता।", "हा ब्राउझर ठिकाण शेअर करू शकत नाही.")
            ) : (
              L("Couldn't get your location. Try again.", "आपकी लोकेशन नहीं मिली। फिर से कोशिश करें।", "तुमचे ठिकाण मिळाले नाही. पुन्हा प्रयत्न करा.")
            )}
          </p>
        )}
      </div>
      {!on.size && (
        <p className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-full bg-white/90 px-3 py-1.5 text-[12.5px] font-medium text-[#4a4f52] shadow-[0_0_0_1px_rgba(43,48,51,.12)]">
          {L("Turn on a layer above · click a ward to open it", "ऊपर कोई लेयर चालू करें · खोलने के लिए वार्ड पर क्लिक करें", "वर एखादा स्तर चालू करा · उघडण्यासाठी वॉर्डवर क्लिक करा")}
        </p>
      )}
    </div>
  );
}
