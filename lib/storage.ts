import { supabaseDb } from "./supabase-db";
import type { Order, Product, SessionEntry, User } from "./types";

interface UserRow {
  username: string;
  password: string;
  role: User["role"];
  tokens: number;
  created_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

interface SessionRow {
  id: string;
  username: string;
  category: string;
  weight: number;
  tokens_earned: number;
  photos: SessionEntry["photos"];
  created_at: string;
}

interface OrderRow {
  id: string;
  username: string;
  items: Order["items"];
  subtotal: number;
  tokens_used: number;
  total: number;
  created_at: string;
}

const userFromRow = (r: UserRow): User => ({
  username: r.username,
  password: r.password,
  role: r.role,
  tokens: r.tokens,
  createdAt: r.created_at,
});

const sessionFromRow = (r: SessionRow): SessionEntry => ({
  id: r.id,
  username: r.username,
  category: r.category,
  weight: Number(r.weight),
  tokensEarned: r.tokens_earned,
  photos: r.photos ?? [],
  createdAt: r.created_at,
});

const orderFromRow = (r: OrderRow): Order => ({
  id: r.id,
  username: r.username,
  items: r.items ?? [],
  subtotal: r.subtotal,
  tokensUsed: r.tokens_used,
  total: r.total,
  createdAt: r.created_at,
});

// ─── users ──────────────────────────────────────────────────────────────────

export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabaseDb
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle<UserRow>();
  if (error) throw error;
  return data ? userFromRow(data) : null;
}

export async function getUserByCredentials(
  username: string,
  password: string,
): Promise<User | null> {
  const { data, error } = await supabaseDb
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle<UserRow>();
  if (error) throw error;
  return data ? userFromRow(data) : null;
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabaseDb
    .from("users")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<UserRow[]>();
  if (error) throw error;
  return (data ?? []).map(userFromRow);
}

export async function createUser(input: {
  username: string;
  password: string;
  role: User["role"];
}): Promise<User> {
  const { data, error } = await supabaseDb
    .from("users")
    .insert({
      username: input.username,
      password: input.password,
      role: input.role,
      tokens: 0,
    })
    .select("*")
    .single<UserRow>();
  if (error) throw error;
  return userFromRow(data);
}

export async function deleteUser(username: string): Promise<boolean> {
  const { data, error } = await supabaseDb
    .from("users")
    .delete()
    .eq("username", username)
    .select("username");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function userExists(username: string): Promise<boolean> {
  const { count, error } = await supabaseDb
    .from("users")
    .select("username", { count: "exact", head: true })
    .eq("username", username);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Atomically adjust a user's token balance. Positive delta to credit, negative
 * to debit. Returns the new balance.
 */
export async function incrementUserTokens(
  username: string,
  delta: number,
): Promise<number> {
  const { data, error } = await supabaseDb.rpc("increment_user_tokens", {
    p_username: username,
    p_delta: delta,
  });
  if (error) throw error;
  return Number(data);
}

// ─── products ───────────────────────────────────────────────────────────────

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabaseDb
    .from("products")
    .select("*")
    .order("name", { ascending: true })
    .returns<ProductRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabaseDb
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle<ProductRow>();
  if (error) throw error;
  return data;
}

// ─── sessions ───────────────────────────────────────────────────────────────

export async function listSessions(usernameFilter?: string): Promise<SessionEntry[]> {
  let q = supabaseDb
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (usernameFilter) q = q.eq("username", usernameFilter);
  const { data, error } = await q.returns<SessionRow[]>();
  if (error) throw error;
  return (data ?? []).map(sessionFromRow);
}

export async function createSession(entry: SessionEntry): Promise<SessionEntry> {
  const { data, error } = await supabaseDb
    .from("sessions")
    .insert({
      id: entry.id,
      username: entry.username,
      category: entry.category,
      weight: entry.weight,
      tokens_earned: entry.tokensEarned,
      photos: entry.photos,
      created_at: entry.createdAt,
    })
    .select("*")
    .single<SessionRow>();
  if (error) throw error;
  return sessionFromRow(data);
}

// ─── orders ─────────────────────────────────────────────────────────────────

export async function createOrder(order: Order): Promise<Order> {
  const { data, error } = await supabaseDb
    .from("orders")
    .insert({
      id: order.id,
      username: order.username,
      items: order.items,
      subtotal: order.subtotal,
      tokens_used: order.tokensUsed,
      total: order.total,
      created_at: order.createdAt,
    })
    .select("*")
    .single<OrderRow>();
  if (error) throw error;
  return orderFromRow(data);
}
