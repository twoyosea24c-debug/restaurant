import { prisma } from "./prisma";
import { defaultStoreId, seedDefaultData } from "./seed";
import { formatPrice } from "./format";

export const orderStatuses = ["RECEIVED", "PREPARING", "COMPLETED", "CANCELED"] as const;
export type OrderStatusKey = (typeof orderStatuses)[number];
export const bookingStatuses = ["REQUESTED", "CONFIRMED", "CHANGE_REQUESTED", "CANCEL_REQUESTED", "CANCELED"] as const;
export type BookingStatusKey = (typeof bookingStatuses)[number];
export const inquiryStatuses = ["NEW", "IN_PROGRESS", "DONE", "CLOSED"] as const;
export type InquiryStatusKey = (typeof inquiryStatuses)[number];
export const stockMovementTypes = ["IN", "OUT", "ADJUST"] as const;
export type StockMovementTypeKey = (typeof stockMovementTypes)[number];
export const paymentStatuses = ["UNPAID", "PENDING", "PAID", "REFUNDED", "CANCELED"] as const;
export type PaymentStatusKey = (typeof paymentStatuses)[number];

export const statusLabels: Record<OrderStatusKey, string> = {
  RECEIVED: "受付済み",
  PREPARING: "準備中",
  COMPLETED: "受け渡し済み",
  CANCELED: "キャンセル",
};

export const bookingStatusLabels: Record<BookingStatusKey, string> = {
  REQUESTED: "受付待ち",
  CONFIRMED: "確定",
  CHANGE_REQUESTED: "変更依頼",
  CANCEL_REQUESTED: "キャンセル依頼",
  CANCELED: "キャンセル済み",
};

export const inquiryStatusLabels: Record<InquiryStatusKey, string> = {
  NEW: "未対応",
  IN_PROGRESS: "対応中",
  DONE: "対応済み",
  CLOSED: "クローズ",
};

export const stockMovementTypeLabels: Record<StockMovementTypeKey, string> = {
  IN: "入庫",
  OUT: "出庫",
  ADJUST: "棚卸調整",
};

export const paymentStatusLabels: Record<PaymentStatusKey, string> = {
  UNPAID: "未払い",
  PENDING: "確認中",
  PAID: "支払い済み",
  REFUNDED: "返金済み",
  CANCELED: "キャンセル",
};

export function toOrderStatusKey(status: string): OrderStatusKey {
  return orderStatuses.includes(status as OrderStatusKey) ? (status as OrderStatusKey) : "RECEIVED";
}

export function toBookingStatusKey(status: string): BookingStatusKey {
  return bookingStatuses.includes(status as BookingStatusKey) ? (status as BookingStatusKey) : "REQUESTED";
}

export function toInquiryStatusKey(status: string): InquiryStatusKey {
  return inquiryStatuses.includes(status as InquiryStatusKey) ? (status as InquiryStatusKey) : "NEW";
}

export function toStockMovementTypeKey(type: string): StockMovementTypeKey {
  return stockMovementTypes.includes(type as StockMovementTypeKey) ? (type as StockMovementTypeKey) : "IN";
}

export function toPaymentStatusKey(status?: string | null): PaymentStatusKey {
  return paymentStatuses.includes(status as PaymentStatusKey) ? (status as PaymentStatusKey) : "UNPAID";
}

export { formatPrice };

