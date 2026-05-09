const { put } = require("@vercel/blob");
const crypto = require("crypto");

const PIXEL_ID = "955872823931402";

/**
 * Send a server-side Lead event to Meta Conversions API.
 * Requires META_CAPI_TOKEN env var (System User access token with ads_management permission).
 * Fails silently — lead is still saved even if CAPI call fails.
 */
async function sendCapiEvent(lead, req) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return; // CAPI not configured yet — skip silently

  const now = Math.floor(Date.now() / 1000);

  // Hash PII with SHA-256 as Meta requires
  const hash = (v) =>
    crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");

  const userData = {};
  if (lead.phone) userData.ph = [hash(lead.phone.replace(/\s+/g, ""))];
  if (lead.fullName) {
    const parts = lead.fullName.trim().split(/\s+/);
    userData.fn = [hash(parts[0])];
    if (parts.length > 1) userData.ln = [hash(parts[parts.length - 1])];
  }
  if (lead.postcode) userData.zp = [hash(lead.postcode.replace(/\s+/g, ""))];
  userData.country = [hash("gb")];

  // Forward client IP and user agent for better matching
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress;
  const clientUa = req.headers["user-agent"];
  if (clientIp) userData.client_ip_address = clientIp;
  if (clientUa) userData.client_user_agent = clientUa;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: now,
        action_source: "website",
        event_source_url: req.headers.referer || req.headers.origin || "",
        user_data: userData,
      },
    ],
  };

  try {
    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${token}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.error("CAPI error:", r.status, body);
    }
  } catch (err) {
    console.error("CAPI network error:", err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fullName, phone, postcode, service } = req.body || {};
    if (!fullName || !phone || !postcode) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const now = new Date();
    const lead = {
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      postcode: String(postcode).trim().toUpperCase(),
      service: service ? String(service).trim() : "Not specified",
      createdAt: now.toISOString(),
    };

    const slug = `${now.toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
    await put(`leads/${slug}.json`, JSON.stringify(lead), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    // Fire CAPI event in background — don't block the response
    sendCapiEvent(lead, req).catch(() => {});

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Lead save error:", err);
    return res.status(500).json({ error: "Failed to save lead.", detail: String(err) });
  }
};
