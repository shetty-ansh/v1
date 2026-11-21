import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { loadRupee, wardSlug, type PlanItem, type Ward } from "./rupee";

// WhatsApp bot: "Hi" → menu; a ward name / code / neighbourhood → that ward's
// money trail + next-rupee report. Stateless: every message is answered on its
// own, so nothing is stored per user.

const SITE = (process.env.PUBLIC_SITE_URL || "https://followtherupee.vercel.app").replace(/\/$/, "");
const GREETING = /^(hi+|hello+|hey+|hii+|namaste|namaskar|menu|help|start|\?)\b/i;

// ---------------------------------------------------------------------------
// Ward matching
// ---------------------------------------------------------------------------

type WardKey = { code: string; name: string; localities: string[] };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

let wardKeys: Promise<WardKey[]> | null = null;
function loadWardKeys(): Promise<WardKey[]> {
  wardKeys ??= (db()`SELECT ward_code, ward_name, localities FROM wards ORDER BY ward_code` as Promise<Record<string, unknown>[]>)
    .then((rows) =>
      rows.map((r) => ({
        code: String(r.ward_code),
        name: String(r.ward_name),
        localities: Array.isArray(r.localities) ? r.localities.map(String) : [],
      })),
    )
    .catch((e) => {
      wardKeys = null; // retry on the next message
      throw e;
    });
  return wardKeys;
}

// Best ward(s) for free text. Exact code > exact name/locality > partial.
export async function matchWards(text: string): Promise<WardKey[]> {
  const keys = await loadWardKeys();
  const q = norm(text.replace(/^ward\s+/i, ""));
  const qc = compact(q);
  if (!qc) return [];

  const byCode = keys.filter((k) => compact(k.code) === qc);
  if (byCode.length) return byCode;

  const names = (k: WardKey) => [k.name, ...k.name.split(","), ...k.localities].map(norm).filter(Boolean);
  const exact = keys.filter((k) => names(k).includes(q));
  if (exact.length) return exact;

  if (q.length < 3) return [];
  const partial = keys.filter((k) => names(k).some((n) => n.includes(q) || (n.length >= 4 && q.includes(n))));
  return partial;
}

// ---------------------------------------------------------------------------
// Messages (WhatsApp formatting: *bold*, _italic_)
// ---------------------------------------------------------------------------

const inr = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e7 ? `₹${(a / 1e7).toFixed(2)} Cr` : a >= 1e5 ? `₹${(a / 1e5).toFixed(1)} L` : `₹${Math.round(a).toLocaleString("en-IN")}`;
  return n < 0 ? `-${s}` : s;
};
const bar = (part: number, whole: number, width = 10) => {
  const filled = whole > 0 ? Math.max(0, Math.min(width, Math.round((part / whole) * width))) : 0;
  return "▰".repeat(filled) + "▱".repeat(width - filled);
};
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((100 * part) / whole) : 0);

export async function menuMessage(): Promise<string> {
  const keys = await loadWardKeys();
  const list = keys.map((k) => `*${k.code}* ${k.name.split(",")[0]}`).join(" · ");
  return [
    "🙏 *Namaste! This is Follow the Rupee.*",
    "See where your ward's road-repair money went, and where the next rupee should go.",
    "",
    "👉 *Send your ward name or code*, e.g. _Kurla_, _Andheri East_, _L_ or _K/E_.",
    "",
    list,
    "",
    "_Sample data, not official BMC records._",
  ].join("\n");
}

function why(i: PlanItem): string {
  const tags: string[] = [];
  if (i.open_complaints) tags.push(`${i.open_complaints} open complaint${i.open_complaints > 1 ? "s" : ""}`);
  if (i.hospital || i.emergency) tags.push("ambulance road");
  if (i.school) tags.push("school road");
  if (i.accidents_pending) tags.push("accident while waiting");
  if (i.flood_spot) tags.push("flood spot");
  if (i.failed_before) tags.push(`failed ${i.failed_before}× before`);
  return tags.slice(0, 3).join(" · ");
}
const act = (i: PlanItem) =>
  i.act === "dlp" ? "Contractor fixes free (warranty)" : i.act === "resurface" ? "Resurface" : `Fix (${i.method.toLowerCase()})`;

