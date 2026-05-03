"use client";

import { FormEvent, useState } from "react";

export default function ReservePage() {
  const [completed, setCompleted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompleted(true);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
      <h1 className="text-2xl font-bold text-zinc-900">予約フォーム</h1>
      <p className="mt-2 text-sm text-zinc-600">
        必要事項をご入力ください。送信後、受付メッセージが表示されます。
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input label="名前" name="name" type="text" autoComplete="name" />
        <Input label="メールアドレス" name="email" type="email" autoComplete="email" />
        <Input label="電話番号" name="phone" type="tel" autoComplete="tel" />
        <Input label="予約日" name="date" type="date" />
        <Input label="予約時間" name="time" type="time" />
        <Input label="人数" name="people" type="number" min="1" />

        <label className="block text-sm font-medium text-zinc-700">
          備考
          <textarea
            name="note"
            rows={4}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-amber-300 transition focus:ring"
            placeholder="アレルギーやご要望があればご記入ください"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          送信する
        </button>
      </form>

      {completed && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          予約を受け付けました
        </p>
      )}
    </div>
  );
}

type InputProps = {
  label: string;
  name: string;
  type: string;
  min?: string;
  autoComplete?: string;
};

function Input({ label, name, type, min, autoComplete }: InputProps) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        required
        name={name}
        type={type}
        min={min}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-amber-300 transition focus:ring"
      />
    </label>
  );
}
