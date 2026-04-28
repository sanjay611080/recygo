import { promises as fs } from "fs";
import path from "path";
import type { Order, Product, SessionEntry, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, name), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(name: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, name),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

export const readUsers = () => readJson<User[]>("users.json", []);
export const writeUsers = (users: User[]) => writeJson("users.json", users);

export const readSessions = () => readJson<SessionEntry[]>("sessions.json", []);
export const writeSessions = (sessions: SessionEntry[]) =>
  writeJson("sessions.json", sessions);

export const readOrders = () => readJson<Order[]>("orders.json", []);
export const writeOrders = (orders: Order[]) => writeJson("orders.json", orders);

export const readProducts = () => readJson<Product[]>("products.json", []);
