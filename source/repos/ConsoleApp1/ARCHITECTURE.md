# Architecture & Technical Design

## System Overview

OPEN-LEE is a multi-AI consensus engine designed to:
1. **Query** — Route prompts to 7 different AI models in parallel
2. **Aggregate** — Collect responses from each model independently
3. **Synthesize** — Use Claude to identify unique insights and merge them
4. **Return** — Deliver one cohesive, comprehensive answer

```
┌──────────────┐
│  User Query  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           React Frontend (JSX/TSX)              │
│  - Secure API calls via proxy                   │
│  - AbortController timeouts                     │
│  - Real-time progress bars                      │
│  - Error handling UI                            │
└──────┬────────────────────────────────────────┬─┘
       │                                        │
       │ POST /api/query                        │
       │ POST /api/synthesize                   │
       │ GET /api/health                        │
       │                                        │
       ▼                                        ▼
┌──────────────────────┬──────────────────────────────────┐
│  Express Proxy       │  Orchestration Layer             │
│  (Node.js)           │                                  │
│                      ├─ Model Dispatch Table            │
│  ✅ Security         ├─ Timeout Management              │
│  ✅ API Key Storage  ├─ Error Recovery                  │
│  ✅ Async Pool       ├─ Response Collection             │
│  ✅ Synthesis        └─ Rate Limiting (future)          │
└──────┬───────────────┬──────────────────────────────────┘
       │               │
   ┌───┴───┬───────┬───┴──┬──────┬────────┬──────────┐
   │       │       │      │      │        │          │
   ▼       ▼       ▼      ▼      ▼        ▼          ▼
┌──────┐┌──────┐┌──────┐┌─────┐┌──────┐┌──────────┐┌──────┐
│Claude││ChatGPT││Mistral││Grok ││Ollama││ OpenClaw ││LudusAI│
│ API  ││ API   ││ API  ││ API ││local ││ (Ollama) ││Local  │
└──────┘└──────┘└──────┘└─────┘└──────┘└──────────┘└──────┘
```

## Component Breakdown

### 1. Frontend Layer (`web/src/OpenLeeArtifact.jsx`)

**Responsibilities:**
- Accept user prompts
- Display real-time progress
- Show model responses as they arrive
- Render synthesis results
- Handle user interactions (cancel, retry, reset)

**Key Optimizations:**
- `React.memo` on `LoadingDots`, `GpuBar`, `ModelCard`
- `useCallback` for state setters (prevent closure recreation)
- `useMemo` for derived values (progress, doneCt, avgLoad)
- `AbortController` wired to component lifecycle

**Error Handling:**
- Catch errors from each model independently
- Display in red "ERROR" state without blocking others
- Banner notification for critical failures
- Automatic fallback to raw responses if synthesis fails

### 2. Proxy Server (`server/index.js`)

**Responsibilities:**
- Store and use API keys securely
- Route requests to the correct model endpoint
- Apply timeouts and retry logic
- Synthesize responses via Claude
- Provide health check endpoint

**Key Features:**
- **CORS** configured for localhost (3000, 5173, 5000)
- **Dispatch Table** — clean mapping of modelId → caller function
- **System Prompts** — context-aware instructions per mode (general, gamedev, coder)
- **Auto-Config** — writes `openclaw.json` on first run
- **Fallback Synthesis** — if Claude fails, use Ollama instead

**Timeout Strategy:**
```javascript
// Per-request AbortController
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

// Fetch respects the signal
const res = await fetch(url, { signal: controller.signal });
```

### 3. API Endpoints

#### `POST /api/query`
Route a prompt to any single model.

**Request:**
```json
{
  "modelId": "claude",
  "prompt": "Your question here",
  "mode": "general"
}
```

**Response:**
```json
{
  "response": "Answer from the model",
  "error": null
}
```

#### `POST /api/synthesize`
Merge all model responses into one cohesive answer.

**Request:**
```json
{
  "prompt": "Original question",
  "responses": {
    "claude": { "response": "...", "error": null },
    "chatgpt": { "response": "...", "error": null }
  },
  "mode": "general"
}
```

**Response:**
```json
{
  "synthesis": "OPEN-LEE SYNTHESIS: [merged answer]"
}
```

#### `GET /api/health`
Check which models are available.

**Response:**
```json
{
  "status": "ok",
  "models": {
    "claude": true,
    "chatgpt": true,
    "mistral": true,
    "grok": false,
    "ollama": true,
    "openclaw": true
  },
  "openClawConfig": "C:\\Users\\Gierl\\.openclaw\\openclaw.json"
}
```

---

## Data Flow

### Query Execution

```
1. User types prompt in textarea
   ↓
2. Click "▶ EXECUTE" or Ctrl+Enter
   ↓
3. Frontend creates AbortController, fires 6 async calls
   ↓
4. Each call posts to /api/query with modelId
   ↓
5. Server routes to appropriate handler (callClaude, callOpenAI, etc.)
   ↓
6. Handler calls upstream API (with its own timeout)
   ↓
7. Response arrives or times out
   ↓
8. Frontend receives response, updates state
   ↓
9. Model card shows result or error
   ↓
10. Once all 6 complete, synthesis phase begins
   ↓
11. Frontend posts all responses to /api/synthesize
   ↓
12. Server runs Claude synthesis engine
   ↓
13. Synthesis result displays in bottom panel
```

