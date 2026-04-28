"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          router.replace(data.user.role === "admin" ? "/admin" : "/scanner");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Invalid credentials");
        return;
      }
      const data = await res.json();
      router.push(data.role === "admin" ? "/admin" : "/scanner");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-screen">
      <div className="auth-card">
        <h2 style={{ color: "var(--accent)", marginBottom: 10 }}>RECYGO♻</h2>
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 25 }}>
          Environmental Terminal Access
        </p>
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Authorizing..." : "Authorize Access"}
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
