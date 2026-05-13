"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { defaultStoreId, seedDefaultData } from "@/lib/seed";
import { toBookingStatusKey, toInquiryStatusKey, toOrderStatusKey, toPaymentStatusKey, toStockMovementTypeKey } from "@/lib/data";
import { notifyBookingRequest, notifyNewBooking, notifyNewInquiry, notifyNewOrder } from "@/lib/notifications";
import { sendAdminNotification, sendCustomerMail } from "@/lib/mailer";
import { getSessionInfo, session } from "@/lib/session";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function number(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

function parseTimeMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function nextOrderNumber() {
  return `ORD-${Date.now()}`;
}

function nextBookingNumber() {
  return `BKG-${Date.now()}`;
}

function nextInquiryNumber() {
  return `INQ-${Date.now()}`;
}

function safeReturnTo(formData: FormData, fallback: string) {
  const returnTo = text(formData, "returnTo");
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) return fallback;
  return returnTo;
}

function redirectWithNotice(formData: FormData, fallback: string, notice: string): never {
  const returnTo = safeReturnTo(formData, fallback);
  const [pathAndQuery, hash = ""] = returnTo.split("#");
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  const url = `${pathAndQuery}${separator}notice=${encodeURIComponent(notice)}${hash ? `#${hash}` : ""}`;
  redirect(url);
}

function redirectWithError(formData: FormData, fallback: string, error: string): never {
  const returnTo = safeReturnTo(formData, fallback);
  const [pathAndQuery, hash = ""] = returnTo.split("#");
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  const url = `${pathAndQuery}${separator}error=${encodeURIComponent(error)}${hash ? `#${hash}` : ""}`;
  redirect(url);
}

async function currentRole() {
  const cookieStore = await cookies();
  return (await getSessionInfo(cookieStore.get(session.name)?.value))?.role ?? null;
}

async function writeAudit(action: string, targetType: string, targetId: string, summary: string) {
  const role = (await currentRole()) ?? "public";
  await prisma.auditLog.create({
    data: {
      storeId: defaultStoreId,
      actor: role,
      action,
      targetType,
      targetId,
      summary,
    },
  });
}

async function requireEditable(formData: FormData, fallback: string) {
  const role = await currentRole();
  if (role === "viewer") redirectWithError(formData, fallback, "閲覧のみ権限では保存できません。");
}

async function requireManager(formData: FormData, fallback: string) {
  const role = await currentRole();
  if (role !== "owner" && role !== "manager") redirectWithError(formData, fallback, "この操作には管理者権限が必要です。");
}

async function findOrCreateCustomer(input: { name: string; email: string; phone: string }) {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  let customer = await prisma.customer.findFirst({
    where: {
      storeId: defaultStoreId,
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
    },
  });

  if (customer) {
    return prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: input.name.trim(),
        email,
        phone: phone || customer.phone,
      },
    });
  }

  return prisma.customer.create({
    data: {
      storeId: defaultStoreId,
      name: input.name.trim(),
      email,
      phone,
      bookingCount: 0,
    },
  });
}

export async function addCustomer(formData: FormData) {
  await requireEditable(formData, "/admin#customers");
  await seedDefaultData();
  if (!text(formData, "name") || !text(formData, "email")) {
    redirectWithError(formData, "/admin#customers", "名前とメールを入力してください。");
  }
  const customer = await prisma.customer.create({
    data: {
      storeId: defaultStoreId,
      name: text(formData, "name"),
      email: text(formData, "email").toLowerCase(),
      phone: text(formData, "phone"),
      bookingCount: 0,
      tags: "",
      memo: "",
    },
  });
  await writeAudit("create", "CUSTOMER", customer.id, `顧客を追加: ${customer.name}`);
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#customers", "顧客を追加しました。");
}

