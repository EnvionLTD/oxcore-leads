module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fullName, phone, postcode, address, service } = req.body || {};
    if (!fullName || !phone || !postcode || !address || !service) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const baseId = process.env.AIRTABLE_BASE_ID;
    const apiKey = process.env.AIRTABLE_API_KEY;
    if (!baseId || !apiKey) {
      console.error("Airtable env vars missing");
      return res.status(500).json({ error: "Server not configured." });
    }

    const atRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Leads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Name: String(fullName).trim(),
            Phone: String(phone).trim(),
            Postcode: String(postcode).trim().toUpperCase(),
            Address: String(address).trim(),
            Service: String(service).trim(),
          },
        }),
      }
    );

    const responseText = await atRes.text();

    if (!atRes.ok) {
      console.error("Airtable error", atRes.status, responseText);
      return res.status(500).json({
        error: "Failed to save lead.",
        detail: responseText,
      });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Lead handler crashed:", err);
    return res.status(500).json({ error: "Server error.", detail: String(err) });
  }
};
