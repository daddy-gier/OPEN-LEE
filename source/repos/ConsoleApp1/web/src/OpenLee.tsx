import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { callClaude } from "./api";

// ── Preset templates ──────────────────────────────────────────────────────────
const PRESET_CATEGORIES: { label: string; color: string; templates: string[] }[] = [
  {
    label: "BUSINESS",
    color: "#FF6B35",
    templates: [
      "Analyze my business idea:",
      "Write a cold email for:",
      "Create a marketing plan for:",
      "What is the target market for:",
      "List the biggest risks for this business:",
    ],
  },
  {
    label: "CODE",
    color: "#10B981",
    templates: [
      "Review this code for bugs:",
      "Refactor this function:",
      "Explain what this code does:",
      "Write unit tests for:",
      "Convert this code to TypeScript:",
    ],
  },
  {
    label: "WRITING",
    color: "#8B5CF6",
    templates: [
      "Write a blog post about:",
      "Summarize this text:",
      "Edit for clarity:",
      "Write a LinkedIn post about:",
      "Draft a professional email about:",
    ],
  },
  {
    label: "CREATIVE",
    color: "#EC4899",
    templates: [
      "Brainstorm 10 ideas for:",
      "Write a short story about:",
      "Create a product name for:",
      "Write 5 taglines for:",
      "Design a character for a story about:",
    ],
  },
  {
    label: "RESEARCH",
    color: "#F59E0B",
    templates: [
      "Pros and cons of:",
      "Explain [topic] simply:",
      "Compare X vs Y:",
      "What are the most common misconceptions about:",
      "Give me a timeline of:",
    ],
  },
  {
    label: "PRODUCTIVITY",
    color: "#06B6D4",
    templates: [
      "Create a step-by-step plan for:",
      "What are the most important things I should know about:",
      "Break this project into tasks:",
      "Help me prioritize these tasks:",
      "Write a weekly schedule for:",
    ],
  },
];

const CUSTOM_PRESETS_KEY = "openlee_custom_presets";

type Model = { id: string; label: string; color: string; dot: string; vendor: string };
type NodeInfo = { id: string; cpu: string; gpu: string; vram: number; load: number };

const MODELS: Model[] = [
  { id: "claude", label: "CLAUDE", color: "#FF6B35", dot: "#FF6B35", vendor: "anthropic" },
  { id: "chatgpt", label: "CHATGPT", color: "#10B981", dot: "#10B981", vendor: "openai" },
  { id: "mistral", label: "MISTRAL", color: "#8B5CF6", dot: "#8B5CF6", vendor: "mistral" },
  { id: "grok", label: "GROK", color: "#F59E0B", dot: "#F59E0B", vendor: "xai" },
  { id: "ludus", label: "LUDUS-AI", color: "#EC4899", dot: "#EC4899", vendor: "local" },
  { id: "openclaw", label: "OPENCLAW", color: "#06B6D4", dot: "#06B6D4", vendor: "local" },
];

const GPU_NODES: NodeInfo[] = [
  { id: "CAPTAIN", cpu: "Ryzen 7 1700X", gpu: "GTX 1080", vram: 8, load: 72 },
  { id: "FRANKENSTINE", cpu: "Ryzen 5 7600X", gpu: "RX 7700 XT", vram: 12, load: 45 },
  { id: "NODE-03", cpu: "i5-6400", gpu: "GTX 1660 S", vram: 6, load: 88 },
  { id: "NODE-04", cpu: "Ryzen 3 4350G", gpu: "Integrated", vram: 2, load: 31 },
  { id: "NODE-05", cpu: "i5-4590", gpu: "GTX 970", vram: 4, load: 0 },
  { id: "NODE-06", cpu: "Ryzen 7 3700X", gpu: "RTX 3060", vram: 12, load: 56 },
];

