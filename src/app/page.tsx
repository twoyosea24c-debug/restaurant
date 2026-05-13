import type { CSSProperties } from "react";
import { createBooking, createInquiry, requestBookingCancel, requestBookingChange } from "@/app/actions";
import { ShopClient } from "@/components/ShopClient";
import { formatPrice, getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

function parseTimeMinutes(time: string) {
  const [hours = "10", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function formatTimeOption(minutes: number) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

export default async function PublicPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { notice, error } = await searchParams;
  const data = await getAppData();
  const brandStyle = { "--brand": data.store.brandColor } as CSSProperties & Record<"--brand", string>;
  const bookingTimeOptions = Array.from(
    {
      length: Math.max(
        1,
        Math.floor((parseTimeMinutes(data.store.businessCloseTime) - parseTimeMinutes(data.store.businessOpenTime)) / 15),
      ),
    },
    (_, index) => formatTimeOption(parseTimeMinutes(data.store.businessOpenTime) + index * 15),
  );

  return (
    <main className="main public-main" style={brandStyle}>
      <header className="public-hero">
        <div>
          <p className="eyebrow">Store</p>
          <h1>{data.store.name}</h1>
          <p>{data.store.description}</p>
          <div className="public-actions">
            <a className="primary-action" href="#shop">
              {data.store.ctaLabel}
            </a>
            <a className="secondary-action" href="/admin">
              管理画面
            </a>
          </div>
        </div>
        <div className="public-info">
          <p>電話</p>
          <strong>{data.store.phone}</strong>
          <p>メール</p>
          <strong>{data.store.email}</strong>
        </div>
      </header>

      {notice ? <p className="notice-banner">{notice}</p> : null}
      {error ? <p className="notice-banner error-banner">{error}</p> : null}

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>予約</h2>
            <span>既存機能</span>
          </div>
          <p className="empty-state">予約受付・変更依頼・キャンセル依頼と同じ顧客情報へ注文を紐付けます。</p>
        </article>
        <article className="panel">
          <div className="panel-head">
            <h2>商品販売</h2>
            <span>注文受付</span>
          </div>
          <p className="empty-state">最初は決済なしで注文を受け付け、店舗から連絡する運用にしています。</p>
        </article>
      </section>

      <section id="booking" className="panel">
        <div className="panel-head">
          <h2>予約受付</h2>
          <span>DB保存・顧客連携</span>
        </div>
        <form action={createBooking} className="form-grid">
          <label>
            メニュー
            <select name="serviceId" required>
              {data.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} / {service.durationMinutes}分 / {formatPrice(service.price)}
                </option>
              ))}
            </select>
          </label>
          <label>
            希望日
            <input name="startDate" type="date" required />
          </label>
          <label>
            希望時刻
            <select name="startTime" required>
              {bookingTimeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <label>
            名前
            <input name="name" required />
          </label>
          <label>
            メール
            <input name="email" type="email" required />
          </label>
          <label>
            電話
            <input name="phone" />
          </label>
          <label>
            メモ
            <input name="note" placeholder="希望や相談内容" />
          </label>
          <button type="submit">予約する</button>
        </form>
      </section>

      <section className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>予約変更依頼</h2>
            <span>予約番号で受付</span>
          </div>
          <form action={requestBookingChange} className="settings-form">
            <label>
              予約番号
              <input name="bookingNumber" placeholder="BKG-1001" required />
            </label>
            <label>
              変更内容
              <textarea name="requestNote" rows={3} required />
            </label>
            <button type="submit">変更を依頼</button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>予約キャンセル依頼</h2>
            <span>予約番号で受付</span>
          </div>
          <form action={requestBookingCancel} className="settings-form">
            <label>
              予約番号
              <input name="bookingNumber" placeholder="BKG-1001" required />
            </label>
            <label>
              理由・連絡事項
              <textarea name="requestNote" rows={3} required />
            </label>
            <button type="submit">キャンセルを依頼</button>
          </form>
        </section>
      </section>

      <ShopClient products={data.activeProducts} />

      <section id="contact" className="panel">
        <div className="panel-head">
          <h2>問い合わせ</h2>
          <span>予約・注文と同じ顧客情報へ紐付け</span>
        </div>
        <form action={createInquiry} className="form-grid">
          <label>
            名前
            <input name="name" required />
          </label>
          <label>
            メール
            <input name="email" type="email" required />
          </label>
          <label>
            電話
            <input name="phone" />
          </label>
          <label>
            件名
            <input name="subject" required />
          </label>
          <label>
            内容
            <textarea name="message" rows={4} required />
          </label>
          <button type="submit">問い合わせる</button>
        </form>
      </section>
    </main>
  );
}