export async function updateCustomerNote(formData: FormData) {
  await requireEditable(formData, "/admin#customers");
  const customerId = text(formData, "customerId");
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      tags: text(formData, "tags"),
      memo: text(formData, "memo"),
    },
  });
  await writeAudit("update", "CUSTOMER", customerId, "顧客メモを保存");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${customerId}`);
  redirectWithNotice(formData, "/admin#customers", "顧客メモを保存しました。");
}

export async function addProduct(formData: FormData) {
  await requireEditable(formData, "/admin#products");
  await seedDefaultData();
  if (!text(formData, "name") || !text(formData, "description")) {
    redirectWithError(formData, "/admin#products", "商品名と説明を入力してください。");
  }
  if (number(formData, "price") < 0 || number(formData, "stock") < 0) {
    redirectWithError(formData, "/admin#products", "価格と在庫は0以上で入力してください。");
  }
  const product = await prisma.product.create({
    data: {
      storeId: defaultStoreId,
      name: text(formData, "name"),
      description: text(formData, "description"),
      price: number(formData, "price"),
      stock: number(formData, "stock"),
      active: true,
    },
  });
  await writeAudit("create", "PRODUCT", product.id, `商品を追加: ${product.name}`);
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#products", "商品を追加しました。");
}

export async function updateProduct(formData: FormData) {
  await requireEditable(formData, "/admin#products");
  if (number(formData, "price") < 0 || number(formData, "stock") < 0) {
    redirectWithError(formData, "/admin#products", "価格と在庫は0以上で入力してください。");
  }
  const product = await prisma.product.update({
    where: { id: text(formData, "productId") },
    data: {
      name: text(formData, "name"),
      description: text(formData, "description"),
      price: number(formData, "price"),
      stock: number(formData, "stock"),
      active: text(formData, "active") === "true",
    },
  });
  await writeAudit("update", "PRODUCT", product.id, `商品を保存: ${product.name}`);
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#products", "商品を保存しました。");
}

export async function adjustStock(formData: FormData) {
  await requireEditable(formData, "/admin#stock");
  const productId = text(formData, "productId");
  const type = toStockMovementTypeKey(text(formData, "type"));
  const quantity = number(formData, "quantity");
  if (!productId) {
    redirectWithError(formData, "/admin#stock", "商品を選択してください。");
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    redirectWithError(formData, "/admin#stock", "数量は0以上の整数で入力してください。");
  }

  const product = await prisma.product.findFirst({ where: { id: productId, storeId: defaultStoreId } });
  if (!product) {
    redirectWithError(formData, "/admin#stock", "商品が見つかりません。");
  }

  const stockBefore = product.stock;
  const stockAfter = type === "IN" ? stockBefore + quantity : type === "OUT" ? stockBefore - quantity : quantity;
  if (stockAfter < 0) {
    redirectWithError(formData, "/admin#stock", "在庫がマイナスになる出庫はできません。");
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: { stock: stockAfter },
    });
    await tx.stockMovement.create({
      data: {
        storeId: defaultStoreId,
        productId: product.id,
        type,
        quantity,
        stockBefore,
        stockAfter,
        note: text(formData, "note"),
      },
    });
  });
  await writeAudit("stock", "PRODUCT", product.id, `${type} ${quantity}: ${stockBefore} -> ${stockAfter}`);

  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#stock", "在庫を更新しました。");
}

export async function toggleProduct(formData: FormData) {
  await requireEditable(formData, "/admin#products");
  const product = await prisma.product.findUniqueOrThrow({ where: { id: text(formData, "productId") } });
  await prisma.product.update({
    where: { id: product.id },
    data: { active: !product.active },
  });
  await writeAudit("toggle", "PRODUCT", product.id, product.active ? "商品を非公開" : "商品を公開");
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#products", product.active ? "商品を非公開にしました。" : "商品を公開しました。");
}

export async function updateOrderStatus(formData: FormData) {
  await requireEditable(formData, "/admin#orders");
  const order = await prisma.order.update({
    where: { id: text(formData, "orderId") },
    data: { status: toOrderStatusKey(text(formData, "status")) },
  });
  await writeAudit("status", "ORDER", order.id, `注文ステータスを${order.status}へ更新`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${order.customerId}`);
  revalidatePath(`/admin/orders/${order.id}`);
  redirectWithNotice(formData, "/admin#orders", "注文ステータスを更新しました。");
}

