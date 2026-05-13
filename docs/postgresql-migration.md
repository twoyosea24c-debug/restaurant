# PostgreSQL 移行準備

ローカル開発は SQLite のまま維持し、本番では PostgreSQL 用 schema を指定して Prisma を実行します。

## 追加済みファイル

- `prisma/schema.prisma`
  - ローカル SQLite 用
- `prisma/schema.postgres.prisma`
  - 本番 PostgreSQL 用

## 追加済み npm script

```bash
npm run db:pg:generate
npm run db:pg:push
```

## 本番DBの準備

1. PostgreSQL データベースを作成します。
2. 本番環境変数に `DATABASE_URL` を設定します。

```txt
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

Supabaseで `DATABASE_URL` が `6543` + `pgbouncer=true` の Transaction pooler になっている場合、テーブル作成時は Session pooler の `5432` または Direct connection を使います。アプリ実行時は Transaction pooler、Prisma CLI実行時は Session pooler / Direct connection、という分け方が安全です。

3. Prisma Client を PostgreSQL schema で生成します。

```bash
npm run db:pg:generate
```

4. PostgreSQL にテーブルを作成します。

```bash
npm run db:pg:push
```

5. 初期データが必要な場合だけ seed を実行します。

```bash
npm run db:seed
```

## データ移行方針

現在のローカル SQLite データを本番に移す場合は、管理画面のバックアップJSONを使うのが安全です。

1. ローカル管理画面で `/admin/backup` からJSONを取得します。
2. 本番環境を PostgreSQL で起動します。
3. 本番管理画面の「バックアップ/復元」にJSONを貼り付けて復元します。
4. 顧客、予約、問い合わせ、商品、注文、在庫、権限を確認します。

## 注意点

- SQLite用の `npm run db:push` はローカル専用です。
- PostgreSQL本番では `npm run db:pg:push` を使います。ただし Supabase の Transaction pooler URL ではなく、Session pooler または Direct connection を指定してください。
- 本番ビルドでは `npm run build:pg` を使い、PostgreSQL用 Prisma Client を生成してから Next.js をビルドします。
- `schema.prisma` と `schema.postgres.prisma` は datasource provider 以外を同じ内容に保ちます。
- 本格運用後は `prisma migrate` への移行を検討してください。現時点では小規模アプリの初期本番化を優先し、`db push` で準備しています。
