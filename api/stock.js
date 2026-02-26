export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const GAS_URL = process.env.GAS_URL;
  if (!GAS_URL) return res.status(500).json({ ok: false, error: "Missing GAS_URL env" });

  const debug = String(req.query?.debug || "") === "1";

  try {
    const url = new URL(GAS_URL);

    // forward query params
    if (req.method === "GET") {
      for (const [k, v] of Object.entries(req.query || {})) {
        if (k !== "debug") url.searchParams.set(k, v);
      }
    }

    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers: req.method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: req.method === "POST" ? JSON.stringify(req.body || {}) : undefined,
      redirect: "follow",
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "";

    // ✅ Debug: ตอบเป็น JSON เสมอเพื่อดูว่าปลายทางส่งอะไรมา
    if (debug) {
      return res.status(200).json({
        ok: true,
        gas_url: url.toString(),
        upstream_status: upstream.status,
        upstream_content_type: contentType,
        body_length: text.length,
        body_preview: text.slice(0, 300),
      });
    }

    // ถ้าเป็น HTML ให้แปลงเป็น error JSON กันหน้าเว็บพัง
    const isHtml = /^\s*<!doctype/i.test(text) || /^\s*<html/i.test(text);
    if (isHtml) {
      return res.status(502).json({
        ok: false,
        error: "GAS returned HTML (not JSON). Check Apps Script Deploy access and routing.",
        preview: text.slice(0, 200),
      });
    }

    // ส่งผ่านตามจริง
    res.setHeader("Content-Type", contentType || "application/json; charset=utf-8");
    return res.status(upstream.status).send(text);

  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
