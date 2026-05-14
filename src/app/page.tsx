import type { CSSProperties } from "react";
import { createInquiry, requestBookingCancel, requestBookingChange } from "@/app/actions";
import { BookingForm } from "@/components/BookingForm";
import { ShopClient } from "@/components/ShopClient";
import { formatPrice, getAppData, toLpDesignPresetKey } from "@/lib/data";

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

function formatClosedDays(value: string) {
  const labels = ["日", "月", "火", "水", "木", "金", "土"];
  const days = value
    .split(",")
    .map((day) => Number(day.trim()))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .map((day) => labels[day]);
  return days.length > 0 ? `${days.join("・")}曜` : "不定休";
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
  const businessHours = `${data.store.businessOpenTime} - ${data.store.businessCloseTime}`;
  const closedDays = formatClosedDays(data.store.closedWeekdays);
  const problemCards = [
    ["電話とメモで予約が散らばる", "予約台帳、電話メモ、チャットが分かれていると、確認漏れや二重予約が起きやすくなります。"],
    ["営業時間外の予約を逃している", "閉店後や接客中に受けられなかった予約が、そのまま機会損失になります。"],
    ["変更・キャンセル対応が属人化する", "担当者だけが状況を知っている状態では、スタッフ間の引き継ぎに時間がかかります。"],
  ];
  const solutionCards = [
    ["予約受付を一本化", "公開ページから予約を受け付け、管理画面で一覧確認できます。"],
    ["顧客情報を自動で蓄積", "予約・注文・問い合わせを同じ顧客情報へ紐付けます。"],
    ["運用を小さく始められる", "決済なしの注文受付や問い合わせ対応から段階的に拡張できます。"],
  ];
  const featureCards = [
    ["予約受付", "希望日・時間・メニューをスマホから入力できます。"],
    ["予約一覧管理", "受付状況、変更依頼、キャンセル依頼を管理画面で確認できます。"],
    ["キャンセル管理", "キャンセル依頼を履歴として残し、対応漏れを防ぎます。"],
    ["店舗情報掲載", "営業時間、連絡先、案内文を公開ページに表示できます。"],
    ["メニュー紹介", "予約メニューや商品を同じ画面で見せられます。"],
    ["スマホ対応", "お客様も店舗スタッフもスマホで使いやすい設計です。"],
  ];
  const benefits = ["予約ミス削減", "業務時間削減", "営業時間外の予約受付", "スタッフ間の情報共有"];
  const plans: Array<{ name: string; description: string; price: string; items: string[] }> = [
    { name: "Starter", description: "まず予約受付を始めたい店舗向け", price: "¥0", items: ["公開ページ", "予約受付", "問い合わせ受付"] },
    { name: "Standard", description: "予約・注文・顧客管理まで使いたい店舗向け", price: "¥4,980", items: ["共通管理画面", "商品販売", "顧客履歴", "メール通知"] },
    { name: "Pro", description: "複数スタッフで本格運用したい店舗向け", price: "¥9,800", items: ["権限管理", "監査ログ", "バックアップ", "優先サポート"] },
  ];
  const faqs = [
    ["専門知識がなくても使えますか？", "はい。店舗情報、予約メニュー、商品を管理画面から入力して使える設計です。"],
    ["決済なしでも注文受付できますか？", "できます。最初は注文受付だけで運用し、必要になった段階で決済サービスを設定できます。"],
    ["スマホだけで管理できますか？", "主要な予約確認、注文確認、問い合わせ確認はスマホから操作しやすいように設計しています。"],
    ["既存の予約機能は使えますか？", "はい。現在の予約受付、変更依頼、キャンセル依頼の処理は残したままLPを再設計しています。"],
  ];

  return (
    <main className={`main public-main saas-lp lp-design-${lpDesignPreset}`} style={brandStyle}>
      <header className="saas-hero">
        <div className="saas-hero-copy">
          <p className="eyebrow">Small Store SaaS</p>
          <h1>小規模店舗の予約受付と顧客管理を、ひとつの管理画面に。</h1>
          <p>
            予約、変更依頼、キャンセル、商品注文、問い合わせをまとめて扱える店舗向けベースアプリです。
            電話や紙台帳に頼らず、スマホから迷わず受付できます。
          </p>
          <div className="saas-hero-actions" aria-label="主要操作">
            <a className="primary-action" href="#booking">無料で予約受付を試す</a>
            <a className="secondary-action" href="#app-preview">画面を見る</a>
          </div>
          <div className="saas-trust-row" aria-label="導入メリット">
            <span>予約受付</span>
            <span>顧客連携</span>
            <span>スマホ対応</span>
          </div>
        </div>
        <div className="saas-mockup" aria-label="アプリ画面のモックアップ">
          <div className="mockup-dashboard">
            <div className="mockup-dashboard-head">
              <span>Today</span>
              <strong>予約一覧</strong>
            </div>
            <div className="mockup-toolbar">
              <span />
              <span />
              <span />
            </div>
            {["10:00 田中様", "11:30 佐藤様", "14:00 山本様"].map((row) => (
              <div className="mockup-row" key={row}>
                <span>{row}</span>
                <em>受付済</em>
              </div>
            ))}
            <div className="mockup-metrics" aria-hidden="true">
              <span>予約 12</span>
              <span>問い合わせ 4</span>
            </div>
          </div>
          <div className="mockup-phone">
            <div className="mockup-bar" />
            <p>予約受付</p>
            <strong>ベーシックケア</strong>
            <span>5月21日 10:30</span>
            <label>お名前</label>
            <div className="mockup-input">山田 花子</div>
            <button type="button">予約する</button>
          </div>
        </div>
      </header>

      <nav className="mobile-action-bar" aria-label="主要操作">
        <a href="#booking">予約</a>
        <a href="#shop">商品</a>
        <a href="#contact">問い合わせ</a>
      </nav>

      {notice ? <p className="notice-banner">{notice}</p> : null}
      {error ? <p className="notice-banner error-banner">{error}</p> : null}

      <section className="saas-section">
        <div className="saas-section-head">
          <p className="eyebrow">Problems</p>
          <h2>小規模店舗の予約管理は、忙しい日ほど崩れやすい。</h2>
        </div>
        <div className="saas-card-grid">
          {problemCards.map(([title, body]) => (
            <article className="saas-card" key={title}>
              <span className="saas-card-icon">!</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section saas-split-section">
        <div className="saas-section-head">
          <p className="eyebrow">Solution</p>
          <h2>予約、顧客、注文、問い合わせを同じ流れで管理。</h2>
          <p>最初は予約受付だけ。必要に応じて商品販売や問い合わせ対応を追加できる、店舗運営の共通ベースです。</p>
        </div>
        <div className="saas-solution-list">
          {solutionCards.map(([title, body]) => (
            <article key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section">
        <div className="saas-section-head">
          <p className="eyebrow">Features</p>
          <h2>予約アプリに必要な基本機能を、最初から整えています。</h2>
        </div>
        <div className="saas-feature-grid">
          {featureCards.map(([title, body]) => (
            <article className="saas-feature" key={title}>
              <span>{title.slice(0, 1)}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="app-preview" className="saas-section">
        <div className="saas-section-head">
          <p className="eyebrow">Product Preview</p>
          <h2>お客様の予約画面と、店舗の管理画面を同時にイメージできます。</h2>
        </div>
        <div className="saas-preview-grid">
          <article className="preview-phone-card">
            <div className="preview-phone">
              <p>予約フォーム</p>
              <label>メニュー</label>
              <div>ベーシックケア / 60分</div>
              <label>希望日時</label>
              <div>5月21日 10:30</div>
              <button type="button">予約する</button>
            </div>
          </article>
          <article className="preview-admin-card">
            <div className="preview-admin-head">
              <span>管理画面</span>
              <strong>今日の予約</strong>
            </div>
            {["10:00 ベーシックケア", "11:30 商品受け取り", "14:00 問い合わせ対応"].map((item) => (
              <div className="preview-admin-row" key={item}>
                <span>{item}</span>
                <em>確認</em>
              </div>
            ))}
          </article>
        </div>
      </section>

      <section className="saas-section">
        <div className="saas-section-head">
          <p className="eyebrow">Benefits</p>
          <h2>少ない人数でも、予約対応を安定させます。</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article key={benefit}>
              <strong>{benefit}</strong>
              <p>受付から対応履歴まで一箇所に残し、確認の手間を減らします。</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="saas-section">
        <div className="saas-section-head">
          <p className="eyebrow">Pricing</p>
          <h2>店舗の成長に合わせて選べる料金プラン。</h2>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <article className={index === 1 ? "pricing-card featured" : "pricing-card"} key={plan.name}>
              {index === 1 ? <span className="plan-badge">おすすめ</span> : null}
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <strong>{plan.price}<small>/月</small></strong>
              <ul>
                {plan.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <a className={index === 1 ? "primary-action" : "secondary-action"} href="#booking">このプランで試す</a>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section faq-section">
        <div className="saas-section-head">
          <p className="eyebrow">FAQ</p>
          <h2>よくある質問</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details className="faq-item" key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">Start</p>
        <h2>予約受付を、今日から見やすく整える。</h2>
        <p>まずは現在の店舗情報と予約メニューで、公開ページの動きを確認できます。</p>
        <div className="saas-hero-actions">
          <a className="primary-action" href="#booking">予約受付を試す</a>
          <a className="secondary-action" href="#contact">相談する</a>
        </div>
      </section>

      <section id="booking" className="panel saas-live-section">
        <div className="panel-head">
          <h2>予約受付デモ</h2>
          <span>実際の予約フォーム</span>
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

      <ShopClient paymentProviderSetting={data.paymentProviderSetting} products={data.activeProducts} />

      <section id="contact" className="panel saas-live-section">
        <div className="panel-head">
          <h2>問い合わせ</h2>
          <span>予約・注文と同じ顧客情報へ紐付け</span>
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

      <section className="public-info saas-store-info">
        <div>
          <p>導入店舗例</p>
          <strong>{data.store.name}</strong>
        </div>
        <div>
          <p>営業時間</p>
          <strong>{businessHours}</strong>
        </div>
        <div>
          <p>定休日</p>
          <strong>{closedDays}</strong>
        </div>
        <div>
          <p>連絡先</p>
          <strong>{publicPhone} / {data.store.email}</strong>
        </div>
      </section>

      <footer className="public-footer">
        <a href="/legal">特定商取引法に基づく表記</a>
        <a href="/privacy">プライバシーポリシー</a>
        <a href="/admin">管理画面</a>
      </footer>
    </main>
  );
}
