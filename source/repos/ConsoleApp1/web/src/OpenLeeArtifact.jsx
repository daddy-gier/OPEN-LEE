import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MODELS = [
  { id: "claude",   label: "CLAUDE",   color: "#FF6B35", dot: "#FF6B35", vendor: "anthropic" },
  { id: "chatgpt",  label: "CHATGPT",  color: "#10B981", dot: "#10B981", vendor: "openai"    },
  { id: "mistral",  label: "MISTRAL",  color: "#8B5CF6", dot: "#8B5CF6", vendor: "mistral"   },
  { id: "grok",     label: "GROK",     color: "#F59E0B", dot: "#F59E0B", vendor: "xai"       },
  { id: "ludus",    label: "LUDUS-AI", color: "#EC4899", dot: "#EC4899", vendor: "local"     },
  { id: "openclaw", label: "OPENCLAW", color: "#06B6D4", dot: "#06B6D4", vendor: "local"     },
];

const GPU_NODES = [
  { id: "CAPTAIN",     cpu: "Ryzen 7 1700X", gpu: "GTX 1080",   vram: 8,  load: 72 },
  { id: "FRANKENSTINE",cpu: "Ryzen 5 7600X", gpu: "RX 7700 XT", vram: 12, load: 45 },
  { id: "NODE-03",     cpu: "i5-6400",       gpu: "GTX 1660 S", vram: 6,  load: 88 },
  { id: "NODE-04",     cpu: "Ryzen 3 4350G", gpu: "Integrated", vram: 2,  load: 31 },
  { id: "NODE-05",     cpu: "i5-4590",       gpu: "GTX 970",    vram: 4,  load: 0  },
  { id: "NODE-06",     cpu: "Ryzen 7 3700X", gpu: "RTX 3060",   vram: 12, load: 56 },
];

const DEMO_RESPONSES = {
  chatgpt:  "Based on the query, the key considerations are: 1) Context alignment is critical for accurate responses. 2) The user's intent should be parsed at semantic depth. 3) Prior knowledge provides a strong foundation for output generation. Note that edge cases must be handled with fallback logic.",
  mistral:  "Analyzing this request through a structured lens: The primary objective maps to information retrieval with synthesis. Cross-referencing internal training data suggests multiple valid approaches. Optimal path involves weighing confidence scores across candidate answers before committing to output.",
  grok:     "Straight up: this is a complex question with multiple angles. What most people miss is the second-order effects. The obvious answer is X, but if you dig deeper you find Y which completely changes the calculus. Real talk — the synthesis matters more than any single data point here.",
  ludus:    "[LUDUS-AI / UE5 MODE] Parsing request for Unreal Engine context... Blueprint node chain identified. Recommended C++ implementation pattern detected. Cross-referencing NPC behavior trees and NYGHTSHADE_HOLLOW architecture specs. Output optimized for game dev pipeline integration.",
  openclaw: "[OPENCLAW / LOCAL MODE] Running on Ollama endpoint localhost:11434. Model: qwen2.5-coder:7b loaded. Processing with local inference — zero cloud latency. Response derived from on-device compute. GPU memory allocated: 6.2GB / 8GB. Tokens/sec: 34.2",
};

const BUDDY_PLANS = [
  {
    id: "free",
    name: "FREE",
    price: "$0",
    period: "/mo",
    color: "#555",
    features: ["5 queries/day", "Shared node pool", "Claude node only", "Community support"],
    cta: "Current Plan",
  },
  {
    id: "pro",
    name: "PRO",
    price: "$9.99",
    period: "/mo",
    color: "#FF6B35",
    popular: true,
    features: ["Unlimited queries", "Priority node access", "All 6 AI models", "Synthesis engine", "Cancel anytime"],
    cta: "Go Pro",
  },
  {
    id: "cluster",
    name: "CLUSTER",
    price: "$29.99",
    period: "/mo",
    color: "#F59E0B",
    features: ["Dedicated GPU nodes", "Reserved VRAM", "Team access (5 seats)", "Full API access", "Priority support", "Custom model endpoints"],
    cta: "Get Cluster",
  },
];

