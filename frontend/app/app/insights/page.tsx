"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import TopNav from "@/components/TopNav";

type Point = { date: string; violations: number };

const RANGES = [7, 30, 90];

function TrendChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720, height = 220, padding = 28;
  const max = Math.max(1, ...data.map(d => d.violations));
  const barGap = 2;
  const barW = Math.max(2, (width - padding * 2) / data.length - barGap);
  const scaleY = (v: number) => (height - padding * 2) * (v / max);

  // Sparse x-axis labels: first, middle, last, to avoid a wall of overlapping text.
  const labelIdx = new Set([0, Math.floor(data.length / 2), data.length - 1]);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}
           role="img" aria-label={`Confirmed violations over the last ${data.length} days`}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding}
              stroke="var(--border)" strokeWidth={1} />
        {data.map((d, i) => {
          const x = padding + i * (barW + barGap);
          const h = scaleY(d.violations);
          const isHover = hover === i;
          return (
            <g key={d.date}>
              <rect x={x} y={height - padding - h} width={barW} height={Math.max(h, d.violations > 0 ? 2 : 0)}
                    rx={Math.min(2, barW / 2)} fill={isHover ? "var(--rust-dark)" : "var(--rust)"}
                    opacity={d.violations === 0 ? 0.25 : 1} />
              <rect x={x} y={padding} width={barW} height={height - padding * 2}
                    fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              {labelIdx.has(i) && (
                <text x={x + barW / 2} y={height - padding + 14} fontSize={10} fill="var(--muted)" textAnchor="middle">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="notice" style={{
          position: "absolute", top: 0, left: `${(hover / data.length) * 100}%`,
          transform: "translateX(-50%)", padding: "6px 10px", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          <strong>{data[hover].violations}</strong> violation{data[hover].violations === 1 ? "" : "s"} · {data[hover].date}
        </div>
      )}
      {/* Screen-reader fallback: the chart above is decorative sugar over this data. */}
      <table className="sr-only">
        <caption>Confirmed violations per day</caption>
        <thead><tr><th>Date</th><th>Violations</th></tr></thead>
        <tbody>
          {data.map(d => <tr key={d.date}><td>{d.date}</td><td>{d.violations}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function InsightsPage() {
  const { token, loading } = useSession();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Point[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!loading && !token) router.push("/login"); }, [loading, token, router]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try { setData(await apiFetch(`/stats/violations?days=${days}`, { token }) as Point[]); }
    catch (e) { setErr(String(e)); }
  }, [token, days]);
  useEffect(() => { refresh(); }, [refresh]);

  const total = data?.reduce((s, d) => s + d.violations, 0) ?? 0;

  if (loading) return <main className="page"><p className="muted">Loading…</p></main>;
  return (
    <>
      <TopNav />
      <main className="page">
        <p className="eyebrow">Workspace</p>
        <h1 style={{ marginBottom: 6 }}>Insights</h1>
        <p className="muted small">Confirmed tribunal violations across all your sessions, over time.</p>

        <div className="toolbar">
          {RANGES.map(r => (
            <button key={r} className={`btn btn-sm ${days === r ? "btn-primary" : "btn-ghost"}`}
                    style={{ width: "auto" }} onClick={() => setDays(r)}>
              {r}d
            </button>
          ))}
        </div>

        <div className="card" style={{ marginTop: 12, padding: 24 }}>
          {err && <p className="error">{err}</p>}
          {!data ? <p className="empty">Loading…</p> : data.every(d => d.violations === 0) ? (
            <p className="empty">No violations in the last {days} days.</p>
          ) : (
            <>
              <p className="label" style={{ marginBottom: 12 }}>{total} total in the last {days} days</p>
              <TrendChart data={data} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