export async function updatePaymentStatus(formData: FormData) {
  await requireEditable(formData, "/admin#orders");
  const orderId = text(formData, "orderId");
  const status = toPaymentStatusKey(text(formData, "status"));
  const method = text(formData, "method") || "NONE";
  const note = text(formData, "note");
  const order = await prisma.order.findFirst({ where: { id: orderId, storeId: defaultStoreId } });
  if (!order) redirectWithError(formData, "/admin#orders", "注文が見つかりません。");
  const payment = await prisma.payment.upsert({
    where: { orderId },
    create: {
      storeId: defaultStoreId,
      orderId,
      status,
      method,
      amount: order.total,
      note,
      paidAt: status === "PAID" ? new Date() : null,
    },
    update: {
      status,
      method,
      amount: order.total,
      note,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });
  await writeAudit("payment", "ORDER", orderId, `決済ステータスを${payment.status}へ更新`);
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
  redirectWithNotice(formData, `/admin/orders/${orderId}`, "決済ステータスを更新しました。");
}

export async function createBooking(formData: FormData) {
  await seedDefaultData();
  const serviceId = text(formData, "serviceId");
  const startDate = text(formData, "startDate");
  const startTime = text(formData, "startTime");
  const startAtValue = startDate && startTime ? `${startDate}T${startTime}` : text(formData, "startAt");
  const startAt = new Date(startAtValue);
  if (Number.isNaN(startAt.getTime())) {
    redirectWithError(formData, "/#booking", "希望日時を入力してください。");
  }
  if (startAt.getMinutes() % 15 !== 0) {
    redirectWithError(formData, "/#booking", "予約時間は15分単位で選択してください。");
  }
  const store = await prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } });
  const customer = await findOrCreateCustomer({
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
  });
  const service = await prisma.service.findFirstOrThrow({
    where: { id: serviceId, storeId: defaultStoreId, active: true },
  });
  const closedDays = store.closedWeekdays.split(",").map((day) => Number(day));
  if (closedDays.includes(startAt.getDay())) {
    redirectWithError(formData, "/#booking", "選択した日は定休日です。");
  }
  const startMinutes = startAt.getHours() * 60 + startAt.getMinutes();
  const endMinutes = startMinutes + service.durationMinutes;
  if (startMinutes < parseTimeMinutes(store.businessOpenTime) || endMinutes > parseTimeMinutes(store.businessCloseTime)) {
    redirectWithError(formData, "/#booking", "営業時間外の予約はできません。");
  }
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60 * 1000);
  const dayStart = new Date(startAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startAt);
  dayEnd.setHours(23, 59, 59, 999);
  const dayBookings = await prisma.booking.findMany({
    where: {
      storeId: defaultStoreId,
      status: { notIn: ["CANCELED", "CANCEL_REQUESTED"] },
      startAt: { gte: dayStart, lte: dayEnd },
    },
    include: { service: true },
  });
  const overlapped = dayBookings.some((booking) => {
    const bookingEnd = new Date(booking.startAt.getTime() + booking.service.durationMinutes * 60 * 1000);
    return startAt < bookingEnd && endAt > booking.startAt;
  });
  if (overlapped) {
    redirectWithError(formData, "/#booking", "その時間帯はすでに予約があります。別の時間を選んでください。");
  }

  const booking = await prisma.booking.create({
    data: {
      bookingNumber: nextBookingNumber(),
      storeId: defaultStoreId,
      customerId: customer.id,
      serviceId: service.id,
      customerName: customer.name,
      status: "REQUESTED",
      startAt,
      note: text(formData, "note"),
    },
  });
  await prisma.customer.update({
    where: { id: customer.id },
    data: { bookingCount: { increment: 1 } },
  });
  await notifyNewBooking({ store, booking, service, customer });
  await writeAudit("create", "BOOKING", booking.id, `予約受付: ${booking.bookingNumber}`);
  revalidatePath("/");
  redirectWithNotice(formData, "/#booking", "予約が完了しました。");
}

export async function requestBookingChange(formData: FormData) {
  const bookingNumber = text(formData, "bookingNumber");
  const requestNote = text(formData, "requestNote");
  if (!bookingNumber || !requestNote) {
    redirectWithError(formData, "/", "予約番号と変更内容を入力してください。");
  }
  const store = await prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } });
  const booking = await prisma.booking.findUnique({ where: { bookingNumber } });
  if (!booking) {
    redirectWithError(formData, "/", "指定された予約番号が見つかりません。");
  }
  await prisma.booking.update({
    where: { bookingNumber },
    data: {
      status: "CHANGE_REQUESTED",
      requestNote,
    },
  });
  await writeAudit("request_change", "BOOKING", booking.id, `予約変更依頼: ${bookingNumber}`);
  await notifyBookingRequest({ store, bookingNumber, requestType: "変更依頼", requestNote });
  revalidatePath("/");
  redirectWithNotice(formData, "/", "予約変更依頼を受け付けました。");
}

