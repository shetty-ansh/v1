import { replyFor, sendText, verifySignature } from "@/lib/whatsapp";

// WhatsApp Cloud API webhook.
//   GET  — Meta's one-time verification (hub.challenge echo).
//   POST — incoming messages: reply with the menu or a ward report.
// Env: WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
//      optional WHATSAPP_APP_SECRET (checks X-Hub-Signature-256).


export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
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

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Bad signature", { status: 401 });
  }

  let payload: { entry?: { changes?: { value?: { messages?: Incoming[] } }[] }[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  // Status callbacks (sent/delivered/read) carry no messages — just acknowledge.
  const messages = (payload.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));
  const results = [];
  for (const m of messages) {
    const text =
      m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
    let reply: string;
    try {
      reply = text
        ? await replyFor(text)
        : "I can only read text messages. Send *Hi* to start, or a ward name like _Kurla_.";
    } catch (e) {
      console.error("whatsapp: building reply failed", e);
      reply = "Sorry, something went wrong on our side. Please try again in a minute.";
    }
    const sent = await sendText(m.from, reply);
    if (!sent.ok) console.error("whatsapp: send failed", sent.status, sent.error);
    // Echo the reply when it couldn't be sent (e.g. no token locally) to make testing easy.
    results.push({ id: m.id, sent: sent.ok, ...(sent.ok ? {} : { error: sent.error, reply }) });
  }

  // Always 200 so Meta doesn't retry a message we've already handled.
  return Response.json({ ok: true, results });
}
