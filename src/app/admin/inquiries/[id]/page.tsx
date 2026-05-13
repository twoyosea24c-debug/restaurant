import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { addInternalNote, sendInquiryReply, updateInquiryStatus } from "@/app/actions";
import {
  getInquiryDetail,
  inquiryStatuses,
  inquiryStatusLabels,
  toInquiryStatusKey,
} from "@/lib/data";
import { session, verifySessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({
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
  const data = await getInquiryDetail(id);
  if (!data) notFound();

  const { inquiry, internalNotes, store, replyTemplates } = data;
  const brandStyle = { "--brand": store.brandColor } as CSSProperties & Record<"--brand", string>;

  return (
    <div className="shell" style={brandStyle}>
      <aside className="sidebar" aria-label="管理メニュー">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <p className="brand-name">Small Store Base</p>
            <p className="brand-meta">問い合わせ詳細</p>
          </div>
        </div>
        <nav className="nav" aria-label="メイン">
          <a href="/admin">ダッシュボード</a>
          <a href="/admin#inquiries">問い合わせ管理</a>
          <a href={`/admin/customers/${inquiry.customerId}`}>顧客詳細</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Inquiry</p>
            <h1>{inquiry.inquiryNumber}</h1>
          </div>
          <div className="topbar-actions">
            <a className="secondary-action" href="/admin#inquiries">問い合わせ一覧</a>
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
            <strong>{inquiryStatusLabels[toInquiryStatusKey(inquiry.status)]}</strong>
          </article>
          <article className="metric">
            <p>顧客</p>
            <strong>{inquiry.customerName}</strong>
          </article>
          <article className="metric">
            <p>受付日</p>
            <strong>{inquiry.createdAt.toLocaleDateString("ja-JP")}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>{inquiry.subject}</h2>
              <span>{inquiry.customer.email}</span>
            </div>
            <p className="empty-state">{inquiry.message}</p>
            <div className="summary-strip" style={{ marginTop: 18 }}>
              <div>
                <p>電話</p>
                <strong>{inquiry.customer.phone || "-"}</strong>
              </div>
              <div>
                <p>対応メモ</p>
                <strong>{inquiry.responseNote || "-"}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>対応更新</h2>
              <span>問い合わせ管理</span>
            </div>
            <form action={updateInquiryStatus} className="settings-form">
              <input name="inquiryId" type="hidden" value={inquiry.id} />
              <input name="returnTo" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
              <label>
                状態
                <select name="status" defaultValue={inquiry.status}>
                  {inquiryStatuses.map((status) => (
                    <option key={status} value={status}>{inquiryStatusLabels[status]}</option>
                  ))}
                </select>
              </label>
              <label>
                対応メモ
                <textarea name="responseNote" rows={6} defaultValue={inquiry.responseNote} />
              </label>
              <button type="submit">保存</button>
            </form>
          </section>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>対応履歴</h2>
            <span>{internalNotes.length}件</span>
          </div>
          <form action={addInternalNote} className="form-grid">
            <input name="targetType" type="hidden" value="INQUIRY" />
            <input name="targetId" type="hidden" value={inquiry.id} />
            <input name="returnTo" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
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

        <section className="panel">
          <div className="panel-head">
            <h2>メール返信</h2>
            <span>{inquiry.customer.email}</span>
          </div>
          <form action={sendInquiryReply} className="settings-form">
            <input name="inquiryId" type="hidden" value={inquiry.id} />
            <input name="returnTo" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
            <label>
              件名
              <input name="subject" defaultValue={`Re: ${inquiry.subject}`} required />
            </label>
            <label>
              本文
              <textarea
                name="body"
                rows={8}
                defaultValue={inquiry.responseNote || `${inquiry.customerName} 様\n\nお問い合わせありがとうございます。\n\n`}
                required
              />
            </label>
            <button type="submit">顧客へ送信</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>返信テンプレート</h2>
            <span>{replyTemplates.length}件</span>
          </div>
          <div className="module-grid">
            {replyTemplates.length === 0 ? (
              <p className="empty-state">有効な返信テンプレートはありません。</p>
            ) : (
              replyTemplates.map((template) => (
                <article className="module-card" key={template.id}>
                  <h3>{template.title}</h3>
                  <p>{template.body}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
