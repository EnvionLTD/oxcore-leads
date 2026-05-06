const crypto = require("crypto");
const { list } = require("@vercel/blob");

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

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return res.status(500).json({ error: "Server not configured." });

    const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (!verifyToken(token, JWT_SECRET)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { blobs } = await list({ prefix: "leads/", limit: 500 });

    const leads = await Promise.all(
      blobs
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .map(async (blob) => {
          try {
            const r = await fetch(blob.url);
            const data = await r.json();
            return {
              id: blob.pathname,
              fullName: data.fullName || "",
              phone: data.phone || "",
              postcode: data.postcode || "",
              service: data.service || "",
              createdAt: data.createdAt || blob.uploadedAt,
            };
          } catch {
            return null;
          }
        })
    );

    return res.json({ leads: leads.filter(Boolean) });
  } catch (err) {
    console.error("Admin leads error:", err);
    return res.status(500).json({ error: "Failed to fetch leads.", detail: String(err) });
  }
};
