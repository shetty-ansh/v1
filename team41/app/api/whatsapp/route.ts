import { replyFor, sendText, verifySignature } from "@/lib/whatsapp";

// WhatsApp Cloud API webhook.
//   GET  — Meta's one-time verification (hub.challenge echo).
//   POST — incoming messages: reply with the menu or a ward report.
// Env: WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
//      optional WHATSAPP_APP_SECRET (checks X-Hub-Signature-256).
//
// Every step logs one JSON line prefixed "wa:" — filter for it in Vercel →
// Project → Logs. Phone numbers are masked to their last 4 digits.

const mask = (n: string) => (n.length > 4 ? `${"*".repeat(n.length - 4)}${n.slice(-4)}` : n);
const log = (evt: string, data: Record<string, unknown> = {}) => console.log(`wa: ${JSON.stringify({ evt, ...data })}`);

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  const ok = !!expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected;
  log("verify", { ok, mode: p.get("hub.mode"), tokenConfigured: !!expected });
  if (ok) return new Response(p.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  return new Response("Forbidden", { status: 403 });
}

type Incoming = {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  button?: { text: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
};
type Status = {
  id: string;
  status: string;
  recipient_id?: string;
  errors?: { code: number; title: string; message?: string; error_data?: { details?: string } }[];
};
type Payload = {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: { messages?: Incoming[]; statuses?: Status[]; metadata?: { phone_number_id?: string } };
    }[];
  }[];
};

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  const sigOk = verifySignature(raw, sig);
  log("received", { bytes: raw.length, hasSignature: !!sig, signatureOk: sigOk, appSecretConfigured: !!process.env.WHATSAPP_APP_SECRET });
  if (!sigOk) return new Response("Bad signature", { status: 401 });

  let payload: Payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    log("bad_json", { head: raw.slice(0, 120) });
    return Response.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const changes = (payload.entry ?? []).flatMap((e) => e.changes ?? []);
  log("payload", {
    object: payload.object,
    fields: changes.map((c) => c.field),
    phoneNumberId: changes[0]?.value?.metadata?.phone_number_id,
    configuredPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    messages: changes.reduce((n, c) => n + (c.value?.messages?.length ?? 0), 0),
    statuses: changes.reduce((n, c) => n + (c.value?.statuses?.length ?? 0), 0),
  });

  // Delivery receipts: where a failed send shows up (e.g. 131030 not in allowed list).
  for (const s of changes.flatMap((c) => c.value?.statuses ?? [])) {
    log("status", {
      id: s.id,
      status: s.status,
      to: s.recipient_id ? mask(s.recipient_id) : undefined,
      errors: s.errors?.map((e) => ({ code: e.code, title: e.title, details: e.error_data?.details ?? e.message })),
    });
  }

  const messages = changes.flatMap((c) => c.value?.messages ?? []);
  const results = [];
  for (const m of messages) {
    const text =
      m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
    log("message", { id: m.id, from: mask(m.from), type: m.type, text: text.slice(0, 60) });

    let reply: string;
    const t0 = Date.now();
    try {
      reply = text
        ? await replyFor(text)
        : "I can only read text messages. Send *Hi* to start, or a ward name like _Kurla_.";
      log("reply_built", { id: m.id, chars: reply.length, ms: Date.now() - t0 });
    } catch (e) {
      log("reply_failed", { id: m.id, error: e instanceof Error ? e.message : String(e) });
      reply = "Sorry, something went wrong on our side. Please try again in a minute.";
    }

    const sent = await sendText(m.from, reply);
    log("send", { id: m.id, to: mask(m.from), ok: sent.ok, status: sent.status, error: sent.error });
    // Echo the reply when it couldn't be sent (e.g. no token locally) to make testing easy.
    results.push({ id: m.id, sent: sent.ok, ...(sent.ok ? {} : { error: sent.error, reply }) });
  }

  // Always 200 so Meta doesn't retry a message we've already handled.
  return Response.json({ ok: true, results });
}
