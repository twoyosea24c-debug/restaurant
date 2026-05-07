const details = [
  { label: "店名", value: "Restaurant Reserve" },
  { label: "電話番号", value: "03-1234-5678" },
  { label: "住所", value: "東京都○○区○○ 1-2-3" },
  { label: "営業時間", value: "ランチ 11:30 - 15:00 / ディナー 17:30 - 22:00" },
  { label: "定休日", value: "毎週火曜日" },
  { label: "席数", value: "32席（禁煙）" },
];

export default function StorePage() {
  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
      <h1 className="text-2xl font-bold text-zinc-900">ショップ詳細</h1>
      <p className="text-sm leading-7 text-zinc-600 sm:text-base">
        駅から徒歩5分。木目を基調にした落ち着きのある店内で、
        記念日から普段使いまで幅広くご利用いただけます。
      </p>

      <dl className="grid gap-4 text-sm text-zinc-700 sm:grid-cols-2">
        {details.map((item) => (
          <div key={item.label}>
            <dt className="font-semibold text-zinc-900">{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
        <h2 className="font-semibold">アクセス</h2>
        <p className="mt-1">○○線 ○○駅 東口から徒歩5分 / 提携コインパーキングあり（2時間無料）</p>
      </section>

      <section className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
        <h2 className="font-semibold text-zinc-900">予約に関するご案内</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Web予約は来店希望時刻の2時間前まで受け付けています。</li>
          <li>10名以上の団体予約・貸切利用はお電話でご相談ください。</li>
          <li>当日の遅れやキャンセルは必ず店舗までご連絡ください。</li>
        </ul>
      </section>
    </div>
  );
}
