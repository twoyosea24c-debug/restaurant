import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { defaultStoreId, seedDefaultData } from "@/lib/seed";

export async function GET() {
  if (!(await requireAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  await seedDefaultData();

  const [store, customers, services, products, bookings, inquiries, orders, modules, notificationSetting, replyTemplates, stockMovements, internalNotes, adminUsers] =
    await Promise.all([
      prisma.store.findUnique({ where: { id: defaultStoreId } }),
      prisma.customer.findMany({ where: { storeId: defaultStoreId } }),
      prisma.service.findMany({ where: { storeId: defaultStoreId } }),
      prisma.product.findMany({ where: { storeId: defaultStoreId } }),
      prisma.booking.findMany({ where: { storeId: defaultStoreId } }),
      prisma.inquiry.findMany({ where: { storeId: defaultStoreId } }),
      prisma.order.findMany({ where: { storeId: defaultStoreId }, include: { items: true } }),
      prisma.moduleSetting.findMany({ where: { storeId: defaultStoreId } }),
      prisma.notificationSetting.findUnique({ where: { storeId: defaultStoreId } }),
      prisma.replyTemplate.findMany({ where: { storeId: defaultStoreId } }),
      prisma.stockMovement.findMany({ where: { storeId: defaultStoreId } }),
      prisma.internalNote.findMany({ where: { storeId: defaultStoreId } }),
      prisma.adminUser.findMany({ where: { storeId: defaultStoreId } }),
    ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    store,
    customers,
    services,
    products,
    bookings,
    inquiries,
    orders,
    modules,
    notificationSetting,
    replyTemplates,
    stockMovements,
    internalNotes,
    adminUsers: adminUsers.map(({ password, ...user }) => user),
  };

  return NextResponse.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="small-store-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