const DEMO_RESPONSES: Record<string, string> = {
  chatgpt:
    "Based on the query, the key considerations are: 1) Context alignment is critical for accurate responses. 2) The user's intent should be parsed at semantic depth. 3) Prior knowledge provides a strong foundation for output generation. Note that edge cases must be handled with fallback logic.",
  mistral:
    "Analyzing this request through a structured lens: The primary objective maps to information retrieval with synthesis. Cross-referencing internal training data suggests multiple valid approaches. Optimal path involves weighing confidence scores across candidate answers before committing to output.",
  grok:
    "Straight up: this is a complex question with multiple angles. What most people miss is the second-order effects. The obvious answer is X, but if you dig deeper you find Y which completely changes the calculus. Real talk — the synthesis matters more than any single data point here.",
  ludus:
    "[LUDUS-AI / UE5 MODE] Parsing request for Unreal Engine context... Blueprint node chain identified. Recommended C++ implementation pattern detected. Cross-referencing NPC behavior trees and NYGHTSHADE_HOLLOW architecture specs. Output optimized for game dev pipeline integration.",
  openclaw:
    "[OPENCLAW / LOCAL MODE] Running on Ollama endpoint localhost:11434. Model: qwen2.5-coder:7b loaded. Processing with local inference — zero cloud latency. Response derived from on-device compute. GPU memory allocated: 6.2GB / 8GB. Tokens/sec: 34.2",
};