export async function requestBookingCancel(formData: FormData) {
  const bookingNumber = text(formData, "bookingNumber");
  const requestNote = text(formData, "requestNote");
  if (!bookingNumber || !requestNote) {
    redirectWithError(formData, "/", "予約番号と理由を入力してください。");
  }
  const store = await prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } });
  const booking = await prisma.booking.findUnique({ where: { bookingNumber } });
  if (!booking) {
    redirectWithError(formData, "/", "指定された予約番号が見つかりません。");
  }
  await prisma.booking.update({
    where: { bookingNumber },
    data: {
      status: "CANCEL_REQUESTED",
      requestNote,
    },
  });
  await writeAudit("request_cancel", "BOOKING", booking.id, `予約キャンセル依頼: ${bookingNumber}`);
  await notifyBookingRequest({ store, bookingNumber, requestType: "キャンセル依頼", requestNote });
  revalidatePath("/");
  redirectWithNotice(formData, "/", "予約キャンセル依頼を受け付けました。");
}

export async function updateBookingStatus(formData: FormData) {
  await requireEditable(formData, "/admin#bookings");
  const booking = await prisma.booking.update({
    where: { id: text(formData, "bookingId") },
    data: { status: toBookingStatusKey(text(formData, "status")) },
  });
  await writeAudit("status", "BOOKING", booking.id, `予約ステータスを${booking.status}へ更新`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${booking.customerId}`);
  revalidatePath(`/admin/bookings/${booking.id}`);
  redirectWithNotice(formData, "/admin#bookings", "予約ステータスを更新しました。");
}

export async function createInquiry(formData: FormData) {
  await seedDefaultData();
  if (!text(formData, "name") || !text(formData, "email") || !text(formData, "subject") || !text(formData, "message")) {
    redirectWithError(formData, "/#contact", "名前、メール、件名、内容を入力してください。");
  }
  const store = await prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } });
  const customer = await findOrCreateCustomer({
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
  });

  const inquiry = await prisma.inquiry.create({
    data: {
      inquiryNumber: nextInquiryNumber(),
      storeId: defaultStoreId,
      customerId: customer.id,
      customerName: customer.name,
      subject: text(formData, "subject"),
      message: text(formData, "message"),
      status: "NEW",
    },
  });
  await notifyNewInquiry({ store, inquiry, customer });
  await writeAudit("create", "INQUIRY", inquiry.id, `問い合わせ受付: ${inquiry.inquiryNumber}`);
  revalidatePath("/");
  redirectWithNotice(formData, "/#contact", "問い合わせを受け付けました。");
}

export async function updateInquiryStatus(formData: FormData) {
  await requireEditable(formData, "/admin#inquiries");
  const inquiry = await prisma.inquiry.update({
    where: { id: text(formData, "inquiryId") },
    data: {
      status: toInquiryStatusKey(text(formData, "status")),
      responseNote: text(formData, "responseNote"),
    },
  });
  await writeAudit("update", "INQUIRY", inquiry.id, `問い合わせを${inquiry.status}へ更新`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${inquiry.customerId}`);
  revalidatePath(`/admin/inquiries/${inquiry.id}`);
  redirectWithNotice(formData, "/admin#inquiries", "問い合わせを保存しました。");
}

