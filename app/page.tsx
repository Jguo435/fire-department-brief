"use client";
import { FormEvent, useEffect, useState } from "react";
import { BriefDisplay } from "@/components/BriefDisplay";
import { BriefData } from "@/types/brief";
const EXAMPLES = ["ChIJpcN7ecgAyIkRrOcWzZx3Yyc", "ChIJr-yREGP9tEwRr7M-F00PpM8"];

const RESEARCH_STAGES = [
  { after: 0, label: "Identifying the department" },
  { after: 4, label: "Searching public sources" },
  { after: 10, label: "Reviewing fleet, funding, and leadership" },
  { after: 20, label: "Completing targeted follow-up research" },
  { after: 32, label: "Finishing the brief" },
];
export default function Home() {
  const [placeId, setPlaceId] = useState("");
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  const researchStage = [...RESEARCH_STAGES].reverse().find((stage) => elapsed >= stage.after)!;

  async function generate(event: FormEvent) {
    event.preventDefault();
    setElapsed(0);
    setLoading(true);
    setError("");
    setBrief(null);
    setWarnings([]);
    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: placeId.trim() }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Brief generation failed.");
      setBrief(result.data);
      setWarnings(result.warnings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Brief generation failed.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">G</span>
          <span>GARAGE</span>
        </a>
        <span className="product-name">Call Intelligence</span>
        <span className="live">
          <i /> LIVE RESEARCH
        </span>
      </header>
      <section className="workspace">
        <div className="tool-intro">
          <h1>Fire department brief</h1>
          <p>Enter a Google Place ID to generate a sourced brief.</p>
        </div>
        <form className="search-panel" onSubmit={generate}>
          <label htmlFor="placeId">Google Place ID</label>
          <div className="input-row">
            <input
              id="placeId"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="Paste a Place ID…"
              spellCheck={false}
              autoComplete="off"
            />
            <button disabled={loading || !placeId.trim()}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Researching
                </>
              ) : (
                <>
                  Generate brief <span>→</span>
                </>
              )}
            </button>
          </div>
          <div className="examples">
            <span>TRY AN EXAMPLE</span>
            {EXAMPLES.map((id, i) => (
              <button type="button" key={id} onClick={() => setPlaceId(id)}>
                Test department {i + 1}
              </button>
            ))}
          </div>
        </form>
        {loading && (
          <div className="researching" role="status" aria-live="polite">
            <div className="research-progress">
              <span className="spinner research-spinner" />
              <div>
                <strong>{researchStage.label}</strong>
                <p>Live research usually takes 20–40 seconds.</p>
              </div>
              <time>{elapsed}s</time>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-indicator" />
            </div>
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            <strong>Couldn’t generate this brief</strong>
            <span>{error}</span>
          </div>
        )}
        {brief && <BriefDisplay data={brief} warnings={warnings} />}
      </section>
      <footer>
        <span>GARAGE / INTERNAL SALES INTELLIGENCE</span>
        <span>AI-generated research. Open sources to verify before use.</span>
      </footer>
    </main>
  );
}
