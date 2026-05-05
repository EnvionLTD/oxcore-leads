const { put } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fullName, phone, postcode, address, service } = req.body || {};
    if (!fullName || !phone || !postcode || !address || !service) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const now = new Date();
    const lead = {
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      postcode: String(postcode).trim().toUpperCase(),
      address: String(address).trim(),
      service: String(service).trim(),
      createdAt: now.toISOString(),
    };

    const slug = `${now.toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
    await put(`leads/${slug}.json`, JSON.stringify(lead), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Lead save error:", err);
    return res.status(500).json({ error: "Failed to save lead.", detail: String(err) });
  }
};
