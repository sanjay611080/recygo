"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import AppHeader from "../AppHeader";
import type { SessionEntry } from "@/lib/types";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setSessions(data.sessions ?? []);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    let weight = 0;
    let tokens = 0;
    for (const s of sessions) {
      weight += s.weight;
      tokens += s.tokensEarned;
    }
    const byCategory = sessions.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + s.weight;
      return acc;
    }, {});
    return { weight, tokens, sessions: sessions.length, byCategory };
  }, [sessions]);

  return (
    <>
      <AppHeader title="DASHBOARD" />
      <div className="page-scroll">
        <div className="dashboard-stats">
          <StatCard label="Total Sessions" value={String(stats.sessions)} />
          <StatCard label="Total Mass (g)" value={stats.weight.toLocaleString()} />
          <StatCard label="Total Tokens" value={stats.tokens.toLocaleString()} />
          <StatCard
            label="Top Category"
            value={topCategory(stats.byCategory) ?? "—"}
          />
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Recycling History</h3>
            <span className="muted-text">
              {loading ? "Loading…" : `${sessions.length} entries`}
            </span>
          </div>

          {!loading && sessions.length === 0 && (
            <div className="empty-state">
              No sessions yet. Capture some waste from the Scanner.
            </div>
          )}

          {sessions.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Weight</th>
                    <th>Tokens</th>
                    <th>Photos</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const isOpen = openId === s.id;
                    return (
                      <Fragment key={s.id}>
                        <tr
                          className="row-clickable"
                          onClick={() => setOpenId(isOpen ? null : s.id)}
                        >
                          <td>{formatDateTime(s.createdAt)}</td>
                          <td>@{s.username}</td>
                          <td>
                            <span className="chip">{s.category}</span>
                          </td>
                          <td>{s.weight} g</td>
                          <td className="token-cell">+{s.tokensEarned}</td>
                          <td>{s.photos.length}</td>
                        </tr>
                        {isOpen && (
                          <tr className="row-photos">
                            <td colSpan={6}>
                              <div className="photo-row">
                                {s.photos.map((p, i) => (
                                  <a
                                    key={i}
                                    href={p.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="photo-thumb"
                                    title={`${p.angle} · ${formatDateTime(p.capturedAt)}`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.url} alt={p.angle} />
                                    <span className="photo-thumb-tag">
                                      {p.angle} · {formatTime(p.capturedAt)}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function topCategory(map: Record<string, number>): string | null {
  const entries = Object.entries(map);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}
