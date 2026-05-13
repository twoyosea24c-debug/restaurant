# Architecture Plan

## 全体構成

```txt
公開ページ
管理画面
共通データ
認証・権限
デザイン基盤
機能モジュール
```

現在の本番化構成:

```txt
Next.js App Router
Prisma Client
SQLite local DB
Server Actions
Client cart component
Admin login
SMTP mail notification
Customer detail
Admin search
Reply templates
```

## URL構成

```txt
/                       公開トップ
/services               サービス一覧
/products               商品一覧
/booking                予約受付
/contact                問い合わせ
/admin                  管理画面
/admin/customers        顧客
/admin/bookings         予約
/admin/products         商品
/admin/orders           注文
/admin/inquiries        問い合わせ
/admin/settings         設定
```

## 共通データベース案

```txt
stores
users
customers
customer_addresses
services
products
bookings
orders
order_items
inquiries
payments
store_modules
```

現在のPrismaモデル:

```txt
Store
Customer
Service
Booking
Inquiry
Product
Order
OrderItem
ModuleSetting
NotificationSetting
ReplyTemplate
```

## MVP

- 管理画面レイアウト
- 店舗情報
- 顧客管理
- 機能モジュール設定
- デザイン設定
- 商品一覧
- 商品詳細
- カート
- 決済なし注文受付
- 商品管理
- 注文管理
- 公開ページプレビュー

## 本番化メモ

- 管理データはPrisma経由でDBに保存
- カートだけはブラウザ内の一時状態
- 公開ページ `/` と管理画面 `/admin` を分離
- 管理画面は `/login` からのパスワードログインで保護
- 予約受付・変更依頼・キャンセル依頼は `Booking` として保存
- 問い合わせは `Inquiry` として保存し、管理画面で状態と対応メモを更新
- 注文・問い合わせ作成時にメールまたは電話で既存顧客へ紐付け
- 予約・問い合わせ・注文の受付後にSMTP設定があれば店舗向けメール通知を送信
- SMTP設定は環境変数を基本にし、管理画面保存の設定が有効な場合はそちらを優先
- 顧客詳細では予約・注文・問い合わせを同じ顧客軸で確認
- 管理画面検索は顧客、予約、問い合わせ、注文の主要文字列を横断検索
- 在庫不足・非公開商品は注文前にサーバー側で検証
- Prisma datasourceをPostgreSQLに変更できるよう、DBアクセスは `src/lib` と Server Actions に集約

## 予約と商品販売の統合ポイント

- 顧客情報は `customers` を共通軸にする
- 予約履歴、注文履歴、問い合わせ履歴は顧客詳細でまとめて扱う
- 注文・問い合わせ時はメールまたは電話で既存顧客へ紐付ける
- 決済は注文受付とは分離し、後から `payments` を追加する

## 今回は作らない機能

- 本番認証
- 決済
- メール送信
- 顧客マイページ
- 複数店舗の本格管理
