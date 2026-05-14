import type { CSSProperties } from "react";
import { createInquiry, requestBookingCancel, requestBookingChange } from "@/app/actions";
import { BookingForm } from "@/components/BookingForm";
import { ShopClient } from "@/components/ShopClient";
import { formatPrice, getAppData, pageSectionTypeLabels, toLpDesignPresetKey, toPageSectionTypeKey } from "@/lib/data";

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

function RequiredMark() {
  return <span className="required-badge">必須</span>;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function PublicPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { notice, error } = await searchParams;
  const data = await getAppData();
  const brandStyle = { "--brand": data.store.brandColor } as CSSProperties & Record<"--brand", string>;
  const lpDesignPreset = toLpDesignPresetKey(data.store.lpDesignPreset);
  const bookingTimeOptions = Array.from(
    {
      length: Math.max(
        1,
        Math.floor((parseTimeMinutes(data.store.businessCloseTime) - parseTimeMinutes(data.store.businessOpenTime)) / 15),
      ),
    },
    (_, index) => formatTimeOption(parseTimeMinutes(data.store.businessOpenTime) + index * 15),
  );
  const bookedSlots = data.bookings
    .filter((booking) => !["CANCELED", "CANCEL_REQUESTED"].includes(booking.status))
    .map((booking) => ({
      date: formatDateInput(booking.startAt),
      time: formatTimeOption(booking.startAt.getHours() * 60 + booking.startAt.getMinutes()),
    }));
  const publicPhone = data.store.phone === "03-0000-0000" ? "店舗へお問い合わせください" : data.store.phone;
  const enabledSections = data.pageSections.filter((section) => section.enabled);
  const heroSection = enabledSections.find((section) => section.type === "hero");
  const navSections = enabledSections.filter((section) => !["hero", "custom"].includes(section.type));

  return (
    <main className={`main public-main lp-design-${lpDesignPreset}`} style={brandStyle}>
      <header className="public-hero">
        <div className="lp-visual" aria-hidden="true">
          <span>{data.store.name.slice(0, 1)}</span>
        </div>
        <div>
          <p className="eyebrow">Store</p>
          <h1>{heroSection?.title || data.store.name}</h1>
          <p>{heroSection?.body || data.store.description}</p>
          <div className="public-actions" aria-label="主要操作">
            <a className="primary-action" href={heroSection?.buttonHref || "#booking"}>
              {heroSection?.buttonLabel || "予約する"}
            </a>
            <a className="secondary-action" href="#shop">
              商品を見る
            </a>
            <a className="secondary-action" href="#contact">
              問い合わせ
            </a>
            <a className="secondary-action" href="/admin">
              管理画面
            </a>
          </div>
        </div>
        <div className="public-info">
          <p>電話</p>
          <strong>{publicPhone}</strong>
          <p>メール</p>
          <strong>{data.store.email}</strong>
        </div>
      </header>

      <nav className="mobile-action-bar" aria-label="主要操作">
        {navSections.slice(0, 4).map((section) => (
          <a href={`#section-${section.id}`} key={section.id}>{pageSectionTypeLabels[toPageSectionTypeKey(section.type)]}</a>
        ))}
      </nav>

      {notice ? <p className="notice-banner">{notice}</p> : null}
      {error ? <p className="notice-banner error-banner">{error}</p> : null}

      {enabledSections.filter((section) => section.type !== "hero").map((section) => {
        const sectionType = toPageSectionTypeKey(section.type);
        if (sectionType === "booking") {
          return (
            <section id="booking" className="panel" key={section.id}>
              <div className="panel-head">
                <h2>{section.title}</h2>
                <span>{section.body || "DB保存・顧客連携"}</span>
              </div>
              <BookingForm
                bookedSlots={bookedSlots}
                services={data.services.map((service) => ({
                  id: service.id,
                  label: `${service.name} / ${service.durationMinutes}分 / ${formatPrice(service.price)}`,
                }))}
                timeOptions={bookingTimeOptions}
              />
              <section className="dashboard-grid" style={{ marginTop: 18 }}>
                <section className="panel">
                  <div className="panel-head">
                    <h2>予約変更依頼</h2>
                    <span>予約番号で受付</span>
                  </div>
                  <form action={requestBookingChange} className="settings-form">
                    <label><span className="field-label">予約番号 <RequiredMark /></span><input name="bookingNumber" placeholder="BKG-1001" required /></label>
                    <label><span className="field-label">変更内容 <RequiredMark /></span><textarea name="requestNote" rows={3} required /></label>
                    <button type="submit">変更を依頼</button>
                  </form>
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <h2>予約キャンセル依頼</h2>
                    <span>予約番号で受付</span>
                  </div>
                  <form action={requestBookingCancel} className="settings-form">
                    <label><span className="field-label">予約番号 <RequiredMark /></span><input name="bookingNumber" placeholder="BKG-1001" required /></label>
                    <label><span className="field-label">理由・連絡事項 <RequiredMark /></span><textarea name="requestNote" rows={3} required /></label>
                    <button type="submit">キャンセルを依頼</button>
                  </form>
                </section>
              </section>
            </section>
          );
        }
        if (sectionType === "products") {
          return (
            <div id={`section-${section.id}`} key={section.id}>
              <ShopClient paymentProviderSetting={data.paymentProviderSetting} products={data.activeProducts} />
            </div>
          );
        }
        if (sectionType === "contact") {
          return (
            <section id="contact" className="panel" key={section.id}>
              <div className="panel-head">
                <h2>{section.title}</h2>
                <span>{section.body || "予約・注文と同じ顧客情報へ紐付け"}</span>
              </div>
              <form action={createInquiry} className="form-grid">
                <label><span className="field-label">名前 <RequiredMark /></span><input name="name" required /></label>
                <label><span className="field-label">メール <RequiredMark /></span><input name="email" type="email" required /></label>
                <label><span className="field-label">電話 <RequiredMark /></span><input name="phone" required /></label>
                <label><span className="field-label">件名 <RequiredMark /></span><input name="subject" required /></label>
                <label><span className="field-label">内容 <RequiredMark /></span><textarea name="message" rows={4} required /></label>
                <button type="submit">問い合わせる</button>
              </form>
            </section>
          );
        }
        return (
          <section id={`section-${section.id}`} className="panel lp-section" key={section.id}>
            <div className="panel-head">
              <h2>{section.title}</h2>
              <span>{pageSectionTypeLabels[sectionType]}</span>
            </div>
            <p>{section.body}</p>
            {sectionType === "menu" ? (
              <div className="status-grid" style={{ marginTop: 16 }}>
                {data.services.map((service) => (
                  <article className="status-card" key={service.id}>
                    <p>{service.name}</p>
                    <strong>{formatPrice(service.price)}</strong>
                    <span>{service.durationMinutes}分</span>
                  </article>
                ))}
              </div>
            ) : null}
            {sectionType === "access" ? (
              <div className="summary-strip" style={{ marginTop: 16 }}>
                <div><p>電話</p><strong>{publicPhone}</strong></div>
                <div><p>メール</p><strong>{data.store.email}</strong></div>
              </div>
            ) : null}
            {section.buttonLabel && section.buttonHref ? <a className="secondary-action" href={section.buttonHref}>{section.buttonLabel}</a> : null}
          </section>
        );
      })}

      <footer className="public-footer">
        <a href="/legal">特定商取引法に基づく表記</a>
        <a href="/privacy">プライバシーポリシー</a>
        <a href="/admin">管理画面</a>
      </footer>
    </main>
  );
}
