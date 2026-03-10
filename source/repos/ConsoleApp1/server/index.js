import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
app.use(express.json());
// CORS — allow all origins for local desktop/dev use
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.warn("[SERVER] WARNING: ANTHROPIC_API_KEY not set — /api/claude will return 503.");
}

// Health check — lets the UI and Electron know the server is up
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", claude: !!ANTHROPIC_API_KEY, ts: Date.now() });
});

app.post("/api/claude", async (req, res) => {
  const { prompt, max_tokens, system } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt" });
  }
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s — matches client

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: max_tokens || 2000,
        system: system ||
          "You are one node in OPEN-LEE, a multi-AI aggregation system. " +
          "Give a thorough, focused answer. Do not mention that you are Claude or reference Anthropic. " +
          "Your label is simply 'CLAUDE NODE'. Be direct and substantive.",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const txt = await response.text();
      return res.status(502).json({ error: `Upstream error ${response.status}: ${txt.slice(0, 300)}` });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? null;
    if (!text) return res.status(502).json({ error: "Empty response from upstream" });

    return res.json({ text });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") return res.status(504).json({ error: "Request to Anthropic timed out (90s)" });
    console.error("[SERVER] /api/claude error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[SERVER] OPEN-LEE proxy listening on http://localhost:${port}`);
  console.log(`[SERVER] Claude API key: ${ANTHROPIC_API_KEY ? "SET ✓" : "MISSING ✗"}`);
});
