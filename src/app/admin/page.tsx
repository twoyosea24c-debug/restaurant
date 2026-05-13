import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addCustomer,
  addAdminUser,
  addProduct,
  addReplyTemplate,
  adjustStock,
  restoreBackup,
  saveBookingRules,
  saveDesign,
  saveNotificationSettings,
  saveStore,
  sendTestNotification,
  toggleModule,
  toggleProduct,
  updateCustomerNote,
  updateBookingStatus,
  updateInquiryStatus,
  updateOrderStatus,
  updateProduct,
  updateReplyTemplate,
  updateAdminUser,
} from "@/app/actions";
import { ShopClient } from "@/components/ShopClient";
import { logout } from "@/app/login/actions";
import {
  bookingStatuses,
  bookingStatusLabels,
  inquiryStatuses,
  inquiryStatusLabels,
  formatPrice,
  getAppData,
  orderStatuses,
  paymentStatusLabels,
  parseTags,
  stockMovementTypes,
  stockMovementTypeLabels,
  statusLabels,
  toBookingStatusKey,
  toInquiryStatusKey,
  toOrderStatusKey,
  toPaymentStatusKey,
  toStockMovementTypeKey,
} from "@/lib/data";
import { session, verifySessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    notice?: string;
    error?: string;
    bookingStatus?: string;
    orderStatus?: string;
    inquiryStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    stockView?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const verified = await verifySessionValue(cookieStore.get(session.name)?.value);
  if (!verified) redirect("/login");

  const { bookingStatus, dateFrom, dateTo, error, inquiryStatus, notice, orderStatus, q, stockView } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
  const inDateRange = (date: Date) => (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
  const data = await getAppData();
  const brandStyle = { "--brand": data.store.brandColor } as CSSProperties & Record<"--brand", string>;
  const filteredCustomers = query
    ? data.customers.filter((customer) =>
        [
          customer.name,
          customer.email,
          customer.phone ?? "",
          customer.tags,
          customer.memo,
          ...customer.bookings.map((booking) => booking.bookingNumber),
          ...customer.orders.map((order) => order.orderNumber),
          ...customer.inquiries.flatMap((inquiry) => [inquiry.inquiryNumber, inquiry.subject]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : data.customers;
  const filteredBookings = data.bookings.filter((booking) => {
    const matchesQuery = !query || [booking.bookingNumber, booking.customerName, booking.service.name, booking.note, booking.requestNote].join(" ").toLowerCase().includes(query);
    const matchesStatus = !bookingStatus || booking.status === bookingStatus;
    return matchesQuery && matchesStatus && inDateRange(booking.startAt);
  });
  const filteredInquiries = data.inquiries.filter((inquiry) => {
    const matchesQuery = !query || [inquiry.inquiryNumber, inquiry.customerName, inquiry.subject, inquiry.message, inquiry.responseNote].join(" ").toLowerCase().includes(query);
    const matchesStatus = !inquiryStatus || inquiry.status === inquiryStatus;
    return matchesQuery && matchesStatus && inDateRange(inquiry.createdAt);
  });
  const filteredOrders = data.orders.filter((order) => {
    const matchesQuery = !query || [order.orderNumber, order.customerName, order.note, ...order.items.map((item) => item.name)].join(" ").toLowerCase().includes(query);
    const matchesStatus = !orderStatus || order.status === orderStatus;
    return matchesQuery && matchesStatus && inDateRange(order.createdAt);
  });
  const filteredProducts = stockView === "low" ? data.products.filter((product) => product.stock <= 3) : data.products;
  const hasFilters = Boolean(query || bookingStatus || orderStatus || inquiryStatus || dateFrom || dateTo || stockView);
  const sampleCustomerCount = data.customers.filter((customer) => customer.email.endsWith("@example.com")).length;
  const sampleBookingCount = data.bookings.filter((booking) => booking.bookingNumber === "BKG-1001" || booking.note.includes("サンプル")).length;
  const sampleOrderCount = data.orders.filter((order) => order.orderNumber === "ORD-1001").length;
  const sampleDataCount = sampleCustomerCount + sampleBookingCount + sampleOrderCount;
  const readinessItems = [
    {
      done: data.store.phone !== "03-0000-0000",
      title: "電話番号",
      detail: data.store.phone !== "03-0000-0000" ? data.store.phone : "サンプル電話番号が残っています。",
    },
    {
      done: data.services.length > 0,
      title: "予約メニュー",
      detail: `${data.services.length}件登録済み`,
    },
    {
      done: data.products.length > 0,
      title: "商品",
      detail: `${data.products.length}件登録済み / 低在庫 ${data.dashboard.lowStockProducts.length}件`,
    },
    {
      done: Boolean(data.notificationSetting?.enabled && data.notificationSetting.notificationEmail),
      title: "メール通知",
      detail: data.notificationSetting?.enabled ? `通知先: ${data.notificationSetting.notificationEmail || data.store.email}` : "メール通知が無効です。",
    },
    {
      done: sampleDataCount === 0,
      title: "テストデータ",
      detail: sampleDataCount === 0 ? "サンプルらしいデータは見つかりません。" : `サンプル候補 ${sampleDataCount}件`,
    },
    {
      done: false,
      title: "独自ドメイン",
      detail: "VercelのDomainsとDNSで設定してください。",
    },
  ];

  return (
    <div className="shell" style={brandStyle}>
      <aside className="sidebar" aria-label="管理メニュー">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <p className="brand-name">Small Store Base</p>
            <p className="brand-meta">本番構成</p>
          </div>
        </div>
        <nav className="nav" aria-label="メイン">
          <a href="#dashboard">ダッシュボード</a>
          <a href="#shop">商品一覧</a>
          <a href="#calendar">予約カレンダー</a>
          <a href="#bookings">予約管理</a>
          <a href="#inquiries">問い合わせ</a>
          <a href="#templates">返信テンプレート</a>
          <a href="#customers">顧客</a>
          <a href="#products">商品管理</a>
          <a href="#stock">在庫管理</a>
          <a href="#orders">注文管理</a>
          <a href="#audit">監査ログ</a>
          <a href="#settings">設定</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Production Base</p>
            <h1>共通管理画面</h1>
          </div>
          <div className="topbar-actions">
            <a className="secondary-action" href="/">公開ページ</a>
            <form action={logout}>
              <button className="secondary-action" type="submit">ログアウト</button>
            </form>
          </div>
        </header>

        {notice ? <p className="notice-banner">{notice}</p> : null}
        {error ? <p className="notice-banner error-banner">{error}</p> : null}

        <section className="panel" id="launch-checklist">
          <div className="panel-head">
            <h2>公開前チェックリスト</h2>
            <span>{readinessItems.filter((item) => item.done).length}/{readinessItems.length} 完了</span>
          </div>
          <div className="checklist-grid">
            {readinessItems.map((item) => (
              <article className="checklist-item" key={item.title}>
                <span className={item.done ? "check-status done" : "check-status pending"}>
                  {item.done ? "完了" : "要確認"}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="table-actions" style={{ marginTop: 14 }}>
            <a className="secondary-action" href="#settings">店舗情報を編集</a>
            <a className="secondary-action" href="#products">商品を確認</a>
            <a className="secondary-action" href="/admin/backup">バックアップ取得</a>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>検索</h2>
            <span>顧客・予約・問い合わせ・注文</span>
          </div>
          <form className="filter-form" action="/admin">
            <label>
              キーワード
              <input name="q" defaultValue={q ?? ""} placeholder="名前、メール、電話、番号、件名" />
            </label>
            <label>
              予約状態
              <select name="bookingStatus" defaultValue={bookingStatus ?? ""}>
                <option value="">すべて</option>
                {bookingStatuses.map((status) => (
                  <option key={status} value={status}>{bookingStatusLabels[status]}</option>
                ))}
              </select>
            </label>
            <label>
              注文状態
              <select name="orderStatus" defaultValue={orderStatus ?? ""}>
                <option value="">すべて</option>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </label>
            <label>
              問い合わせ状態
              <select name="inquiryStatus" defaultValue={inquiryStatus ?? ""}>
                <option value="">すべて</option>
                {inquiryStatuses.map((status) => (
                  <option key={status} value={status}>{inquiryStatusLabels[status]}</option>
                ))}
              </select>
            </label>
            <label>
              開始日
              <input name="dateFrom" type="date" defaultValue={dateFrom ?? ""} />
            </label>
            <label>
              終了日
              <input name="dateTo" type="date" defaultValue={dateTo ?? ""} />
            </label>
            <label>
              在庫
              <select name="stockView" defaultValue={stockView ?? ""}>
                <option value="">すべて</option>
                <option value="low">低在庫のみ</option>
              </select>
            </label>
            <button type="submit">検索</button>
            {hasFilters ? (
              <a className="secondary-action" href="/admin">
                解除
              </a>
            ) : null}
          </form>
          {hasFilters ? (
            <p className="empty-state" style={{ marginTop: 12 }}>
              顧客 {filteredCustomers.length}件 / 予約 {filteredBookings.length}件 / 問い合わせ {filteredInquiries.length}件 / 注文 {filteredOrders.length}件 / 商品 {filteredProducts.length}件
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>CSV出力</h2>
            <span>顧客・予約・注文</span>
          </div>
          <div className="topbar-actions">
            <a className="secondary-action" href="/admin/export/customers">顧客CSV</a>
            <a className="secondary-action" href="/admin/export/bookings">予約CSV</a>
            <a className="secondary-action" href="/admin/export/orders">注文CSV</a>
          </div>
        </section>

        <section id="dashboard">
          <div className="metrics">
            <article className="metric">
              <p>顧客数</p>
              <strong>{data.dashboard.customerCount}</strong>
            </article>
            <article className="metric">
              <p>有効モジュール</p>
              <strong>{data.dashboard.enabledModuleCount}</strong>
            </article>
            <article className="metric">
              <p>予約数</p>
              <strong>{data.dashboard.bookingCount}</strong>
            </article>
            <article className="metric">
              <p>注文数</p>
              <strong>{data.dashboard.orderCount}</strong>
            </article>
            <article className="metric">
              <p>問い合わせ</p>
              <strong>{data.dashboard.inquiryCount}</strong>
            </article>
            <article className="metric">
              <p>商品数</p>
              <strong>{data.products.length}</strong>
            </article>
            <article className="metric">
              <p>売上見込み</p>
              <strong>{formatPrice(data.dashboard.salesTotal)}</strong>
            </article>
            <article className="metric">
              <p>低在庫</p>
              <strong>{data.dashboard.lowStockProducts.length}</strong>
            </article>
          </div>

          <div className="dashboard-grid" style={{ marginTop: 22 }}>
            <section className="panel">
              <div className="panel-head">
                <h2>注文状況</h2>
                <span>ステータス別</span>
              </div>
              <div className="status-grid">
                {data.dashboard.statusSummaries.map((summary) => (
                  <article className="status-card" key={summary.status}>
                    <p>{summary.label}</p>
                    <strong>{summary.count}件</strong>
                    <span>{formatPrice(summary.total)}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>低在庫</h2>
                <span>在庫3点以下</span>
              </div>
              {data.dashboard.lowStockProducts.length === 0 ? (
                <p className="empty-state">低在庫の商品はありません。</p>
              ) : (
                data.dashboard.lowStockProducts.map((product) => (
                  <article className="history-item" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.active ? "公開中" : "非公開"} / {formatPrice(product.price)}</p>
                    </div>
                    <span className="status-badge">在庫 {product.stock}</span>
                  </article>
                ))
              )}
            </section>
          </div>

          <section className="panel" style={{ marginTop: 22 }}>
            <div className="panel-head">
              <h2>最近の注文</h2>
              <span>直近5件</span>
            </div>
            {data.dashboard.recentOrders.length === 0 ? (
              <p className="empty-state">最近の注文はありません。</p>
            ) : (
              data.dashboard.recentOrders.map((order) => (
                <article className="history-item" key={order.id}>
                  <div>
                    <strong>{order.customerName}</strong>
                    <p>
                      {order.orderNumber} / {order.items.map((item) => `${item.name} x ${item.quantity}`).join("、")}
                    </p>
                  </div>
                  <div className="history-meta">
                    <span className="status-badge">{statusLabels[toOrderStatusKey(order.status)]}</span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>
                </article>
              ))
            )}
          </section>
        </section>

        <ShopClient products={data.activeProducts} />

        <section id="calendar" className="panel">
          <div className="panel-head">
            <h2>予約カレンダー</h2>
            <span>直近7日間</span>
          </div>
          <div className="module-grid">
            {data.calendarDays.map((day) => (
              <article className="module-card" key={day.date.toISOString()}>
                <h3>{day.date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })}</h3>
                {day.bookings.length === 0 ? (
                  <p className="empty-state">予約なし</p>
                ) : (
                  day.bookings.map((booking) => (
                    <article className="history-item" key={booking.id}>
                      <div>
                        <strong>{booking.startAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</strong>
                        <p>
                          <a href={`/admin/bookings/${booking.id}`}>{booking.customerName}</a> / {booking.service.name}
                        </p>
                      </div>
                      <span className="status-badge">{bookingStatusLabels[toBookingStatusKey(booking.status)]}</span>
                    </article>
                  ))
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="bookings" className="panel">
          <div className="panel-head">
            <h2>予約管理</h2>
            <span>受付・変更依頼・キャンセル依頼</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>予約番号</th>
                  <th>顧客</th>
                  <th>メニュー</th>
                  <th>希望日時</th>
                  <th>状態</th>
                  <th>依頼メモ</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.bookingNumber}</strong>
                      <p>
                        <a className="secondary-action" href={`/admin/bookings/${booking.id}`}>
                          詳細
                        </a>
                      </p>
                    </td>
                    <td>{booking.customerName}</td>
                    <td>{booking.service.name}</td>
                    <td>{booking.startAt.toLocaleString("ja-JP")}</td>
                    <td>
                      <form action={updateBookingStatus}>
                        <input name="bookingId" type="hidden" value={booking.id} />
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

        <section id="customers" className="panel">
          <div className="panel-head">
            <h2>顧客</h2>
            <span>予約・注文・問い合わせの共通軸</span>
          </div>
          <form action={addCustomer} className="form-grid">
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
            <button type="submit">追加</button>
          </form>
          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table>
              <thead>
                <tr>
                  <th>名前</th>
                  <th>メール</th>
                  <th>電話</th>
                  <th>履歴</th>
                  <th>タグ・メモ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const orderTotal = customer.orders.reduce((sum, order) => sum + order.total, 0);
                  return (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.name}</strong>
                        <p>
                          <a className="secondary-action" href={`/admin/customers/${customer.id}`}>
                            詳細
                          </a>
                        </p>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>
                        予約 {customer.bookings.length}件 / 注文 {customer.orders.length}件 / 問い合わせ{" "}
                        {customer.inquiries.length}件 / 購入 {formatPrice(orderTotal)}
                      </td>
                      <td>
                        <div className="tag-list">
                          {parseTags(customer.tags).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                        <form action={updateCustomerNote} className="settings-form" style={{ marginTop: 10 }}>
                          <input name="customerId" type="hidden" value={customer.id} />
                          <label>
                            タグ
                            <input name="tags" defaultValue={customer.tags} />
                          </label>
                          <label>
                            メモ
                            <textarea name="memo" rows={3} defaultValue={customer.memo} />
                          </label>
                          <button type="submit">保存</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section id="inquiries" className="panel">
          <div className="panel-head">
            <h2>問い合わせ管理</h2>
            <span>顧客情報と連携</span>
          </div>
          <div className="summary-strip">
            <div>
              <p>問い合わせ数</p>
              <strong>{filteredInquiries.length}件</strong>
            </div>
            <div>
              <p>未対応</p>
              <strong>{filteredInquiries.filter((inquiry) => inquiry.status === "NEW").length}件</strong>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>問い合わせID</th>
                  <th>顧客</th>
                  <th>件名</th>
                  <th>内容</th>
                  <th>状態</th>
                  <th>対応メモ</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>
                      <strong>{inquiry.inquiryNumber}</strong>
                      <p>
                        <a className="secondary-action" href={`/admin/inquiries/${inquiry.id}`}>
                          詳細
                        </a>
                      </p>
                    </td>
                    <td>{inquiry.customerName}</td>
                    <td>{inquiry.subject}</td>
                    <td>{inquiry.message}</td>
                    <td>
                      <span className="status-badge">{inquiryStatusLabels[toInquiryStatusKey(inquiry.status)]}</span>
                    </td>
                    <td>
                      <form action={updateInquiryStatus} className="settings-form">
                        <input name="inquiryId" type="hidden" value={inquiry.id} />
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

        <section id="templates" className="panel">
          <div className="panel-head">
            <h2>返信テンプレート</h2>
            <span>問い合わせ対応の下書き</span>
          </div>
          <form action={addReplyTemplate} className="form-grid">
            <label>
              タイトル
              <input name="title" required placeholder="予約変更への返信" />
            </label>
            <label>
              本文
              <textarea name="body" rows={3} required placeholder="お問い合わせありがとうございます。" />
            </label>
            <button type="submit">追加</button>
          </form>
          <div className="module-grid" style={{ marginTop: 18 }}>
            {data.replyTemplates.map((template) => (
              <article className="module-card" key={template.id}>
                <h3>{template.title}</h3>
                <p>{template.body}</p>
                <span className="module-status">{template.active ? "有効" : "無効"}</span>
                <form action={updateReplyTemplate} className="settings-form" style={{ marginTop: 12 }}>
                  <input name="templateId" type="hidden" value={template.id} />
                  <label>
                    タイトル
                    <input name="title" defaultValue={template.title} required />
                  </label>
                  <label>
                    本文
                    <textarea name="body" rows={4} defaultValue={template.body} required />
                  </label>
                  <label>
                    状態
                    <select name="active" defaultValue={String(template.active)}>
                      <option value="true">有効</option>
                      <option value="false">無効</option>
                    </select>
                  </label>
                  <button type="submit">保存</button>
                </form>
              </article>
            ))}
          </div>
        </section>

        <section id="products" className="panel">
          <div className="panel-head">
            <h2>商品管理</h2>
            <span>追加・公開設定・価格・在庫</span>
          </div>
          <div className="summary-strip">
            <div>
              <p>登録商品</p>
              <strong>{data.products.length}件</strong>
            </div>
            <div>
              <p>公開中</p>
              <strong>{data.products.filter((product) => product.active).length}件</strong>
            </div>
          </div>

          <section className="product-admin-layout">
            <form action={addProduct} className="settings-form product-create-form">
              <div className="panel-head">
                <h3>商品を追加</h3>
                <span>追加後すぐ公開できます</span>
              </div>
              <label>
                商品名
                <input name="name" placeholder="例: ギフト用ハーブティー" required />
              </label>
              <label>
                説明
                <textarea name="description" rows={3} placeholder="商品内容、受け取り方法、注意事項など" required />
              </label>
              <div className="form-grid product-inline-fields">
                <label>
                  価格
                  <input name="price" type="number" min="0" step="1" placeholder="1600" required />
                </label>
                <label>
                  初期在庫
                  <input name="stock" type="number" min="0" step="1" placeholder="10" required />
                </label>
                <label>
                  公開状態
                  <select name="active" defaultValue="true">
                    <option value="true">公開</option>
                    <option value="false">非公開</option>
                  </select>
                </label>
              </div>
              <button type="submit">商品を追加</button>
            </form>

            <div className="product-admin-list">
            {filteredProducts.map((product) => (
              <article className="product-admin-card" key={product.id}>
                <div className="product-admin-head">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                  </div>
                  <span className="module-status">{product.active ? "公開" : "非公開"}</span>
                </div>
                <div className="summary-strip product-admin-stats">
                  <div>
                    <p>価格</p>
                    <strong>{formatPrice(product.price)}</strong>
                  </div>
                  <div>
                    <p>在庫</p>
                    <strong>{product.stock}</strong>
                  </div>
                </div>
                <form action={updateProduct} className="settings-form" style={{ marginTop: 12 }}>
                  <input name="productId" type="hidden" value={product.id} />
                  <label>
                    商品名
                    <input name="name" defaultValue={product.name} required />
                  </label>
                  <label>
                    価格
                    <input name="price" type="number" defaultValue={product.price} required />
                  </label>
                  <label>
                    在庫
                    <input name="stock" type="number" defaultValue={product.stock} required />
                  </label>
                  <label>
                    説明
                    <textarea name="description" rows={3} defaultValue={product.description} required />
                  </label>
                  <label>
                    公開状態
                    <select name="active" defaultValue={String(product.active)}>
                      <option value="true">公開</option>
                      <option value="false">非公開</option>
                    </select>
                  </label>
                  <button type="submit">保存</button>
                </form>
                <form action={toggleProduct} style={{ marginTop: 10 }}>
                  <input name="productId" type="hidden" value={product.id} />
                  <button className="secondary-action" type="submit">
                    {product.active ? "非公開にする" : "公開する"}
                  </button>
                </form>
              </article>
            ))}
            {filteredProducts.length === 0 ? <p className="empty-state">条件に一致する商品はありません。</p> : null}
            </div>
          </section>
        </section>

        <section id="stock" className="panel">
          <div className="panel-head">
            <h2>在庫管理</h2>
            <span>入庫・出庫・棚卸調整</span>
          </div>
          <form action={adjustStock} className="form-grid">
            <label>
              商品
              <select name="productId" required>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} / 現在 {product.stock}
                  </option>
                ))}
              </select>
            </label>
            <label>
              種別
              <select name="type" defaultValue="IN">
                {stockMovementTypes.map((type) => (
                  <option key={type} value={type}>
                    {stockMovementTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              数量
              <input name="quantity" type="number" min="0" step="1" required />
            </label>
            <label>
              メモ
              <input name="note" placeholder="仕入れ、破損、棚卸など" />
            </label>
            <button type="submit">記録</button>
          </form>

          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>商品</th>
                  <th>種別</th>
                  <th>数量</th>
                  <th>在庫</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {data.stockMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.createdAt.toLocaleString("ja-JP")}</td>
                    <td>{movement.product.name}</td>
                    <td>
                      <span className="status-badge">{stockMovementTypeLabels[toStockMovementTypeKey(movement.type)]}</span>
                    </td>
                    <td>{movement.quantity}</td>
                    <td>
                      {movement.stockBefore} → {movement.stockAfter}
                    </td>
                    <td>{movement.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="orders" className="panel">
          <div className="panel-head">
            <h2>注文管理</h2>
            <span>予約と同じ顧客情報に紐付く注文</span>
          </div>
          <div className="summary-strip">
            <div>
              <p>注文数</p>
              <strong>{filteredOrders.length}件</strong>
            </div>
            <div>
              <p>合計</p>
              <strong>{formatPrice(filteredOrders.reduce((sum, order) => sum + order.total, 0))}</strong>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>注文ID</th>
                  <th>顧客</th>
                  <th>商品</th>
                  <th>合計</th>
                  <th>状態</th>
                  <th>決済</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      <p>
                        <a className="secondary-action" href={`/admin/orders/${order.id}`}>
                          詳細
                        </a>
                      </p>
                    </td>
                    <td>{order.customerName}</td>
                    <td>{order.items.map((item) => `${item.name} x ${item.quantity}`).join(" / ")}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td>
                      <form action={updateOrderStatus}>
                        <input name="orderId" type="hidden" value={order.id} />
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
                      <span className="status-badge">
                        {paymentStatusLabels[toPaymentStatusKey(order.payment?.status)]}
                      </span>
                    </td>
                    <td>{order.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="audit" className="panel">
          <div className="panel-head">
            <h2>監査ログ</h2>
            <span>直近50件</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>担当</th>
                  <th>操作</th>
                  <th>対象</th>
                  <th>内容</th>
                </tr>
              </thead>
              <tbody>
                {data.auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.createdAt.toLocaleString("ja-JP")}</td>
                    <td>{log.actor}</td>
                    <td>
                      <span className="status-badge">{log.action}</span>
                    </td>
                    <td>
                      {log.targetType} / {log.targetId}
                    </td>
                    <td>{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.auditLogs.length === 0 ? <p className="empty-state">監査ログはまだありません。</p> : null}
        </section>

        <section id="settings" className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>店舗情報</h2>
              <span>公開ページと管理画面で共通利用</span>
            </div>
            <form action={saveStore} className="settings-form">
              <label>
                店舗名
                <input name="name" defaultValue={data.store.name} required />
              </label>
              <label>
                紹介文
                <textarea name="description" rows={4} defaultValue={data.store.description} />
              </label>
              <label>
                電話
                <input name="phone" defaultValue={data.store.phone} />
              </label>
              <label>
                メール
                <input name="email" type="email" defaultValue={data.store.email} />
              </label>
              <button type="submit">保存</button>
            </form>
            <form action={sendTestNotification} className="settings-form" style={{ marginTop: 12 }}>
              <button className="secondary-action" type="submit">
                テストメールを送信
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>デザイン・機能</h2>
              <span>共通設定</span>
            </div>
            <form action={saveDesign} className="settings-form">
              <label>
                ブランドカラー
                <input name="brandColor" type="color" defaultValue={data.store.brandColor} />
              </label>
              <label>
                ボタン表示名
                <input name="ctaLabel" defaultValue={data.store.ctaLabel} />
              </label>
              <button type="submit">反映</button>
            </form>
            <div className="module-grid" style={{ marginTop: 18 }}>
              {data.modules.map((module) => (
                <article className="module-card" key={module.key}>
                  <h3>{module.name}</h3>
                  <p>{module.description}</p>
                  <span className="module-status">{module.enabled ? "有効" : "無効"}</span>
                  <form action={toggleModule} style={{ marginTop: 12 }}>
                    <input name="key" type="hidden" value={module.key} />
                    <button className="secondary-action" type="submit">
                      {module.enabled ? "停止" : "有効化"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>予約受付ルール</h2>
              <span>営業時間・定休日</span>
            </div>
            <form action={saveBookingRules} className="settings-form">
              <label>
                開始時刻
                <input name="businessOpenTime" type="time" defaultValue={data.store.businessOpenTime} />
              </label>
              <label>
                終了時刻
                <input name="businessCloseTime" type="time" defaultValue={data.store.businessCloseTime} />
              </label>
              <label>
                定休日
                <span className="table-actions">
                  {["日", "月", "火", "水", "木", "金", "土"].map((label, index) => (
                    <label key={label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <input
                        name="closedWeekdays"
                        type="checkbox"
                        value={index}
                        defaultChecked={data.store.closedWeekdays.split(",").includes(String(index))}
                        style={{ width: "auto" }}
                      />
                      {label}
                    </label>
                  ))}
                </span>
              </label>
              <button type="submit">保存</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>メール通知</h2>
              <span>予約・注文・問い合わせ</span>
            </div>
            <form action={saveNotificationSettings} className="settings-form">
              <label>
                <span>
                  <input
                    name="enabled"
                    type="checkbox"
                    defaultChecked={data.notificationSetting?.enabled ?? false}
                    style={{ width: "auto", marginRight: 8 }}
                  />
                  管理画面のSMTP設定を使う
                </span>
              </label>
              <label>
                SMTPホスト
                <input name="smtpHost" defaultValue={data.notificationSetting?.smtpHost ?? ""} placeholder="smtp.example.com" />
              </label>
              <label>
                SMTPポート
                <input name="smtpPort" type="number" defaultValue={data.notificationSetting?.smtpPort ?? 587} />
              </label>
              <label>
                SMTPユーザー
                <input name="smtpUser" defaultValue={data.notificationSetting?.smtpUser ?? ""} />
              </label>
              <label>
                SMTPパスワード
                <input name="smtpPass" type="password" placeholder={data.notificationSetting?.smtpPass ? "変更する場合のみ入力" : ""} />
              </label>
              <label>
                送信元
                <input name="mailFrom" defaultValue={data.notificationSetting?.mailFrom ?? ""} placeholder="Small Store <noreply@example.com>" />
              </label>
              <label>
                通知先
                <input name="notificationEmail" type="email" defaultValue={data.notificationSetting?.notificationEmail ?? ""} placeholder={data.store.email} />
              </label>
              <button type="submit">保存</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>バックアップ/復元</h2>
              <span>JSON</span>
            </div>
            <div className="topbar-actions">
              <a className="secondary-action" href="/admin/backup">バックアップを取得</a>
            </div>
            <form action={restoreBackup} className="settings-form" style={{ marginTop: 16 }}>
              <label>
                復元JSON
                <textarea name="backupJson" rows={6} placeholder="バックアップJSONを貼り付け" />
              </label>
              <button type="submit">復元</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>権限管理</h2>
              <span>スタッフログイン</span>
            </div>
            <form action={addAdminUser} className="settings-form">
              <label>
                名前
                <input name="name" required />
              </label>
              <label>
                メール
                <input name="email" type="email" required />
              </label>
              <label>
                パスワード
                <input name="password" type="password" required />
              </label>
              <label>
                権限
                <select name="role" defaultValue="staff">
                  <option value="manager">管理者</option>
                  <option value="staff">スタッフ</option>
                  <option value="viewer">閲覧のみ</option>
                </select>
              </label>
              <button type="submit">追加</button>
            </form>
            <div className="module-grid" style={{ marginTop: 18 }}>
              {data.adminUsers.map((user) => (
                <article className="module-card" key={user.id}>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className="module-status">{user.active ? user.role : "停止中"}</span>
                  <form action={updateAdminUser} className="settings-form" style={{ marginTop: 12 }}>
                    <input name="adminUserId" type="hidden" value={user.id} />
                    <label>
                      名前
                      <input name="name" defaultValue={user.name} required />
                    </label>
                    <label>
                      権限
                      <select name="role" defaultValue={user.role}>
                        <option value="manager">管理者</option>
                        <option value="staff">スタッフ</option>
                        <option value="viewer">閲覧のみ</option>
                      </select>
                    </label>
                    <label>
                      状態
                      <select name="active" defaultValue={String(user.active)}>
                        <option value="true">有効</option>
                        <option value="false">停止</option>
                      </select>
                    </label>
                    <label>
                      新パスワード
                      <input name="password" type="password" placeholder="変更時のみ" />
                    </label>
                    <button type="submit">保存</button>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section id="public" className="public-preview">
          <div>
            <p className="eyebrow">公開ページ</p>
            <h2>{data.store.name}</h2>
            <p>{data.store.description}</p>
          </div>
          <a className="primary-action" href="#shop">
            {data.store.ctaLabel}
          </a>
        </section>
      </main>
    </div>
  );
}
