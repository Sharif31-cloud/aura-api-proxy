export default async function handler(req, res) {
  // Only allow POST (generateContent is a POST request)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // The API key is never exposed to the client
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Server missing GEMINI_API_KEY" });
  }

  // Let the client choose the model, but fall back to a default
  const model = req.query.model || "gemini-2.0-flash-lite";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json");
    return res.send(data);
  } catch (err) {
    return res.status(502).json({ error: "Upstream error", detail: String(err) });
  }
}