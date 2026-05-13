import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { addInternalNote, updateOrderStatus, updatePaymentStatus } from "@/app/actions";
import {
  formatPrice,
  getOrderDetail,
  orderStatuses,
  paymentStatuses,
  paymentStatusLabels,
  statusLabels,
  toOrderStatusKey,
  toPaymentStatusKey,
} from "@/lib/data";
import { session, verifySessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const cookieStore = await cookies();
  const verified = await verifySessionValue(cookieStore.get(session.name)?.value);
  if (!verified) redirect("/login");

  const { id } = await params;
  const { notice, error } = await searchParams;
  const data = await getOrderDetail(id);
  if (!data) notFound();

  const { internalNotes, order, store } = data;
  const brandStyle = { "--brand": store.brandColor } as CSSProperties & Record<"--brand", string>;
  const paymentStatus = toPaymentStatusKey(order.payment?.status);
  const paymentMethod = order.payment?.method ?? "NONE";

  return (
    <div className="shell" style={brandStyle}>
      <aside className="sidebar" aria-label="管理メニュー">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <p className="brand-name">Small Store Base</p>
            <p className="brand-meta">注文詳細</p>
          </div>
        </div>
        <nav className="nav" aria-label="メイン">
          <a href="/admin">ダッシュボード</a>
          <a href="/admin#orders">注文管理</a>
          <a href={`/admin/customers/${order.customerId}`}>顧客詳細</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Order</p>
            <h1>{order.orderNumber}</h1>
          </div>
          <div className="topbar-actions">
            <a className="secondary-action" href="/admin#orders">注文一覧</a>
            <form action={logout}>
              <button className="secondary-action" type="submit">ログアウト</button>
            </form>
          </div>
        </header>

        {notice ? <p className="notice-banner">{notice}</p> : null}
        {error ? <p className="notice-banner error-banner">{error}</p> : null}

        <section className="metrics">
          <article className="metric">
            <p>状態</p>
            <strong>{statusLabels[toOrderStatusKey(order.status)]}</strong>
          </article>
          <article className="metric">
            <p>商品数</p>
            <strong>{order.items.length}</strong>
          </article>
          <article className="metric">
            <p>合計</p>
            <strong>{formatPrice(order.total)}</strong>
          </article>
          <article className="metric">
            <p>決済</p>
            <strong>{paymentStatusLabels[paymentStatus]}</strong>
          </article>
          <article className="metric">
            <p>受付日</p>
            <strong>{order.createdAt.toLocaleDateString("ja-JP")}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>注文内容</h2>
              <span>{order.customerName}</span>
            </div>
            {order.items.map((item) => (
              <article className="history-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{formatPrice(item.price)} x {item.quantity}</p>
                </div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </article>
            ))}
            <div className="cart-summary">
              <span>合計</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
            <p className="empty-state" style={{ marginTop: 12 }}>{order.note || "注文メモはありません。"}</p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>ステータス更新</h2>
              <span>注文管理</span>
            </div>
            <form action={updateOrderStatus} className="settings-form">
              <input name="orderId" type="hidden" value={order.id} />
              <input name="returnTo" type="hidden" value={`/admin/orders/${order.id}`} />
              <label>
                状態
                <select name="status" defaultValue={order.status}>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>{statusLabels[status]}</option>
                  ))}
                </select>
              </label>
              <button type="submit">更新</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>決済準備</h2>
              <span>決済サービス連携前の入金管理</span>
            </div>
            <form action={updatePaymentStatus} className="settings-form">
              <input name="orderId" type="hidden" value={order.id} />
              <label>
                決済状態
                <select name="status" defaultValue={paymentStatus}>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>{paymentStatusLabels[status]}</option>
                  ))}
                </select>
              </label>
              <label>
                決済方法
                <select name="method" defaultValue={paymentMethod}>
                  <option value="NONE">未設定</option>
                  <option value="CASH">店頭現金</option>
                  <option value="BANK">銀行振込</option>
                  <option value="ONLINE">オンライン決済予定</option>
                  <option value="OTHER">その他</option>
                </select>
              </label>
              <label>
                決済メモ
                <textarea name="note" rows={3} defaultValue={order.payment?.note ?? ""} placeholder="入金確認日、振込名義、外部決済IDなど" />
              </label>
              <button type="submit">保存</button>
            </form>
            <div className="summary-strip" style={{ marginTop: 16 }}>
              <div>
                <p>金額</p>
                <strong>{formatPrice(order.payment?.amount ?? order.total)}</strong>
              </div>
              <div>
                <p>入金日</p>
                <strong>{order.payment?.paidAt ? order.payment.paidAt.toLocaleDateString("ja-JP") : "-"}</strong>
              </div>
            </div>
          </section>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>対応履歴</h2>
            <span>{internalNotes.length}件</span>
          </div>
          <form action={addInternalNote} className="form-grid">
            <input name="targetType" type="hidden" value="ORDER" />
            <input name="targetId" type="hidden" value={order.id} />
            <input name="returnTo" type="hidden" value={`/admin/orders/${order.id}`} />
            <label>
              担当者
              <input name="author" defaultValue="管理者" />
            </label>
            <label>
              内容
              <textarea name="body" rows={3} required />
            </label>
            <button type="submit">追加</button>
          </form>
          <div style={{ marginTop: 18 }}>
            {internalNotes.length === 0 ? (
              <p className="empty-state">対応履歴はまだありません。</p>
            ) : (
              internalNotes.map((note) => (
                <article className="history-item" key={note.id}>
                  <div>
                    <strong>{note.author}</strong>
                    <p>{note.body}</p>
                  </div>
                  <span className="status-badge">{note.createdAt.toLocaleString("ja-JP")}</span>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