/**
 * callClaude — proxy to local Express server at port 3001.
 *
 * Fix: always uses our own AbortController for fetch so the timer works.
 * Forwards parentSignal to our controller so cancel also works.
 */
async function callClaude(prompt, timeoutMs = 90000, parentSignal, options = {}) {
  const controller = new AbortController();

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
    } else {
      parentSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("http://localhost:3001/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, ...options }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Claude proxy error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json().catch(() => null);
    const text = data?.content?.[0]?.text ?? data?.text ?? data?.response ?? null;
    return text || "No response returned.";
  } catch (err) {
    if (err?.name === "AbortError") throw new Error("Request timed out or was cancelled");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function LoadingDots({ color }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: color,
            animation: `blink 1.2s ${i * 0.2}s infinite`,
            display: "inline-block",
          }}
        />
      ))}
    </span>
  );
}

const MemoLoadingDots = React.memo(LoadingDots);

function GpuBar({ load, color }) {
  const barColor = load > 80 ? "#EF4444" : load > 50 ? "#F59E0B" : color;
  return (
    <div style={{ width: "100%", height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        width: `${load}%`, height: "100%",
        background: barColor,
        transition: "width 1s ease",
        boxShadow: `0 0 6px ${barColor}`,
      }} />
    </div>
  );
}

const MemoGpuBar = React.memo(GpuBar);

