import Link from "next/link";

const highlights = [
  "旬の食材を使った日替わりメニュー",
  "おひとり様からグループまで使いやすい席配置",
  "スマホから24時間いつでも予約可能",
];

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
        <p className="text-sm font-semibold text-amber-700">RESTAURANT RESERVE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          やさしい時間を、
          <br className="sm:hidden" />
          おいしい料理と。
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
          落ち着いた空間で楽しむランチとディナー。初めてのお客様でも、
          予約フォームからかんたんにお席をご用意できます。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/reserve"
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            今すぐ予約する
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center rounded-xl border border-amber-200 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
          >
            メニューを見る
          </Link>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
        <h2 className="text-lg font-bold text-zinc-900">当店のこだわり</h2>
        <ul className="mt-4 space-y-3 text-sm text-zinc-700">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
