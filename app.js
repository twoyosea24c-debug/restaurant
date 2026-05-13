const storageKey = "small-store-base-state-v1";

const defaultState = {
  store: {
    name: "緑町サロン",
    description: "予約、問い合わせ、商品販売をあとから追加できる小規模店舗向けの公開ページです。",
    phone: "03-0000-0000",
    email: "hello@example.com",
  },
  design: {
    color: "#0f766e",
    cta: "問い合わせる",
  },
  customers: [
    {
      id: "cus-1",
      name: "山田 花子",
      email: "hanako@example.com",
      phone: "090-0000-0000",
      bookings: 1,
      tags: ["常連", "ギフト"],
      memo: "月末の来店が多い。ギフト商品の案内に反応あり。",
    },
    {
      id: "cus-2",
      name: "佐藤 太郎",
      email: "taro@example.com",
      phone: "080-1111-1111",
      bookings: 2,
      tags: ["予約利用"],
      memo: "電話連絡を希望。",
    },
  ],
  products: [
    {
      id: "prd-1",
      name: "ホームケアオイル",
      description: "来店後のケアに使える軽い質感のオイルです。",
      price: 2800,
      stock: 12,
      active: true,
    },
    {
      id: "prd-2",
      name: "ギフト用ハーブティー",
      description: "施術後のリラックスタイムに合うブレンドです。",
      price: 1600,
      stock: 20,
      active: true,
    },
    {
      id: "prd-3",
      name: "ケアチケット",
      description: "店頭で使えるサービスチケット。決済なし注文で受付します。",
      price: 5000,
      stock: 8,
      active: true,
    },
  ],
  cart: [],
  orders: [
    {
      id: "ord-1001",
      customerId: "cus-1",
      customerName: "山田 花子",
      items: [{ productId: "prd-2", name: "ギフト用ハーブティー", price: 1600, quantity: 1 }],
      total: 1600,
      status: "受付済み",
      note: "店頭受け取り",
    },
  ],
  modules: [
    {
      key: "inquiries",
      name: "問い合わせ",
      description: "公開フォーム、対応ステータス、顧客への紐付け。",
      enabled: true,
    },
    {
      key: "booking",
      name: "予約",
      description: "サービス、空き枠、予約履歴、事前決済。",
      enabled: false,
    },
    {
      key: "commerce",
      name: "商品販売",
      description: "商品、在庫、カート、注文、配送先。",
      enabled: true,
    },
    {
      key: "payments",
      name: "決済",
      description: "予約と注文の両方に紐付く支払い管理。",
      enabled: false,
    },
    {
      key: "notifications",
      name: "通知",
      description: "予約確認、注文確認、問い合わせ受付のメール通知。",
      enabled: false,
    },
    {
      key: "staff",
      name: "スタッフ",
      description: "スタッフ権限、担当予約、簡易シフト。",
      enabled: false,
    },
  ],
};

const state = loadState();

const titles = {
  dashboard: "ダッシュボード",
  shop: "商品一覧",
  cart: "カート",
  customers: "顧客",
  products: "商品管理",
  orders: "注文管理",
  store: "店舗情報",
  modules: "機能",
  design: "デザイン",
};

const pageTitle = document.querySelector("#page-title");
const customerRows = document.querySelector("#customer-rows");
const customerCount = document.querySelector("#customer-count");
const enabledCount = document.querySelector("#enabled-count");
const orderCount = document.querySelector("#order-count");
const cartCount = document.querySelector("#cart-count");
const salesTotal = document.querySelector("#sales-total");
const lowStockCount = document.querySelector("#low-stock-count");
const dashboardModules = document.querySelector("#dashboard-modules");
const dashboardStatuses = document.querySelector("#dashboard-statuses");
const dashboardLowStock = document.querySelector("#dashboard-low-stock");
const dashboardRecentOrders = document.querySelector("#dashboard-recent-orders");
const moduleList = document.querySelector("#module-list");
const storeForm = document.querySelector("#store-form");
const designForm = document.querySelector("#design-form");
const shopProducts = document.querySelector("#shop-products");
const productDetail = document.querySelector("#product-detail");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const productRows = document.querySelector("#product-rows");
const productEditor = document.querySelector("#product-editor");
const orderRows = document.querySelector("#order-rows");
const customerDetail = document.querySelector("#customer-detail");
const orderDetail = document.querySelector("#order-detail");
const productForm = document.querySelector("#product-form");
const orderForm = document.querySelector("#order-form");
const submitOrder = document.querySelector("#submit-order");
const orderFilterForm = document.querySelector("#order-filter-form");
const filteredOrderCount = document.querySelector("#filtered-order-count");
const filteredOrderTotal = document.querySelector("#filtered-order-total");
const toast = document.querySelector("#toast");
const orderStatuses = ["受付済み", "準備中", "受け渡し済み", "キャンセル"];
const orderFilters = {
  query: "",
  status: "all",
};
let toastTimer;

