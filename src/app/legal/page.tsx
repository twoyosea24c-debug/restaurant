import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LegalPage() {
  const data = await getAppData();
  const store = data.store;

  const rows = [
    ["販売事業者", store.name],
    ["運営責任者", "店舗管理者"],
    ["所在地", "店舗所在地は請求があった場合に遅滞なく開示します。"],
    ["電話番号", store.phone],
    ["メールアドレス", store.email],
    ["販売価格", "商品ページに税込価格を表示します。"],
    ["商品代金以外の必要料金", "送料や振込手数料が発生する場合は、注文確認時に案内します。"],
    ["支払方法", "現在は店頭支払いまたは店舗からの個別案内です。"],
    ["商品の引渡時期", "注文受付後、店舗から連絡する納期・受け渡し方法に従います。"],
    ["返品・キャンセル", "商品の性質上、返品・キャンセル条件は注文内容ごとに店舗から案内します。"],
  ];

  return (
    <main className="main public-main">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">LEGAL</p>
            <h1>特定商取引法に基づく表記</h1>
          </div>
          <a className="secondary-action" href="/">
            トップへ戻る
          </a>
        </div>
        <div className="table-wrap">
          <table>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
