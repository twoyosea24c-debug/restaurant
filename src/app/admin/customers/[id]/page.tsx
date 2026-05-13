import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { updateBookingStatus, updateCustomerNote, updateInquiryStatus, updateOrderStatus } from "@/app/actions";
import {
  bookingStatuses,
  bookingStatusLabels,
  formatPrice,
  getCustomerDetail,
  inquiryStatuses,
  inquiryStatusLabels,
  orderStatuses,
  parseTags,
  statusLabels,
  toBookingStatusKey,
  toInquiryStatusKey,
  toOrderStatusKey,
} from "@/lib/data";
import { session, verifySessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
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
  const data = await getCustomerDetail(id);
  if (!data) notFound();

  const brandStyle = { "--brand": data.store.brandColor } as CSSProperties & Record<"--brand", string>;
  const customer = data.customer;

  return (
    <div className="shell" style={brandStyle}>
      <aside className="sidebar" aria-label="管理メニュー">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <p className="brand-name">Small Store Base</p>
            <p className="brand-meta">顧客詳細</p>
          </div>
        </div>
        <nav className="nav" aria-label="メイン">
          <a href="/admin">ダッシュボード</a>
          <a href="/admin#customers">顧客一覧</a>
          <a href="/admin#bookings">予約管理</a>
          <a href="/admin#inquiries">問い合わせ</a>
          <a href="/admin#orders">注文管理</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Customer</p>
            <h1>{customer.name}</h1>
          </div>
          <div className="topbar-actions">
            <a className="secondary-action" href="/admin#customers">
              顧客一覧
            </a>
            <form action={logout}>
              <button className="secondary-action" type="submit">
                ログアウト
              </button>
            </form>
          </div>
        </header>

        {notice ? <p className="notice-banner">{notice}</p> : null}
        {error ? <p className="notice-banner error-banner">{error}</p> : null}

        <section className="metrics">
          <article className="metric">
            <p>予約</p>
            <strong>{data.summary.bookingCount}</strong>
          </article>
          <article className="metric">
            <p>注文</p>
            <strong>{data.summary.orderCount}</strong>
          </article>
          <article className="metric">
            <p>問い合わせ</p>
            <strong>{data.summary.inquiryCount}</strong>
          </article>
          <article className="metric">
            <p>累計購入</p>
            <strong>{formatPrice(data.summary.salesTotal)}</strong>
          </article>
          <article className="metric">
            <p>最終利用</p>
            <strong>{data.summary.lastActivityAt.toLocaleDateString("ja-JP")}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>基本情報</h2>
              <span>共通顧客データ</span>
            </div>
            <div className="summary-strip">
              <div>
                <p>メール</p>
                <strong>{customer.email}</strong>
              </div>
              <div>
                <p>電話</p>
                <strong>{customer.phone || "-"}</strong>
              </div>
            </div>
            <div className="tag-list">
              {parseTags(customer.tags).length === 0 ? (
                <span>タグなし</span>
              ) : (
                parseTags(customer.tags).map((tag) => <span key={tag}>{tag}</span>)
              )}
            </div>
            {customer.memo ? <p className="empty-state" style={{ marginTop: 12 }}>{customer.memo}</p> : null}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>タグ・メモ</h2>
              <span>顧客対応用</span>
            </div>
            <form action={updateCustomerNote} className="settings-form">
              <input name="customerId" type="hidden" value={customer.id} />
              <input name="returnTo" type="hidden" value={`/admin/customers/${customer.id}`} />
              <label>
                タグ
                <input name="tags" defaultValue={customer.tags} />
              </label>
              <label>
                メモ
                <textarea name="memo" rows={5} defaultValue={customer.memo} />
              </label>
              <button type="submit">保存</button>
            </form>
          </section>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>予約履歴</h2>
            <span>{customer.bookings.length}件</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>予約番号</th>
                  <th>メニュー</th>
                  <th>日時</th>
                  <th>状態</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {customer.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.bookingNumber}</strong>
                      <p>
                        <a className="secondary-action" href={`/admin/bookings/${booking.id}`}>
                          詳細
                        </a>
                      </p>
                    </td>
                    <td>{booking.service.name}</td>
                    <td>{booking.startAt.toLocaleString("ja-JP")}</td>
                    <td>
                      <form action={updateBookingStatus}>
                        <input name="bookingId" type="hidden" value={booking.id} />
                        <input name="returnTo" type="hidden" value={`/admin/customers/${customer.id}`} />
                        <select name="status" defaultValue={booking.status}>
                          {bookingStatuses.map((status) => (
                            <option key={status} value={status}>
                              {bookingStatusLabels[status]}
                            </option>
                          ))}
                        </select>
                        <button className="secondary-action" type="submit" style={{ marginTop: 8 }}>
                          更新
                        </button>
                      </form>
                    </td>
                    <td>
                      <span className="status-badge">{bookingStatusLabels[toBookingStatusKey(booking.status)]}</span>
                      <p>{booking.requestNote || booking.note || "-"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>注文履歴</h2>
            <span>{customer.orders.length}件</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>注文ID</th>
                  <th>商品</th>
                  <th>合計</th>
                  <th>状態</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      <p>
                        <a className="secondary-action" href={`/admin/orders/${order.id}`}>
                          詳細
                        </a>
                      </p>
                    </td>
                    <td>{order.items.map((item) => `${item.name} x ${item.quantity}`).join(" / ")}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td>
                      <form action={updateOrderStatus}>
                        <input name="orderId" type="hidden" value={order.id} />
                        <input name="returnTo" type="hidden" value={`/admin/customers/${customer.id}`} />
                        <select name="status" defaultValue={order.status}>
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                        <button className="secondary-action" type="submit" style={{ marginTop: 8 }}>
                          更新
                        </button>
                      </form>
                    </td>
                    <td>
                      <span className="status-badge">{statusLabels[toOrderStatusKey(order.status)]}</span>
                      <p>{order.note || "-"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>問い合わせ履歴</h2>
            <span>{customer.inquiries.length}件</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>問い合わせID</th>
                  <th>件名</th>
                  <th>内容</th>
                  <th>状態</th>
                  <th>対応メモ</th>
                </tr>
              </thead>
              <tbody>
                {customer.inquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>
                      <strong>{inquiry.inquiryNumber}</strong>
                      <p>
                        <a className="secondary-action" href={`/admin/inquiries/${inquiry.id}`}>
                          詳細
                        </a>
                      </p>
                    </td>
                    <td>{inquiry.subject}</td>
                    <td>{inquiry.message}</td>
                    <td>
                      <span className="status-badge">{inquiryStatusLabels[toInquiryStatusKey(inquiry.status)]}</span>
                    </td>
                    <td>
                      <form action={updateInquiryStatus} className="settings-form">
                        <input name="inquiryId" type="hidden" value={inquiry.id} />
                        <input name="returnTo" type="hidden" value={`/admin/customers/${customer.id}`} />
                        <label>
                          状態
                          <select name="status" defaultValue={inquiry.status}>
                            {inquiryStatuses.map((status) => (
                              <option key={status} value={status}>
                                {inquiryStatusLabels[status]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          メモ
                          <textarea name="responseNote" rows={3} defaultValue={inquiry.responseNote} />
                        </label>
                        <button type="submit">保存</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