export function wardReport(w: Ward): string {
  const spentPct = pct(w.spent_inr, w.budget_inr);
  const o = w.outcome_inr;
  const total = o.held + o.failed + o.flagged || 1;
  const t = w.trail;
  const plan = w.next_rupee;
  const left = plan.budget_left_inr >= 0 ? inr(plan.budget_left_inr) : `none (over by ${inr(-plan.budget_left_inr)})`;

  const lines = [
    `🏙️ *Ward ${w.ward_code} · ${w.ward_name}*`,
    "",
    "💰 *MONEY TRAIL*",
    `Spent *${inr(w.spent_inr)}* of ${inr(w.budget_inr)} (${spentPct}%)`,
    `${bar(w.spent_inr, w.budget_inr)}${spentPct > 100 ? " ⚠️ over budget" : ""}`,
    `on ${w.jobs} repair jobs:`,
    `✅ Held 30+ days  *${inr(o.held)}* (${pct(o.held, total)}%)`,
    `🔁 Failed in 30 days  *${inr(o.failed)}* (${pct(o.failed, total)}%)`,
    `🚩 Flagged for review  *${inr(o.flagged)}* (${pct(o.flagged, total)}%)`,
    "",
    "📣 *COMPLAINTS → REPAIRS*",
    `${t.complaints ?? 0} complaints → ${t.issues_fixed ?? 0} problems fixed`,
    `${t.held ?? 0} held · ${t.failed ?? 0} failed again`,
    `❗ ${t.issues_open ?? 0} problems never fixed (${t.complaints_open ?? 0} complaints still open)`,
    "",
    "🛣️ *WHERE THE NEXT RUPEE SHOULD GO*",
    `Budget left: ${left}`,
    `Recoverable from flagged bills: *${inr(plan.recoverable_inr)}*`,
  ];
  const items = plan.items.slice(0, 3);
  if (items.length) {
    items.forEach((i, k) => {
      lines.push("", `*${k + 1}. ${i.road}*`, `${act(i)}${i.est_cost_inr ? ` · about ${inr(i.est_cost_inr)}` : " · ₹0 to BMC"}`);
      const reason = why(i);
      if (reason) lines.push(`_${reason}_`);
    });
  } else {
    lines.push("No open, unfixed complaints mapped to roads here. 🎉");
  }
  lines.push(
    "",
    `🔗 Full report: ${SITE}/ward/${wardSlug(w.ward_code)}`,
    "",
    "Send another ward, or *Hi* for the list.",
    "_Sample data, not official BMC records._",
  );
  return lines.join("\n");
}

// The reply for one incoming text message.
export async function replyFor(text: string): Promise<string> {
  const t = text.trim();
  if (!t || GREETING.test(t)) return menuMessage();

  const matches = await matchWards(t);
  if (matches.length === 1) {
    const D = await loadRupee();
    const w = D.wards.find((x) => x.ward_code === matches[0].code);
    if (w) return wardReport(w);
  }
  if (matches.length > 1) {
    return [
      `"${t}" matches ${matches.length} wards. Which one?`,
      "",
      ...matches.slice(0, 8).map((m) => `• *${m.code}*: ${m.name}`),
      "",
      "Reply with the ward code.",
    ].join("\n");
  }
  return [
    `🤔 I couldn't find a ward called "${t.slice(0, 40)}".`,
    "Try a name like _Kurla_ or _Bandra West_, or a code like _L_ or _H/W_.",
    "Send *Hi* for the full list.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// WhatsApp Cloud API plumbing
// ---------------------------------------------------------------------------

export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // signature check is optional until the app secret is configured
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const got = header.slice(7);
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export async function sendText(to: string, body: string): Promise<{ ok: boolean; status: number; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, status: 0, error: "WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set" };
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: body.slice(0, 4096) },
    }),
  });
  return { ok: res.ok, status: res.status, error: res.ok ? undefined : (await res.text()).slice(0, 500) };
}
