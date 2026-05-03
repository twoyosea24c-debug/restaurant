export default function StorePage() {
  return (
    <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
      <h1 className="text-2xl font-bold text-zinc-900">店舗案内</h1>
      <div className="space-y-3 text-zinc-700">
        <p>店名: Restaurant Reserve</p>
        <p>住所: 東京都○○区○○ 1-2-3</p>
        <p>営業時間: 11:30 - 22:00（L.O. 21:30）</p>
        <p>定休日: 毎週火曜日</p>
        <p>電話番号: 03-1234-5678</p>
      </div>
      <p className="text-sm text-zinc-500">
        10名以上の団体予約や貸切については、お電話でお問い合わせください。
      </p>
    </div>
  );
}
