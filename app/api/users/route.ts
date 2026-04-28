import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readUsers, writeUsers } from "@/lib/storage";
import type { Role, User } from "@/lib/types";

async function ensureAdmin() {
  const me = await getCurrentUser();
  if (!me) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  if (me.role !== "admin")
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  return { me };
}

export async function GET() {
  const { error } = await ensureAdmin();
  if (error) return error;
  const users = await readUsers();
  return NextResponse.json({
    users: users.map((u) => ({
      username: u.username,
      role: u.role,
      tokens: u.tokens,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const { error } = await ensureAdmin();
  if (error) return error;
  const body = (await req.json()) as {
    username?: string;
    password?: string;
    role?: Role;
  };
  const username = body.username?.trim();
  const password = body.password;
  const role: Role = body.role === "admin" ? "admin" : "user";

  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const users = await readUsers();
  if (users.some((u) => u.username === username)) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
  const newUser: User = {
    username,
    password,
    role,
    tokens: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await writeUsers(users);
  return NextResponse.json({
    user: {
      username: newUser.username,
      role: newUser.role,
      tokens: newUser.tokens,
      createdAt: newUser.createdAt,
    },
  });
}

export async function DELETE(req: Request) {
  const { error, me } = await ensureAdmin();
  if (error) return error;
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }
  if (username === me!.username) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 },
    );
  }
  const users = await readUsers();
  const next = users.filter((u) => u.username !== username);
  if (next.length === users.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writeUsers(next);
  return NextResponse.json({ ok: true });
}
