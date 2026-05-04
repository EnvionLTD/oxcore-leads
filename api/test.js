module.exports = async function handler(req, res) {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !apiKey) {
    return res.status(500).json({ ok: false, error: "Env vars missing", baseId: !!baseId, apiKey: !!apiKey });
  }

  try {
    const atRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Leads?maxRecords=1`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const text = await atRes.text();
    return res.json({ ok: atRes.ok, status: atRes.status, body: text.slice(0, 500) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
