import { cookies } from "next/headers";
import { readUsers } from "./storage";
import type { User } from "./types";

const COOKIE_NAME = "recygo_session";

export async function setSession(username: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const username = store.get(COOKIE_NAME)?.value;
  if (!username) return null;
  const users = await readUsers();
  return users.find((u) => u.username === username) ?? null;
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("FORBIDDEN");
  return u;
}
