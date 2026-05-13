import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { updateProduct, toggleProduct, adjustStock } from "@/app/actions";
import { logout } from "@/app/login/actions";
import { formatPrice, getProductDetail, stockMovementTypeLabels, stockMovementTypes, statusLabels, toOrderStatusKey } from "@/lib/data";
import { session, verifySessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
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
  const data = await getProductDetail(id);
  if (!data) notFound();

  const { product, store, summary } = data;
  const brandStyle = { "--brand": store.brandColor } as CSSProperties & Record<"--brand", string>;

  return (
    <div className="shell" style={brandStyle}>
      <aside className="sidebar" aria-label="管理メニュー">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <p className="brand-name">Small Store Base</p>
            <p className="brand-meta">商品詳細</p>
          </div>
        </div>
        <nav className="nav" aria-label="メイン">
          <a href="/admin">ダッシュボード</a>
          <a href="/admin#products">商品管理</a>
          <a href="/admin#stock">在庫管理</a>
          <a href="/admin#orders">注文管理</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Product</p>
            <h1>{product.name}</h1>
          </div>
          <div className="topbar-actions">
            <a className="secondary-action" href="/admin#products">商品一覧</a>
            <form action={logout}>
              <button className="secondary-action" type="submit">ログアウト</button>
            </form>
          </div>
        </header>

        {notice ? <p className="notice-banner">{notice}</p> : null}
        {error ? <p className="notice-banner error-banner">{error}</p> : null}

        <section className="metrics">
          <article className="metric">
            <p>公開状態</p>
            <strong>{product.active ? "公開中" : "非公開"}</strong>
          </article>
          <article className="metric">
            <p>価格</p>
            <strong>{formatPrice(product.price)}</strong>
          </article>
          <article className="metric">
            <p>在庫</p>
            <strong>{product.stock}</strong>
          </article>
          <article className="metric">
            <p>販売数</p>
            <strong>{summary.soldQuantity}</strong>
          </article>
          <article className="metric">
            <p>売上</p>
            <strong>{formatPrice(summary.salesTotal)}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>商品情報</h2>
              <span>詳細ページで修正</span>
            </div>
            <form action={updateProduct} className="settings-form">
              <input name="productId" type="hidden" value={product.id} />
              <input name="returnTo" type="hidden" value={`/admin/products/${product.id}`} />
              <label>
                商品名
                <input name="name" defaultValue={product.name} required />
              </label>
              <label>
                説明
                <textarea name="description" rows={5} defaultValue={product.description} required />
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
              <button type="submit">商品情報を保存</button>
            </form>
            <form action={toggleProduct} style={{ marginTop: 12 }}>
              <input name="productId" type="hidden" value={product.id} />
              <input name="returnTo" type="hidden" value={`/admin/products/${product.id}`} />
              <button className="secondary-action" type="submit">
                {product.active ? "非公開にする" : "公開する"}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>在庫調整</h2>
              <span>この商品だけ更新</span>
            </div>
            <form action={adjustStock} className="settings-form">
              <input name="productId" type="hidden" value={product.id} />
              <input name="returnTo" type="hidden" value={`/admin/products/${product.id}`} />
              <label>
                種別
                <select name="type" defaultValue="IN">
                  {stockMovementTypes.map((type) => (
                    <option key={type} value={type}>{stockMovementTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
              <label>
                数量
                <input name="quantity" type="number" min="0" step="1" required />
              </label>
              <label>
                メモ
                <textarea name="note" rows={3} placeholder="入荷、棚卸、破損調整など" />
              </label>
              <button type="submit">在庫を更新</button>
            </form>
          </section>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>販売履歴</h2>
            <span>{summary.orderCount}件</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>注文</th>
                  <th>顧客</th>
                  <th>数量</th>
                  <th>金額</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {product.orderItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.order.orderNumber}</strong>
                      <p><a className="secondary-action" href={`/admin/orders/${item.order.id}`}>詳細</a></p>
                    </td>
                    <td>{item.order.customer.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                    <td><span className="status-badge">{statusLabels[toOrderStatusKey(item.order.status)]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {product.orderItems.length === 0 ? <p className="empty-state">販売履歴はまだありません。</p> : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>在庫履歴</h2>
            <span>{summary.stockMovementCount}件</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>種別</th>
                  <th>数量</th>
                  <th>在庫</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {product.stockMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.createdAt.toLocaleString("ja-JP")}</td>
                    <td>{stockMovementTypeLabels[movement.type as keyof typeof stockMovementTypeLabels] ?? movement.type}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.stockBefore} → {movement.stockAfter}</td>
                    <td>{movement.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {product.stockMovements.length === 0 ? <p className="empty-state">在庫履歴はまだありません。</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
}
