import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addCustomer,
  addAdminUser,
  addPageSection,
  addProduct,
  addReplyTemplate,
  adjustStock,
  deleteProduct,
  restoreBackup,
  saveBookingRules,
  saveDesign,
  saveNotificationSettings,
  savePaymentProviderSettings,
  saveStore,
  sendTestNotification,
  toggleModule,
  toggleProduct,
  updateCustomerNote,
  updateBookingStatus,
  updateInquiryStatus,
  updateOrderStatus,
  updatePageSection,
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
  paymentProviderLabels,
  paymentProviders,
  pageSectionTypeLabels,
  pageSectionTypes,
  lpDesignPresetDescriptions,
  lpDesignPresetLabels,
  lpDesignPresets,
  parseTags,
  stockMovementTypes,
  stockMovementTypeLabels,
  statusLabels,
  toBookingStatusKey,
  toInquiryStatusKey,
  toOrderStatusKey,
  toPaymentStatusKey,
  toPaymentProviderKey,
  toPageSectionTypeKey,
  toLpDesignPresetKey,
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
          <a href="#lp-builder">LP編集</a>
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

        <details className="panel collapsible-panel" id="launch-checklist" open>
          <summary className="panel-head collapsible-summary">
            <h2>公開前チェックリスト</h2>
            <span>{readinessItems.filter((item) => item.done).length}/{readinessItems.length} 完了</span>
          </summary>
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
        </details>

        <details className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>検索</h2>
            <span>顧客・予約・問い合わせ・注文</span>
          </summary>
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
        </details>

        <details className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>CSV出力</h2>
            <span>顧客・予約・注文</span>
          </summary>
          <div className="topbar-actions">
            <a className="secondary-action" href="/admin/export/customers">顧客CSV</a>
            <a className="secondary-action" href="/admin/export/bookings">予約CSV</a>
            <a className="secondary-action" href="/admin/export/orders">注文CSV</a>
          </div>
        </details>

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
            <details className="panel collapsible-panel" open>
              <summary className="panel-head collapsible-summary">
                <h2>注文状況</h2>
                <span>ステータス別</span>
              </summary>
              <div className="status-grid">
                {data.dashboard.statusSummaries.map((summary) => (
                  <article className="status-card" key={summary.status}>
                    <p>{summary.label}</p>
                    <strong>{summary.count}件</strong>
                    <span>{formatPrice(summary.total)}</span>
                  </article>
                ))}
              </div>
            </details>

            <details className="panel collapsible-panel" open>
              <summary className="panel-head collapsible-summary">
                <h2>低在庫</h2>
                <span>在庫3点以下</span>
              </summary>
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
            </details>
          </div>

          <details className="panel collapsible-panel" style={{ marginTop: 22 }} open>
            <summary className="panel-head collapsible-summary">
              <h2>最近の注文</h2>
              <span>直近5件</span>
            </summary>
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
          </details>
        </section>

        <ShopClient paymentProviderSetting={data.paymentProviderSetting} products={data.activeProducts} />

        <details id="calendar" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>予約カレンダー</h2>
            <span>直近7日間</span>
          </summary>
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
        </details>

        <details id="bookings" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>予約管理</h2>
            <span>受付・変更依頼・キャンセル依頼</span>
          </summary>
          <div className="switch-list booking-admin-list">
            <div className="product-view-switch" aria-label="予約一覧の表示切替">
              <input id="booking-view-list" name="bookingView" type="radio" defaultChecked />
              <label htmlFor="booking-view-list">縦列</label>
              <input id="booking-view-card" name="bookingView" type="radio" />
              <label htmlFor="booking-view-card">カード</label>
            </div>
            <div className="table-wrap switch-table">
              <table className="compact-admin-table">
                <thead>
                  <tr>
                    <th>予約番号</th>
                    <th>顧客</th>
                    <th>メニュー</th>
                    <th>希望日時</th>
                    <th>状態</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td><strong>{booking.bookingNumber}</strong></td>
                      <td>{booking.customerName}</td>
                      <td>{booking.service.name}</td>
                      <td>{booking.startAt.toLocaleString("ja-JP")}</td>
                      <td><span className="status-badge">{bookingStatusLabels[toBookingStatusKey(booking.status)]}</span></td>
                      <td><a className="secondary-action" href={`/admin/bookings/${booking.id}`}>詳細</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="switch-card-list">
              {filteredBookings.map((booking) => (
                <article className="switch-card" key={booking.id}>
                  <div className="switch-card-head">
                    <div>
                      <h3>{booking.bookingNumber}</h3>
                      <p>{booking.customerName} / {booking.service.name}</p>
                    </div>
                    <span className="status-badge">{bookingStatusLabels[toBookingStatusKey(booking.status)]}</span>
                  </div>
                  <p className="empty-state">{booking.startAt.toLocaleString("ja-JP")} / {booking.requestNote || booking.note || "メモなし"}</p>
                  <form action={updateBookingStatus} className="settings-form">
                    <input name="bookingId" type="hidden" value={booking.id} />
                    <input name="returnTo" type="hidden" value="/admin#bookings" />
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
                  <a className="secondary-action" href={`/admin/bookings/${booking.id}`}>詳細ページ</a>
                </article>
              ))}
            </div>
          </div>
        </details>

        <details id="customers" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>顧客</h2>
            <span>予約・注文・問い合わせの共通軸</span>
          </summary>
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
          <div className="customer-admin-list">
            <div className="product-view-switch" aria-label="顧客一覧の表示切替">
              <input id="customer-view-list" name="customerView" type="radio" defaultChecked />
              <label htmlFor="customer-view-list">縦列</label>
              <input id="customer-view-card" name="customerView" type="radio" />
              <label htmlFor="customer-view-card">カード</label>
            </div>

            <div className="table-wrap customer-table-wrap">
              <table className="customer-admin-table">
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>メール</th>
                    <th>電話</th>
                    <th>履歴</th>
                    <th>タグ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const orderTotal = customer.orders.reduce((sum, order) => sum + order.total, 0);
                    return (
                      <tr key={customer.id}>
                        <td><strong>{customer.name}</strong></td>
                        <td>{customer.email}</td>
                        <td>{customer.phone || "-"}</td>
                        <td>
                          予約 {customer.bookings.length} / 注文 {customer.orders.length} / 問い合わせ {customer.inquiries.length} / {formatPrice(orderTotal)}
                        </td>
                        <td>
                          <div className="tag-list compact-tags">
                            {parseTags(customer.tags).length === 0 ? <span>タグなし</span> : parseTags(customer.tags).map((tag) => <span key={tag}>{tag}</span>)}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions compact-actions">
                            <a className="secondary-action" href={`/admin/customers/${customer.id}`}>詳細</a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="customer-card-list">
              {filteredCustomers.map((customer) => {
                const orderTotal = customer.orders.reduce((sum, order) => sum + order.total, 0);
                return (
                  <article className="customer-list-card" key={customer.id}>
                    <div className="customer-card-head">
                      <div>
                        <h3>{customer.name}</h3>
                        <p>{customer.email} / {customer.phone || "電話未登録"}</p>
                      </div>
                      <a className="secondary-action" href={`/admin/customers/${customer.id}`}>詳細</a>
                    </div>
                    <div className="summary-strip customer-card-summary">
                      <div>
                        <p>予約</p>
                        <strong>{customer.bookings.length}</strong>
                      </div>
                      <div>
                        <p>注文</p>
                        <strong>{customer.orders.length}</strong>
                      </div>
                      <div>
                        <p>問い合わせ</p>
                        <strong>{customer.inquiries.length}</strong>
                      </div>
                      <div>
                        <p>購入</p>
                        <strong>{formatPrice(orderTotal)}</strong>
                      </div>
                    </div>
                    <div className="tag-list">
                      {parseTags(customer.tags).length === 0 ? <span>タグなし</span> : parseTags(customer.tags).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <form action={updateCustomerNote} className="settings-form">
                      <input name="customerId" type="hidden" value={customer.id} />
                      <input name="returnTo" type="hidden" value="/admin#customers" />
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
                  </article>
                );
              })}
            </div>
          </div>
        </details>

        <details id="inquiries" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>問い合わせ管理</h2>
            <span>顧客情報と連携</span>
          </summary>
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
          <div className="switch-list inquiry-admin-list">
            <div className="product-view-switch" aria-label="問い合わせ一覧の表示切替">
              <input id="inquiry-view-list" name="inquiryView" type="radio" defaultChecked />
              <label htmlFor="inquiry-view-list">縦列</label>
              <input id="inquiry-view-card" name="inquiryView" type="radio" />
              <label htmlFor="inquiry-view-card">カード</label>
            </div>
            <div className="table-wrap switch-table">
              <table className="compact-admin-table">
                <thead>
                  <tr>
                    <th>問い合わせID</th>
                    <th>顧客</th>
                    <th>件名</th>
                    <th>内容</th>
                    <th>状態</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id}>
                      <td><strong>{inquiry.inquiryNumber}</strong></td>
                      <td>{inquiry.customerName}</td>
                      <td>{inquiry.subject}</td>
                      <td className="compact-text">{inquiry.message}</td>
                      <td><span className="status-badge">{inquiryStatusLabels[toInquiryStatusKey(inquiry.status)]}</span></td>
                      <td><a className="secondary-action" href={`/admin/inquiries/${inquiry.id}`}>詳細</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="switch-card-list">
              {filteredInquiries.map((inquiry) => (
                <article className="switch-card" key={inquiry.id}>
                  <div className="switch-card-head">
                    <div>
                      <h3>{inquiry.subject}</h3>
                      <p>{inquiry.inquiryNumber} / {inquiry.customerName}</p>
                    </div>
                    <span className="status-badge">{inquiryStatusLabels[toInquiryStatusKey(inquiry.status)]}</span>
                  </div>
                  <p className="empty-state">{inquiry.message}</p>
                  <form action={updateInquiryStatus} className="settings-form">
                    <input name="inquiryId" type="hidden" value={inquiry.id} />
                    <input name="returnTo" type="hidden" value="/admin#inquiries" />
                    <label>
                      状態
                      <select name="status" defaultValue={inquiry.status}>
                        {inquiryStatuses.map((status) => (
                          <option key={status} value={status}>{inquiryStatusLabels[status]}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      メモ
                      <textarea name="responseNote" rows={3} defaultValue={inquiry.responseNote} />
                    </label>
                    <button type="submit">保存</button>
                  </form>
                  <a className="secondary-action" href={`/admin/inquiries/${inquiry.id}`}>詳細ページ</a>
                </article>
              ))}
            </div>
          </div>
        </details>

        <details id="templates" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>返信テンプレート</h2>
            <span>問い合わせ対応の下書き</span>
          </summary>
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
          <div className="switch-list template-admin-list">
            <div className="product-view-switch" aria-label="返信テンプレート一覧の表示切替">
              <input id="template-view-list" name="templateView" type="radio" defaultChecked />
              <label htmlFor="template-view-list">縦列</label>
              <input id="template-view-card" name="templateView" type="radio" />
              <label htmlFor="template-view-card">カード</label>
            </div>
            <div className="table-wrap switch-table">
              <table className="compact-admin-table">
                <thead>
                  <tr>
                    <th>タイトル</th>
                    <th>本文</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {data.replyTemplates.map((template) => (
                    <tr key={template.id}>
                      <td><strong>{template.title}</strong></td>
                      <td className="compact-text">{template.body}</td>
                      <td><span className="module-status">{template.active ? "有効" : "無効"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="switch-card-list">
              {data.replyTemplates.map((template) => (
                <article className="switch-card" key={template.id}>
                  <div className="switch-card-head">
                    <div>
                      <h3>{template.title}</h3>
                      <p>{template.body}</p>
                    </div>
                    <span className="module-status">{template.active ? "有効" : "無効"}</span>
                  </div>
                  <form action={updateReplyTemplate} className="settings-form">
                    <input name="templateId" type="hidden" value={template.id} />
                    <input name="returnTo" type="hidden" value="/admin#templates" />
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
          </div>
        </details>

        <details id="products" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>商品管理</h2>
            <span>追加・公開設定・価格・在庫</span>
          </summary>
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
              <div className="product-view-switch" aria-label="商品一覧の表示切替">
                <input id="product-view-list" name="productView" type="radio" defaultChecked />
                <label htmlFor="product-view-list">縦列</label>
                <input id="product-view-card" name="productView" type="radio" />
                <label htmlFor="product-view-card">カード</label>
              </div>

              <div className="table-wrap product-table-wrap">
                <table className="product-admin-table">
                  <thead>
                    <tr>
                      <th>商品名</th>
                      <th>価格</th>
                      <th>在庫</th>
                      <th>状態</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <a className="product-row-link" href={`#product-detail-${product.id}`}>
                            <strong>{product.name}</strong>
                            <span>{product.description}</span>
                          </a>
                        </td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span className="module-status">{product.active ? "公開中" : "非公開"}</span>
                        </td>
                        <td>
                          <div className="table-actions compact-actions">
                            <a className="secondary-action" href={`#product-detail-${product.id}`}>確認</a>
                            <form action={toggleProduct}>
                              <input name="productId" type="hidden" value={product.id} />
                              <input name="returnTo" type="hidden" value="/admin#products" />
                              <button className="secondary-action" type="submit">
                                {product.active ? "非公開" : "公開"}
                              </button>
                            </form>
                            <form action={deleteProduct}>
                              <input name="productId" type="hidden" value={product.id} />
                              <input name="returnTo" type="hidden" value="/admin#products" />
                              <button className="secondary-action danger-action" type="submit">削除</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="product-card-list">
                {filteredProducts.map((product) => (
                  <a className="product-list-card" href={`#product-detail-${product.id}`} key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.description}</span>
                    </div>
                    <div>
                      <strong>{formatPrice(product.price)}</strong>
                      <span>在庫 {product.stock} / {product.active ? "公開中" : "非公開"}</span>
                    </div>
                  </a>
                ))}
              </div>
              {filteredProducts.length === 0 ? <p className="empty-state">条件に一致する商品はありません。</p> : null}
              <div className="product-detail-stack">
                {filteredProducts.map((product, index) => (
                  <article className="product-detail-card" id={`product-detail-${product.id}`} key={product.id}>
                    <div className="product-detail-summary">
                      <div>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                      </div>
                      <div className="product-detail-price">
                        <strong>{formatPrice(product.price)}</strong>
                        <span>在庫 {product.stock} / {product.active ? "公開中" : "非公開"}</span>
                      </div>
                    </div>
                    <form action={updateProduct} className="settings-form product-detail-edit">
                      <input name="productId" type="hidden" value={product.id} />
                      <input name="returnTo" type="hidden" value={`/admin?selectedProduct=${index}#product-detail-${product.id}`} />
                      <label>
                        商品名
                        <input name="name" defaultValue={product.name} required />
                      </label>
                      <label>
                        説明
                        <textarea name="description" rows={3} defaultValue={product.description} required />
                      </label>
                      <div className="form-grid product-inline-fields">
                        <label>
                          価格
                          <input name="price" type="number" min="0" step="1" defaultValue={product.price} required />
                        </label>
                        <label>
                          在庫
                          <input name="stock" type="number" min="0" step="1" defaultValue={product.stock} required />
                        </label>
                        <label>
                          公開状態
                          <select name="active" defaultValue={String(product.active)}>
                            <option value="true">公開</option>
                            <option value="false">非公開</option>
                          </select>
                        </label>
                      </div>
                      <button type="submit">保存</button>
                    </form>
                    <div className="product-detail-actions">
                      <a className="secondary-action" href={`/admin/products/${product.id}`}>個別ページ</a>
                      <form action={toggleProduct}>
                        <input name="productId" type="hidden" value={product.id} />
                        <input name="returnTo" type="hidden" value={`/admin?selectedProduct=${index}#product-detail-${product.id}`} />
                        <button className="secondary-action" type="submit">
                          {product.active ? "非公開にする" : "公開する"}
                        </button>
                      </form>
                      <form action={deleteProduct}>
                        <input name="productId" type="hidden" value={product.id} />
                        <input name="returnTo" type="hidden" value="/admin#products" />
                        <button className="secondary-action danger-action" type="submit">削除</button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </details>

        <details id="stock" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>在庫管理</h2>
            <span>入庫・出庫・棚卸調整</span>
          </summary>
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

          <div className="switch-list stock-admin-list">
            <div className="product-view-switch" aria-label="在庫履歴の表示切替">
              <input id="stock-view-list" name="stockHistoryView" type="radio" defaultChecked />
              <label htmlFor="stock-view-list">縦列</label>
              <input id="stock-view-card" name="stockHistoryView" type="radio" />
              <label htmlFor="stock-view-card">カード</label>
            </div>
            <div className="table-wrap switch-table">
              <table className="compact-admin-table">
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
                      <td><span className="status-badge">{stockMovementTypeLabels[toStockMovementTypeKey(movement.type)]}</span></td>
                      <td>{movement.quantity}</td>
                      <td>{movement.stockBefore} → {movement.stockAfter}</td>
                      <td className="compact-text">{movement.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="switch-card-list">
              {data.stockMovements.map((movement) => (
                <article className="switch-card" key={movement.id}>
                  <div className="switch-card-head">
                    <div>
                      <h3>{movement.product.name}</h3>
                      <p>{movement.createdAt.toLocaleString("ja-JP")}</p>
                    </div>
                    <span className="status-badge">{stockMovementTypeLabels[toStockMovementTypeKey(movement.type)]}</span>
                  </div>
                  <div className="summary-strip customer-card-summary">
                    <div><p>数量</p><strong>{movement.quantity}</strong></div>
                    <div><p>変更前</p><strong>{movement.stockBefore}</strong></div>
                    <div><p>変更後</p><strong>{movement.stockAfter}</strong></div>
                  </div>
                  <p className="empty-state">{movement.note || "メモなし"}</p>
                </article>
              ))}
            </div>
          </div>
        </details>

        <details id="orders" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>注文管理</h2>
            <span>予約と同じ顧客情報に紐付く注文</span>
          </summary>
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
          <div className="switch-list order-admin-list">
            <div className="product-view-switch" aria-label="注文一覧の表示切替">
              <input id="order-view-list" name="orderView" type="radio" defaultChecked />
              <label htmlFor="order-view-list">縦列</label>
              <input id="order-view-card" name="orderView" type="radio" />
              <label htmlFor="order-view-card">カード</label>
            </div>
            <div className="table-wrap switch-table">
              <table className="compact-admin-table">
                <thead>
                  <tr>
                    <th>注文ID</th>
                    <th>顧客</th>
                    <th>商品</th>
                    <th>合計</th>
                    <th>状態</th>
                    <th>決済</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.orderNumber}</strong></td>
                      <td>{order.customerName}</td>
                      <td className="compact-text">{order.items.map((item) => `${item.name} x ${item.quantity}`).join(" / ")}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td><span className="status-badge">{statusLabels[toOrderStatusKey(order.status)]}</span></td>
                      <td><span className="status-badge">{paymentStatusLabels[toPaymentStatusKey(order.payment?.status)]}</span></td>
                      <td><a className="secondary-action" href={`/admin/orders/${order.id}`}>詳細</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="switch-card-list">
              {filteredOrders.map((order) => (
                <article className="switch-card" key={order.id}>
                  <div className="switch-card-head">
                    <div>
                      <h3>{order.orderNumber}</h3>
                      <p>{order.customerName} / {order.items.map((item) => `${item.name} x ${item.quantity}`).join("、")}</p>
                    </div>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>
                  <div className="table-actions">
                    <span className="status-badge">{statusLabels[toOrderStatusKey(order.status)]}</span>
                    <span className="status-badge">{paymentStatusLabels[toPaymentStatusKey(order.payment?.status)]}</span>
                  </div>
                  <form action={updateOrderStatus} className="settings-form">
                    <input name="orderId" type="hidden" value={order.id} />
                    <input name="returnTo" type="hidden" value="/admin#orders" />
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
                  <a className="secondary-action" href={`/admin/orders/${order.id}`}>詳細ページ</a>
                </article>
              ))}
            </div>
          </div>
        </details>

        <details id="lp-builder" className="panel collapsible-panel" open>
          <summary className="panel-head collapsible-summary">
            <h2>LP編集</h2>
            <span>トップ画面・店舗案内・メニュー・機能パーツ</span>
          </summary>
          <form action={addPageSection} className="form-grid">
            <label>
              種類
              <select name="type" defaultValue="custom">
                {pageSectionTypes.map((type) => (
                  <option key={type} value={type}>{pageSectionTypeLabels[type]}</option>
                ))}
              </select>
            </label>
            <label>
              見出し
              <input name="title" placeholder="新しいセクション" required />
            </label>
            <label>
              表示順
              <input name="sortOrder" type="number" defaultValue={80} required />
            </label>
            <label>
              状態
              <select name="enabled" defaultValue="true">
                <option value="true">表示</option>
                <option value="false">非表示</option>
              </select>
            </label>
            <label>
              本文
              <textarea name="body" rows={3} placeholder="店舗の説明、案内文、キャンペーンなど" />
            </label>
            <label>
              ボタン名
              <input name="buttonLabel" placeholder="詳しく見る" />
            </label>
            <label>
              ボタンリンク
              <input name="buttonHref" placeholder="#booking または https://..." />
            </label>
            <label>
              追加情報
              <input name="metadata" placeholder="将来の画像URLや地図URL用" />
            </label>
            <button type="submit">LPセクションを追加</button>
          </form>
          <div className="switch-list lp-admin-list">
            <div className="product-view-switch" aria-label="LPセクション一覧の表示切替">
              <input id="lp-view-list" name="lpView" type="radio" defaultChecked />
              <label htmlFor="lp-view-list">縦列</label>
              <input id="lp-view-card" name="lpView" type="radio" />
              <label htmlFor="lp-view-card">カード</label>
            </div>
            <div className="table-wrap switch-table">
              <table className="compact-admin-table">
                <thead>
                  <tr>
                    <th>順</th>
                    <th>種類</th>
                    <th>見出し</th>
                    <th>本文</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pageSections.map((section) => (
                    <tr key={section.id}>
                      <td>{section.sortOrder}</td>
                      <td>{pageSectionTypeLabels[toPageSectionTypeKey(section.type)]}</td>
                      <td><strong>{section.title}</strong></td>
                      <td className="compact-text">{section.body || "-"}</td>
                      <td><span className="module-status">{section.enabled ? "表示" : "非表示"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="switch-card-list">
              {data.pageSections.map((section) => (
                <article className="switch-card" key={section.id}>
                  <div className="switch-card-head">
                    <div>
                      <h3>{section.title}</h3>
                      <p>{pageSectionTypeLabels[toPageSectionTypeKey(section.type)]} / 表示順 {section.sortOrder}</p>
                    </div>
                    <span className="module-status">{section.enabled ? "表示" : "非表示"}</span>
                  </div>
                  <form action={updatePageSection} className="settings-form">
                    <input name="sectionId" type="hidden" value={section.id} />
                    <label>
                      種類
                      <select name="type" defaultValue={section.type}>
                        {pageSectionTypes.map((type) => (
                          <option key={type} value={type}>{pageSectionTypeLabels[type]}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      見出し
                      <input name="title" defaultValue={section.title} required />
                    </label>
                    <label>
                      本文
                      <textarea name="body" rows={4} defaultValue={section.body} />
                    </label>
                    <div className="form-grid product-inline-fields">
                      <label>
                        表示順
                        <input name="sortOrder" type="number" defaultValue={section.sortOrder} required />
                      </label>
                      <label>
                        状態
                        <select name="enabled" defaultValue={String(section.enabled)}>
                          <option value="true">表示</option>
                          <option value="false">非表示</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      ボタン名
                      <input name="buttonLabel" defaultValue={section.buttonLabel} />
                    </label>
                    <label>
                      ボタンリンク
                      <input name="buttonHref" defaultValue={section.buttonHref} />
                    </label>
                    <label>
                      追加情報
                      <input name="metadata" defaultValue={section.metadata} />
                    </label>
                    <button type="submit">保存</button>
                  </form>
                </article>
              ))}
            </div>
          </div>
        </details>

        <section id="settings" className="dashboard-grid">
          <details className="panel collapsible-panel" open>
            <summary className="panel-head collapsible-summary">
              <h2>店舗情報</h2>
              <span>公開ページと管理画面で共通利用</span>
            </summary>
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
          </details>

          <details className="panel collapsible-panel" open>
            <summary className="panel-head collapsible-summary">
              <h2>デザイン・機能</h2>
              <span>共通設定</span>
            </summary>
            <form action={saveDesign} className="settings-form">
              <label>
                ブランドカラー
                <input name="brandColor" type="color" defaultValue={data.store.brandColor} />
              </label>
              <label>
                LPデザイン
                <select name="lpDesignPreset" defaultValue={toLpDesignPresetKey(data.store.lpDesignPreset)}>
                  {lpDesignPresets.map((preset) => (
                    <option key={preset} value={preset}>{lpDesignPresetLabels[preset]}</option>
                  ))}
                </select>
              </label>
              <label>
                ボタン表示名
                <input name="ctaLabel" defaultValue={data.store.ctaLabel} />
              </label>
              <button type="submit">反映</button>
            </form>
            <div className="design-preset-grid">
              {lpDesignPresets.map((preset) => (
                <article className={`design-preset-card lp-design-${preset}`} key={preset}>
                  <div className="design-preset-visual" aria-hidden="true">
                    <span>{lpDesignPresetLabels[preset].slice(0, 1)}</span>
                  </div>
                  <h3>{lpDesignPresetLabels[preset]}</h3>
                  <p>{lpDesignPresetDescriptions[preset]}</p>
                </article>
              ))}
            </div>
            <div className="switch-list module-admin-list">
              <div className="product-view-switch" aria-label="機能一覧の表示切替">
                <input id="module-view-list" name="moduleView" type="radio" defaultChecked />
                <label htmlFor="module-view-list">縦列</label>
                <input id="module-view-card" name="moduleView" type="radio" />
                <label htmlFor="module-view-card">カード</label>
              </div>
              <div className="table-wrap switch-table">
                <table className="compact-admin-table">
                  <thead>
                    <tr>
                      <th>機能</th>
                      <th>説明</th>
                      <th>状態</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.modules.map((module) => (
                      <tr key={module.key}>
                        <td><strong>{module.name}</strong></td>
                        <td className="compact-text">{module.description}</td>
                        <td><span className="module-status">{module.enabled ? "有効" : "無効"}</span></td>
                        <td>
                          <form action={toggleModule}>
                            <input name="key" type="hidden" value={module.key} />
                            <input name="returnTo" type="hidden" value="/admin#settings" />
                            <button className="secondary-action" type="submit">{module.enabled ? "停止" : "有効化"}</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="switch-card-list">
                {data.modules.map((module) => (
                  <article className="switch-card" key={module.key}>
                    <div className="switch-card-head">
                      <div>
                        <h3>{module.name}</h3>
                        <p>{module.description}</p>
                      </div>
                      <span className="module-status">{module.enabled ? "有効" : "無効"}</span>
                    </div>
                    <form action={toggleModule}>
                      <input name="key" type="hidden" value={module.key} />
                      <input name="returnTo" type="hidden" value="/admin#settings" />
                      <button className="secondary-action" type="submit">
                        {module.enabled ? "停止" : "有効化"}
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            </div>
          </details>

          <details className="panel collapsible-panel" open>
            <summary className="panel-head collapsible-summary">
              <h2>予約受付ルール</h2>
              <span>営業時間・定休日</span>
            </summary>
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
          </details>

          <details className="panel collapsible-panel" open>
            <summary className="panel-head collapsible-summary">
              <h2>メール通知</h2>
              <span>予約・注文・問い合わせ</span>
            </summary>
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
          </details>

          <details className="panel collapsible-panel" open>
            <summary className="panel-head collapsible-summary">
              <h2>決済サービス設定</h2>
              <span>正式発売後に店舗ごとに選択</span>
            </summary>
            <form action={savePaymentProviderSettings} className="settings-form">
              <label>
                <span>
                  <input
                    name="enabled"
                    type="checkbox"
                    defaultChecked={data.paymentProviderSetting?.enabled ?? false}
                    style={{ width: "auto", marginRight: 8 }}
                  />
                  決済サービスを利用する
                </span>
              </label>
              <label>
                決済サービス
                <select name="provider" defaultValue={toPaymentProviderKey(data.paymentProviderSetting?.provider)}>
                  {paymentProviders.map((provider) => (
                    <option key={provider} value={provider}>{paymentProviderLabels[provider]}</option>
                  ))}
                </select>
              </label>
              <label>
                表示名
                <input name="displayName" defaultValue={data.paymentProviderSetting?.displayName ?? ""} placeholder="例: Stripe決済、銀行振込、店頭決済" />
              </label>
              <label>
                モード
                <select name="mode" defaultValue={data.paymentProviderSetting?.mode ?? "TEST"}>
                  <option value="TEST">テスト</option>
                  <option value="LIVE">本番</option>
                </select>
              </label>
              <label>
                公開キー・公開ID
                <input name="publicKey" defaultValue={data.paymentProviderSetting?.publicKey ?? ""} placeholder="公開可能なキーのみ" />
              </label>
              <label>
                秘密キーの保管名
                <input name="secretRef" defaultValue={data.paymentProviderSetting?.secretRef ?? ""} placeholder="例: Vercel環境変数 STRIPE_SECRET_KEY" />
              </label>
              <label>
                決済ページURL
                <input name="checkoutUrl" defaultValue={data.paymentProviderSetting?.checkoutUrl ?? ""} placeholder="https://..." />
              </label>
              <label>
                顧客への案内文
                <textarea
                  name="instructions"
                  rows={4}
                  defaultValue={data.paymentProviderSetting?.instructions ?? ""}
                  placeholder="注文後に店舗から決済リンクを送付します。"
                />
              </label>
              <button type="submit">決済設定を保存</button>
            </form>
            <p className="empty-state" style={{ marginTop: 12 }}>
              秘密キーそのものは画面に保存せず、Vercelなどの環境変数名を「秘密キーの保管名」に記録する想定です。
            </p>
          </details>

          <details className="panel collapsible-panel" open>
            <summary className="panel-head collapsible-summary">
              <h2>バックアップ/復元</h2>
              <span>JSON</span>
            </summary>
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
          </details>

          <details className="panel collapsible-panel" open>
            <summary className="panel-head collapsible-summary">
              <h2>権限管理</h2>
              <span>スタッフログイン</span>
            </summary>
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
            <div className="switch-list staff-admin-list">
              <div className="product-view-switch" aria-label="スタッフ一覧の表示切替">
                <input id="staff-view-list" name="staffView" type="radio" defaultChecked />
                <label htmlFor="staff-view-list">縦列</label>
                <input id="staff-view-card" name="staffView" type="radio" />
                <label htmlFor="staff-view-card">カード</label>
              </div>
              <div className="table-wrap switch-table">
                <table className="compact-admin-table">
                  <thead>
                    <tr>
                      <th>名前</th>
                      <th>メール</th>
                      <th>権限</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.adminUsers.map((user) => (
                      <tr key={user.id}>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td><span className="module-status">{user.active ? "有効" : "停止中"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="switch-card-list">
                {data.adminUsers.map((user) => (
                  <article className="switch-card" key={user.id}>
                    <div className="switch-card-head">
                      <div>
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                      </div>
                      <span className="module-status">{user.active ? user.role : "停止中"}</span>
                    </div>
                    <form action={updateAdminUser} className="settings-form">
                      <input name="adminUserId" type="hidden" value={user.id} />
                      <input name="returnTo" type="hidden" value="/admin#settings" />
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
            </div>
          </details>
        </section>

        <details id="audit" className="panel collapsible-panel">
          <summary className="panel-head collapsible-summary">
            <h2>監査ログ</h2>
            <span>直近50件</span>
          </summary>
          <div className="switch-list audit-admin-list">
            <div className="product-view-switch" aria-label="監査ログの表示切替">
              <input id="audit-view-list" name="auditView" type="radio" defaultChecked />
              <label htmlFor="audit-view-list">縦列</label>
              <input id="audit-view-card" name="auditView" type="radio" />
              <label htmlFor="audit-view-card">カード</label>
            </div>
            <div className="table-wrap switch-table">
              <table className="compact-admin-table">
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
                      <td><span className="status-badge">{log.action}</span></td>
                      <td>{log.targetType} / {log.targetId}</td>
                      <td className="compact-text">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="switch-card-list">
              {data.auditLogs.map((log) => (
                <article className="switch-card" key={log.id}>
                  <div className="switch-card-head">
                    <div>
                      <h3>{log.summary}</h3>
                      <p>{log.createdAt.toLocaleString("ja-JP")} / {log.actor}</p>
                    </div>
                    <span className="status-badge">{log.action}</span>
                  </div>
                  <p className="empty-state">{log.targetType} / {log.targetId}</p>
                </article>
              ))}
            </div>
          </div>
          {data.auditLogs.length === 0 ? <p className="empty-state">監査ログはまだありません。</p> : null}
        </details>

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
