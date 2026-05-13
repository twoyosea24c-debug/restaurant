import { NextResponse } from "next/server";
import { statusLabels, toOrderStatusKey } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { defaultStoreId, seedDefaultData } from "@/lib/seed";

export async function GET() {
  if (!(await requireAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  await seedDefaultData();

  const orders = await prisma.order.findMany({
    where: { storeId: defaultStoreId },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  const rows = [
    ["注文ID", "顧客名", "メール", "電話", "商品", "合計", "状態", "メモ", "受付日"],
    ...orders.map((order) => [
      order.orderNumber,
      order.customerName,
      order.customer.email,
      order.customer.phone ?? "",
      order.items.map((item) => `${item.name} x ${item.quantity}`).join(" / "),
      order.total,
      statusLabels[toOrderStatusKey(order.status)],
      order.note,
      order.createdAt,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}
