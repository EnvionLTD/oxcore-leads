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

    const lead = {
      Name: String(fullName).trim(),
      Phone: String(phone).trim(),
      Postcode: String(postcode).trim().toUpperCase(),
      Address: String(address).trim(),
      Service: String(service).trim(),
    };

    const atRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Leads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{ fields: lead }],
          typecast: true,
        }),
      }
    );

    if (!atRes.ok) {
      const errText = await atRes.text();
      console.error("Airtable error", atRes.status, errText);
      return res
        .status(500)
        .json({ error: "Failed to save lead. Check Airtable column names." });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Lead handler crashed:", err);
    return res.status(500).json({ error: "Server error." });
  }
};
