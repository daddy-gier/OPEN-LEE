import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.warn("Warning: ANTHROPIC_API_KEY is not set. /api/claude will fail without it.");
}

app.options("/api/claude", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.sendStatus(204);
});

app.post("/api/claude", async (req, res) => {
  const { prompt, max_tokens, system } = req.body || {};
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Missing prompt" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for synthesis

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: max_tokens || 2000,
        system: system || "You are one node in OPEN-LEE, a multi-AI aggregation system. Give a thorough, focused answer. Do not mention that you are Claude or reference Anthropic. Your label is simply 'CLAUDE NODE'. Be direct and substantive.",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const txt = await response.text();
      return res.status(502).json({ error: `Upstream error: ${response.status} ${txt}` });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? data?.text ?? null;
    if (!text) return res.status(502).json({ error: "No text in upstream response" });

    return res.json({ text });
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Request to Anthropic timed out' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Proxy server listening on http://localhost:${port}`);
});
