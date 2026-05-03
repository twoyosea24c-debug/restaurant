const menus = [
  {
    name: "季節野菜のサラダ",
    price: "¥880",
    description: "旬の野菜を使った、みずみずしい前菜です。",
  },
  {
    name: "本日のパスタ",
    price: "¥1,480",
    description: "日替わりソースで仕上げる人気メニュー。",
  },
  {
    name: "グリルチキンプレート",
    price: "¥1,680",
    description: "外は香ばしく中はジューシーなメイン料理。",
  },
  {
    name: "自家製ティラミス",
    price: "¥650",
    description: "食後に人気のなめらかデザート。",
  },
];

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">メニュー紹介</h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          ランチ・ディナーどちらでもお楽しみいただける定番メニューです。
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {menus.map((item) => (
          <li key={item.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-100">
            <div className="mb-2 flex items-center justify-between gap-3">
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
