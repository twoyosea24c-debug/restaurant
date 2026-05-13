# 本番設定チェックリスト

本番公開前に確認する項目です。未設定のまま公開すると、管理画面の保護、メール通知、データ永続化に問題が出ます。

## 必須設定

- `DATABASE_URL`
  - 本番では PostgreSQL の接続URLを設定します。
  - 例: `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public`
- `DIRECT_URL`
  - Prisma CLIでテーブル作成や将来のmigrationを行うための接続URLです。
  - Supabaseでは Session pooler または Direct connection を使います。
- `ADMIN_PASSWORD`
  - 初期オーナーログイン用の強いパスワードに変更します。
  - 共有アカウント運用を避け、公開後は管理画面の「権限管理」でスタッフアカウントを作ります。
- `AUTH_SECRET`
  - 32文字以上のランダム文字列を設定します。
  - 変更すると既存ログインセッションは無効になります。
- `NEXT_PUBLIC_APP_URL`
  - デプロイ先URLを設定します。
  - 例: `https://example.com`

## メール通知

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `NOTIFICATION_EMAIL`

SMTP設定は管理画面の「メール通知」からも保存できます。管理画面に保存した設定がある場合は、環境変数より優先されます。

## 管理画面で確認する初期データ

- 店舗名、紹介文、電話番号、メールアドレス
- 営業時間、定休日
- 予約メニュー
- 商品名、価格、在庫、公開状態
- 返信テンプレート
- スタッフ権限

## 公開前の動作確認

- 公開ページが表示できる
- 管理画面へログインできる
- 予約を送信できる
- 予約変更依頼とキャンセル依頼を送信できる
- 問い合わせを送信できる
- 注文を送信できる
- 注文後に在庫が減る
- 決済準備ステータスを変更できる
- 顧客詳細に予約・注文・問い合わせが紐付く
- CSVエクスポートができる
- バックアップJSONを取得できる
- メール通知と顧客自動返信が届く
- 本番ビルドコマンドが `npm run build:pg` になっている

## 本番で避けること

- `ADMIN_PASSWORD=admin123` のまま公開しない
- `AUTH_SECRET=dev-secret-change-me` のまま公開しない
- SQLite の `file:./dev.db` を本番DBとして使わない
- SMTP未確認のまま顧客向けメールを有効運用しない
- バックアップなしで復元操作をしない
