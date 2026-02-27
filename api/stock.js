export default async function handler(req, res) {
  // 1) ตั้งค่า Apps Script endpoint
  const GAS = process.env.GAS_ENDPOINT;

  if (!GAS) {
    return res.status(500).json({ ok: false, error: "Missing GAS_ENDPOINT env var" });
  }

  try {
    // 2) รองรับ GET (ใช้โหลด recent)
    if (req.method === "GET") {
      // ส่ง query string ต่อไปให้ Apps Script
      const qs = req.url.includes("?") ? req.url.split("?")[1] : "";
      const url = qs ? `${GAS}?${qs}` : GAS;

      const r = await fetch(url, { method: "GET" });
      const data = await r.text();

      // ส่งกลับให้ browser
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(data);
    }

    // 3) รองรับ POST (ใช้ Save)
    if (req.method === "POST") {
      // Apps Script ของคุณรองรับ form-urlencoded อยู่แล้ว
      // เราจะ forward body เป็น form-urlencoded เหมือนเดิม
      const body =
        typeof req.body === "string"
          ? req.body
          : new URLSearchParams(req.body || {}).toString();

      const r = await fetch(GAS, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
      });

      const data = await r.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(data);
    }

    // 4) method อื่นไม่ให้ใช้
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
