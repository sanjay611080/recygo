import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import {
  readOrders,
  readProducts,
  readUsers,
  writeOrders,
  writeUsers,
} from "@/lib/storage";
import type { Order, OrderItem } from "@/lib/types";

interface IncomingItem {
  productId: string;
  quantity: number;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await req.json()) as {
    items?: IncomingItem[];
    tokensUsed?: number;
  };
  const items = body.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const products = await readProducts();
  const orderItems: OrderItem[] = [];
  let subtotal = 0;
  for (const it of items) {
    const product = products.find((p) => p.id === it.productId);
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 0));
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product ${it.productId}` },
        { status: 400 },
      );
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
    });
    subtotal += product.price * qty;
  }

  const requested = Math.max(0, Math.floor(Number(body.tokensUsed) || 0));
  const tokensUsed = Math.min(requested, user.tokens, subtotal);
  const total = subtotal - tokensUsed;

  const order: Order = {
    id: randomUUID(),
    username: user.username,
    items: orderItems,
    subtotal,
    tokensUsed,
    total,
    createdAt: new Date().toISOString(),
  };

  const orders = await readOrders();
  orders.push(order);
  await writeOrders(orders);

  const users = await readUsers();
  const idx = users.findIndex((u) => u.username === user.username);
  if (idx !== -1) {
    users[idx] = { ...users[idx], tokens: users[idx].tokens - tokensUsed };
    await writeUsers(users);
  }

  return NextResponse.json({
    order,
    tokens: users[idx]?.tokens ?? user.tokens - tokensUsed,
  });
}