function loadState() {
  try {
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return structuredClone(defaultState);

    return {
      ...structuredClone(defaultState),
      ...JSON.parse(savedState),
    };
  } catch (error) {
    console.warn("保存データを読み込めませんでした。初期データで起動します。", error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn("保存に失敗しました。", error);
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function formatPrice(value) {
  return `${value.toLocaleString("ja-JP")}円`;
}

function getCustomerOrderCount(customerId) {
  return state.orders.filter((order) => order.customerId === customerId).length;
}

function getCustomerHistory(customer) {
  const orderAmount = state.orders
    .filter((order) => order.customerId === customer.id)
    .reduce((sum, order) => sum + order.total, 0);
  return `予約 ${customer.bookings || 0}件 / 注文 ${getCustomerOrderCount(customer.id)}件 / 購入 ${formatPrice(orderAmount)}`;
}

function getCustomerOrders(customerId) {
  return state.orders.filter((order) => order.customerId === customerId);
}

function findOrCreateCustomer({ name, email, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();
  let customer = state.customers.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (!customer && normalizedPhone) {
    customer = state.customers.find((item) => item.phone === normalizedPhone);
  }

  if (customer) {
    customer.name = name;
    customer.email = normalizedEmail;
    customer.phone = normalizedPhone || customer.phone;
    return customer;
  }

  customer = {
    id: `cus-${Date.now()}`,
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    bookings: 0,
    tags: [],
    memo: "",
  };
  state.customers.unshift(customer);
  return customer;
}

function switchView(viewId) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  pageTitle.textContent = titles[viewId];
}

function renderCustomers() {
  customerRows.innerHTML = state.customers
    .map(
      (customer) => `
        <tr>
          <td>${customer.name}</td>
          <td>${customer.email}</td>
          <td>${customer.phone || "-"}</td>
          <td>
            ${getCustomerHistory(customer)}
            <div class="tag-list">${(customer.tags || []).map((tag) => `<span>${tag}</span>`).join("")}</div>
          </td>
          <td><button class="table-action" data-customer-detail="${customer.id}">見る</button></td>
        </tr>
      `,
    )
    .join("");

  customerCount.textContent = String(state.customers.length);
}

function renderCustomerDetail(customerId) {
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return;

  const orders = getCustomerOrders(customer.id);
  customerDetail.hidden = false;
  customerDetail.innerHTML = `
    <div class="panel-head">
      <h2>${customer.name}</h2>
      <span>顧客詳細</span>
    </div>
    <div class="detail-layout compact">
      <div>
        <dl class="detail-list">
          <div><dt>メール</dt><dd>${customer.email}</dd></div>
          <div><dt>電話</dt><dd>${customer.phone || "-"}</dd></div>
          <div><dt>予約履歴</dt><dd>${customer.bookings || 0}件</dd></div>
          <div><dt>注文履歴</dt><dd>${orders.length}件</dd></div>
          <div><dt>タグ</dt><dd>${(customer.tags || []).join("、") || "-"}</dd></div>
        </dl>
        <form class="settings-form compact-form" id="customer-note-form" data-customer-id="${customer.id}">
          <label>
            タグ
            <input name="tags" value="${(customer.tags || []).join(", ")}" placeholder="常連, ギフト" />
          </label>
          <label>
            メモ
            <textarea name="memo" rows="4" placeholder="接客メモや注意点">${customer.memo || ""}</textarea>
          </label>
          <button type="submit">顧客メモを保存</button>
        </form>
      </div>
      <div>
        <h3 class="subhead">注文履歴</h3>
        ${
          orders.length === 0
            ? '<p class="empty-state">注文履歴はまだありません。</p>'
            : orders
                .map(
                  (order) => `
                    <article class="history-item">
                      <div>
                        <strong>${order.id}</strong>
                        <p>${order.items.map((item) => `${item.name} x ${item.quantity}`).join("、")}</p>
                      </div>
                      <span class="status-badge">${order.status}</span>
                    </article>
                  `,
                )
                .join("")
        }
      </div>
    </div>
  `;
}

function renderModules() {
  const enabledModules = state.modules.filter((module) => module.enabled);
  enabledCount.textContent = String(enabledModules.length);

  dashboardModules.innerHTML = state.modules
    .slice(0, 6)
    .map(
      (module) => `
        <article class="module-card">
          <h3>${module.name}</h3>
          <p>${module.description}</p>
          <span class="module-status">${module.enabled ? "有効" : "後で追加"}</span>
        </article>
      `,
    )
    .join("");

  moduleList.innerHTML = state.modules
    .map(
      (module) => `
        <article class="module-row">
          <h3>${module.name}</h3>
          <p>${module.description}</p>
          <span class="module-status">${module.enabled ? "有効" : "無効"}</span>
          <button class="${module.enabled ? "enabled" : ""}" data-module="${module.key}">
            ${module.enabled ? "停止" : "有効化"}
          </button>
        </article>
      `,
    )
    .join("");
}

function renderDashboard() {
  const payableOrders = state.orders.filter((order) => order.status !== "キャンセル");
  const lowStockProducts = state.products.filter((product) => product.stock <= 3);
  salesTotal.textContent = formatPrice(payableOrders.reduce((sum, order) => sum + order.total, 0));
  lowStockCount.textContent = String(lowStockProducts.length);

  dashboardStatuses.innerHTML = orderStatuses
    .map((status) => {
      const orders = state.orders.filter((order) => order.status === status);
      const total = orders.reduce((sum, order) => sum + order.total, 0);
      return `
        <article class="status-card">
          <p>${status}</p>
          <strong>${orders.length}件</strong>
          <span>${formatPrice(total)}</span>
        </article>
      `;
    })
    .join("");

  dashboardLowStock.innerHTML =
    lowStockProducts.length === 0
      ? '<p class="empty-state">低在庫の商品はありません。</p>'
      : lowStockProducts
          .map(
            (product) => `
              <article class="history-item">
                <div>
                  <strong>${product.name}</strong>
                  <p>${product.active ? "公開中" : "非公開"} / ${formatPrice(product.price)}</p>
                </div>
                <span class="status-badge">在庫 ${product.stock}</span>
              </article>
            `,
          )
          .join("");

  dashboardRecentOrders.innerHTML =
    state.orders.length === 0
      ? '<p class="empty-state">最近の注文はありません。</p>'
      : state.orders
          .slice(0, 5)
          .map(
            (order) => `
              <article class="history-item">
                <div>
                  <strong>${order.customerName}</strong>
                  <p>${order.id} / ${order.items.map((item) => `${item.name} x ${item.quantity}`).join("、")}</p>
                </div>
                <div class="history-meta">
                  <span class="status-badge">${order.status}</span>
                  <strong>${formatPrice(order.total)}</strong>
                </div>
              </article>
            `,
          )
          .join("");
}

function renderProducts() {
  shopProducts.innerHTML = state.products
    .filter((product) => product.active)
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-thumb">${product.name.slice(0, 1)}</div>
          <div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
          </div>
          <div class="product-actions">
            <strong>${formatPrice(product.price)}</strong>
            <button data-detail="${product.id}">詳細</button>
            <button data-add-cart="${product.id}" ${product.stock < 1 ? "disabled" : ""}>カートに入れる</button>
          </div>
        </article>
      `,
    )
    .join("");

  productRows.innerHTML = state.products
    .map(
      (product) => `
        <tr>
          <td>${product.name}</td>
          <td>${formatPrice(product.price)}</td>
          <td>${product.stock}</td>
          <td>${product.active ? "公開" : "停止"}</td>
          <td class="table-actions">
            <button class="table-action" data-product-edit="${product.id}">編集</button>
            <button class="table-action" data-product-toggle="${product.id}">${product.active ? "非公開" : "公開"}</button>
          </td>
        </tr>
      `,
    )
    .join("");

  renderDashboard();
}

function renderProductEditor(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  productEditor.hidden = false;
  productEditor.innerHTML = `
    <div class="panel-head">
      <h2>${product.name}</h2>
      <span>商品編集</span>
    </div>
    <form class="settings-form" id="product-edit-form" data-product-id="${product.id}">
      <label>
        商品名
        <input name="name" value="${product.name}" required />
      </label>
      <label>
        価格
        <input name="price" type="number" min="0" step="100" value="${product.price}" required />
      </label>
      <label>
        在庫
        <input name="stock" type="number" min="0" step="1" value="${product.stock}" required />
      </label>
      <label>
        説明
        <textarea name="description" rows="3" required>${product.description}</textarea>
      </label>
      <label>
        公開状態
        <select name="active" class="status-select">
          <option value="true" ${product.active ? "selected" : ""}>公開</option>
          <option value="false" ${!product.active ? "selected" : ""}>非公開</option>
        </select>
      </label>
      <button type="submit">保存</button>
    </form>
  `;
}

function renderProductDetail(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  productDetail.hidden = false;
  productDetail.innerHTML = `
    <div class="panel-head">
      <h2>${product.name}</h2>
      <span>商品詳細</span>
    </div>
    <div class="detail-layout">
      <div class="product-thumb large">${product.name.slice(0, 1)}</div>
      <div>
        <p>${product.description}</p>
        <dl class="detail-list">
          <div><dt>価格</dt><dd>${formatPrice(product.price)}</dd></div>
          <div><dt>在庫</dt><dd>${product.stock}</dd></div>
          <div><dt>注文方法</dt><dd>決済なしで受付し、店舗から連絡します。</dd></div>
        </dl>
        <button class="inline-action" data-add-cart="${product.id}">カートに入れる</button>
      </div>
    </div>
  `;
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product || product.stock < 1) return;

  const existing = state.cart.find((item) => item.productId === productId);
  if (existing) {
    if (existing.quantity < product.stock) existing.quantity += 1;
  } else {
    state.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  saveState();
  renderCart();
  showToast("カートに追加しました。");
}

function renderCart() {
  if (state.cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-state">カートは空です。</p>';
  } else {
    cartItems.innerHTML = state.cart
      .map(
        (item) => `
          <article class="cart-row">
            <div>
              <h3>${item.name}</h3>
              <p>${formatPrice(item.price)} x ${item.quantity}</p>
            </div>
            <div class="quantity-controls">
              <button data-cart-decrease="${item.productId}">-</button>
              <span>${item.quantity}</span>
              <button data-cart-increase="${item.productId}">+</button>
              <button data-cart-remove="${item.productId}">削除</button>
            </div>
          </article>
        `,
      )
      .join("");
  }

  const quantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = String(quantity);
  cartTotal.textContent = formatPrice(total);
  submitOrder.disabled = quantity === 0;
  renderDashboard();
}

function validateCartStock() {
  return state.cart
    .map((item) => {
      const product = state.products.find((productItem) => productItem.id === item.productId);
      if (!product) return `${item.name}は販売を終了しています。`;
      if (!product.active) return `${item.name}は現在非公開です。`;
      if (item.quantity > product.stock) return `${item.name}の在庫が不足しています。`;
      return "";
    })
    .filter(Boolean);
}

function renderOrders() {
  const filteredOrders = state.orders.filter((order) => {
    const query = orderFilters.query.trim().toLowerCase();
    const matchesStatus = orderFilters.status === "all" || order.status === orderFilters.status;
    const searchableText = [
      order.id,
      order.customerName,
      order.status,
      order.items.map((item) => item.name).join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return matchesStatus && (!query || searchableText.includes(query));
  });

  orderRows.innerHTML =
    filteredOrders.length === 0
      ? '<tr><td colspan="6">注文はまだありません。</td></tr>'
      : filteredOrders
          .map(
            (order) => `
              <tr>
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.items.map((item) => `${item.name} x ${item.quantity}`).join("<br />")}</td>
                <td>${formatPrice(order.total)}</td>
                <td>
                  <select class="status-select" data-order-status="${order.id}">
                    ${orderStatuses
                      .map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`)
                      .join("")}
                  </select>
                </td>
                <td><button class="table-action" data-order-detail="${order.id}">見る</button></td>
              </tr>
            `,
          )
          .join("");

  orderCount.textContent = String(state.orders.length);
  filteredOrderCount.textContent = `${filteredOrders.length}件`;
  filteredOrderTotal.textContent = formatPrice(filteredOrders.reduce((sum, order) => sum + order.total, 0));
  renderDashboard();
}

function renderOrderDetail(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;

  const customer = state.customers.find((item) => item.id === order.customerId);
  orderDetail.hidden = false;
  orderDetail.innerHTML = `
    <div class="panel-head">
      <h2>${order.id}</h2>
      <span>注文詳細</span>
    </div>
    <div class="detail-layout compact">
      <div>
        <dl class="detail-list">
          <div><dt>顧客</dt><dd>${order.customerName}</dd></div>
          <div><dt>メール</dt><dd>${customer?.email || "-"}</dd></div>
          <div><dt>電話</dt><dd>${customer?.phone || "-"}</dd></div>
          <div><dt>状態</dt><dd>${order.status}</dd></div>
          <div><dt>合計</dt><dd>${formatPrice(order.total)}</dd></div>
          <div><dt>メモ</dt><dd>${order.note || "-"}</dd></div>
        </dl>
      </div>
      <div>
        <h3 class="subhead">注文商品</h3>
        ${order.items
          .map(
            (item) => `
              <article class="history-item">
                <div>
                  <strong>${item.name}</strong>
                  <p>${formatPrice(item.price)} x ${item.quantity}</p>
                </div>
                <span>${formatPrice(item.price * item.quantity)}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderStore() {
  storeForm.name.value = state.store.name;
  storeForm.description.value = state.store.description;
  storeForm.phone.value = state.store.phone;
  storeForm.email.value = state.store.email;

  document.querySelector("#public-name").textContent = state.store.name;
  document.querySelector("#public-description").textContent = state.store.description;
}

function renderDesign() {
  designForm.color.value = state.design.color;
  designForm.cta.value = state.design.cta;
  document.documentElement.style.setProperty("--brand", state.design.color);
  document.querySelector("#public-cta").textContent = state.design.cta;
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelector("#customer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.customers.unshift({
    id: `cus-${Date.now()}`,
    name: formData.get("name"),
    email: formData.get("email").trim().toLowerCase(),
    phone: formData.get("phone").trim(),
    bookings: 0,
    tags: [],
    memo: "",
  });
  event.currentTarget.reset();
  saveState();
  renderCustomers();
  showToast("顧客を追加しました。");
});

customerRows.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-customer-detail]");
  if (!detailButton) return;
  renderCustomerDetail(detailButton.dataset.customerDetail);
});

