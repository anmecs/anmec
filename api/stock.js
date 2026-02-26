export default async function handler(req, res) {
  // อนุญาต preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const GAS_URL = process.env.GAS_URL; // ต้องเป็น .../exec
  if (!GAS_URL) return res.status(500).json({ ok: false, error: "Missing GAS_URL env" });

  try {
    const url = new URL(GAS_URL);

    if (req.method === "GET") {
      for (const [k, v] of Object.entries(req.query || {})) url.searchParams.set(k, v);
      const r = await fetch(url.toString(), { method: "GET" });
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const r = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });

    const text = await r.text();
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
