"use client";

import { useEffect, useState } from "react";

export default function AppHeader({ title }: { title: string }) {
  const [tokens, setTokens] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      if (!alive || !data.user) return;
      setTokens(data.user.tokens);
      setUsername(data.user.username);
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <header>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="terminal-title">{title}</span>
        {username && <span className="header-user">@{username}</span>}
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="token-label">EARNED TOKENS</div>
        <div className="token-value">{tokens ?? "—"}</div>
      </div>
    </header>
  );
}
