export default function StorePage() {
  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
      <h1 className="text-2xl font-bold text-zinc-900">店舗案内</h1>
      <p className="text-sm leading-7 text-zinc-600 sm:text-base">
        駅から歩いて5分。木目を基調にした店内で、ゆったりとしたお食事時間をお楽しみください。
      </p>

      <dl className="grid gap-4 text-sm text-zinc-700 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-zinc-900">店名</dt>
          <dd>Restaurant Reserve</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-900">電話番号</dt>
          <dd>03-1234-5678</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-900">住所</dt>
          <dd>東京都○○区○○ 1-2-3</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-900">営業時間</dt>
          <dd>11:30 - 22:00（L.O. 21:30）</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-900">定休日</dt>
          <dd>毎週火曜日</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-900">席数</dt>
          <dd>32席（禁煙）</dd>
        </div>
      </dl>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        10名以上の団体予約・貸切利用は、お電話にてお問い合わせください。
      </p>
    </div>
  );
}