export default function OpenLeeArtifact() {
  const [prompt,      setPrompt]      = useState("");
  const [running,     setRunning]     = useState(false);
  const [states,      setStates]      = useState({});
  const [responses,   setResponses]   = useState({});
  const [synthesis,   setSynthesis]   = useState("");
  const [synthesizing,setSynthesizing] = useState(false);
  const [activeTab,   setActiveTab]   = useState("oracle");
  const [nodeLoads,   setNodeLoads]   = useState(GPU_NODES.map(n => n.load));
  const [totalRuns,   setTotalRuns]   = useState(0);
  const [queryLog,    setQueryLog]    = useState([]);
  const [errorBanner, setErrorBanner] = useState(null);
  const [listening,   setListening]   = useState(false);
  const [selectedPlan,setSelectedPlan]= useState("free");

  const abortRef  = useRef(null);
  const synthRef  = useRef(null);

  // Simulate live GPU load fluctuation
  useEffect(() => {
    const t = setInterval(() => {
      setNodeLoads(prev =>
        prev.map((l, i) =>
          GPU_NODES[i].load === 0 ? 0 : Math.max(10, Math.min(95, l + (Math.random() - 0.5) * 10))
        )
      );
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const startListening = useCallback(() => {
    if (!window.electron?.startSpeech) {
      setErrorBanner("Speech recognition requires the Electron desktop app.");
      return;
    }
    setListening(true);
    setPrompt("");
    window.electron.onSpeechResult(text => {
      if (text) setPrompt(text);
      setListening(false);
    });
    window.electron.onSpeechError(err => {
      setErrorBanner(`Mic error: ${err}`);
      setListening(false);
    });
    window.electron.startSpeech();
  }, []);

  const stopListening = useCallback(() => {
    window.electron?.stopSpeech();
    setListening(false);
  }, []);

  const setModelState    = useCallback((id, state) => setStates(prev => ({ ...prev, [id]: state })), []);
  const setModelResponse = useCallback((id, text)  => setResponses(prev => ({ ...prev, [id]: text })), []);

  const runQuery = useCallback(async () => {
    if (!prompt.trim() || running) return;
    const q = prompt.trim();

    // Cancel any in-flight request
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
    const controller = new AbortController();
    abortRef.current = controller;

    setErrorBanner(null);
    setRunning(true);
    setSynthesis("");
    setResponses({});
    setStates({});
    setQueryLog(prev => [{ q, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);

    const initStates = {};
    MODELS.forEach(m => { initStates[m.id] = "loading"; });
    setStates(initStates);

    const collected = {};

    const claudePromise = callClaude(q, 90000, controller.signal)
      .then(text => {
        if (controller.signal.aborted) return;
        collected["claude"] = text;
        setModelState("claude", "done");
        setModelResponse("claude", text);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        const msg = `ERROR: ${String(err.message ?? err)}`;
        collected["claude"] = msg;
        setModelState("claude", "error");
        setModelResponse("claude", msg);
        setErrorBanner(`Claude: ${err.message ?? err}`);
      });

    const demoPromises = ["chatgpt", "mistral", "grok", "ludus", "openclaw"].map((id, i) =>
      new Promise(resolve => setTimeout(() => {
        if (controller.signal.aborted) { resolve(); return; }
        const text = DEMO_RESPONSES[id] + `\n\n[Responding to: "${q.slice(0, 60)}${q.length > 60 ? "..." : ""}"]`;
        collected[id] = text;
        setModelState(id, "done");
        setModelResponse(id, text);
        resolve();
      }, 1200 + i * 600 + Math.random() * 800))
    );

    await Promise.all([claudePromise, ...demoPromises]);

    if (controller.signal.aborted) {
      setRunning(false);
      setSynthesizing(false);
      return;
    }

    // Synthesis pass
    setSynthesizing(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      const synthPrompt =
        `You are OPEN-LEE's synthesis engine. Multiple AI models answered this query: "${q}"\n\n` +
        `Here are their responses:\n\n` +
        Object.entries(collected).map(([k, v]) => `[${k.toUpperCase()}]: ${v}`).join("\n\n") +
        `\n\nYour job: Identify what each model got RIGHT that others missed. ` +
        `Combine all unique insights into one DEFINITIVE unified answer. ` +
        `Format with clear sections. Start with "OPEN-LEE SYNTHESIS:" and be comprehensive.`;

      const synth = await callClaude(synthPrompt, 90000, controller.signal, { max_tokens: 2000 });
      if (!controller.signal.aborted) setSynthesis(synth);
    } catch {
      if (!controller.signal.aborted) setSynthesis("Synthesis engine offline. See individual node responses above.");
    }

    setSynthesizing(false);
    setRunning(false);
    setTotalRuns(n => n + 1);
    setTimeout(() => synthRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [prompt, running, setModelResponse, setModelState]);

  const doneCt    = useMemo(() => Object.values(states).filter(s => s === "done" || s === "error").length, [states]);
  const progress  = useMemo(() => MODELS.length > 0 ? (doneCt / MODELS.length) * 100 : 0, [doneCt]);
  const onlineNodes = useMemo(() => GPU_NODES.filter((_, i) => nodeLoads[i] > 0).length, [nodeLoads]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      color: "#e0e0e0",
      overflowX: "hidden",
    }}>
      <style>{`
        @keyframes blink       { 0%,100%{opacity:.2}  50%{opacity:1} }
        @keyframes pulse       { 0%,100%{opacity:1}   50%{opacity:.4} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow        { 0%,100%{box-shadow:0 0 6px #FF6B35} 50%{box-shadow:0 0 22px #FF6B35,0 0 44px #FF6B3566} }
        ::-webkit-scrollbar        { width: 6px }
        ::-webkit-scrollbar-track  { background: #0a0a14 }
        ::-webkit-scrollbar-thumb  { background: #FF6B35; border-radius: 3px }
        textarea { outline: none; font-family: inherit; }
        button   { font-family: inherit; }
        button:disabled { opacity: 0.45; cursor: not-allowed !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        borderBottom: "1px solid #1a1a2e",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(90deg,#050508 0%,#0a0a14 100%)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "2px solid #FF6B35",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#FF6B35",
            animation: running ? "glow 1.5s infinite" : "none",
            boxShadow: "0 0 12px #FF6B3544",
          }}>⬡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: "#FF6B35" }}>OPEN-LEE</div>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 2 }}>MULTI-NEURAL AGGREGATION SYSTEM v3.1</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>TOTAL RUNS</div>
            <div style={{ fontSize: 18, color: "#FF6B35", fontWeight: 700 }}>{totalRuns}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>BUDDY NODES</div>
            <div style={{ fontSize: 18, color: "#10B981", fontWeight: 700 }}>{onlineNodes}/{GPU_NODES.length}</div>
          </div>
          <div style={{
            padding: "4px 12px",
            border: "1px solid #10B981", borderRadius: 2,
            fontSize: 10, color: "#10B981", letterSpacing: 2,
            animation: "pulse 2s infinite",
          }}>● ONLINE</div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a2e", padding: "0 24px", background: "#050508" }}>
        {[
          { id: "oracle", label: "◈  ORACLE ENGINE"  },
          { id: "buddy",  label: "⬡  BUDDY SYSTEM"   },
          { id: "log",    label: "≡  QUERY LOG"       },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: "none", border: "none",
              borderBottom: activeTab === t.id ? "2px solid #FF6B35" : "2px solid transparent",
              color: activeTab === t.id ? "#FF6B35" : "#555",
              padding: "12px 20px", fontSize: 11, letterSpacing: 2,
              cursor: "pointer", transition: "color 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ══════════════════════════════════════
            ORACLE ENGINE TAB
        ══════════════════════════════════════ */}
        {activeTab === "oracle" && (
          <>
            {/* Error banner */}
            {errorBanner && (
              <div style={{
                background: "#200a0a", border: "1px solid #EF444466",
                color: "#FFB4B4", padding: "10px 16px", borderRadius: 4,
                marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12,
                animation: "fadeSlideIn 0.3s ease",
              }}>
                <span><strong>Error:</strong> {errorBanner}</span>
                <button onClick={() => setErrorBanner(null)} style={{ background: "none", color: "#FFB4B4", border: "none", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>✕</button>
              </div>
            )}

            {/* Prompt input */}
            <div style={{ border: "1px solid #1a1a2e", borderRadius: 4, overflow: "hidden", marginBottom: 20, background: "#08080f" }}>
              <div style={{
                padding: "6px 16px", background: "#0a0a14", borderBottom: "1px solid #1a1a2e",
                fontSize: 9, letterSpacing: 3, color: "#444",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>PROMPT INPUT — ALL NODES RECEIVE SIMULTANEOUSLY</span>
                <span style={{ color: "#FF6B35" }}>{MODELS.length} MODELS ACTIVE</span>
              </div>
              <div style={{ display: "flex" }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runQuery(); }}
                  placeholder="Enter your query — all 6 AI nodes will process it simultaneously and OPEN-LEE will synthesize the best combined answer. (Ctrl+Enter to execute)"
                  style={{
                    flex: 1, background: "transparent", border: "none",
                    color: "#e0e0e0", padding: "14px 16px",
                    fontSize: 13, resize: "none", height: 90, lineHeight: 1.6,
                  }}
                />
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, borderLeft: "1px solid #1a1a2e", minWidth: 130 }}>
                  <button
                    onClick={runQuery}
                    disabled={running || !prompt.trim()}
                    style={{
                      background: running ? "#1a1a2e" : "#FF6B35",
                      color: running ? "#555" : "#050508",
                      border: "none", borderRadius: 2,
                      padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                      cursor: running || !prompt.trim() ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {running ? "PROCESSING..." : "▶ EXECUTE"}
                  </button>

                  <button
                    onClick={listening ? stopListening : startListening}
                    disabled={running}
                    style={{
                      background: listening ? "#1a0a2e" : "#0a0a14",
                      color: listening ? "#a855f7" : "#666",
                      border: `1px solid ${listening ? "#a855f7" : "#1a1a2e"}`,
                      borderRadius: 2, padding: "7px 10px", fontSize: 10, letterSpacing: 1,
                      cursor: running ? "not-allowed" : "pointer",
                      boxShadow: listening ? "0 0 8px #a855f744" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {listening ? "🎙 LISTENING" : "🎤 MIC"}
                  </button>

                  {running && (
                    <button
                      onClick={() => abortRef.current?.abort()}
                      style={{
                        background: "#1a0505", color: "#EF4444",
                        border: "1px solid #EF4444", borderRadius: 2,
                        padding: "7px 10px", fontSize: 10, letterSpacing: 1, cursor: "pointer",
                      }}
                    >
                      ✕ CANCEL
                    </button>
                  )}

                  {!running && (prompt || synthesis) && (
                    <button
                      onClick={() => { setPrompt(""); setSynthesis(""); setResponses({}); setStates({}); setErrorBanner(null); }}
                      style={{
                        background: "none", color: "#444",
                        border: "1px solid #1a1a2e", borderRadius: 2,
                        padding: "7px 10px", fontSize: 10, letterSpacing: 1, cursor: "pointer",
                      }}
                    >
                      RESET
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {running && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#444", letterSpacing: 2 }}>NODE COMPLETION</span>
                  <span style={{ fontSize: 9, color: "#FF6B35" }}>{doneCt}/{MODELS.length}</span>
                </div>
                <div style={{ height: 2, background: "#1a1a2e", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progress}%`,
                    background: "linear-gradient(90deg,#FF6B35,#F59E0B)",
                    transition: "width 0.5s ease",
                    boxShadow: "0 0 8px #FF6B35",
                  }} />
                </div>
              </div>
            )}

            {/* Model cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 24 }}>
              {MODELS.map(m => {
                const s = states[m.id] || "idle";
                const r = responses[m.id];
                return (
                  <div
                    key={m.id}
                    style={{
                      border: `1px solid ${s === "error" ? "#EF444444" : s === "done" ? m.color + "44" : s === "loading" ? m.color + "33" : "#1a1a2e"}`,
                      borderRadius: 4, background: "#08080f", overflow: "hidden",
                      transition: "all 0.3s",
                      animation: (s === "done" || s === "error") ? "fadeSlideIn 0.4s ease" : "none",
                    }}
                  >
                    <div style={{
                      padding: "8px 12px",
                      background: s === "loading" ? `${m.color}11` : "#0a0a14",
                      borderBottom: `1px solid ${s !== "idle" ? m.color + "22" : "#1a1a2e"}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "background 0.3s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: s === "idle" ? "#333" : s === "error" ? "#EF4444" : m.dot,
                          boxShadow: s !== "idle" ? `0 0 6px ${s === "error" ? "#EF4444" : m.dot}` : "none",
                          animation: s === "loading" ? "pulse 0.8s infinite" : "none",
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: s !== "idle" ? (s === "error" ? "#EF4444" : m.color) : "#444" }}>
                          {m.label}
                        </span>
                      </div>
                      <span style={{ fontSize: 9, letterSpacing: 1, color: s === "done" ? "#10B981" : s === "loading" ? m.color : s === "error" ? "#EF4444" : "#333" }}>
                        {s === "idle" ? "STANDBY" : s === "loading" ? "THINKING" : s === "error" ? "ERROR" : "COMPLETE"}
                      </span>
                    </div>

                    <div style={{ padding: 12, minHeight: 80 }}>
                      {s === "idle" && <div style={{ color: "#2a2a3a", fontSize: 11, fontStyle: "italic" }}>Awaiting query...</div>}
                      {s === "loading" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <MemoLoadingDots color={m.color} />
                          <span style={{ fontSize: 10, color: m.color }}>Processing...</span>
                        </div>
                      )}
                      {(s === "done" || s === "error") && r && (
                        <div style={{
                          fontSize: 11, lineHeight: 1.7,
                          color: s === "error" ? "#FFB4B4" : "#b0b0c0",
                          maxHeight: 160, overflowY: "auto", whiteSpace: "pre-wrap",
                        }}>{r}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Synthesis panel */}
            <div
              ref={synthRef}
              style={{
                border: `1px solid ${synthesis ? "#FF6B3566" : "#1a1a2e"}`,
                borderRadius: 4, background: "#08080f", overflow: "hidden",
                transition: "border-color 0.5s",
              }}
            >
              <div style={{
                padding: "10px 16px",
                background: synthesis ? "#FF6B3511" : "#0a0a14",
                borderBottom: "1px solid #1a1a2e",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: synthesis ? "#FF6B35" : synthesizing ? "#F59E0B" : "#333",
                  boxShadow: synthesis ? "0 0 10px #FF6B35" : "none",
                  animation: synthesizing ? "pulse 0.6s infinite" : "none",
                }} />
                <span style={{ fontSize: 11, letterSpacing: 3, color: synthesis ? "#FF6B35" : "#444", fontWeight: 700 }}>
                  OPEN-LEE SYNTHESIS ENGINE
                </span>
                {synthesizing && <MemoLoadingDots color="#F59E0B" />}
                {synthesis && (
                  <span style={{ marginLeft: "auto", fontSize: 9, color: "#10B981", letterSpacing: 1 }}>
                    ✓ CROSS-REFERENCED {MODELS.length} MODELS
                  </span>
                )}
              </div>
              <div style={{ padding: 16, minHeight: 100 }}>
                {!synthesis && !synthesizing && (
                  <div style={{ color: "#2a2a3a", fontSize: 11, fontStyle: "italic" }}>
                    Synthesis output will appear here after all nodes complete...
                  </div>
                )}
                {synthesizing && (
                  <div style={{ color: "#F59E0B", fontSize: 11 }}>
                    Comparing node outputs... identifying gaps... merging unique insights...
                  </div>
                )}
                {synthesis && (
                  <div style={{
                    fontSize: 12, lineHeight: 1.9, color: "#d0d0e0",
                    whiteSpace: "pre-wrap", animation: "fadeSlideIn 0.5s ease",
                  }}>
                    {synthesis}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            BUDDY SYSTEM TAB
        ══════════════════════════════════════ */}
        {activeTab === "buddy" && (
          <>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, letterSpacing: 3, color: "#06B6D4", fontWeight: 700 }}>⬡ THE BUDDY SYSTEM</div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginTop: 4 }}>DISTRIBUTED GPU SHARING NETWORK — OZARK, MO CLUSTER</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 10, maxWidth: 520, lineHeight: 1.7 }}>
                  Share your GPU with the network and earn credits. Buy time on other members' GPUs to run
                  AI models locally — no cloud, no data leaving your city.
                </div>
              </div>
              <div style={{ padding: "6px 14px", border: "1px solid #06B6D4", borderRadius: 2, fontSize: 10, color: "#06B6D4", letterSpacing: 2 }}>
                {onlineNodes} / {GPU_NODES.length} NODES ACTIVE
              </div>
            </div>

            {/* GPU node cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }}>
              {GPU_NODES.map((node, i) => {
                const load   = Math.round(nodeLoads[i]);
                const online = load > 0;
                return (
                  <div key={node.id} style={{
                    border: `1px solid ${online ? "#06B6D455" : "#1a1a2e"}`,
                    borderRadius: 4, background: "#08080f", overflow: "hidden",
                  }}>
                    <div style={{
                      padding: "8px 12px",
                      background: online ? "#06B6D40a" : "#0a0a14",
                      borderBottom: "1px solid #1a1a2e",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: online ? "#06B6D4" : "#333",
                          boxShadow: online ? "0 0 6px #06B6D4" : "none",
                          animation: online ? "pulse 2s infinite" : "none",
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: online ? "#06B6D4" : "#444" }}>{node.id}</span>
                      </div>
                      <span style={{ fontSize: 10, color: online ? "#10B981" : "#EF4444", letterSpacing: 1 }}>
                        {online ? "● ONLINE" : "○ OFFLINE"}
                      </span>
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[["CPU", node.cpu], ["GPU", node.gpu], ["VRAM", `${node.vram} GB`],
                          ["UTIL", online ? `${load}%` : "---"]].map(([label, val]) => (
                          <div key={label}>
                            <div style={{ fontSize: 8, color: "#444", letterSpacing: 1, marginBottom: 2 }}>{label}</div>
                            <div style={{
                              fontSize: 10, fontWeight: label === "UTIL" ? 700 : 400,
                              color: label === "UTIL"
                                ? (load > 80 ? "#EF4444" : load > 50 ? "#F59E0B" : "#10B981")
                                : "#b0b0c0",
                            }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      <MemoGpuBar load={online ? load : 0} color="#06B6D4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cluster aggregate stats */}
            <div style={{
              border: "1px solid #1a1a2e", borderRadius: 4, background: "#08080f",
              padding: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32,
            }}>
              {[
                { label: "TOTAL VRAM",   value: `${GPU_NODES.reduce((a, n) => a + n.vram, 0)} GB` },
                {
                  label: "AVG GPU LOAD",
                  value: `${Math.round(
                    nodeLoads.filter((_, i) => GPU_NODES[i].load > 0).reduce((a, b) => a + b, 0) /
                    Math.max(1, nodeLoads.filter((_, i) => GPU_NODES[i].load > 0).length)
                  )}%`,
                },
                { label: "CLUSTER ID",  value: "OZARK-01" },
                { label: "PROTOCOL",    value: "BUDDY v1"  },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, color: "#06B6D4", fontWeight: 700 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* ── ACCESS PLANS ── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#FF6B35", fontWeight: 700, marginBottom: 6 }}>
                ◈ NETWORK ACCESS — CHOOSE YOUR TIER
              </div>
              <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7 }}>
                Buy access to run any AI model on the BUDDY GPU network.
                Share your own hardware to earn BUDDY credits toward your subscription.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 32 }}>
              {BUDDY_PLANS.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    border: `1px solid ${selectedPlan === plan.id ? plan.color : "#1a1a2e"}`,
                    borderRadius: 4,
                    background: selectedPlan === plan.id ? `${plan.color}0d` : "#08080f",
                    padding: 20, cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position: "absolute", top: -1, right: 16,
                      background: "#FF6B35", color: "#050508",
                      fontSize: 8, fontWeight: 700, letterSpacing: 2, padding: "2px 8px",
                    }}>POPULAR</div>
                  )}

                  <div style={{ fontSize: 11, letterSpacing: 3, color: plan.color, fontWeight: 700, marginBottom: 10 }}>
                    {plan.name}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 16 }}>
                    <span style={{ fontSize: 30, color: plan.color, fontWeight: 700 }}>{plan.price}</span>
                    <span style={{ fontSize: 11, color: "#555" }}>{plan.period}</span>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize: 11, color: "#999", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: plan.color, flexShrink: 0 }}>▸</span> {f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); setSelectedPlan(plan.id); }}
                    style={{
                      width: "100%",
                      background: selectedPlan === plan.id ? plan.color : "transparent",
                      color: selectedPlan === plan.id ? "#050508" : plan.color,
                      border: `1px solid ${plan.color}`,
                      borderRadius: 2, padding: "9px 0",
                      fontSize: 11, fontWeight: 700, letterSpacing: 2,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* Share your GPU CTA */}
            <div style={{
              border: "1px solid #06B6D444", borderRadius: 4,
              background: "#06B6D40a", padding: 20,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 2, color: "#06B6D4", fontWeight: 700, marginBottom: 6 }}>
                  ⬡ SHARE YOUR GPU — EARN CREDITS
                </div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.7 }}>
                  Have spare GPU cycles? Join the BUDDY network and earn credits every time someone
                  uses your hardware. Credits apply directly to your subscription.
                </div>
              </div>
              <button style={{
                background: "#06B6D4", color: "#050508",
                border: "none", borderRadius: 2,
                padding: "10px 24px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                JOIN NETWORK
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            QUERY LOG TAB
        ══════════════════════════════════════ */}
        {activeTab === "log" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: 2 }}>
                RECENT QUERIES — LAST {queryLog.length} RUNS
              </div>
              {queryLog.length > 0 && (
                <button
                  onClick={() => setQueryLog([])}
                  style={{
                    background: "none", color: "#555",
                    border: "1px solid #1a1a2e", borderRadius: 2,
                    padding: "4px 12px", fontSize: 9, letterSpacing: 1, cursor: "pointer",
                  }}
                >
                  CLEAR LOG
                </button>
              )}
            </div>

            {queryLog.length === 0 && (
              <div style={{ color: "#2a2a3a", fontSize: 12, fontStyle: "italic" }}>
                No queries yet. Run your first query in the Oracle Engine tab.
              </div>
            )}

            {queryLog.map((entry, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #1a1a2e", borderRadius: 2,
                  padding: "10px 14px", marginBottom: 8,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#08080f",
                  animation: i === 0 ? "fadeSlideIn 0.3s ease" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ color: "#FF6B35", flexShrink: 0, fontSize: 11 }}>#{queryLog.length - i}</span>
                  <div style={{ fontSize: 12, color: "#b0b0c0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.q}
                  </div>
                </div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: 1, flexShrink: 0, marginLeft: 16 }}>
                  {entry.ts}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
