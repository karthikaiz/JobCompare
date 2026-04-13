"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL ?? "http://localhost:8000";

interface Company {
  name: string;
  slug: string;
  industry: string;
  status: string | null;
  last_scraped: string | null;
  reviews: number | null;
  salaries: number | null;
  interviews: number | null;
}

interface ScrapeStatus {
  running: boolean;
  phase?: "starting" | "scraping" | "syncing" | "done" | "error" | "scrape_only" | "stopped";
  mode?: string;
  slugs?: string[];
  started_at?: string;
  finished_at?: string;
  companies?: { scraped: number; failed: number; total: number };
}

const PHASE_LABEL: Record<string, string> = {
  starting: "Starting…",
  scraping: "Scraping AmbitionBox…",
  syncing: "Syncing to DB…",
  done: "Complete",
  error: "Error",
  scrape_only: "Scrape complete",
  stopped: "Stopped",
};
const PHASE_COLOR: Record<string, string> = {
  starting: "text-white/40",
  scraping: "text-[#C9876E]",
  syncing: "text-[#6B9B7F]",
  done: "text-[#4A7C59]",
  error: "text-[#B05252]",
  scrape_only: "text-white/50",
  stopped: "text-[#C9876E]",
};

function lineColor(line: string) {
  if (line.includes("=== ") && line.includes(" ===")) return "text-white/60 font-semibold";
  if (/FAILED|ERROR|error/.test(line)) return "text-[#B05252]";
  if (/\bOK\b|DONE|Succeeded|COMPLETE/.test(line)) return "text-[#4A7C59]";
  if (/PIPELINE|SYNC|Syncing/.test(line)) return "text-[#6B9B7F]";
  if (/retry|Retry|RETRY/.test(line)) return "text-[#C9876E]";
  return "text-white/45";
}

type Mode = "all" | "failed" | "custom";

