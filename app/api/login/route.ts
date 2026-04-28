import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { readUsers } from "@/lib/storage";

export async function POST(req: Request) {
  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  const users = await readUsers();
  const match = users.find(
    (u) => u.username === username && u.password === password,
  );
  if (!match) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await setSession(match.username);
  return NextResponse.json({
    username: match.username,
    role: match.role,
    tokens: match.tokens,
  });
}
