"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "../AppHeader";
import type { Product } from "@/lib/types";

interface CartLine {
  product: Product;
  quantity: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [tokens, setTokens] = useState(0);
  const [tokensToUse, setTokensToUse] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshTokens = useCallback(async () => {
    const res = await fetch("/api/me");
    if (!res.ok) return;
    const data = await res.json();
    setTokens(data.user?.tokens ?? 0);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => alive && setProducts(d.products ?? []));
    refreshTokens();
    return () => {
      alive = false;
    };
  }, [refreshTokens]);

  const subtotal = useMemo(
    () =>
      Object.values(cart).reduce(
        (sum, line) => sum + line.product.price * line.quantity,
        0,
      ),
    [cart],
  );

  const maxTokens = Math.min(tokens, subtotal);
  const appliedTokens = Math.min(tokensToUse, maxTokens);
  const total = Math.max(0, subtotal - appliedTokens);

  const addToCart = (product: Product) => {
    setSuccess(null);
    setCart((prev) => {
      const existing = prev[product.id];
      const quantity = existing ? existing.quantity + 1 : 1;
      return { ...prev, [product.id]: { product, quantity } };
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const line = prev[id];
      if (!line) return prev;
      const quantity = line.quantity + delta;
      if (quantity <= 0) {
        const { [id]: _removed, ...rest } = prev;
        void _removed;
        return rest;
      }
      return { ...prev, [id]: { ...line, quantity } };
    });
  };

  const removeLine = (id: string) => {
    setCart((prev) => {
      const { [id]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  };

  const buy = async () => {
    if (Object.keys(cart).length === 0) return;
    setPurchasing(true);
    setSuccess(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Object.values(cart).map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
          })),
          tokensUsed: appliedTokens,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body.error ?? "Order failed");
        return;
      }
      setCart({});
      setTokensToUse(0);
      setSuccess(
        `Order placed! Paid ₹${body.order.total} (used ${body.order.tokensUsed} tokens).`,
      );
      await refreshTokens();
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <>
      <AppHeader title="RECYCLED MARKET" />
      <div className="page-scroll products-layout">
        <div>
          <div className="products-grid">
            {products.map((p) => (
              <div className="product-card" key={p.id}>
                <div className="product-image">{p.image}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-desc">{p.description}</div>
                <div className="product-footer">
                  <span className="product-price">₹{p.price}</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => addToCart(p)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="cart-card">
          <div className="cart-header">
            <h3>Your Cart</h3>
            <span className="muted-text">
              {Object.values(cart).reduce((n, l) => n + l.quantity, 0)} items
            </span>
          </div>

          {Object.keys(cart).length === 0 ? (
            <div className="empty-state small">Cart is empty.</div>
          ) : (
            <div className="cart-lines">
              {Object.values(cart).map((line) => (
                <div className="cart-line" key={line.product.id}>
                  <div className="cart-line-emoji">{line.product.image}</div>
                  <div className="cart-line-body">
                    <div className="cart-line-name">{line.product.name}</div>
                    <div className="cart-line-meta">
                      ₹{line.product.price} ×{" "}
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(line.product.id, -1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{line.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(line.product.id, 1)}
                      >
                        +
                      </button>
                      <button
                        className="cart-remove"
                        onClick={() => removeLine(line.product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-line-total">
                    ₹{line.product.price * line.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cart-summary">
            <div className="cart-row">
              <span>Subtotal</span>
              <strong>₹{subtotal}</strong>
            </div>
            <div className="cart-row">
              <span>Available tokens</span>
              <strong className="token-value-inline">{tokens}</strong>
            </div>
            <div className="token-slider">
              <label>Use tokens (max {maxTokens})</label>
              <input
                type="range"
                min={0}
                max={maxTokens}
                step={1}
                value={Math.min(tokensToUse, maxTokens)}
                onChange={(e) => setTokensToUse(Number(e.target.value))}
                disabled={maxTokens === 0}
              />
              <div className="token-slider-row">
                <input
                  type="number"
                  min={0}
                  max={maxTokens}
                  value={Math.min(tokensToUse, maxTokens)}
                  onChange={(e) => setTokensToUse(Number(e.target.value) || 0)}
                  disabled={maxTokens === 0}
                />
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setTokensToUse(maxTokens)}
                  disabled={maxTokens === 0}
                >
                  Max
                </button>
              </div>
            </div>
            <div className="cart-row">
              <span>Tokens applied</span>
              <strong>−₹{appliedTokens}</strong>
            </div>
            <div className="cart-row cart-total-row">
              <span>You pay</span>
              <strong>₹{total}</strong>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              onClick={buy}
              disabled={purchasing || Object.keys(cart).length === 0}
            >
              {purchasing ? "Processing..." : "Buy now"}
            </button>
            {success && <p className="success-text">{success}</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
