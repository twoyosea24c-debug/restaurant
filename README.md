# Small Store Base

小規模店舗向けの共通ベースアプリです。

現在は静的MVPから、Next.js + Prisma + SQLite の本番寄り構成へ移行済みです。
ローカルではSQLiteで動かし、将来的にはPrismaのdatasourceをPostgreSQLへ差し替える前提です。

## 機能

- 共通の管理画面
- 注文状況・売上見込み・低在庫が見えるダッシュボード
- 共通の顧客データ
- 顧客メモ・タグ管理
- 顧客詳細ページ
- 管理画面の共通検索
- ステータス・日付・低在庫フィルター
- 顧客・予約・注文CSVエクスポート
- JSONバックアップ/復元
- スタッフ権限管理
- 監査ログ
- フォーム送信後の成功・エラー表示
- 予約受付
- 営業時間・定休日・重複予約チェック
- 予約カレンダー
- 予約受付時のメール通知
- 顧客への予約受付自動返信
- 予約変更依頼
- 予約キャンセル依頼
- 予約管理
- 予約詳細
- 予約対応履歴
- 問い合わせ受付
- 問い合わせ受付時のメール通知
- 顧客への問い合わせ受付自動返信
- 問い合わせ管理
- 問い合わせ詳細
- 問い合わせステータス・対応メモ管理
- 問い合わせ対応履歴
- 問い合わせ返信テンプレート
- 問い合わせ詳細からの顧客宛メール返信
- 店舗情報の編集
- 機能モジュールの有効化イメージ
- 商品一覧
- 商品詳細
- カート
- 決済なしの注文受付
- 決済準備ステータス管理
- 注文受付時のメール通知
- 顧客への注文受付自動返信
- 管理画面でのメール通知設定
- 空カート・在庫不足の注文防止
- 入力不備・存在しない予約番号のエラー表示
- 在庫の入庫・出庫・棚卸調整
- 在庫調整履歴
- 商品管理
- 商品編集
- 商品の公開/非公開切り替え
- 注文管理
- 注文検索・ステータス絞り込み
- 注文の表示件数・合計金額集計
- 注文詳細
- 注文対応履歴
- 注文ステータス変更
- 顧客詳細での注文履歴確認
- localStorageでの状態保存
- 保存・更新時の通知表示
- 公開ページのプレビュー
- スマホ対応レイアウト

## 開発

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

確認URL:

```txt
公開ページ: http://localhost:3000
管理画面: http://localhost:3000/admin
ログイン: http://localhost:3000/login
```

開発用ログイン:

```txt
ADMIN_PASSWORD=admin123
```

本番では `.env` の `ADMIN_PASSWORD` と `AUTH_SECRET` を必ず変更してください。
本番公開前の確認項目は [docs/production-checklist.md](docs/production-checklist.md) を参照してください。
PostgreSQLへ移行する場合は [docs/postgresql-migration.md](docs/postgresql-migration.md) を参照してください。

## メール通知

予約受付、予約変更依頼、予約キャンセル依頼、問い合わせ受付、注文受付のタイミングで店舗向け通知を送れます。
SMTP設定が未設定の場合は送信せず、サーバーログに `[mail:skip]` を出します。
管理画面の「メール通知」でSMTP設定を保存した場合は、その設定を優先します。

```txt
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="password"
MAIL_FROM="Small Store <noreply@example.com>"
NOTIFICATION_EMAIL="owner@example.com"
```

`NOTIFICATION_EMAIL` が空の場合は、店舗情報のメールアドレスへ通知します。

## チェック

```bash
npm run check
npm run build
```

## データベース

ローカルDBは `prisma/dev.db` です。

主要モデル:

- `Store`
- `Customer`
- `Service`
- `Booking`
- `Inquiry`
- `Product`
- `Order`
- `OrderItem`
- `Payment`
- `AuditLog`
- `StockMovement`
- `InternalNote`
- `AdminUser`
- `ModuleSetting`
- `NotificationSetting`
- `ReplyTemplate`

Prismaのschema engineがこのWindows環境でSQLite反映時に詳細なしで失敗したため、`npm run db:push` は `prisma/init-sqlite.ts` でSQLiteテーブルを作成してから `prisma generate` を実行する構成にしています。

本番PostgreSQL用に `prisma/schema.postgres.prisma` を用意しています。

```bash
npm run db:pg:generate
npm run db:pg:push
npm run build:pg
```

## レガシーMVP

以下のファイルは、移行前の静的MVPとして残しています。

- `index.html`
- `styles.css`
- `app.js`

## 顧客連携

予約・注文・問い合わせ時のメールアドレス、または電話番号が既存顧客と一致した場合は、同じ顧客として履歴に紐付けます。
これにより、予約した顧客と購入した顧客を共通の顧客情報で扱える前提にしています。
