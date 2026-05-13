import { prisma } from "./prisma";

const storeId = "store-main";

export async function seedDefaultData() {
  const existingStore = await prisma.store.findUnique({ where: { id: storeId } });
  if (existingStore) {
    await ensureBookingSeed();
    return existingStore;
  }

  const store = await prisma.store.create({
    data: {
      id: storeId,
      name: "緑町サロン",
      description: "予約、問い合わせ、商品販売を一つの管理画面で扱える小規模店舗向けの公開ページです。",
      phone: "03-0000-0000",
      email: "hello@example.com",
      brandColor: "#0f766e",
      ctaLabel: "問い合わせる",
    },
  });

  const [hanako, taro] = await Promise.all([
    prisma.customer.create({
      data: {
        storeId,
        name: "山田 花子",
        email: "hanako@example.com",
        phone: "090-0000-0000",
        bookingCount: 1,
        tags: "常連,ギフト",
        memo: "月末の来店が多い。ギフト商品の案内に反応あり。",
      },
    }),
    prisma.customer.create({
      data: {
        storeId,
        name: "佐藤 太郎",
        email: "taro@example.com",
        phone: "080-1111-1111",
        bookingCount: 2,
        tags: "予約利用",
        memo: "電話連絡を希望。",
      },
    }),
  ]);

  const [oil, tea, ticket] = await Promise.all([
    prisma.product.create({
      data: {
        storeId,
        name: "ホームケアオイル",
        description: "来店後のケアに使える軽い質感のオイルです。",
        price: 2800,
        stock: 12,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId,
        name: "ギフト用ハーブティー",
        description: "施術後のリラックスタイムに合うブレンドです。",
        price: 1600,
        stock: 20,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId,
        name: "ケアチケット",
        description: "店頭で使えるサービスチケット。決済なし注文で受付します。",
        price: 5000,
        stock: 8,
        active: true,
      },
    }),
  ]);

  const [care, counseling] = await Promise.all([
    prisma.service.create({
      data: {
        storeId,
        name: "ベーシックケア",
        description: "初回にも使いやすい標準メニューです。",
        durationMinutes: 60,
        price: 6600,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        storeId,
        name: "カウンセリング",
        description: "予約前の相談や商品選びの相談に対応します。",
        durationMinutes: 30,
        price: 0,
        active: true,
      },
    }),
  ]);

  await prisma.booking.create({
    data: {
      bookingNumber: "BKG-1001",
      storeId,
      customerId: taro.id,
      serviceId: care.id,
      customerName: taro.name,
      status: "CONFIRMED",
      startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      note: "既存予約のサンプル",
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: "ORD-1001",
      storeId,
      customerId: hanako.id,
      customerName: hanako.name,
      status: "RECEIVED",
      total: tea.price,
      note: "店頭受け取り",
      items: {
        create: [
          {
            productId: tea.id,
            name: tea.name,
            price: tea.price,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.moduleSetting.createMany({
    data: [
      {
        storeId,
        key: "inquiries",
        name: "問い合わせ",
        description: "公開フォーム、対応ステータス、顧客への紐付け。",
        enabled: true,
      },
      {
        storeId,
        key: "booking",
        name: "予約",
        description: "サービス、空き枠、予約履歴、事前決済。",
        enabled: true,
      },
      {
        storeId,
        key: "commerce",
        name: "商品販売",
        description: "商品、在庫、カート、注文、配送先。",
        enabled: true,
      },
      {
        storeId,
        key: "payments",
        name: "決済",
        description: "予約と注文の両方に紐付く支払い管理。",
        enabled: false,
      },
      {
        storeId,
        key: "notifications",
        name: "通知",
        description: "予約確認、注文確認、問い合わせ受付のメール通知。",
        enabled: false,
      },
      {
        storeId,
        key: "staff",
        name: "スタッフ",
        description: "スタッフ権限、担当予約、簡易シフト。",
        enabled: false,
      },
    ],
  });

  void oil;
  void ticket;
  void counseling;
  return store;
}

export const defaultStoreId = storeId;

async function ensureBookingSeed() {
  const serviceCount = await prisma.service.count({ where: { storeId } });
  if (serviceCount > 0) return;

  const service = await prisma.service.create({
    data: {
      storeId,
      name: "ベーシックケア",
      description: "初回にも使いやすい標準メニューです。",
      durationMinutes: 60,
      price: 6600,
      active: true,
    },
  });

  await prisma.service.create({
    data: {
      storeId,
      name: "カウンセリング",
      description: "予約前の相談や商品選びの相談に対応します。",
      durationMinutes: 30,
      price: 0,
      active: true,
    },
  });

  const customer = await prisma.customer.findFirst({ where: { storeId }, orderBy: { createdAt: "asc" } });
  if (!customer) return;

  await prisma.booking.create({
    data: {
      bookingNumber: "BKG-1001",
      storeId,
      customerId: customer.id,
      serviceId: service.id,
      customerName: customer.name,
      status: "CONFIRMED",
      startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      note: "既存予約のサンプル",
    },
  });
}
