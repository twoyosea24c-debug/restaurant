import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { addInternalNote, updateBookingStatus } from "@/app/actions";
import {
  bookingStatuses,
  bookingStatusLabels,
  formatPrice,
  getBookingDetail,
  toBookingStatusKey,
} from "@/lib/data";
import { session, verifySessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
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
  const data = await getBookingDetail(id);
  if (!data) notFound();

  const { booking, internalNotes, store } = data;
  const brandStyle = { "--brand": store.brandColor } as CSSProperties & Record<"--brand", string>;

  return (
    <div className="shell" style={brandStyle}>
      <aside className="sidebar" aria-label="管理メニュー">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <p className="brand-name">Small Store Base</p>
            <p className="brand-meta">予約詳細</p>
          </div>
        </div>
        <nav className="nav" aria-label="メイン">
          <a href="/admin">ダッシュボード</a>
          <a href="/admin#bookings">予約管理</a>
          <a href={`/admin/customers/${booking.customerId}`}>顧客詳細</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Booking</p>
            <h1>{booking.bookingNumber}</h1>
          </div>
          <div className="topbar-actions">
            <a className="secondary-action" href="/admin#bookings">予約一覧</a>
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
            <strong>{bookingStatusLabels[toBookingStatusKey(booking.status)]}</strong>
          </article>
          <article className="metric">
            <p>メニュー</p>
            <strong>{booking.service.name}</strong>
          </article>
          <article className="metric">
            <p>料金</p>
            <strong>{formatPrice(booking.service.price)}</strong>
          </article>
          <article className="metric">
            <p>希望日時</p>
            <strong>{booking.startAt.toLocaleDateString("ja-JP")}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>予約内容</h2>
              <span>{booking.startAt.toLocaleString("ja-JP")}</span>
            </div>
            <div className="summary-strip">
              <div>
                <p>顧客</p>
                <strong>{booking.customerName}</strong>
              </div>
              <div>
                <p>所要時間</p>
                <strong>{booking.service.durationMinutes}分</strong>
              </div>
            </div>
            <p className="empty-state">{booking.note || "予約メモはありません。"}</p>
            {booking.requestNote ? <p className="notice-banner" style={{ marginTop: 12 }}>{booking.requestNote}</p> : null}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>ステータス更新</h2>
              <span>予約管理</span>
            </div>
            <form action={updateBookingStatus} className="settings-form">
              <input name="bookingId" type="hidden" value={booking.id} />
              <input name="returnTo" type="hidden" value={`/admin/bookings/${booking.id}`} />
              <label>
                状態
                <select name="status" defaultValue={booking.status}>
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>{bookingStatusLabels[status]}</option>
                  ))}
                </select>
              </label>
              <button type="submit">更新</button>
            </form>
          </section>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>対応履歴</h2>
            <span>{internalNotes.length}件</span>
          </div>
          <form action={addInternalNote} className="form-grid">
            <input name="targetType" type="hidden" value="BOOKING" />
            <input name="targetId" type="hidden" value={booking.id} />
            <input name="returnTo" type="hidden" value={`/admin/bookings/${booking.id}`} />
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
