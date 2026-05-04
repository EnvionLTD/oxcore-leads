const crypto = require("crypto");

function verifyToken(token, secret) {
  const parts = (token || "").split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64").toString());
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Server not configured." });
  }

  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!verifyToken(token, JWT_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const atRes = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!atRes.ok) {
    return res.status(500).json({ error: "Failed to fetch leads." });
  }

  const data = await atRes.json();
  const leads = (data.records || [])
    .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime))
    .map((r) => ({
      id: r.id,
      fullName: r.fields.Name || "",
      phone: r.fields.Phone || "",
      postcode: r.fields.Postcode || "",
      address: r.fields.Address || "",
      service: r.fields.Service || "",
      createdAt: r.createdTime,
    }));

  return res.json({ leads });
};
