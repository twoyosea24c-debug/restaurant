import type { Booking, Inquiry, Order, OrderItem, Product, Service, Store } from "@prisma/client";
import { formatPrice } from "./format";
import { sendAdminNotification } from "./mailer";
import { sendCustomerMail } from "./mailer";

function customerLine(customer: { name: string; email: string; phone?: string | null }) {
  return [`お名前: ${customer.name}`, `メール: ${customer.email}`, `電話: ${customer.phone || "-"}`].join("\n");
}

async function safeNotify(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.error("[mail:error]", error);
  }
}

export async function notifyNewBooking(input: {
  store: Store;
  booking: Booking;
  service: Service;
  customer: { name: string; email: string; phone?: string | null };
}) {
  await safeNotify(() =>
    sendAdminNotification({
      storeEmail: input.store.email,
      replyTo: input.customer.email,
      subject: `【予約受付】${input.booking.customerName} 様 / ${input.service.name}`,
      text: [
        "新しい予約を受け付けました。",
        "",
        `予約番号: ${input.booking.bookingNumber}`,
        `メニュー: ${input.service.name}`,
        `希望日時: ${input.booking.startAt.toLocaleString("ja-JP")}`,
        `メモ: ${input.booking.note || "-"}`,
        "",
        customerLine(input.customer),
      ].join("\n"),
    }),
  );
  await safeNotify(() =>
    sendCustomerMail({
      to: input.customer.email,
      replyTo: input.store.email,
      subject: `【${input.store.name}】予約受付のお知らせ`,
      text: [
        `${input.customer.name} 様`,
        "",
        "予約を受け付けました。",
        "",
        `予約番号: ${input.booking.bookingNumber}`,
        `メニュー: ${input.service.name}`,
        `希望日時: ${input.booking.startAt.toLocaleString("ja-JP")}`,
        "",
        "店舗からの確認連絡をお待ちください。",
      ].join("\n"),
    }),
  );
}

export async function notifyBookingRequest(input: {
  store: Store;
  bookingNumber: string;
  requestType: "変更依頼" | "キャンセル依頼";
  requestNote: string;
}) {
  await safeNotify(() =>
    sendAdminNotification({
      storeEmail: input.store.email,
      subject: `【予約${input.requestType}】${input.bookingNumber}`,
      text: [
        `予約の${input.requestType}を受け付けました。`,
        "",
        `予約番号: ${input.bookingNumber}`,
        `依頼内容: ${input.requestNote || "-"}`,
      ].join("\n"),
    }),
  );
}

export async function notifyNewInquiry(input: {
  store: Store;
  inquiry: Inquiry;
  customer: { name: string; email: string; phone?: string | null };
}) {
  await safeNotify(() =>
    sendAdminNotification({
      storeEmail: input.store.email,
      replyTo: input.customer.email,
      subject: `【問い合わせ】${input.inquiry.subject}`,
      text: [
        "新しい問い合わせを受け付けました。",
        "",
        `問い合わせID: ${input.inquiry.inquiryNumber}`,
        `件名: ${input.inquiry.subject}`,
        `内容: ${input.inquiry.message}`,
        "",
        customerLine(input.customer),
      ].join("\n"),
    }),
  );
  await safeNotify(() =>
    sendCustomerMail({
      to: input.customer.email,
      replyTo: input.store.email,
      subject: `【${input.store.name}】問い合わせ受付のお知らせ`,
      text: [
        `${input.customer.name} 様`,
        "",
        "お問い合わせを受け付けました。",
        "",
        `問い合わせID: ${input.inquiry.inquiryNumber}`,
        `件名: ${input.inquiry.subject}`,
        "",
        "内容を確認のうえ、店舗からご連絡します。",
      ].join("\n"),
    }),
  );
}

export async function notifyNewOrder(input: {
  store: Store;
  order: Order;
  items: Array<OrderItem & { product?: Product | null }>;
  customer: { name: string; email: string; phone?: string | null };
}) {
  await safeNotify(() =>
    sendAdminNotification({
      storeEmail: input.store.email,
      replyTo: input.customer.email,
      subject: `【注文受付】${input.order.orderNumber} / ${input.order.customerName} 様`,
      text: [
        "新しい注文を受け付けました。",
        "",
        `注文ID: ${input.order.orderNumber}`,
        `合計: ${formatPrice(input.order.total)}`,
        `メモ: ${input.order.note || "-"}`,
        "",
        "商品:",
        ...input.items.map((item) => `- ${item.name} x ${item.quantity} (${formatPrice(item.price * item.quantity)})`),
        "",
        customerLine(input.customer),
      ].join("\n"),
    }),
  );
  await safeNotify(() =>
    sendCustomerMail({
      to: input.customer.email,
      replyTo: input.store.email,
      subject: `【${input.store.name}】注文受付のお知らせ`,
      text: [
        `${input.customer.name} 様`,
        "",
        "注文を受け付けました。",
        "",
        `注文ID: ${input.order.orderNumber}`,
        `合計: ${formatPrice(input.order.total)}`,
        "",
        "商品:",
        ...input.items.map((item) => `- ${item.name} x ${item.quantity}`),
      ].join("\n"),
    }),
  );
}