customerDetail.addEventListener("submit", (event) => {
  const form = event.target.closest("#customer-note-form");
  if (!form) return;

  event.preventDefault();
  const customer = state.customers.find((item) => item.id === form.dataset.customerId);
  if (!customer) return;

  const formData = new FormData(form);
  customer.tags = formData
    .get("tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  customer.memo = formData.get("memo").trim();

  saveState();
  renderCustomers();
  renderCustomerDetail(customer.id);
  showToast("顧客メモを保存しました。");
});

shopProducts.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-detail]");
  const addButton = event.target.closest("[data-add-cart]");

  if (detailButton) renderProductDetail(detailButton.dataset.detail);
  if (addButton) addToCart(addButton.dataset.addCart);
});

productDetail.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-cart]");
  if (addButton) addToCart(addButton.dataset.addCart);
});

cartItems.addEventListener("click", (event) => {
  const increaseButton = event.target.closest("[data-cart-increase]");
  const decreaseButton = event.target.closest("[data-cart-decrease]");
  const removeButton = event.target.closest("[data-cart-remove]");
  const productId =
    increaseButton?.dataset.cartIncrease ||
    decreaseButton?.dataset.cartDecrease ||
    removeButton?.dataset.cartRemove;
  if (!productId) return;

  const cartItem = state.cart.find((item) => item.productId === productId);
  const product = state.products.find((item) => item.id === productId);
  if (!cartItem || !product) return;

  if (increaseButton && cartItem.quantity < product.stock) cartItem.quantity += 1;
  if (decreaseButton) cartItem.quantity -= 1;
  if (removeButton || cartItem.quantity < 1) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
  }

  saveState();
  renderCart();
  showToast("カートを更新しました。");
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  state.products.unshift({
    id: `prd-${Date.now()}`,
    name: formData.get("name"),
    description: formData.get("description"),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    active: true,
  });
  productForm.reset();
  saveState();
  renderProducts();
  showToast("商品を追加しました。");
});

