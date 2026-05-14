"use client";

import { useMemo, useState } from "react";
import { createBooking } from "@/app/actions";

type ServiceOption = {
  id: string;
  label: string;
};

type BookedSlot = {
  date: string;
  time: string;
};

function RequiredMark() {
  return <span className="required-badge">必須</span>;
}

export function BookingForm({
  bookedSlots,
  services,
  timeOptions,
}: {
  bookedSlots: BookedSlot[];
  services: ServiceOption[];
  timeOptions: string[];
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const bookedTimes = useMemo(() => {
    return new Set(bookedSlots.filter((slot) => slot.date === selectedDate).map((slot) => slot.time));
  }, [bookedSlots, selectedDate]);

  return (
    <form action={createBooking} className="form-grid booking-form-grid">
      <p className="form-intro booking-form-intro">メニュー、日時、連絡先の順に入力してください。予約状況を確認して店舗からご連絡します。</p>
      <label className="booking-service-field">
        <span className="field-label">メニュー <RequiredMark /></span>
        <select name="serviceId" required>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.label}
            </option>
          ))}
        </select>
      </label>
      <label className="booking-date-field">
        <span className="field-label">希望日 <RequiredMark /></span>
        <input name="startDate" onChange={(event) => setSelectedDate(event.target.value)} required type="date" />
      </label>
      <label className="booking-time-field">
        <span className="field-label">希望時刻 <RequiredMark /></span>
        <select name="startTime" required>
          {timeOptions.map((time) => {
            const booked = bookedTimes.has(time);
            return (
              <option disabled={booked} key={time} value={time}>
                {booked ? `${time} 予約済み` : time}
              </option>
            );
          })}
        </select>
      </label>
      <label className="booking-name-field">
        <span className="field-label">名前 <RequiredMark /></span>
        <input name="name" required />
      </label>
      <label>
        <span className="field-label">メール <RequiredMark /></span>
        <input name="email" required type="email" />
      </label>
      <label>
        <span className="field-label">電話 <RequiredMark /></span>
        <input name="phone" required />
      </label>
      <label>
        <span className="field-label">メモ</span>
        <input name="note" placeholder="希望や相談内容" />
      </label>
      <button type="submit">予約する</button>
    </form>
  );
}
