const menus = [
  { name: "季節野菜のサラダ", price: "¥880", description: "旬の野菜を使ったさっぱり前菜" },
  { name: "本日のパスタ", price: "¥1,480", description: "日替わりソースで楽しむ人気メニュー" },
  { name: "グリルチキンプレート", price: "¥1,680", description: "香ばしく焼き上げたジューシーな一皿" },
  { name: "自家製ティラミス", price: "¥650", description: "食後にぴったりの定番デザート" },
];

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">メニュー紹介</h1>
      <ul className="grid gap-4 sm:grid-cols-2">
        {menus.map((item) => (
          <li
            key={item.name}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-amber-100"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-zinc-900">{item.name}</h2>
              <p className="text-sm font-semibold text-amber-700">{item.price}</p>
            </div>
            <p className="text-sm text-zinc-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
