import { NextResponse } from "next/server";
import { bookingStatusLabels, toBookingStatusKey } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { defaultStoreId, seedDefaultData } from "@/lib/seed";

export async function GET() {
  if (!(await requireAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  await seedDefaultData();

  const bookings = await prisma.booking.findMany({
    where: { storeId: defaultStoreId },
    include: { customer: true, service: true },
    orderBy: { startAt: "desc" },
  });
  const rows = [
    ["予約番号", "顧客名", "メール", "電話", "メニュー", "希望日時", "状態", "メモ", "依頼メモ", "受付日"],
    ...bookings.map((booking) => [
      booking.bookingNumber,
      booking.customerName,
      booking.customer.email,
      booking.customer.phone ?? "",
      booking.service.name,
      booking.startAt,
      bookingStatusLabels[toBookingStatusKey(booking.status)],
      booking.note,
      booking.requestNote,
      booking.createdAt,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bookings.csv"',
    },
  });
}
