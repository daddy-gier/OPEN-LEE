# API Reference

## Base URL
```
http://localhost:3001
```

---

## Endpoints

### 1. POST /api/query

Fire a single prompt to any AI model.

**Request:**
```http
POST /api/query HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "modelId": "claude",
  "prompt": "What is the capital of France?",
  "mode": "general"
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `modelId` | string | Yes | One of: `claude`, `chatgpt`, `mistral`, `grok`, `ludus`, `openclaw` |
| `prompt` | string | Yes | The user's question or prompt |
| `mode` | string | No | Context mode: `general` (default), `gamedev`, `coder` |

**Response (Success):**
```json
{
  "response": "Paris is the capital of France. It is the most populous city in France...",
  "error": null
}
```

**Response (Error):**
```json
{
  "response": null,
  "error": "Claude HTTP 401 — Invalid API key"
}
```

**Status Codes:**
- `200` — Success (even if model returned an error, HTTP is 200)
- `400` — Bad request (missing required fields)
- `500` — Server error

**Examples:**

```bash
# Using curl
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "claude",
    "prompt": "Explain quantum computing",
    "mode": "general"
  }'

# Using JavaScript fetch
const res = await fetch("http://localhost:3001/api/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modelId: "mistral",
    prompt: "Write a haiku about AI",
    mode: "coder"
  })
});
const data = await res.json();
console.log(data.response);
```

---

### 2. POST /api/synthesize

Merge responses from multiple models into one cohesive answer.

**Request:**
```http
POST /api/synthesize HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "prompt": "What is AI?",
  "responses": {
    "claude": {
      "response": "AI is artificial intelligence...",
      "error": null
    },
    "chatgpt": {
      "response": "Artificial intelligence refers to...",
      "error": null
    },
    "mistral": {
      "response": null,
      "error": "Timeout"
    }
  },
  "mode": "general"
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `prompt` | string | Yes | The original user question |
| `responses` | object | Yes | Map of model responses from `/api/query` |
| `mode` | string | No | Context mode: `general`, `gamedev`, `coder` |

**Response:**
```json
{
  "synthesis": "## 🔍 Unique Contributions By Model\n\n### Claude\n- Focused on machine learning foundations\n\n### ChatGPT\n- Emphasized practical applications...\n\n## ⚠️ Conflicts / Disagreements\nNone found.\n\n## ✅ OPEN-LEE FINAL ANSWER\nAI is..."
}
```

**Examples:**

```bash
# Using curl (simplified)
curl -X POST http://localhost:3001/api/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is AI?",
    "responses": {
      "claude": { "response": "AI is...", "error": null },
      "chatgpt": { "response": "AI refers to...", "error": null }
    },
    "mode": "general"
  }'
```

---

### 3. GET /api/health

Check server status and which models are available.

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:3001
```

**Response:**
```json
{
  "status": "ok",
  "models": {
    "claude": true,
    "chatgpt": false,
    "mistral": true,
    "grok": false,
    "ollama": true,
    "openclaw": true
  },
  "openClawConfig": "C:\\Users\\Gierl\\.openclaw\\openclaw.json"
}
```

**Examples:**

```bash
curl http://localhost:3001/api/health | jq .

# Quick check in JavaScript
const health = await fetch("http://localhost:3001/api/health")
  .then(r => r.json());
console.log(health.models.claude ? "Claude ready" : "Claude unavailable");
```

---

## Model IDs

| Model | Vendor | Requires API Key | Speed | Cost |
|-------|--------|------------------|-------|------|
| `claude` | Anthropic | Yes | Fast | $$ |
| `chatgpt` | OpenAI | Yes | Very Fast | $$ |
| `mistral` | Mistral | Yes | Very Fast | $ |
| `grok` | xAI | Yes | Fast | $$ |
| `ollama` | Local | No | Medium | FREE |
| `openclaw` | Local (via Ollama) | No | Medium | FREE |
| `ludus` | Local | No | Slow | FREE |

---

## Modes

| Mode | Context | Best For |
|------|---------|----------|
| `general` | Standard AI responses | General questions |
| `gamedev` | Unreal Engine 5 C++ specialist | Game development, UE5 code |
| `coder` | Production code focus | Software engineering |

**System Prompts by Mode:**

```javascript
// general
"" // (no special system prompt)

// gamedev
"You are an expert Unreal Engine 5 C++ developer. Project: NYGHTSHADE HOLLOW..."

// coder
"You are an elite software engineer. Give precise, production-ready code with error handling. No fluff."
```

---

## Error Handling

### Common Errors

**Missing Required Field:**
```json
{
  "error": "modelId and prompt required"
}
```

**Unknown Model:**
```json
{
  "response": null,
  "error": "Unknown modelId: xyz"
}
```

**API Key Not Set:**
```json
{
  "response": "[Claude] No ANTHROPIC_API_KEY set on server",
  "error": null
}
```

**Timeout:**
```json
{
  "response": null,
  "error": "Request timed out"
}
```

**Ollama Offline:**
```json
{
  "response": null,
  "error": "Ollama HTTP 404 — is 'ollama serve' running?"
}
```

---

## Rate Limiting (Future)

Currently unlimited. Future versions will implement:
```
Rate Limit: 100 requests/minute per IP
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

---

## Timeouts

**Default:** 90 seconds per request

**Configuration:**
```bash
# server/.env
TIMEOUT_MS=90000  # milliseconds
```

If a model doesn't respond within this time, the request is aborted and an error is returned.

---

## Response Format

All successful responses follow this pattern:

```json
{
  "response": "string or null",
  "error": "string or null"
}
```

**Rules:**
- If `error` is `null`, `response` contains the model's answer
- If `error` is not `null`, `response` is `null`
- Either `response` or `error` is always populated

---

## Authentication

Currently, no API authentication is required to call `/api/query` or `/api/synthesize`.

**Future Enhancement:**
```bash
Authorization: Bearer YOUR_TOKEN
```

---

## Examples

### Complete Query → Synthesis Flow

```javascript
// 1. Query all models in parallel
const models = ["claude", "chatgpt", "mistral"];
const responses = await Promise.all(
  models.map(id =>
    fetch("http://localhost:3001/api/query", {
      method: "POST",
      body: JSON.stringify({
        modelId: id,
        prompt: "Explain blockchain",
        mode: "coder"
      })
    }).then(r => r.json())
  )
);

// 2. Synthesize the responses
const synthesis = await fetch("http://localhost:3001/api/synthesize", {
  method: "POST",
  body: JSON.stringify({
    prompt: "Explain blockchain",
    responses: {
      claude: responses[0],
      chatgpt: responses[1],
      mistral: responses[2]
    },
    mode: "coder"
  })
}).then(r => r.json());

console.log(synthesis.synthesis);
```

### Error Handling

```javascript
try {
  const res = await fetch("http://localhost:3001/api/query", {
    method: "POST",
    body: JSON.stringify({
      modelId: "claude",
      prompt: "Hello"
    })
  });
  const data = await res.json();

  if (data.error) {
    console.error("Model error:", data.error);
  } else {
    console.log("Response:", data.response);
  }
} catch (err) {
  console.error("Network error:", err);
}
```

---

## Changelog

### v3.1 (Current)
- Added timeout abort signals
- Added synthesis endpoint
- Added health check endpoint
- Full TypeScript types

### v3.0
- Production-grade proxy
- Express server
- CORS configuration

### v2.0
- Multi-AI orchestration
- Synthesis engine

---

**OPEN-LEE API v3.1 | MIT License**