function LoadingDots({ color }: { color: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
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

function GpuBar({ load, color }: { load: number; color: string }) {
  return (
    <div style={{ width: "100%", height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
      <div
        style={{
          width: `${load}%`,
          height: "100%",
          background: load > 80 ? "#EF4444" : load > 50 ? "#F59E0B" : color,
          transition: "width 1s ease",
          boxShadow: `0 0 6px ${load > 80 ? "#EF4444" : color}`,
        }}
      />
    </div>
  );
}

const MemoGpuBar = React.memo(GpuBar);

export default function OpenLee(): JSX.Element {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [states, setStates] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [synthesis, setSynthesis] = useState<string>("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"oracle" | "buddy" | "log" | "presets">("oracle");
  const [customPresets, setCustomPresets] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || "[]"); } catch { return []; }
  });
  const [nodeLoads, setNodeLoads] = useState<number[]>(GPU_NODES.map(n => n.load));
  const [totalRuns, setTotalRuns] = useState(0);
  const [queryLog, setQueryLog] = useState<{ q: string; ts: string }[]>([]);
  const synthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setNodeLoads(prev => prev.map((l, i) => (GPU_NODES[i].load === 0 ? 0 : Math.max(10, Math.min(95, l + (Math.random() - 0.5) * 10)))));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const setModelState = useCallback((id: string, state: "idle" | "loading" | "done" | "error") =>
    setStates(prev => ({ ...prev, [id]: state })),
  []);

  const setModelResponse = useCallback((id: string, text: string) => setResponses(prev => ({ ...prev, [id]: text })), []);

  const exportSession = useCallback(() => {
    if (!prompt && Object.keys(responses).length === 0) return;
    const ts = new Date().toLocaleString();
    let md = `# OPEN-LEE Session Export\n_${ts}_\n\n`;
    if (prompt) md += `## Query\n${prompt}\n\n`;
    if (Object.keys(responses).length > 0) {
      md += `## Node Responses\n\n`;
      for (const [id, text] of Object.entries(responses)) {
        if (text) md += `### ${id.toUpperCase()}\n${text}\n\n`;
      }
    }
    if (synthesis) md += `## OPEN-LEE Synthesis\n${synthesis}\n\n`;
    if (queryLog.length > 0) {
      md += `## Query History\n`;
      queryLog.forEach((q, i) => { md += `${i + 1}. [${q.ts}] ${q.q}\n`; });
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `openlee-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  }, [prompt, responses, synthesis, queryLog]);

  const runQuery = useCallback(async () => {
    if (!prompt.trim() || running) return;
    const q = prompt.trim();
    setRunning(true);
    setSynthesis("");
    setResponses({});
    setStates({});
    setQueryLog(prev => [{ q, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);

    const initStates: Record<string, string> = {};
    MODELS.forEach(m => { initStates[m.id] = "loading"; });
    setStates(initStates as any);

    const collected: Record<string, string> = {};

    // Call server-side Claude proxy
    const claudePromise = callClaude(q).then(text => {
      collected["claude"] = text;
      setModelState("claude", "done");
      setModelResponse("claude", text);
    }).catch(err => {
      const msg = `ERROR: ${String(err.message ?? err)}`;
      collected["claude"] = msg;
      setModelState("claude", "error");
      setModelResponse("claude", msg);
    });

    const demoPromises = ["chatgpt", "mistral", "grok", "ludus", "openclaw"].map((id, i) =>
      new Promise<void>(resolve => setTimeout(() => {
        const text = DEMO_RESPONSES[id] + `\n\n[Responding to: "${q.slice(0,60)}..."]`;
        collected[id] = text;
        setModelState(id, "done");
        setModelResponse(id, text);
        resolve();
      }, 1200 + i * 600 + Math.random() * 800))
    );

    await Promise.all([claudePromise, ...demoPromises]);

    // Synthesize via server-side proxy
    setSynthesizing(true);
    await new Promise(r => setTimeout(r, 800));

    try {
      const synthPrompt = `You are OPEN-LEE's synthesis engine. Multiple AI models answered this query: "${q}"\n\nHere are their responses:\n\n${Object.entries(collected).map(([k,v]) => `[${k.toUpperCase()}]: ${v}`).join("\n\n")}\n\nYour job: Identify what each model got RIGHT that others missed. Combine all unique insights into one DEFINITIVE unified answer. Format it clearly. Start with "OPEN-LEE SYNTHESIS:" and be comprehensive.`;
      const synth = await callClaude(synthPrompt);
      setSynthesis(synth);
    } catch (err) {
      setSynthesis("Synthesis engine offline. Showing raw responses above.");
    }

    setSynthesizing(false);
    setRunning(false);
    setTotalRuns(n => n + 1);
    setTimeout(() => synthRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [prompt, running, setModelResponse, setModelState]);

  const savePreset = useCallback(() => {
    const text = prompt.trim();
    if (!text) return;
    setCustomPresets(prev => {
      if (prev.includes(text)) return prev;
      const next = [text, ...prev].slice(0, 20);
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(next));
      return next;
    });
  }, [prompt]);

  const deleteCustomPreset = useCallback((text: string) => {
    setCustomPresets(prev => {
      const next = prev.filter(p => p !== text);
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const doneCt = useMemo(() => Object.values(states).filter(s => s === "done").length, [states]);
  const progress = MODELS.length > 0 ? (doneCt / MODELS.length) * 100 : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      color: "#e0e0e0",
      overflowX: "hidden",
    }}>
      <style>{`\n        @keyframes blink { 0%,100%{opacity:.2} 50%{opacity:1} }\n        @keyframes scanline {\n          0% { transform: translateY(-100%) }\n          100% { transform: translateY(100vh) }\n        }\n        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }\n        @keyframes glow {\n          0%,100% { box-shadow: 0 0 5px currentColor }\n          50% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor }\n        }\n        @keyframes fadeSlideIn {\n          from { opacity:0; transform:translateY(10px) }\n          to { opacity:1; transform:translateY(0) }\n        }\n        ::-webkit-scrollbar { width: 6px }\n        ::-webkit-scrollbar-track { background: #0a0a14 }\n        ::-webkit-scrollbar-thumb { background: #FF6B35; border-radius: 3px }\n        textarea:focus { outline: none }\n        button:hover { opacity: 0.85 }\n        .tab-active { border-bottom: 2px solid #FF6B35 !important; color: #FF6B35 !important }\n        .node-card:hover { background: #0f0f1a !important; transform: translateY(-1px) }\n      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a1a2e",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(90deg, #050508 0%, #0a0a14 100%)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "2px solid #FF6B35",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#FF6B35",
            animation: running ? "glow 1.5s infinite" : "none",
            boxShadow: "0 0 12px #FF6B3566",
          }}>⬡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: "#FF6B35" }}>
              OPEN-LEE
            </div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>
              MULTI-NEURAL AGGREGATION SYSTEM v1.0
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>TOTAL RUNS</div>
            <div style={{ fontSize: 18, color: "#FF6B35", fontWeight: 700 }}>{totalRuns}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>NODES ONLINE</div>
            <div style={{ fontSize: 18, color: "#10B981", fontWeight: 700 }}>
              {GPU_NODES.filter((_,i) => nodeLoads[i] > 0).length}/{GPU_NODES.length}
            </div>
          </div>
          <button onClick={exportSession} style={{
            padding: "4px 12px",
            border: "1px solid #555",
            borderRadius: 2,
            fontSize: 10,
            color: "#888",
            letterSpacing: 2,
            background: "none",
            cursor: "pointer",
          }}>⬇ EXPORT</button>
          <div style={{
            padding: "4px 12px",
            border: "1px solid #10B981",
            borderRadius: 2,
            fontSize: 10,
            color: "#10B981",
            letterSpacing: 2,
            animation: "pulse 2s infinite",
          }}>● ONLINE</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #1a1a2e",
        padding: "0 24px",
        background: "#050508",
        gap: 0,
      }}>
        {[
          { id: "oracle", label: "◈  ORACLE ENGINE" },
          { id: "buddy", label: "⬡  BUDDY SYSTEM" },
          { id: "log", label: "≡  QUERY LOG" },
          { id: "presets", label: "⚡  PRESETS" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={activeTab === t.id ? "tab-active" : ""}
            style={{
              background: "none", border: "none", borderBottom: "2px solid transparent",
              color: activeTab === t.id ? "#FF6B35" : "#555",
              padding: "12px 20px", cursor: "pointer",
              fontSize: 11, letterSpacing: 2,
              transition: "color 0.2s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* === ORACLE ENGINE TAB === */}
        {activeTab === "oracle" && (
          <>
            {/* Prompt Area */}
            <div style={{
              border: "1px solid #1a1a2e",
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 24,
              background: "#08080f",
            }}>
              <div style={{
                padding: "8px 16px",
                background: "#0a0a14",
                borderBottom: "1px solid #1a1a2e",
                fontSize: 9, letterSpacing: 3, color: "#555",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>PROMPT INPUT — ALL NODES RECEIVE SIMULTANEOUSLY</span>
                <span style={{ color: "#FF6B35" }}>{MODELS.length} MODELS ACTIVE</span>
              </div>
              <div style={{ display: "flex" }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runQuery();
                  }}
                  placeholder="Enter your query... all 6 AI nodes will process it simultaneously and OPEN-LEE will synthesize the best combined answer."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    color: "#e0e0e0",
                    padding: "16px",
                    fontSize: 13,
                    resize: "none",
                    height: 80,
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, borderLeft: "1px solid #1a1a2e" }}>
                  <button onClick={() => runQuery()} disabled={running || !prompt.trim()}
                    style={{
                      background: running ? "#1a1a2e" : "#FF6B35",
                      color: running ? "#555" : "#050508",
                      border: "none", borderRadius: 2,
                      padding: "10px 20px",
                      cursor: running ? "not-allowed" : "pointer",
                      fontSize: 11, fontWeight: 700, letterSpacing: 2,
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}>
                    {running ? "PROCESSING..." : "▶ EXECUTE"}
                  </button>
                  <button onClick={savePreset} disabled={!prompt.trim()}
                    title="Save current prompt as a custom preset"
                    style={{
                      background: "transparent",
                      color: prompt.trim() ? "#FF6B35" : "#333",
                      border: `1px solid ${prompt.trim() ? "#FF6B3566" : "#1a1a2e"}`,
                      borderRadius: 2,
                      padding: "6px 12px",
                      cursor: prompt.trim() ? "pointer" : "not-allowed",
                      fontSize: 10, fontWeight: 700, letterSpacing: 1,
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}>
                    + SAVE PRESET
                  </button>
                  <div style={{ fontSize: 9, color: "#333", textAlign: "center" }}>CTRL+ENTER</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {running && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>NODE COMPLETION</span>
                  <span style={{ fontSize: 9, color: "#FF6B35" }}>{doneCt}/{MODELS.length}</span>
                </div>
                <div style={{ height: 2, background: "#1a1a2e", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progress}%`,
                    background: "linear-gradient(90deg, #FF6B35, #F59E0B)",
                    transition: "width 0.5s ease",
                    boxShadow: "0 0 8px #FF6B35",
                  }} />
                </div>
              </div>
            )}

            {/* Model Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}>
              {MODELS.map(m => {
                const s = (states[m.id] as any) || "idle";
                const r = responses[m.id];
                return (
                  <div key={m.id} className="node-card" style={{
                    border: `1px solid ${s === "done" ? m.color + "44" : s === "loading" ? m.color + "33" : "#1a1a2e"}`,
                    borderRadius: 4,
                    background: "#08080f",
                    overflow: "hidden",
                    transition: "all 0.3s",
                    animation: s === "done" ? "fadeSlideIn 0.4s ease" : "none",
                  }}>
                    <div style={{
                      padding: "8px 12px",
                      background: s === "loading" ? `${m.color}11` : s === "done" ? `${m.color}09` : "#0a0a14",
                      borderBottom: `1px solid ${s !== "idle" ? m.color + "33" : "#1a1a2e"}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "background 0.3s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: s === "idle" ? "#333" : m.dot,
                          boxShadow: s !== "idle" ? `0 0 6px ${m.dot}` : "none",
                          animation: s === "loading" ? "pulse 0.8s infinite" : "none",
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: s !== "idle" ? m.color : "#444" }}>
                          {m.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 9, letterSpacing: 1,
                        color: s === "done" ? "#10B981" : s === "loading" ? m.color : s === "error" ? "#EF4444" : "#333",
                      }}>
                        {s === "idle" ? "STANDBY" : s === "loading" ? "THINKING" : s === "error" ? "ERROR" : "COMPLETE"}
                      </span>
                    </div>
                    <div style={{ padding: 12, minHeight: 80 }}>
                      {s === "idle" && (
                        <div style={{ color: "#2a2a3a", fontSize: 11, fontStyle: "italic" }}>
                          Awaiting query...
                        </div>
                      )}
                      {s === "loading" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <MemoLoadingDots color={m.color} />
                          <span style={{ fontSize: 10, color: m.color }}>Processing...</span>
                        </div>
                      )}
                      {(s === "done" || s === "error") && r && (
                        <div style={{
                          fontSize: 11, lineHeight: 1.7, color: s === "error" ? "#EF4444" : "#b0b0c0",
                          maxHeight: 160, overflowY: "auto",
                        }}>
                          {r}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Synthesis Panel */}
            <div ref={synthRef} style={{
              border: `1px solid ${synthesis ? "#FF6B3566" : "#1a1a2e"}`,
              borderRadius: 4,
              background: "#08080f",
              overflow: "hidden",
              transition: "border-color 0.5s",
            }}>
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
                    fontSize: 12, lineHeight: 1.8, color: "#d0d0e0",
                    whiteSpace: "pre-wrap",
                    animation: "fadeSlideIn 0.5s ease",
                  }}>
                    {synthesis}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* === BUDDY SYSTEM TAB === */}
        {activeTab === "buddy" && (
          <>
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, letterSpacing: 3, color: "#06B6D4", fontWeight: 700 }}>
                  ⬡ THE BUDDY SYSTEM
                </div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginTop: 2 }}>
                  DISTRIBUTED GPU SHARING NETWORK — OZARK, MO CLUSTER
                </div>
              </div>
              <div style={{
                padding: "6px 14px",
                border: "1px solid #06B6D4",
                borderRadius: 2, fontSize: 10, color: "#06B6D4", letterSpacing: 2,
              }}>
                {GPU_NODES.filter((_,i) => nodeLoads[i] > 0).length} / {GPU_NODES.length} NODES ACTIVE
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12, marginBottom: 24 }}>
              {GPU_NODES.map((node, i) => {
                const load = Math.round(nodeLoads[i]);
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
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: online ? "#06B6D4" : "#444" }}>
                          {node.id}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: online ? "#10B981" : "#333", letterSpacing: 1 }}>
                        {online ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 1, marginBottom: 2 }}>CPU</div>
                          <div style={{ fontSize: 10, color: "#b0b0c0" }}>{node.cpu}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 1, marginBottom: 2 }}>GPU</div>
                          <div style={{ fontSize: 10, color: "#b0b0c0" }}>{node.gpu}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 1, marginBottom: 2 }}>VRAM</div>
                          <div style={{ fontSize: 10, color: "#b0b0c0" }}>{node.vram} GB</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 1, marginBottom: 2 }}>GPU UTIL</div>
                          <div style={{ fontSize: 10, color: load > 80 ? "#EF4444" : load > 50 ? "#F59E0B" : "#10B981", fontWeight: 700 }}>
                            {online ? `${load}%` : "---"}
                          </div>
                        </div>
                      </div>
                      <MemoGpuBar load={online ? load : 0} color="#06B6D4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cluster Stats */}
            <div style={{
              border: "1px solid #1a1a2e", borderRadius: 4, background: "#08080f",
              padding: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
            }}>
              {([
                { label: "TOTAL VRAM", value: `${GPU_NODES.reduce((a,n) => a+n.vram,0)} GB` },
                { label: "AVG GPU LOAD", value: `${Math.round(nodeLoads.filter((_,i) => GPU_NODES[i].load > 0).reduce((a,b) => a+b, 0) / nodeLoads.filter((_,i) => GPU_NODES[i].load > 0).length)}%` },
                { label: "CLUSTER ID", value: "OZARK-01" },
                { label: "PROTOCOL", value: "BUDDY v1" },
              ] as const).map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, color: "#06B6D4", fontWeight: 700 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* === PRESETS TAB === */}
        {activeTab === "presets" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, letterSpacing: 3, color: "#FF6B35", fontWeight: 700 }}>
                  ⚡ PROMPT TEMPLATES
                </div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginTop: 2 }}>
                  CLICK A PRESET TO LOAD IT INTO THE PROMPT — THEN HIT EXECUTE
                </div>
              </div>
              <div style={{
                padding: "6px 14px",
                border: "1px solid #FF6B3566",
                borderRadius: 2, fontSize: 10, color: "#FF6B35", letterSpacing: 2,
              }}>
                {PRESET_CATEGORIES.reduce((a, c) => a + c.templates.length, 0) + customPresets.length} TEMPLATES
              </div>
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 9, letterSpacing: 3, color: "#FF6B35",
                  marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#FF6B35", display: "inline-block",
                    boxShadow: "0 0 6px #FF6B35",
                  }} />
                  MY SAVED PRESETS
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {customPresets.map((text, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center",
                      border: "1px solid #FF6B3566",
                      borderRadius: 3, background: "#FF6B3511",
                      overflow: "hidden",
                    }}>
                      <button
                        onClick={() => { setPrompt(text); setActiveTab("oracle"); }}
                        style={{
                          background: "transparent", border: "none",
                          color: "#FF6B35", padding: "7px 12px",
                          cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                          textAlign: "left", maxWidth: 340, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                        {text}
                      </button>
                      <button
                        onClick={() => deleteCustomPreset(text)}
                        title="Remove preset"
                        style={{
                          background: "transparent", border: "none", borderLeft: "1px solid #FF6B3533",
                          color: "#555", padding: "7px 8px",
                          cursor: "pointer", fontSize: 10, fontFamily: "inherit",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Built-in categories */}
            {PRESET_CATEGORIES.map(cat => (
              <div key={cat.label} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 9, letterSpacing: 3, color: cat.color,
                  marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: cat.color, display: "inline-block",
                    boxShadow: `0 0 6px ${cat.color}`,
                  }} />
                  {cat.label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {cat.templates.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => { setPrompt(text); setActiveTab("oracle"); }}
                      style={{
                        background: "#08080f",
                        border: `1px solid ${cat.color}44`,
                        borderRadius: 3,
                        color: "#b0b0c0",
                        padding: "7px 14px",
                        cursor: "pointer",
                        fontSize: 11, fontFamily: "inherit",
                        transition: "all 0.15s",
                        letterSpacing: 0.5,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${cat.color}18`;
                        e.currentTarget.style.color = cat.color;
                        e.currentTarget.style.borderColor = cat.color;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#08080f";
                        e.currentTarget.style.color = "#b0b0c0";
                        e.currentTarget.style.borderColor = `${cat.color}44`;
                      }}>
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === QUERY LOG TAB === */}
        {activeTab === "log" && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 9, color: "#555", letterSpacing: 2 }}>
              RECENT QUERIES — LAST {queryLog.length} RUNS
            </div>
            {queryLog.length === 0 && (
              <div style={{ color: "#2a2a3a", fontSize: 12, fontStyle: "italic" }}>
                No queries yet. Run your first query in the Oracle Engine tab.
              </div>
            )}
            {queryLog.map((q, i) => (
              <div key={i} style={{
                border: "1px solid #1a1a2e", borderRadius: 2,
                padding: "10px 14px", marginBottom: 8,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#08080f",
              }}>
                <div style={{ fontSize: 12, color: "#b0b0c0" }}>
                  <span style={{ color: "#FF6B35", marginRight: 8 }}>▶</span>
                  {q.q}
                </div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 1, flexShrink: 0, marginLeft: 16 }}>
                  {q.ts}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