productRows.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-product-edit]");
  const toggleButton = event.target.closest("[data-product-toggle]");

  if (editButton) {
    renderProductEditor(editButton.dataset.productEdit);
    return;
  }

  if (toggleButton) {
    const product = state.products.find((item) => item.id === toggleButton.dataset.productToggle);
    if (!product) return;

    product.active = !product.active;
    saveState();
    renderProducts();
    showToast(product.active ? "商品を公開しました。" : "商品を非公開にしました。");
  }
});

productEditor.addEventListener("submit", (event) => {
  const form = event.target.closest("#product-edit-form");
  if (!form) return;

  event.preventDefault();
  const product = state.products.find((item) => item.id === form.dataset.productId);
  if (!product) return;

  const formData = new FormData(form);
  product.name = formData.get("name").trim();
  product.description = formData.get("description").trim();
  product.price = Number(formData.get("price"));
  product.stock = Number(formData.get("stock"));
  product.active = formData.get("active") === "true";

  saveState();
  renderProducts();
  renderProductEditor(product.id);
  showToast("商品を保存しました。");
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.cart.length === 0) {
    showToast("カートが空です。");
    return;
  }

  const stockErrors = validateCartStock();
  if (stockErrors.length > 0) {
    showToast(stockErrors[0]);
    renderProducts();
    renderCart();
    return;
  }

  const formData = new FormData(orderForm);
  const customer = findOrCreateCustomer({
    name: formData.get("name").trim(),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  const order = {
    id: `ord-${Date.now()}`,
    customerId: customer.id,
    customerName: customer.name,
    items: state.cart.map((item) => ({ ...item })),
    total: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: "受付済み",
    note: formData.get("note"),
  };

  state.orders.unshift(order);
  state.cart.forEach((item) => {
    const product = state.products.find((productItem) => productItem.id === item.productId);
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
  });
  state.cart = [];
  orderForm.reset();
  saveState();
  renderCustomers();
  renderProducts();
  renderCart();
  renderOrders();
  switchView("orders");
  showToast("注文を受け付けました。");
});

orderRows.addEventListener("change", (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;

  const order = state.orders.find((item) => item.id === select.dataset.orderStatus);
  if (!order) return;

  order.status = select.value;
  saveState();
  renderOrders();
  renderCustomers();
  renderOrderDetail(order.id);
  showToast("注文ステータスを更新しました。");
});

orderRows.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-order-detail]");
  if (!detailButton) return;
  renderOrderDetail(detailButton.dataset.orderDetail);
});

orderFilterForm.addEventListener("input", () => {
  const formData = new FormData(orderFilterForm);
  orderFilters.query = formData.get("query");
  orderFilters.status = formData.get("status");
  renderOrders();
});

orderFilterForm.addEventListener("reset", () => {
  orderFilters.query = "";
  orderFilters.status = "all";
  setTimeout(renderOrders, 0);
});

storeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(storeForm);
  state.store = {
    name: formData.get("name"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  };
  saveState();
  renderStore();
  showToast("店舗情報を保存しました。");
});

designForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(designForm);
  state.design = {
    color: formData.get("color"),
    cta: formData.get("cta"),
  };
  saveState();
  renderDesign();
  showToast("デザインを反映しました。");
});

moduleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-module]");
  if (!button) return;

  const module = state.modules.find((item) => item.key === button.dataset.module);
  module.enabled = !module.enabled;
  saveState();
  renderModules();
  renderDashboard();
  showToast(module.enabled ? "機能を有効化しました。" : "機能を停止しました。");
});

renderCustomers();
renderModules();
renderProducts();
renderCart();
renderOrders();
renderDashboard();
renderStore();
renderDesign();
