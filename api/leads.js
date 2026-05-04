module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fullName, phone, postcode, address, service } = req.body || {};
  if (!fullName || !phone || !postcode || !address || !service) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const lead = {
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    postcode: String(postcode).trim().toUpperCase(),
    address: String(address).trim(),
    service: String(service).trim(),
  };

  const atRes = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: lead.fullName,
          Phone: lead.phone,
          Postcode: lead.postcode,
          Address: lead.address,
          Service: lead.service,
        },
      }),
    }
  );

  if (!atRes.ok) {
    const err = await atRes.text();
    console.error("Airtable error:", err);
    return res.status(500).json({ error: "Failed to save lead." });
  }

  return res.status(201).json({ ok: true });
};
