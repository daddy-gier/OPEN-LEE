import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * OPEN-LEE Artifact-compatible JSX
 * - Uses platform's Anthropic proxy at https://api.anthropic.com/v1/messages (no keys in client)
 * - AbortController timeouts + manual cancel
 * - JSDoc types for safety in JSX artifacts
 * - Memoized subcomponents to reduce re-renders
 */

const MODELS = [
  { id: "claude", label: "CLAUDE", color: "#FF6B35", dot: "#FF6B35", vendor: "anthropic" },
  { id: "chatgpt", label: "CHATGPT", color: "#10B981", dot: "#10B981", vendor: "openai" },
  { id: "mistral", label: "MISTRAL", color: "#8B5CF6", dot: "#8B5CF6", vendor: "mistral" },
  { id: "grok", label: "GROK", color: "#F59E0B", dot: "#F59E0B", vendor: "xai" },
  { id: "ludus", label: "LUDUS-AI", color: "#EC4899", dot: "#EC4899", vendor: "local" },
  { id: "openclaw", label: "OPENCLAW", color: "#06B6D4", dot: "#06B6D4", vendor: "local" },
];

const GPU_NODES = [
  { id: "CAPTAIN", cpu: "Ryzen 7 1700X", gpu: "GTX 1080", vram: 8, load: 72 },
  { id: "FRANKENSTINE", cpu: "Ryzen 5 7600X", gpu: "RX 7700 XT", vram: 12, load: 45 },
  { id: "NODE-03", cpu: "i5-6400", gpu: "GTX 1660 S", vram: 6, load: 88 },
  { id: "NODE-04", cpu: "Ryzen 3 4350G", gpu: "Integrated", vram: 2, load: 31 },
  { id: "NODE-05", cpu: "i5-4590", gpu: "GTX 970", vram: 4, load: 0 },
  { id: "NODE-06", cpu: "Ryzen 7 3700X", gpu: "RTX 3060", vram: 12, load: 56 },
];

const DEMO_RESPONSES = {
  chatgpt: "Based on the query, the key considerations are: 1) Context alignment is critical for accurate responses. 2) The user's intent should be parsed at semantic depth. 3) Prior knowledge provides a strong foundation for output generation. Note that edge cases must be handled with fallback logic.",
  mistral: "Analyzing this request through a structured lens: The primary objective maps to information retrieval with synthesis. Cross-referencing internal training data suggests multiple valid approaches. Optimal path involves weighing confidence scores across candidate answers before committing to output.",
  grok: "Straight up: this is a complex question with multiple angles. What most people miss is the second-order effects. The obvious answer is X, but if you dig deeper you find Y which completely changes the calculus. Real talk — the synthesis matters more than any single data point here.",
  ludus: "[LUDUS-AI / UE5 MODE] Parsing request for Unreal Engine context... Blueprint node chain identified. Recommended C++ implementation pattern detected. Cross-referencing NPC behavior trees and NYGHTSHADE_HOLLOW architecture specs. Output optimized for game dev pipeline integration.",
  openclaw: "[OPENCLAW / LOCAL MODE] Running on Ollama endpoint localhost:11434. Model: qwen2.5-coder:7b loaded. Processing with local inference — zero cloud latency. Response derived from on-device compute. GPU memory allocated: 6.2GB / 8GB. Tokens/sec: 34.2",
};

/**
 * callClaude - uses artifact platform proxy to reach Anthropic endpoint.
 * Platform should inject credentials server-side.
 * @param {string} prompt
 * @param {number} timeoutMs
 * @param {AbortSignal} signal
 * @returns {Promise<string>}
 */
async function callClaude(prompt, timeoutMs = 90000, signal, options = {}) {
  const controller = new AbortController();
  const mergedSignal = signal;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("http://localhost:3001/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, ...options }),
      signal: mergedSignal || controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Claude proxy error: ${res.status} ${body.slice(0, 200)}`);
    }

    const data = await res.json().catch(() => null);
    const text = data?.content?.[0]?.text ?? data?.text ?? data?.response ?? null;
    return text || "No response.";
  } catch (err) {
    if (err && err.name === "AbortError") throw new Error("Request timed out or cancelled");
    throw err;
  }
}

function LoadingDots({ color }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: color,
          animation: `blink 1.2s ${i * 0.2}s infinite`,
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

const MemoLoadingDots = React.memo(LoadingDots);

function GpuBar({ load, color }) {
  const barColor = load > 80 ? "#EF4444" : load > 50 ? "#F59E0B" : color;
  return (
    <div style={{ width: "100%", height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${load}%`, height: "100%", background: barColor, transition: "width 1s ease", boxShadow: `0 0 6px ${barColor}` }} />
    </div>
  );
}

const MemoGpuBar = React.memo(GpuBar);