---

## Security Model

### API Key Protection

**Before (Vulnerable):**
```javascript
// ❌ BAD — key exposed to browser
const res = await fetch("https://api.anthropic.com/v1/messages", {
  headers: { "x-api-key": process.env.ANTHROPIC_API_KEY },
});
```

**After (Secure):**
```javascript
// ✅ GOOD — key stays server-side
// Browser calls localhost proxy
const res = await fetch("http://localhost:3001/api/query", {
  body: JSON.stringify({ modelId: "claude", prompt: "..." })
});

// Server has the key, uses it internally
const upstreamRes = await fetch("https://api.anthropic.com/v1/messages", {
  headers: { "x-api-key": process.env.ANTHROPIC_API_KEY }, // Never exposed
});
```

### CORS Configuration
```javascript
app.use(cors({
  origin: [
    "http://localhost:3000",   // CRA dev
    "http://localhost:5173",   // Vite dev
    "http://localhost:5000"    // Custom
  ]
}));
```

### Environment Variables
- `.env` file is in `.gitignore`
- Keys loaded via `process.env` on server only
- Frontend gets zero access to raw keys

---

## Error Handling Strategy

### Model-Level Errors (Isolation)
If Claude fails, ChatGPT still responds independently.

```javascript
// Each model is awaited separately with catch
const claudePromise = callClaude(q).catch(err => {
  return `ERROR: ${err.message}`;
});

const chatgptPromise = callOpenAI(q).catch(err => {
  return `ERROR: ${err.message}`;
});

// If one fails, others still resolve
await Promise.all([claudePromise, chatgptPromise, ...]);
```

### Timeout Errors
```javascript
// AbortController triggers on timeout
const controller = new AbortController();
setTimeout(() => controller.abort(), 90_000);

try {
  const res = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err.name === "AbortError") {
    return "Request timed out";
  }
}
```

### Synthesis Fallback
If Claude synthesis fails, use Ollama; if both fail, show raw responses.

```javascript
try {
  const synthesis = await callClaude(synthPrompt);
} catch {
  try {
    const synthesis = await callOllama(synthPrompt);
  } catch {
    return "Synthesis offline. Raw responses above.";
  }
}
```

---

## Performance Optimizations

### Frontend

**Memoization:**
```javascript
// Prevents re-render of LoadingDots when parent updates
const MemoLoadingDots = React.memo(LoadingDots);

// useCallback prevents closure recreation
const setModelState = useCallback((id, state) => {
  setStates(prev => ({ ...prev, [id]: state }));
}, []);

// useMemo prevents recalculation of progress
const progress = useMemo(() => {
  return (doneCt / MODELS.length) * 100;
}, [doneCt]);
```

**Async Patterns:**
- All 6 model calls fire in parallel (not sequential)
- Synthesis only starts after all models complete
- UI updates immediately as responses arrive

### Backend

**Connection Pooling:**
- Express handles multiple concurrent requests
- Each model endpoint gets its own timeout
- No global request queue (scales with Node.js event loop)

**Caching (Future):**
- Responses could be cached by prompt hash
- TTL-based invalidation per model

---

## Deployment Checklist

### Local Development
- [ ] `ANTHROPIC_API_KEY` set in `server/.env`
- [ ] `ollama serve` running (if using Ollama/OpenClaw)
- [ ] `npm install` in both `server/` and `web/`
- [ ] `npm start` in proxy first, then frontend
- [ ] Test at `http://localhost:5173`

### Production (Self-Hosted)
- [ ] Use environment variables for all secrets (no `.env` files)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (nginx/CloudFlare)
- [ ] Update CORS origin to production domain
- [ ] Run behind a reverse proxy (nginx)
- [ ] Set up monitoring (Sentry, New Relic)

### Production (Cloud — Vercel + Railway)
- [ ] Frontend: `vercel deploy` (auto-builds from GitHub)
- [ ] Backend: `git push heroku main` (auto-deploys)
- [ ] Set secrets in Vercel/Railway dashboards
- [ ] Configure environment variables
- [ ] Test endpoints via public domain

---

## Testing

### Unit Tests (Future)
```javascript
// test/synthesis.test.js
describe("Synthesis Engine", () => {
  it("should merge unique insights from 3 models", async () => {
    const responses = {
      claude: "Insight A",
      chatgpt: "Insight B",
      mistral: "Insight A + C"
    };
    const synth = await synthesize(responses);
    expect(synth).toContain("A");
    expect(synth).toContain("B");
    expect(synth).toContain("C");
  });
});
```

### Integration Tests
```bash
# Query all models and verify responses
curl -X POST http://localhost:3001/api/query \
  -d '{"modelId":"claude","prompt":"test"}'
```

---

## Future Enhancements

1. **Model Weighting** — Prioritize certain models for synthesis
2. **Custom System Prompts** — User-defined instructions per model
3. **Response Caching** — Redis cache layer
4. **Analytics** — Track model response times, accuracy
5. **Rate Limiting** — Prevent abuse
6. **Streaming Responses** — WebSocket for real-time updates
7. **Batch Processing** — Queue multiple prompts
8. **Model Fallbacks** — Automatic retry on failure

---

**OPEN-LEE v3.1 | Production Architecture | MIT License**
