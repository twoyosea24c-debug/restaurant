# Commerce Integration Plan

## 追加した対象

- Next.js App Router構成
- Prismaモデル
- SQLiteローカルDB
- Server Actions
- 公開ページと管理画面の分離
- 管理画面ログイン
- 予約受付・変更依頼・キャンセル依頼
- 予約管理
- 問い合わせ受付
- 問い合わせ管理
- 問い合わせステータス・対応メモ管理
- 公開側の商品一覧
- 注文状況・売上見込み・低在庫が見えるダッシュボード
- 商品詳細
- カート
- 決済なしの注文受付
- 空カート・在庫不足の注文防止
- 管理画面の商品管理
- 商品編集
- 商品の公開/非公開切り替え
- 管理画面の注文管理
- 注文検索・ステータス絞り込み
- 注文の表示件数・合計金額集計
- 注文詳細
- 注文ステータス変更
- 顧客詳細での注文履歴表示
- 顧客情報との注文紐付け
- 顧客メモ・タグ管理
- localStorageでのMVPデータ保存
- 保存・更新時の通知表示

## 顧客統合

注文受付時にメールアドレスを優先して既存顧客を探し、見つからない場合は電話番号で探します。
一致した場合は同じ顧客として注文を紐付けます。
問い合わせ受付も同じルールで顧客へ紐付けます。

```txt
customers
├─ bookings
├─ orders
└─ inquiries
```

## 将来DB化するテーブル

```txt
products
- id
- store_id
- name
- description
- price
- stock_quantity
- is_active

orders
- id
- store_id
- customer_id
- status
- total_amount
- note

order_items
- id
- order_id
- product_id
- product_name
- unit_price
- quantity
- total_price
```

## 決済追加時の方針

注文受付と決済を分離します。
`orders` は先に作成し、決済を追加する場合は `payments` を `order_id` に紐付けます。

## 注文ステータス

```txt
受付済み
準備中
受け渡し済み
キャンセル
```

予約ステータスとは分けて管理し、顧客詳細では予約件数と注文履歴をまとめて確認できる形にしています。

## MVP保存

静的MVPでは、以下をブラウザの `localStorage` に保存します。

```txt
store
design
customers
products
cart
orders
modules
inquiries
```

本番化する場合は、この保存先をAPIとデータベースへ置き換えます。

現在の本番化版では、顧客・商品・注文・問い合わせ・店舗情報・モジュール設定はDB保存に移行済みです。
カートは注文前の一時状態としてブラウザ側で保持しています。