export default function OpenLeeArtifact() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [states, setStates] = useState({});
  const [responses, setResponses] = useState({});
  const [synthesis, setSynthesis] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [activeTab, setActiveTab] = useState("oracle");
  const [nodeLoads, setNodeLoads] = useState(GPU_NODES.map(n => n.load));
  const [totalRuns, setTotalRuns] = useState(0);
  const [queryLog, setQueryLog] = useState([]);
  const [errorBanner, setErrorBanner] = useState(null);
  const [listening, setListening] = useState(false);

  const abortRef = useRef(null);
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    if (!window.electron?.startSpeech) { setErrorBanner("Speech IPC not available."); return; }
    setListening(true);
    setPrompt("");
    window.electron.onSpeechResult((text) => {
      if (text) setPrompt(text);
      setListening(false);
    });
    window.electron.onSpeechError((err) => {
      setErrorBanner(`Mic error: ${err}`);
      setListening(false);
    });
    window.electron.startSpeech();
  }, []);

  const stopListening = useCallback(() => {
    window.electron?.stopSpeech();
    setListening(false);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setNodeLoads(prev => prev.map((l, i) => GPU_NODES[i].load === 0 ? 0 : Math.max(10, Math.min(95, l + (Math.random() - 0.5) * 10))));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const setModelState = useCallback((id, state) => setStates(prev => ({ ...prev, [id]: state })), []);
  const setModelResponse = useCallback((id, text) => setResponses(prev => ({ ...prev, [id]: text })), []);

  const runQuery = useCallback(async () => {
    if (!prompt.trim() || running) return;
    const q = prompt.trim();

    // cancel previous
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {};
    }
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

    const claudePromise = callClaude(q, 90000, controller.signal).then(text => {
      if (controller.signal.aborted) return;
      collected["claude"] = text;
      setModelState("claude", "done");
      setModelResponse("claude", text);
    }).catch(err => {
      if (controller.signal.aborted) return;
      const msg = `ERROR: ${String(err.message ?? err)}`;
      collected["claude"] = msg;
      setModelState("claude", "error");
      setModelResponse("claude", msg);
      setErrorBanner(msg);
    });

    const demoPromises = ["chatgpt","mistral","grok","ludus","openclaw"].map((id, i) =>
      new Promise(resolve => setTimeout(() => {
        if (controller.signal.aborted) { resolve(); return; }
        const text = DEMO_RESPONSES[id] + `\n\n[Responding to: "${q.slice(0,60)}..."]`;
        collected[id] = text;
        setModelState(id, "done");
        setModelResponse(id, text);
        resolve();
      }, 1200 + i * 600 + Math.random() * 800))
    );

    await Promise.all([claudePromise, ...demoPromises]);

    // Synthesize
    setSynthesizing(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      const synthPrompt = `You are OPEN-LEE's synthesis engine. Multiple AI models answered this query: "${q}"\n\nHere are their responses:\n\n${Object.entries(collected).map(([k,v]) => `[${k.toUpperCase()}]: ${v}`).join("\n\n")}\n\nYour job: Identify what each model got RIGHT that others missed. Combine all unique insights into one DEFINITIVE unified answer. Format it clearly. Start with \"OPEN-LEE SYNTHESIS:\" and be comprehensive.`;
      const synth = await callClaude(synthPrompt, 90000, controller.signal, { max_tokens: 2000 });
      if (!controller.signal.aborted) setSynthesis(synth);
    } catch (err) {
      if (!controller.signal.aborted) setSynthesis("Synthesis engine offline. Showing raw responses above.");
    }

    setSynthesizing(false);
    setRunning(false);
    setTotalRuns(n => n + 1);
    setTimeout(() => synthRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [prompt, running, setModelResponse, setModelState]);

  const doneCt = useMemo(() => Object.values(states).filter(s => s === "done" || s === "error").length, [states]);
  const progress = useMemo(() => MODELS.length > 0 ? (doneCt / MODELS.length) * 100 : 0, [doneCt]);

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Courier New', 'Lucida Console', monospace", color: "#e0e0e0" }}>
      <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`}</style>

      <div style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #FF6B35", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6B35" }}>⬡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: "#FF6B35" }}>OPEN-LEE</div>
            <div style={{ fontSize: 10, color: "#777" }}>MULTI-AI AGGREGATION</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#777" }}>TOTAL RUNS</div>
            <div style={{ fontSize: 16, color: "#FF6B35", fontWeight: 700 }}>{totalRuns}</div>
          </div>
          <div>
            <button onClick={() => { setErrorBanner(null); setSynthesis(""); setResponses({}); setStates({}); }} style={{ background: "#0a0a14", color: "#b0b0c0", border: "1px solid #1a1a2e", padding: "6px 10px", borderRadius: 4 }}>Reset</button>
          </div>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>PROMPT INPUT — ALL NODES RECEIVE SIMULTANEOUSLY</div>
          <div style={{ display: "flex", border: "1px solid #1a1a2e", borderRadius: 6, overflow: "hidden", background: "#08080f" }}>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runQuery(); }} placeholder="Enter your query..." style={{ flex: 1, padding: 12, background: "transparent", color: "#e0e0e0", border: "none", height: 100 }} />
            <div style={{ padding: 12, borderLeft: "1px solid #1a1a2e", display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={runQuery} disabled={running || !prompt.trim()} style={{ background: running ? "#333" : "#FF6B35", color: running ? "#777" : "#050508", border: "none", padding: "8px 12px", borderRadius: 4, cursor: running ? "not-allowed" : "pointer" }}>{running ? "PROCESSING..." : "▶ EXECUTE"}</button>
              <button onClick={listening ? stopListening : startListening} disabled={running} title={listening ? "Stop listening" : "Speak your prompt"} style={{ background: listening ? "#1a0a2e" : "#0a0a14", color: listening ? "#a855f7" : "#777", border: `1px solid ${listening ? "#a855f7" : "#1a1a2e"}`, padding: "6px 8px", borderRadius: 4, cursor: running ? "not-allowed" : "pointer", boxShadow: listening ? "0 0 8px #a855f744" : "none" }}>{listening ? "🎙 LISTENING..." : "🎤 MIC"}</button>
              {running && <button onClick={() => abortRef.current?.abort()} style={{ background: "#222", color: "#EF4444", border: "1px solid #EF4444", padding: "6px 8px", borderRadius: 4 }}>✕ CANCEL</button>}
            </div>
          </div>
        </div>

        {errorBanner && (
          <div style={{ background: "#3b0f0f", color: "#FFB4B4", padding: 10, borderRadius: 6, marginBottom: 12 }}>
            <strong>Error:</strong> {errorBanner} <button onClick={() => setErrorBanner(null)} style={{ marginLeft: 12, background: "none", color: "#FFB4B4", border: "none" }}>Dismiss</button>
          </div>
        )}

        {running && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "#777" }}>NODE COMPLETION</div>
              <div style={{ fontSize: 11, color: "#FF6B35" }}>{doneCt}/{MODELS.length}</div>
            </div>
            <div style={{ height: 6, background: "#1a1a2e", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#FF6B35,#F59E0B)", transition: "width 0.4s" }} />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 16 }}>
          {MODELS.map(m => {
            const s = states[m.id] || "idle";
            const r = responses[m.id];
            return (
              <div key={m.id} style={{ border: `1px solid ${s === "done" ? m.color + "44" : s === "loading" ? m.color + "33" : "#1a1a2e" }`, borderRadius: 6, background: "#08080f", padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s === "idle" ? "#333" : m.dot, boxShadow: s !== "idle" ? `0 0 6px ${m.dot}` : "none" }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: s !== "idle" ? m.color : "#777" }}>{m.label}</div>
                  </div>
                  <div style={{ fontSize: 11, color: s === "done" ? "#10B981" : s === "loading" ? m.color : s === "error" ? "#EF4444" : "#777" }}>{s === "idle" ? "STANDBY" : s === "loading" ? "THINKING" : s === "error" ? "ERROR" : "COMPLETE"}</div>
                </div>
                <div style={{ minHeight: 80 }}>
                  {s === "idle" && <div style={{ color: "#2a2a3a", fontStyle: "italic" }}>Awaiting query...</div>}
                  {s === "loading" && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><MemoLoadingDots color={m.color} /><div style={{ color: m.color }}>Processing...</div></div>}
                  {(s === "done" || s === "error") && r && <div style={{ color: s === "error" ? "#FFB4B4" : "#b0b0c0", whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto" }}>{r}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div ref={synthRef} style={{ border: `1px solid ${synthesis ? "#FF6B3566" : "#1a1a2e" }`, borderRadius: 6, background: "#08080f", overflow: "hidden" }}>
          <div style={{ padding: 10, display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #1a1a2e", background: synthesis ? "#FF6B3511" : "#0a0a14" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: synthesis ? "#FF6B35" : synthesizing ? "#F59E0B" : "#333", boxShadow: synthesis ? "0 0 8px #FF6B35" : "none" }} />
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: synthesis ? "#FF6B35" : "#777" }}>OPEN-LEE SYNTHESIS ENGINE</div>
            {synthesizing && <MemoLoadingDots color="#F59E0B" />}
            {synthesis && <div style={{ marginLeft: "auto", color: "#10B981", fontSize: 11 }}>✓ CROSS-REFERENCED {MODELS.length} MODELS</div>}
          </div>
          <div style={{ padding: 12, minHeight: 80 }}>
            {!synthesis && !synthesizing && <div style={{ color: "#2a2a3a", fontStyle: "italic" }}>Synthesis output will appear here after all nodes complete...</div>}
            {synthesizing && <div style={{ color: "#F59E0B" }}>Comparing node outputs... identifying gaps... merging unique insights...</div>}
            {synthesis && <div style={{ color: "#d0d0e0", whiteSpace: "pre-wrap" }}>{synthesis}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
