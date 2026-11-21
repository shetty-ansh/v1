// GET /api/whatsapp/status?token=<WHATSAPP_VERIFY_TOKEN>
// Setup checker: shows which env vars are set (never their values), asks Meta
// whether the access token works for the phone number, and which fields the
// app is subscribed to on the WhatsApp Business Account.

const GRAPH = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v23.0"}`;

async function graph(path: string) {
  const res = await fetch(`${GRAPH}${path}`, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string; code?: number } };
  return { ok: res.ok, status: res.status, body };
}

export async function GET(req: Request) {
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected || new URL(req.url).searchParams.get("token") !== expected) {
    return new Response("Forbidden", { status: 403 });
  }

  const env = {
    WHATSAPP_VERIFY_TOKEN: true,
    WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    WHATSAPP_APP_SECRET: !!process.env.WHATSAPP_APP_SECRET,
    PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || "(default)",
  };

  const out: Record<string, unknown> = { env, hints: [] as string[] };
  const hints = out.hints as string[];

  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    hints.push("Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Vercel, then redeploy.");
    return Response.json(out);
  }

  // 1. Does the token work for this phone number?
  const phone = await graph(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`);
  out.phoneNumber = phone.ok ? phone.body : { error: phone.body.error?.message, code: phone.body.error?.code };
  if (!phone.ok) hints.push(`Meta rejected the access token / phone number ID (${phone.body.error?.message ?? phone.status}). Temporary tokens expire after ~24h: generate a new one and update Vercel.`);

  // 2. Is the app subscribed to this WhatsApp Business Account's events?
  if (env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
    const subs = await graph(`/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/subscribed_apps`);
    out.subscribedApps = subs.ok ? subs.body : { error: subs.body.error?.message, code: subs.body.error?.code };
    const data = (subs.body.data as unknown[] | undefined) ?? [];
    if (subs.ok && data.length === 0) hints.push("No app is subscribed to this WhatsApp Business Account: incoming messages won't reach the webhook. Subscribe the app (see POST below) and tick 'messages' under Webhook fields.");
  } else {
    hints.push("Set WHATSAPP_BUSINESS_ACCOUNT_ID (1469878114707284) in Vercel to check the subscription from here.");
  }

  hints.push("In Meta → WhatsApp → Configuration → Webhook fields, 'messages' must be subscribed.");
  hints.push("While the Meta app is unpublished, only test webhooks sent from the dashboard are delivered. Switch the app to Live to receive real messages.");
  hints.push("Add your phone under WhatsApp → API Setup → 'To' (allowed recipients), or sends fail with code 131030.");
  return Response.json(out);
}

// POST /api/whatsapp/status?token=<WHATSAPP_VERIFY_TOKEN> — subscribes the app to the
// WhatsApp Business Account so incoming messages are delivered to the webhook.
export async function POST(req: Request) {
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected || new URL(req.url).searchParams.get("token") !== expected) {
    return new Response("Forbidden", { status: 403 });
  }
  const waba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  if (!waba || !process.env.WHATSAPP_ACCESS_TOKEN) {
    return Response.json({ ok: false, error: "WHATSAPP_BUSINESS_ACCOUNT_ID or WHATSAPP_ACCESS_TOKEN not set" }, { status: 400 });
  }
  const res = await fetch(`${GRAPH}/${waba}/subscribed_apps`, { method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
  return Response.json({ ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) });
}
