"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrder } from "@/app/actions";
import { formatPrice } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

function RequiredMark() {
  return <span className="required-badge">必須</span>;
}

export function ShopClient({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [orderComplete, setOrderComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  function addToCart(product: Product) {
    setOrderComplete(false);
    setMessage("カートに追加しました。");
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) } : item,
        );
      }
      return [...current, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, direction: number) {
    const product = products.find((candidate) => candidate.id === productId);
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(product?.stock ?? item.quantity, item.quantity + direction) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function submitOrder(formData: FormData) {
    if (cart.length === 0) {
      setOrderComplete(false);
      setMessage("カートが空です。");
      return;
    }

    startTransition(async () => {
      try {
        await createOrder({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          note: String(formData.get("note") ?? ""),
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        });
        setCart([]);
        setOrderComplete(true);
        setMessage("ご注文ありがとうございます。");
      } catch (error) {
        setOrderComplete(false);
        setMessage(error instanceof Error ? error.message : "注文に失敗しました。");
      }
    });
  }

  return (
    <section id="shop" className="panel">
      <div className="panel-head">
        <h2>商品一覧・注文受付</h2>
        <span>決済なしで注文受付</span>
      </div>
      {message ? <p className="status-badge">{message}</p> : null}
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-thumb">{product.name.slice(0, 1)}</div>
            <div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
            </div>
            <div className="product-actions">
              <strong>{formatPrice(product.price)}</strong>
              <button className="primary-action" disabled={product.stock < 1} onClick={() => addToCart(product)}>
                カートに入れる
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-head">
            <h2>カート</h2>
            <span>{cart.length}種類</span>
          </div>
          {cart.length === 0 ? (
            <p className="empty-state">カートは空です。</p>
          ) : (
            cart.map((item) => (
              <article className="cart-row" key={item.productId}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{formatPrice(item.price)} x {item.quantity}</p>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(item.productId, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)}>+</button>
                </div>
              </article>
            ))
          )}
          <div className="cart-summary">
            <span>合計</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </section>

        <form action={submitOrder} className="panel settings-form">
          <div className="panel-head">
            <h2>注文情報</h2>
            <span>顧客情報へ自動紐付け</span>
          </div>
          {orderComplete ? <p className="notice-banner">ご注文ありがとうございます。</p> : null}
          <label>
            <span className="field-label">名前 <RequiredMark /></span>
            <input name="name" required />
          </label>
          <label>
            <span className="field-label">メール <RequiredMark /></span>
            <input name="email" type="email" required />
          </label>
          <label>
            <span className="field-label">電話 <RequiredMark /></span>
            <input name="phone" required />
          </label>
          <label>
            メモ
            <textarea name="note" rows={3} />
          </label>
          <button disabled={cart.length === 0 || isPending} type="submit">
            {isPending ? "注文中" : "注文する"}
          </button>
        </form>
      </div>
    </section>
  );
}
