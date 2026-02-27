// api/stock.js (Vercel Serverless Function) - READY TO PASTE
export default async function handler(req, res) {
  const GAS = process.env.GAS_ENDPOINT;
  if (!GAS) {
    return res.status(500).json({ ok: false, error: "Missing GAS_ENDPOINT env var" });
  }

  // CORS (เผื่อเรียกข้ามโดเมน/มือถือบางรุ่น)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- GET: forward query string to Apps Script ----------
    if (req.method === "GET") {
      // Prefer req.query (Vercel) then fallback parse from req.url
      let qs = "";
      if (req.query && Object.keys(req.query).length) {
        qs = new URLSearchParams(req.query).toString();
      } else {
        qs = req.url?.includes("?") ? req.url.split("?")[1] : "";
      }

      const url = qs ? `${GAS}?${qs}` : GAS;

      const r = await fetch(url, { method: "GET" });
      const text = await r.text();

      // Try to return JSON if possible (safer for client)
      try {
        const json = JSON.parse(text);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).json(json);
      } catch {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).send(text);
      }
    }

    // ---------- POST: forward body to Apps Script ----------
    if (req.method === "POST") {
      // Forward as x-www-form-urlencoded (compatible with your GAS parseIncoming_)
      let body;
      if (typeof req.body === "string") {
        body = req.body;
      } else {
        body = new URLSearchParams(req.body || {}).toString();
      }

      const r = await fetch(GAS, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
      });

      const text = await r.text();

      try {
        const json = JSON.parse(text);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).json(json);
      } catch {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).send(text);
      }
    }

    // ---------- Other methods not allowed ----------
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
