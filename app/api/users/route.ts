import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createUser, deleteUser, listUsers, userExists } from "@/lib/storage";
import type { Role } from "@/lib/types";

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
  const users = await listUsers();
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
  if (await userExists(username)) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
  const newUser = await createUser({ username, password, role });
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
  const removed = await deleteUser(username);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
