"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../AppHeader";
import type { Role } from "@/lib/types";

interface AdminUser {
  username: string;
  role: Role;
  tokens: number;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Failed to create user");
        return;
      }
      setUsername("");
      setPassword("");
      setRole("user");
      await load();
    } finally {
      setCreating(false);
    }
  };

  const remove = async (target: string) => {
    if (!confirm(`Delete user "${target}"?`)) return;
    const res = await fetch(`/api/users?username=${encodeURIComponent(target)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to delete");
      return;
    }
    await load();
  };

  if (forbidden) {
    return (
      <>
        <AppHeader title="ADMIN" />
        <div className="page-scroll">
          <div className="dashboard-card">
            <p>You do not have permission to view this page.</p>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => router.push("/scanner")}
            >
              Back to scanner
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="ADMIN · USER MANAGEMENT" />
      <div className="page-scroll admin-grid">
        <form className="dashboard-card admin-form" onSubmit={submit}>
          <h3>Create user</h3>
          <p className="muted-text" style={{ marginBottom: 14 }}>
            New users can immediately log in with these credentials.
          </p>
          <div className="input-group">
            <label>Username</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. priya"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              required
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Plain-text password"
            />
          </div>
          <div className="input-group">
            <label>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="admin-select"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={creating} type="submit">
            {creating ? "Creating..." : "Create user"}
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>All users</h3>
            <span className="muted-text">
              {loading ? "Loading…" : `${users.length} accounts`}
            </span>
          </div>
          {users.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Tokens</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.username}>
                      <td>@{u.username}</td>
                      <td>
                        <span className={`chip role-${u.role}`}>{u.role}</span>
                      </td>
                      <td className="token-cell">{u.tokens}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => remove(u.username)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
