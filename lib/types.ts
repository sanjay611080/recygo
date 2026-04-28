export type Role = "admin" | "user";

export interface User {
  username: string;
  password: string;
  role: Role;
  tokens: number;
  createdAt: string;
}

export interface SessionEntry {
  id: string;
  username: string;
  category: string;
  weight: number;
  tokensEarned: number;
  photos: { url: string; angle: string; capturedAt: string }[];
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  username: string;
  items: OrderItem[];
  subtotal: number;
  tokensUsed: number;
  total: number;
  createdAt: string;
}
