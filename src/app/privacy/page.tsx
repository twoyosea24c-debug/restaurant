import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const data = await getAppData();
  const store = data.store;

  return (
    <main className="main public-main">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">PRIVACY</p>
            <h1>プライバシーポリシー</h1>
          </div>
          <a className="secondary-action" href="/">
            トップへ戻る
          </a>
        </div>
        <div className="legal-copy">
          <p>
            {store.name}
            は、予約、注文、問い合わせの受付に必要な範囲で、氏名、メールアドレス、電話番号、希望日時、注文内容、問い合わせ内容を取得します。
          </p>
          <p>
            取得した個人情報は、受付内容の確認、店舗からの連絡、顧客対応履歴の管理、サービス改善のために利用します。
          </p>
          <p>
            法令に基づく場合を除き、本人の同意なく第三者へ個人情報を提供しません。
          </p>
          <p>
            個人情報の開示、訂正、削除、利用停止を希望される場合は、{store.email}
            までご連絡ください。
          </p>
        </div>
      </section>
    </main>
  );
}
