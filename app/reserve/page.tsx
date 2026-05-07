"use client";

import { FormEvent, useState } from "react";

type Reservation = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  note: string;
};

const initialForm: Reservation = {
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  people: 2,
  note: "",
};

export default function ReservePage() {
  const [reservation, setReservation] = useState<Reservation>(initialForm);
  const [latest, setLatest] = useState<Reservation | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLatest(reservation);
    setReservation(initialForm);
  };

  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">予約受付フォーム</h1>
        <p className="mt-2 text-sm text-zinc-600">
          日時・人数などを入力して送信すると、予約内容の確認メッセージを表示します。
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input label="名前" value={reservation.name} onChange={(value) => setReservation({ ...reservation, name: value })} name="name" type="text" autoComplete="name" />
        <Input label="メールアドレス" value={reservation.email} onChange={(value) => setReservation({ ...reservation, email: value })} name="email" type="email" autoComplete="email" />
        <Input label="電話番号" value={reservation.phone} onChange={(value) => setReservation({ ...reservation, phone: value })} name="phone" type="tel" autoComplete="tel" />
        <Input label="予約日" value={reservation.date} onChange={(value) => setReservation({ ...reservation, date: value })} name="date" type="date" />
        <Input label="予約時間" value={reservation.time} onChange={(value) => setReservation({ ...reservation, time: value })} name="time" type="time" />
        <Input label="人数" value={String(reservation.people)} onChange={(value) => setReservation({ ...reservation, people: Number(value) })} name="people" type="number" min="1" />

        <label className="block text-sm font-medium text-zinc-700">
          備考
          <textarea
            name="note"
            rows={4}
            value={reservation.note}
            onChange={(event) => setReservation({ ...reservation, note: event.target.value })}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-amber-300 transition focus:ring"
            placeholder="アレルギーやご要望があればご記入ください"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          予約を送信する
        </button>
      </form>

      {latest && (
        <section className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
          <h2 className="font-bold">予約を受け付けました</h2>
          <p className="mt-2">{latest.name} 様、以下の内容で承りました。</p>
          <ul className="mt-2 space-y-1">
            <li>日時: {latest.date} {latest.time}</li>
            <li>人数: {latest.people}名</li>
            <li>連絡先: {latest.email} / {latest.phone}</li>
            {latest.note && <li>備考: {latest.note}</li>}
          </ul>
        </section>
      )}
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  type: string;
  min?: string;
  autoComplete?: string;
};

function Input({ label, value, onChange, name, type, min, autoComplete }: InputProps) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        required
        name={name}
        type={type}
        min={min}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-amber-300 transition focus:ring"
      />
    </label>
  );
}
