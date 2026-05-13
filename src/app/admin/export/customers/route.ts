import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { defaultStoreId, seedDefaultData } from "@/lib/seed";

export async function GET() {
  if (!(await requireAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  await seedDefaultData();

  const customers = await prisma.customer.findMany({
    where: { storeId: defaultStoreId },
    include: { bookings: true, inquiries: true, orders: true },
    orderBy: { updatedAt: "desc" },
  });
  const rows = [
    ["名前", "メール", "電話", "予約数", "注文数", "問い合わせ数", "購入合計", "タグ", "メモ", "登録日"],
    ...customers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone ?? "",
      customer.bookings.length,
      customer.orders.length,
      customer.inquiries.length,
      customer.orders.reduce((sum, order) => sum + order.total, 0),
      customer.tags,
      customer.memo,
      customer.createdAt,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="customers.csv"',
    },
  });
}
