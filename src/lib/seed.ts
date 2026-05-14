import { prisma } from "./prisma";

const storeId = "store-main";

export async function seedDefaultData() {
  const existingStore = await prisma.store.findUnique({ where: { id: storeId } });
  if (existingStore) {
    await ensureBookingSeed();
    await ensurePaymentProviderSetting();
    await ensurePageSections(existingStore.name, existingStore.description);
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
      lpDesignPreset: "simple",
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

  await prisma.paymentProviderSetting.create({
    data: {
      storeId,
      enabled: false,
      provider: "NONE",
      displayName: "決済サービス未設定",
      mode: "TEST",
      instructions: "正式発売後に店舗ごとに利用する決済サービスを選択してください。",
    },
  });

  await createDefaultPageSections(store.name, store.description);

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

async function ensurePaymentProviderSetting() {
  await prisma.paymentProviderSetting.upsert({
    where: { storeId },
    update: {},
    create: {
      storeId,
      enabled: false,
      provider: "NONE",
      displayName: "決済サービス未設定",
      mode: "TEST",
      instructions: "正式発売後に店舗ごとに利用する決済サービスを選択してください。",
    },
  });
}

async function createDefaultPageSections(storeName: string, storeDescription: string) {
  await prisma.pageSection.createMany({
    data: [
      {
        storeId,
        type: "hero",
        title: storeName,
        body: storeDescription,
        buttonLabel: "予約する",
        buttonHref: "#booking",
        sortOrder: 10,
        enabled: true,
      },
      {
        storeId,
        type: "about",
        title: "店舗案内",
        body: "小規模店舗の予約、問い合わせ、商品販売を一つにまとめた店舗ページです。",
        buttonLabel: "問い合わせ",
        buttonHref: "#contact",
        sortOrder: 20,
        enabled: true,
      },
      {
        storeId,
        type: "menu",
        title: "メニュー",
        body: "初回にも使いやすいメニューと、相談しながら選べるサービスを用意しています。",
        buttonLabel: "予約する",
        buttonHref: "#booking",
        sortOrder: 30,
        enabled: true,
      },
      {
        storeId,
        type: "products",
        title: "商品販売",
        body: "店頭受け取りや事前相談に使える商品を注文できます。",
        buttonLabel: "商品を見る",
        buttonHref: "#shop",
        sortOrder: 40,
        enabled: true,
      },
      {
        storeId,
        type: "booking",
        title: "予約受付",
        body: "希望日と時間を選んで予約できます。",
        buttonLabel: "予約する",
        buttonHref: "#booking",
        sortOrder: 50,
        enabled: true,
      },
      {
        storeId,
        type: "access",
        title: "アクセス",
        body: "住所や来店方法は店舗情報に合わせて編集してください。",
        buttonLabel: "",
        buttonHref: "",
        sortOrder: 60,
        enabled: true,
      },
      {
        storeId,
        type: "contact",
        title: "問い合わせ",
        body: "予約前の相談、商品についての質問を受け付けています。",
        buttonLabel: "問い合わせる",
        buttonHref: "#contact",
        sortOrder: 70,
        enabled: true,
      },
    ],
  });
}

async function ensurePageSections(storeName: string, storeDescription: string) {
  const count = await prisma.pageSection.count({ where: { storeId } });
  if (count > 0) return;
  await createDefaultPageSections(storeName, storeDescription);
}