export async function sendInquiryReply(formData: FormData) {
  await requireEditable(formData, "/admin#inquiries");
  const inquiryId = text(formData, "inquiryId");
  const subject = text(formData, "subject");
  const body = text(formData, "body");
  if (!subject || !body) {
    redirectWithError(formData, "/admin#inquiries", "返信件名と本文を入力してください。");
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, storeId: defaultStoreId },
    include: { customer: true, store: true },
  });
  if (!inquiry) {
    redirectWithError(formData, "/admin#inquiries", "問い合わせが見つかりません。");
  }

  let skipped = false;
  try {
    const result = await sendCustomerMail({
      to: inquiry.customer.email,
      subject,
      text: body,
      replyTo: inquiry.store.email,
    });
    skipped = result.skipped;
  } catch {
    redirectWithError(formData, `/admin/inquiries/${inquiry.id}`, "メール送信に失敗しました。SMTP設定を確認してください。");
  }
  if (skipped) {
    redirectWithError(formData, `/admin/inquiries/${inquiry.id}`, "SMTP設定が未設定のため、返信メールを送信できません。");
  }

  await prisma.inquiry.update({
    where: { id: inquiry.id },
    data: {
      status: "DONE",
      responseNote: body,
    },
  });
  await writeAudit("reply", "INQUIRY", inquiry.id, "顧客へ返信メールを送信");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${inquiry.customerId}`);
  revalidatePath(`/admin/inquiries/${inquiry.id}`);
  redirectWithNotice(formData, `/admin/inquiries/${inquiry.id}`, "顧客へ返信メールを送信しました。");
}

export async function addInternalNote(formData: FormData) {
  await requireEditable(formData, "/admin");
  const targetType = text(formData, "targetType").toUpperCase();
  const targetId = text(formData, "targetId");
  const body = text(formData, "body");
  const author = text(formData, "author") || "管理者";
  if (!["BOOKING", "ORDER", "INQUIRY"].includes(targetType) || !targetId) {
    redirectWithError(formData, "/admin", "対応履歴の対象が正しくありません。");
  }
  if (!body) {
    redirectWithError(formData, "/admin", "対応履歴の本文を入力してください。");
  }

  await prisma.internalNote.create({
    data: {
      storeId: defaultStoreId,
      targetType,
      targetId,
      author,
      body,
    },
  });
  await writeAudit("note", targetType, targetId, `対応履歴を追加: ${body.slice(0, 40)}`);

  revalidatePath("/admin");
  if (targetType === "BOOKING") revalidatePath(`/admin/bookings/${targetId}`);
  if (targetType === "ORDER") revalidatePath(`/admin/orders/${targetId}`);
  if (targetType === "INQUIRY") revalidatePath(`/admin/inquiries/${targetId}`);
  redirectWithNotice(formData, "/admin", "対応履歴を追加しました。");
}

export async function saveStore(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  if (!text(formData, "name") || !text(formData, "email")) {
    redirectWithError(formData, "/admin#settings", "店舗名とメールを入力してください。");
  }
  await prisma.store.update({
    where: { id: defaultStoreId },
    data: {
      name: text(formData, "name"),
      description: text(formData, "description"),
      phone: text(formData, "phone"),
      email: text(formData, "email"),
    },
  });
  await writeAudit("update", "STORE", defaultStoreId, "店舗情報を保存");
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", "店舗情報を保存しました。");
}

export async function saveDesign(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  await prisma.store.update({
    where: { id: defaultStoreId },
    data: {
      brandColor: text(formData, "brandColor"),
      ctaLabel: text(formData, "ctaLabel"),
    },
  });
  await writeAudit("update", "STORE", defaultStoreId, "デザイン設定を保存");
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", "デザイン設定を反映しました。");
}

export async function saveBookingRules(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  const open = text(formData, "businessOpenTime") || "10:00";
  const close = text(formData, "businessCloseTime") || "18:00";
  if (parseTimeMinutes(open) >= parseTimeMinutes(close)) {
    redirectWithError(formData, "/admin#settings", "営業時間の開始は終了より前にしてください。");
  }
  await prisma.store.update({
    where: { id: defaultStoreId },
    data: {
      businessOpenTime: open,
      businessCloseTime: close,
      closedWeekdays: formData.getAll("closedWeekdays").map(String).join(","),
    },
  });
  await writeAudit("update", "STORE", defaultStoreId, "予約受付ルールを保存");
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", "予約受付ルールを保存しました。");
}

export async function addAdminUser(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const role = text(formData, "role") || "staff";
  if (!name || !email || !password) {
    redirectWithError(formData, "/admin#settings", "スタッフ名、メール、パスワードを入力してください。");
  }
  await prisma.adminUser.upsert({
    where: { storeId_email: { storeId: defaultStoreId, email } },
    create: { storeId: defaultStoreId, name, email, password, role, active: true },
    update: { name, password, role, active: true },
  });
  await writeAudit("upsert", "ADMIN_USER", email, `スタッフ権限を保存: ${email}`);
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", "スタッフ権限を保存しました。");
}

export async function updateAdminUser(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  const id = text(formData, "adminUserId");
  const password = text(formData, "password");
  const existing = await prisma.adminUser.findFirst({ where: { id, storeId: defaultStoreId } });
  if (!existing) redirectWithError(formData, "/admin#settings", "スタッフが見つかりません。");
  await prisma.adminUser.update({
    where: { id },
    data: {
      name: text(formData, "name"),
      role: text(formData, "role"),
      active: text(formData, "active") === "true",
      password: password || existing.password,
    },
  });
  await writeAudit("update", "ADMIN_USER", id, "スタッフ権限を更新");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", "スタッフ権限を更新しました。");
}

export async function restoreBackup(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  const raw = text(formData, "backupJson");
  if (!raw) redirectWithError(formData, "/admin#settings", "復元するJSONを貼り付けてください。");
  let parsed: { store?: { name?: string; description?: string; phone?: string; email?: string; brandColor?: string; ctaLabel?: string }; products?: Array<{ id?: string; name: string; description: string; price: number; stock: number; active?: boolean }> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    redirectWithError(formData, "/admin#settings", "JSONの形式が正しくありません。");
  }
  if (parsed.store) {
    await prisma.store.update({
      where: { id: defaultStoreId },
      data: {
        name: parsed.store.name ?? undefined,
        description: parsed.store.description ?? undefined,
        phone: parsed.store.phone ?? undefined,
        email: parsed.store.email ?? undefined,
        brandColor: parsed.store.brandColor ?? undefined,
        ctaLabel: parsed.store.ctaLabel ?? undefined,
      },
    });
  }
  for (const product of parsed.products ?? []) {
    if (!product.name) continue;
    await prisma.product.upsert({
      where: { id: product.id || `restored-${product.name}` },
      create: {
        id: product.id,
        storeId: defaultStoreId,
        name: product.name,
        description: product.description ?? "",
        price: Number(product.price ?? 0),
        stock: Number(product.stock ?? 0),
        active: product.active ?? true,
      },
      update: {
        name: product.name,
        description: product.description ?? "",
        price: Number(product.price ?? 0),
        stock: Number(product.stock ?? 0),
        active: product.active ?? true,
      },
    });
  }
  await writeAudit("restore", "BACKUP", defaultStoreId, "バックアップJSONを復元");
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", "バックアップJSONを復元しました。");
}

export async function saveNotificationSettings(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  const smtpPass = text(formData, "smtpPass");
  const existing = await prisma.notificationSetting.findUnique({ where: { storeId: defaultStoreId } });
  const enabled = text(formData, "enabled") === "on";
  const smtpPort = number(formData, "smtpPort") || 587;
  if (enabled && (!text(formData, "smtpHost") || !text(formData, "mailFrom"))) {
    redirectWithError(formData, "/admin#settings", "メール通知を有効にする場合はSMTPホストと送信元を入力してください。");
  }
  if (smtpPort < 1 || smtpPort > 65535) {
    redirectWithError(formData, "/admin#settings", "SMTPポートは1から65535の範囲で入力してください。");
  }

  await prisma.notificationSetting.upsert({
    where: { storeId: defaultStoreId },
    create: {
      storeId: defaultStoreId,
      enabled,
      smtpHost: text(formData, "smtpHost"),
      smtpPort,
      smtpUser: text(formData, "smtpUser"),
      smtpPass,
      mailFrom: text(formData, "mailFrom"),
      notificationEmail: text(formData, "notificationEmail"),
    },
    update: {
      enabled,
      smtpHost: text(formData, "smtpHost"),
      smtpPort,
      smtpUser: text(formData, "smtpUser"),
      smtpPass: smtpPass || existing?.smtpPass || "",
      mailFrom: text(formData, "mailFrom"),
      notificationEmail: text(formData, "notificationEmail"),
    },
  });
  await writeAudit("update", "NOTIFICATION", defaultStoreId, "メール通知設定を保存");
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", "メール通知設定を保存しました。");
}

export async function sendTestNotification(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  const store = await prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } });
  let skipped = false;

  try {
    const result = await sendAdminNotification({
      storeEmail: store.email,
      subject: `【${store.name}】メール通知テスト`,
      text: [
        "メール通知のテスト送信です。",
        "",
        "このメールが届いていれば、管理画面のメール通知設定は有効です。",
      ].join("\n"),
    });
    skipped = result.skipped;
  } catch {
    redirectWithError(formData, "/admin#settings", "テストメール送信に失敗しました。SMTP設定を確認してください。");
  }

  if (skipped) {
    redirectWithError(formData, "/admin#settings", "SMTP設定が未設定のため、テストメールを送信できません。");
  }

  await writeAudit("test", "NOTIFICATION", defaultStoreId, "メール通知テストを送信");
  redirectWithNotice(formData, "/admin#settings", "テストメールを送信しました。");
}

export async function addReplyTemplate(formData: FormData) {
  await requireEditable(formData, "/admin#templates");
  if (!text(formData, "title") || !text(formData, "body")) {
    redirectWithError(formData, "/admin#templates", "テンプレートのタイトルと本文を入力してください。");
  }
  await prisma.replyTemplate.create({
    data: {
      storeId: defaultStoreId,
      title: text(formData, "title"),
      body: text(formData, "body"),
      active: true,
    },
  });
  await writeAudit("create", "REPLY_TEMPLATE", text(formData, "title"), "返信テンプレートを追加");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#templates", "返信テンプレートを追加しました。");
}

export async function updateReplyTemplate(formData: FormData) {
  await requireEditable(formData, "/admin#templates");
  if (!text(formData, "title") || !text(formData, "body")) {
    redirectWithError(formData, "/admin#templates", "テンプレートのタイトルと本文を入力してください。");
  }
  await prisma.replyTemplate.update({
    where: { id: text(formData, "templateId") },
    data: {
      title: text(formData, "title"),
      body: text(formData, "body"),
      active: text(formData, "active") === "true",
    },
  });
  await writeAudit("update", "REPLY_TEMPLATE", text(formData, "templateId"), "返信テンプレートを保存");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#templates", "返信テンプレートを保存しました。");
}

export async function toggleModule(formData: FormData) {
  await requireManager(formData, "/admin#settings");
  const module = await prisma.moduleSetting.findUniqueOrThrow({
    where: { storeId_key: { storeId: defaultStoreId, key: text(formData, "key") } },
  });
  await prisma.moduleSetting.update({
    where: { id: module.id },
    data: { enabled: !module.enabled },
  });
  await writeAudit("toggle", "MODULE", module.key, module.enabled ? "モジュールを停止" : "モジュールを有効化");
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithNotice(formData, "/admin#settings", module.enabled ? "モジュールを停止しました。" : "モジュールを有効化しました。");
}

export async function createOrder(input: {
  name: string;
  email: string;
  phone: string;
  note: string;
  items: Array<{ productId: string; quantity: number }>;
}) {
  await seedDefaultData();
  if (!input.name.trim() || !input.email.trim()) {
    throw new Error("名前とメールを入力してください。");
  }
  if (input.items.length === 0) {
    throw new Error("カートが空です。");
  }
  if (input.items.some((item) => item.quantity < 1 || !Number.isInteger(item.quantity))) {
    throw new Error("注文数が正しくありません。");
  }
  const store = await prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } });
  const customer = await findOrCreateCustomer(input);

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) }, storeId: defaultStoreId },
  });

  const orderItems = input.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) throw new Error("販売終了した商品が含まれています。");
    if (!product.active) throw new Error(`${product.name}は現在非公開です。`);
    if (item.quantity > product.stock) throw new Error(`${product.name}の在庫が不足しています。`);
    return {
      product,
      quantity: item.quantity,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNumber: nextOrderNumber(),
        storeId: defaultStoreId,
        customerId: customer.id,
        customerName: customer.name,
        status: "RECEIVED",
        total,
        note: input.note.trim(),
      },
    });

    for (const item of orderItems) {
      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        },
      });
      await tx.product.update({
        where: { id: item.product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.payment.create({
      data: {
        storeId: defaultStoreId,
        orderId: createdOrder.id,
        status: "UNPAID",
        method: "NONE",
        amount: total,
      },
    });

    return createdOrder;
  });

  const notificationItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  await notifyNewOrder({ store, order, items: notificationItems, customer });
  await writeAudit("create", "ORDER", order.id, `注文受付: ${order.orderNumber}`);
  revalidatePath("/");
}