export function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function getCustomerDetail(customerId: string) {
  await seedDefaultData();

  const [store, customer] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } }),
    prisma.customer.findFirst({
      where: { id: customerId, storeId: defaultStoreId },
      include: {
        orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
        bookings: { include: { service: true }, orderBy: { startAt: "desc" } },
        inquiries: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  if (!customer) return null;

  const payableOrders = customer.orders.filter((order) => order.status !== "CANCELED");
  const lastActivityAt = [customer.updatedAt, ...customer.orders.map((order) => order.createdAt), ...customer.bookings.map((booking) => booking.createdAt), ...customer.inquiries.map((inquiry) => inquiry.createdAt)].sort(
    (a, b) => b.getTime() - a.getTime(),
  )[0];

  return {
    store,
    customer,
    summary: {
      bookingCount: customer.bookings.length,
      orderCount: customer.orders.length,
      inquiryCount: customer.inquiries.length,
      salesTotal: payableOrders.reduce((sum, order) => sum + order.total, 0),
      lastActivityAt,
    },
  };
}

export async function getBookingDetail(bookingId: string) {
  await seedDefaultData();

  const [store, booking, internalNotes] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } }),
    prisma.booking.findFirst({
      where: { id: bookingId, storeId: defaultStoreId },
      include: { customer: true, service: true },
    }),
    prisma.internalNote.findMany({
      where: { storeId: defaultStoreId, targetType: "BOOKING", targetId: bookingId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!booking) return null;
  return { store, booking, internalNotes };
}

export async function getOrderDetail(orderId: string) {
  await seedDefaultData();

  const [store, order, internalNotes] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } }),
    prisma.order.findFirst({
      where: { id: orderId, storeId: defaultStoreId },
      include: { customer: true, items: true, payment: true },
    }),
    prisma.internalNote.findMany({
      where: { storeId: defaultStoreId, targetType: "ORDER", targetId: orderId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!order) return null;
  return { store, order, internalNotes };
}

export async function getInquiryDetail(inquiryId: string) {
  await seedDefaultData();

  const [store, inquiry, replyTemplates, internalNotes] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } }),
    prisma.inquiry.findFirst({
      where: { id: inquiryId, storeId: defaultStoreId },
      include: { customer: true },
    }),
    prisma.replyTemplate.findMany({
      where: { storeId: defaultStoreId, active: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.internalNote.findMany({
      where: { storeId: defaultStoreId, targetType: "INQUIRY", targetId: inquiryId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!inquiry) return null;
  return { store, inquiry, replyTemplates, internalNotes };
}

export async function getAppData() {
  await seedDefaultData();

  const [store, customers, products, bookings, orders, inquiries, modules, services, notificationSetting, replyTemplates, stockMovements, adminUsers, auditLogs] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: defaultStoreId } }),
    prisma.customer.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { updatedAt: "desc" },
      include: {
        orders: { include: { items: true, payment: true }, orderBy: { createdAt: "desc" } },
        bookings: { include: { service: true }, orderBy: { startAt: "desc" } },
        inquiries: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.product.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { startAt: "asc" },
      include: { customer: true, service: true },
    }),
    prisma.order.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true, payment: true },
    }),
    prisma.inquiry.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.moduleSetting.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.service.findMany({
      where: { storeId: defaultStoreId, active: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.notificationSetting.findUnique({
      where: { storeId: defaultStoreId },
    }),
    prisma.replyTemplate.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.stockMovement.findMany({
      where: { storeId: defaultStoreId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.adminUser.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { storeId: defaultStoreId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const activeProducts = products.filter((product) => product.active);
  const payableOrders = orders.filter((order) => order.status !== "CANCELED");
  const lowStockProducts = products.filter((product) => product.stock <= 3);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calendarDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    return {
      date,
      bookings: bookings.filter((booking) => booking.startAt >= date && booking.startAt < next),
    };
  });

  return {
    store,
    customers,
    products,
    activeProducts,
    orders,
    modules,
    notificationSetting,
    replyTemplates,
    stockMovements,
    adminUsers,
    auditLogs,
    calendarDays,
    dashboard: {
      customerCount: customers.length,
      enabledModuleCount: modules.filter((module) => module.enabled).length,
      orderCount: orders.length,
      bookingCount: bookings.length,
      inquiryCount: inquiries.length,
      salesTotal: payableOrders.reduce((sum, order) => sum + order.total, 0),
      lowStockProducts,
      recentOrders: orders.slice(0, 5),
      statusSummaries: orderStatuses.map((status) => {
        const statusOrders = orders.filter((order) => order.status === status);
        return {
          status,
          label: statusLabels[status],
          count: statusOrders.length,
          total: statusOrders.reduce((sum, order) => sum + order.total, 0),
        };
      }),
    },
    services,
    bookings,
    inquiries,
  };
}
