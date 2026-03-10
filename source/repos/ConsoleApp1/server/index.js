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

// ─────────────────────────────────────────────────────────────────
//  Shared Claude helper
// ─────────────────────────────────────────────────────────────────

async function callClaude(system, userPrompt, maxTokens = 1000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Upstream error: ${response.status} ${txt}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text ?? null;
  if (!text) throw new Error("No text in upstream response");
  return text;
}

// ─────────────────────────────────────────────────────────────────
//  In-memory world state (persists for the server's lifetime)
// ─────────────────────────────────────────────────────────────────

const worldState = {
  currentChapter: 1,
  storyFlags: [],
  playerChoices: [],        // [{ event, choice, outcome, timestamp }]
  npcRelationships: {},     // { npcName: "hostile|suspicious|neutral|friendly|trusted" }
  suspicion: 0,
  influence: 0,
};

// ─────────────────────────────────────────────────────────────────
//  OPEN-LEE core endpoint (unchanged)
// ─────────────────────────────────────────────────────────────────

app.options("/api/claude", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.sendStatus(204);
});

app.post("/api/claude", async (req, res) => {
  const { prompt, max_tokens, system } = req.body || {};
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Missing prompt" });

  try {
    const text = await callClaude(
      system || "You are one node in OPEN-LEE, a multi-AI aggregation system. Give a thorough, focused answer. Do not mention that you are Claude or reference Anthropic. Your label is simply 'CLAUDE NODE'. Be direct and substantive.",
      prompt,
      max_tokens || 2000
    );
    return res.json({ text });
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Request to Anthropic timed out' });
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
//  GAME: Health check
//  GET /api/game/health
// ─────────────────────────────────────────────────────────────────

app.get("/api/game/health", (req, res) => {
  res.json({ status: "ok", gameAI: "online", version: "1.0.0" });
});

// ─────────────────────────────────────────────────────────────────
//  GAME: NPC Dialogue
//  POST /api/game/npc-dialogue
//  Body: { character, personality, backstory, context, playerInput, conversationHistory }
//  Returns: { dialogue, character }
// ─────────────────────────────────────────────────────────────────

app.options("/api/game/npc-dialogue", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.sendStatus(204);
});

app.post("/api/game/npc-dialogue", async (req, res) => {
  const { character, personality, backstory, context, playerInput, conversationHistory } = req.body || {};
  if (!character || !playerInput) {
    return res.status(400).json({ error: "Missing required fields: character, playerInput" });
  }

  const history = Array.isArray(conversationHistory) ? conversationHistory.join("\n") : "";
  const relationship = worldState.npcRelationships[character] || "neutral";

  const system = `You are ${character}, an NPC inside Nightshade Hollow prison.

PERSONALITY: ${personality || "Guarded. Does not trust easily."}
BACKSTORY: ${backstory || "A long-term prisoner with secrets."}
CURRENT RELATIONSHIP WITH PLAYER: ${relationship}

Rules:
- Stay fully in character. Never break the fourth wall.
- Keep responses concise (1-4 sentences) unless the player asks a deep question.
- Reflect your relationship with the player: hostile = curt or threatening; trusted = candid.
- Speak dialogue only. Do NOT narrate actions. Do NOT start with the character name or a colon.`;

  const userPrompt = `SCENE: ${context || "Inside Nightshade Hollow prison."}

${history ? `CONVERSATION SO FAR:\n${history}\n\n` : ""}PLAYER SAYS: "${playerInput}"

Respond as ${character}.`;

  try {
    const dialogue = await callClaude(system, userPrompt, 300);
    return res.json({ dialogue, character });
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Request timed out' });
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
//  GAME: Story Event Resolution
//  POST /api/game/story-event
//  Body: { event, playerChoice, worldContext, activeStoryFlags }
//  Returns: { outcome, narrative, flagsToSet, flagsToClear, suspicionDelta, influenceDelta, hint }
// ─────────────────────────────────────────────────────────────────

app.options("/api/game/story-event", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.sendStatus(204);
});

app.post("/api/game/story-event", async (req, res) => {
  const { event, playerChoice, worldContext, activeStoryFlags } = req.body || {};
  if (!event || !playerChoice) {
    return res.status(400).json({ error: "Missing required fields: event, playerChoice" });
  }

  const flags = Array.isArray(activeStoryFlags) ? activeStoryFlags.join(", ") : "";

  const system = `You are the narrative engine for Nightshade Hollow, a prison RPG.
Evaluate the consequence of the player's choice and return ONLY valid JSON — no markdown, no extra text.

The game tracks suspicion (0-100, high = guard alert) and influence (0-100, prisoner standing).

Return exactly this shape:
{
  "outcome": "success | failure | mixed | neutral",
  "narrative": "2-4 sentences in second-person present tense describing what happens.",
  "flagsToSet": ["flag_names_to_activate"],
  "flagsToClear": ["flag_names_to_remove"],
  "suspicionDelta": 0,
  "influenceDelta": 0,
  "hint": "Optional subtle clue about consequences not yet unfolded"
}`;

  const userPrompt = `EVENT: ${event}
PLAYER CHOICE: "${playerChoice}"
WORLD CONTEXT: ${worldContext || "None provided."}
ACTIVE STORY FLAGS: ${flags || "None"}
CURRENT CHAPTER: ${worldState.currentChapter}

Resolve this event.`;

  try {
    const raw = await callClaude(system, userPrompt, 600);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(502).json({ error: "AI returned non-JSON response", raw });

    const result = JSON.parse(jsonMatch[0]);

    // Apply state changes
    if (Array.isArray(result.flagsToSet)) {
      result.flagsToSet.forEach(f => { if (!worldState.storyFlags.includes(f)) worldState.storyFlags.push(f); });
    }
    if (Array.isArray(result.flagsToClear)) {
      worldState.storyFlags = worldState.storyFlags.filter(f => !result.flagsToClear.includes(f));
    }
    if (typeof result.suspicionDelta === 'number') {
      worldState.suspicion = Math.max(0, Math.min(100, worldState.suspicion + result.suspicionDelta));
    }
    if (typeof result.influenceDelta === 'number') {
      worldState.influence = Math.max(0, Math.min(100, worldState.influence + result.influenceDelta));
    }
    worldState.playerChoices.push({ event, choice: playerChoice, outcome: result.outcome, timestamp: Date.now() });

    return res.json(result);
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Request timed out' });
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
//  GAME: World State
//  GET  /api/game/world-state   — read full state
//  POST /api/game/world-state   — merge updates into state
// ─────────────────────────────────────────────────────────────────

app.get("/api/game/world-state", (req, res) => {
  res.json(worldState);
});

app.options("/api/game/world-state", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.sendStatus(204);
});

app.post("/api/game/world-state", (req, res) => {
  const updates = req.body || {};
  const allowed = ["currentChapter", "storyFlags", "npcRelationships", "suspicion", "influence"];
  allowed.forEach(key => { if (updates[key] !== undefined) worldState[key] = updates[key]; });
  res.json(worldState);
});

// ─────────────────────────────────────────────────────────────────
//  GAME: NPC Relationship
//  POST /api/game/npc-relationship
//  Body: { character, relationship }
// ─────────────────────────────────────────────────────────────────

app.options("/api/game/npc-relationship", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.sendStatus(204);
});

app.post("/api/game/npc-relationship", (req, res) => {
  const { character, relationship } = req.body || {};
  if (!character || !relationship) {
    return res.status(400).json({ error: "Missing required fields: character, relationship" });
  }
  const valid = ["hostile", "suspicious", "neutral", "friendly", "trusted"];
  if (!valid.includes(relationship)) {
    return res.status(400).json({ error: `relationship must be one of: ${valid.join(", ")}` });
  }
  worldState.npcRelationships[character] = relationship;
  res.json({ character, relationship });
});

// ─────────────────────────────────────────────────────────────────
//  Start
// ─────────────────────────────────────────────────────────────────

const port = process.env.PORT || 11434;
app.listen(port, () => {
  console.log(`OPEN-LEE listening on http://localhost:${port}`);
  console.log(`  Core:  POST /api/claude`);
  console.log(`  Game:  GET  /api/game/health`);
  console.log(`  Game:  POST /api/game/npc-dialogue`);
  console.log(`  Game:  POST /api/game/story-event`);
  console.log(`  Game:  GET  /api/game/world-state`);
  console.log(`  Game:  POST /api/game/world-state`);
  console.log(`  Game:  POST /api/game/npc-relationship`);
});
