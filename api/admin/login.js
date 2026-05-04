const crypto = require("crypto");

function makeToken(user, secret) {
  const payload = Buffer.from(
    JSON.stringify({ user, exp: Date.now() + 8 * 60 * 60 * 1000 })
  ).toString("base64");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!ADMIN_PASS || !JWT_SECRET) {
    return res.status(500).json({ error: "Server not configured." });
  }

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  return res.json({ token: makeToken(username, JWT_SECRET) });
};
