import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
        <p className="mb-2 text-sm font-semibold text-amber-700">ようこそ</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          予約しやすい、街のレストラン
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          新鮮な食材と落ち着いた空間で、特別な時間をお届けします。
          スマホから簡単にご予約いただけます。
        </p>
        <div className="mt-6">
          <Link
            href="/reserve"
            className="inline-flex items-center rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            予約する
          </Link>
        </div>
      </section>
    </div>
  );
}