export default function ScraperPage() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState<ScrapeStatus | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);

  // Company list + selection
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFilter, setPickerFilter] = useState("");

  // Params
  const [maxReviews, setMaxReviews] = useState(5);
  const [maxSalaries, setMaxSalaries] = useState(15);
  const [maxInterviewPages, setMaxInterviewPages] = useState(50);
  const [autoSync, setAutoSync] = useState(true);

  const [triggering, setTriggering] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  // ── Data fetching ───────────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${SCRAPER_URL}/registry`);
      if (res.ok) setCompanies(await res.json());
    } catch { /* offline */ }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const [hr, sr] = await Promise.all([
        fetch(`${SCRAPER_URL}/health`),
        fetch(`${SCRAPER_URL}/scrape/status`),
      ]);
      setOnline(hr.ok);
      if (sr.ok) setStatus(await sr.json());
    } catch { setOnline(false); }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${SCRAPER_URL}/scrape/logs?tail=300`);
      if (res.ok) {
        const d = await res.json();
        setLogLines(d.lines ?? []);
      }
    } catch { /* offline */ }
  }, []);

  useEffect(() => { fetchCompanies(); fetchStatus(); fetchLogs(); }, [fetchCompanies, fetchStatus, fetchLogs]);

  useEffect(() => {
    const iv = setInterval(() => {
      fetchStatus();
      if (terminalOpen) fetchLogs();
    }, 2000);
    return () => clearInterval(iv);
  }, [fetchStatus, fetchLogs, terminalOpen]);

  useEffect(() => {
    if (!status?.running) return;
    const iv = setInterval(fetchLogs, 1000);
    return () => clearInterval(iv);
  }, [status?.running, fetchLogs]);

  // Auto-scroll terminal
  useEffect(() => {
    const el = terminalRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [logLines]);

  // ── Selection helpers ──────────────────────────────────────────────────
  const failedSlugs = companies.filter(c => c.status === "failed").map(c => c.slug);
  const allSlugs = companies.map(c => c.slug);

  const selectAll = () => { setSelected(new Set(allSlugs)); setMode("custom"); };
  const selectFailed = () => { setSelected(new Set(failedSlugs)); setMode("custom"); };
  const selectNone = () => { setSelected(new Set()); };

  const toggleCompany = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
    setMode("custom");
  };

  // Switch modes
  const setModeAll = () => { setMode("all"); setSelected(new Set()); };
  const setModeFailed = () => { setMode("failed"); setSelected(new Set()); };

  // ── Filtered picker list ───────────────────────────────────────────────
  const filteredCompanies = companies.filter(c =>
    !pickerFilter ||
    c.name.toLowerCase().includes(pickerFilter.toLowerCase()) ||
    c.industry.toLowerCase().includes(pickerFilter.toLowerCase())
  );

  // ── Trigger scrape ─────────────────────────────────────────────────────
  const triggerScrape = async () => {
    setTriggering(true);
    setMessage(null);
    setLogLines([]);
    setTerminalOpen(true);

    const body = {
      mode,
      slugs: mode === "custom" ? Array.from(selected) : [],
      max_reviews: maxReviews,
      max_salaries: maxSalaries,
      max_interview_pages: maxInterviewPages,
      auto_sync: autoSync,
    };

    try {
      const res = await fetch(`${SCRAPER_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        fetchStatus();
      } else {
        setMessage({ text: data.detail ?? "Failed to start.", type: "error" });
      }
    } catch {
      setMessage({ text: "Cannot reach scraper.", type: "error" });
    } finally {
      setTriggering(false);
    }
  };

  // ── Stop scrape ────────────────────────────────────────────────────────
  const stopScrape = async () => {
    setStopping(true);
    setMessage(null);
    try {
      const res = await fetch(`${SCRAPER_URL}/scrape`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Scrape stopped.", type: "success" });
        fetchStatus();
        fetchLogs();
      } else {
        setMessage({ text: data.detail ?? "Failed to stop.", type: "error" });
      }
    } catch {
      setMessage({ text: "Cannot reach scraper.", type: "error" });
    } finally {
      setStopping(false);
    }
  };

  const isRunning = status?.running;

  // ── Button label ───────────────────────────────────────────────────────
  const runLabel = () => {
    if (isRunning) {
      if (status?.phase === "scraping") return "Scraping…";
      if (status?.phase === "syncing") return "Syncing to DB…";
      return "Running…";
    }
    if (triggering) return "Starting…";
    const suffix = autoSync ? " + Sync to DB" : "";
    if (mode === "custom") return `Scrape ${selected.size} Companies${suffix}`;
    if (mode === "failed") return `Retry Failed${suffix}`;
    return `Scrape All${suffix}`;
  };

  const formatTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  // Status badge for picker
  const statusBadge = (c: Company) => {
    if (c.status === "success") return <span className="text-[10px] text-[#4A7C59] border border-[#4A7C59]/20 px-1.5 py-0.5 rounded-sm">Scraped</span>;
    if (c.status === "failed") return <span className="text-[10px] text-[#B05252] border border-[#B05252]/20 px-1.5 py-0.5 rounded-sm">Failed</span>;
    return <span className="text-[10px] text-white/20 border border-white/10 px-1.5 py-0.5 rounded-sm">Pending</span>;
  };

  return (
    <div className="p-8 max-w-4xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-serif font-bold text-cream">Scraper</h1>
        <p className="text-sm text-white/40 mt-1">
          Runs <code className="font-mono text-white/50">batch.py</code> then{" "}
          <code className="font-mono text-white/50">pipeline.py</code> — scrape → sentiment → DB sync.
        </p>
      </div>

      {/* Status row */}
      <div className="p-4 rounded-sm border border-white/8 bg-white/2">
        <div className="flex items-start gap-8 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">API Server</p>
            {online === null && <p className="text-sm text-white/30">Checking…</p>}
            {online === true && <p className="flex items-center gap-1.5 text-sm text-[#4A7C59]"><span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />Online</p>}
            {online === false && (
              <div>
                <p className="flex items-center gap-1.5 text-sm text-[#B05252]"><span className="w-1.5 h-1.5 rounded-full bg-[#B05252]" />Offline</p>
                <code className="text-[11px] text-white/25 font-mono mt-1 block">cd scraper && uvicorn main:app --reload</code>
              </div>
            )}
          </div>
          {status && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Phase</p>
              <p className={`text-sm ${status.phase ? PHASE_COLOR[status.phase] : "text-white/30"}`}>
                {status.phase ? PHASE_LABEL[status.phase] : "Idle"}
              </p>
            </div>
          )}
          {status?.companies && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Progress</p>
              <p className="text-sm text-white/50">
                {status.companies.scraped} scraped ·{" "}
                <span className={status.companies.failed > 0 ? "text-[#C9876E]" : ""}>{status.companies.failed} failed</span>
                {" "}· {status.companies.total} total
              </p>
            </div>
          )}
          {status?.started_at && (
            <div className="ml-auto text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Started</p>
              <p className="text-xs text-white/40">{formatTime(status.started_at)}</p>
              {status.finished_at && <p className="text-[11px] text-white/20 mt-0.5">Done {formatTime(status.finished_at)}</p>}
            </div>
          )}
        </div>
        {(isRunning || status?.phase === "done" || status?.phase === "stopped") && (
          <div className="mt-4 flex gap-1.5">
            {(["scraping", "syncing"] as const).map(ph => {
              const isActive = status?.phase === ph;
              const isStopped = status?.phase === "stopped";
              const isDone = (ph === "scraping" && (status?.phase === "syncing" || status?.phase === "done")) || (ph === "syncing" && status?.phase === "done");
              return (
                <div key={ph} className="flex-1">
                  <div className={`h-0.5 rounded-full transition-all duration-500 ${
                    isDone ? "bg-[#4A7C59]" :
                    isActive && isStopped ? "bg-[#B05252]" :
                    isActive ? "bg-terracotta animate-pulse" :
                    "bg-white/10"
                  }`} />
                  <p className={`text-[9px] mt-1 uppercase tracking-widest ${
                    isDone ? "text-[#4A7C59]" :
                    isActive && isStopped ? "text-[#B05252]" :
                    isActive ? "text-terracotta" :
                    "text-white/15"
                  }`}>
                    {ph === "scraping" ? "1. Scrape" : "2. DB Sync"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Terminal */}
      <div className="rounded-sm border border-white/8 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-white/3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B05252]/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9876E]/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A7C59]/60" />
            </div>
            <span className="text-[11px] text-white/25 font-mono ml-1">scrape_run.log</span>
            {isRunning && <span className="flex items-center gap-1 text-[10px] text-[#4A7C59] ml-2"><span className="w-1 h-1 rounded-full bg-[#4A7C59] animate-pulse" />live</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/20 font-mono">{logLines.length} lines</span>
            <button onClick={fetchLogs} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">refresh</button>
            <button onClick={() => setTerminalOpen(!terminalOpen)} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
              {terminalOpen ? "collapse" : "expand"}
            </button>
          </div>
        </div>
        <div
          ref={terminalRef}
          onScroll={e => { const el = e.currentTarget; atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
          className={`bg-[#0a0a08] font-mono text-xs overflow-y-auto transition-all duration-300 ${terminalOpen ? "h-80" : "h-20"}`}
        >
          {logLines.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/15 text-xs">{isRunning ? "Waiting for output…" : "No logs yet — run a scrape to see output here."}</p>
            </div>
          ) : (
            <div className="p-4 space-y-0.5">
              {logLines.map((line, i) => (
                <div key={i} className={`leading-5 whitespace-pre-wrap break-all ${lineColor(line)}`}>{line || "\u00A0"}</div>
              ))}
              {isRunning && <div className="mt-1"><span className="text-[#4A7C59] animate-pulse">▋</span></div>}
            </div>
          )}
        </div>
      </div>

      {/* ── Company selector ── */}
      <div className="rounded-sm border border-white/8 bg-white/2 overflow-hidden">
        {/* Mode tabs */}
        <div className="flex items-center border-b border-white/8 px-4 py-3 gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-white/30 mr-2">Scope</span>
          <button onClick={setModeAll}
            className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${mode === "all" ? "bg-terracotta/15 border-terracotta/30 text-terracotta" : "border-white/10 text-white/30 hover:text-white/50"}`}>
            All companies ({companies.length})
          </button>
          <button onClick={setModeFailed}
            className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${mode === "failed" ? "bg-terracotta/15 border-terracotta/30 text-terracotta" : "border-white/10 text-white/30 hover:text-white/50"}`}>
            Failed only ({failedSlugs.length})
          </button>
          <button onClick={() => { setMode("custom"); setPickerOpen(true); }}
            className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${mode === "custom" ? "bg-terracotta/15 border-terracotta/30 text-terracotta" : "border-white/10 text-white/30 hover:text-white/50"}`}>
            Custom{mode === "custom" && selected.size > 0 ? ` (${selected.size} selected)` : ""}
          </button>
          {mode === "custom" && (
            <button onClick={() => setPickerOpen(!pickerOpen)} className="ml-auto text-[11px] text-white/30 hover:text-white/60 transition-colors">
              {pickerOpen ? "Hide picker ↑" : "Show picker ↓"}
            </button>
          )}
        </div>

        {/* Company picker — shown when mode=custom and pickerOpen */}
        {mode === "custom" && pickerOpen && (
          <div>
            {/* Picker toolbar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 flex-wrap">
              <input
                type="text"
                placeholder="Filter by name or industry…"
                value={pickerFilter}
                onChange={e => setPickerFilter(e.target.value)}
                className="flex-1 min-w-[180px] bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-xs text-cream placeholder:text-white/20 focus:outline-none focus:border-white/25 font-sans"
              />
              <div className="flex gap-1.5">
                <button onClick={selectAll} className="text-[11px] px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-white/70 rounded-sm transition-colors">
                  Select all
                </button>
                <button onClick={selectFailed} className="text-[11px] px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-[#C9876E] rounded-sm transition-colors">
                  Failed only
                </button>
                <button onClick={selectNone} className="text-[11px] px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-white/70 rounded-sm transition-colors">
                  Clear
                </button>
              </div>
              <span className="text-[11px] text-white/25 ml-auto">{selected.size} selected</span>
            </div>

            {/* Company list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
              {filteredCompanies.length === 0 ? (
                <p className="text-xs text-white/25 text-center py-8">No companies match.</p>
              ) : (
                filteredCompanies.map(c => (
                  <label key={c.slug} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(c.slug)}
                      onChange={() => toggleCompany(c.slug)}
                      className="accent-terracotta w-3.5 h-3.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-cream">{c.name}</span>
                        <span className="text-[10px] text-white/25 border border-white/10 px-1.5 py-0.5 rounded-sm">{c.industry}</span>
                        {statusBadge(c)}
                      </div>
                      <p className="text-[11px] text-white/20 font-mono mt-0.5">{c.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-white/20">
                      {c.reviews != null && <span>{c.reviews} rev</span>}
                      {c.salaries != null && <span>{c.salaries} sal</span>}
                      {c.interviews != null && <span>{c.interviews} int</span>}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Params + run */}
      <div className="p-5 rounded-sm border border-white/8 bg-white/2 space-y-5">
        <p className="text-[10px] uppercase tracking-widest text-white/30">Scrape parameters</p>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-white/50">Max review pages per company</label>
            <span className="text-xs font-mono text-cream">{maxReviews} <span className="text-white/25">≈ {maxReviews * 20} reviews</span></span>
          </div>
          <input type="range" min={1} max={20} value={maxReviews} onChange={e => setMaxReviews(Number(e.target.value))} className="w-full accent-terracotta" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/20">1 page</span>
            <span className="text-[10px] text-white/20">20 pages</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-white/50">Max salary roles per company</label>
            <span className="text-xs font-mono text-cream">{maxSalaries} roles</span>
          </div>
          <input type="range" min={1} max={50} value={maxSalaries} onChange={e => setMaxSalaries(Number(e.target.value))} className="w-full accent-terracotta" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/20">1 role</span>
            <span className="text-[10px] text-white/20">50 roles</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-white/50">Max interview pages per company</label>
            <span className="text-xs font-mono text-cream">
              {maxInterviewPages} pages{" "}
              <span className="text-white/25">≈ up to {maxInterviewPages * 10} interviews</span>
            </span>
          </div>
          <input type="range" min={1} max={100} value={maxInterviewPages} onChange={e => setMaxInterviewPages(Number(e.target.value))} className="w-full accent-terracotta" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/20">1 page (10)</span>
            <span className="text-[10px] text-white/20">100 pages (1,000)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-white/40 cursor-pointer" htmlFor="autosync">Auto-sync to DB after scrape</label>
          <button id="autosync" onClick={() => setAutoSync(!autoSync)}
            className={`w-9 h-5 rounded-full relative transition-colors ${autoSync ? "bg-terracotta/70" : "bg-white/10"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoSync ? "left-4" : "left-0.5"}`} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerScrape}
            disabled={triggering || !online || !!isRunning || (mode === "custom" && selected.size === 0)}
            className="flex-1 py-2.5 text-sm bg-terracotta/90 hover:bg-terracotta text-cream rounded-sm disabled:opacity-40 transition-colors"
          >
            {runLabel()}
          </button>
          {isRunning && (
            <button
              onClick={stopScrape}
              disabled={stopping}
              className="px-4 py-2.5 text-sm bg-[#B05252]/80 hover:bg-[#B05252] text-cream rounded-sm disabled:opacity-40 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {stopping ? (
                <span className="w-3.5 h-3.5 border border-cream/40 border-t-cream rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              )}
              Stop
            </button>
          )}
        </div>

        {mode === "custom" && selected.size === 0 && (
          <p className="text-[11px] text-white/25 text-center -mt-3">Select at least one company above.</p>
        )}
      </div>

      {message && (
        <div className={`text-xs px-4 py-3 rounded-sm border ${
          message.type === "success" ? "bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20" : "bg-[#B05252]/10 text-[#B05252] border-[#B05252]/20"
        }`}>{message.text}</div>
      )}

      {/* Shell reference */}
      <div className="p-5 rounded-sm border border-white/8 bg-white/2 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-white/30">Shell reference</p>
        {[
          { label: "Start API server", cmd: "cd scraper && uvicorn main:app --reload" },
          { label: "All companies — max scrape", cmd: "python3 batch.py --all --max-reviews 20 --max-salaries 50 --max-interview-pages 100" },
          { label: "Specific companies", cmd: "python3 batch.py --slugs infosys,tcs,wipro --max-reviews 10 --max-salaries 20 --max-interview-pages 50" },
          { label: "Retry failed", cmd: "python3 batch.py --failed --max-reviews 10 --max-salaries 20 --max-interview-pages 50" },
          { label: "Sync to DB", cmd: "python3 pipeline.py" },
        ].map(item => (
          <div key={item.cmd}>
            <p className="text-[10px] text-white/25 mb-0.5">{item.label}</p>
            <code className="text-xs text-white/40 font-mono bg-black/30 px-2 py-1.5 rounded-sm block break-all">{item.cmd}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
