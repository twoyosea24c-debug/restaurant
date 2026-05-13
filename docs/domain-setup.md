# 独自ドメイン設定手順

## 1. Vercelにドメインを追加

Vercelのプロジェクト画面で `Domains` を開き、利用するドメインまたはサブドメインを追加します。

例:

- `znzenz.jp`
- `www.znzenz.jp`
- `reserve.znzenz.jp`

## 2. DNSレコードを設定

Vercelに表示された案内に従って、ドメイン管理会社のDNS画面でレコードを追加します。

よく使う設定:

- ルートドメイン: `A` レコード
- サブドメイン: `CNAME` レコード

値はVercelの画面に表示されたものを使います。

## 3. 環境変数を更新

Vercelの `Environment Variables` で `NEXT_PUBLIC_APP_URL` を本番URLに変更します。

例:

```text
NEXT_PUBLIC_APP_URL=https://reserve.znzenz.jp
```

## 4. 再デプロイ

環境変数を変更した後は、Vercelの `Deployments` から最新デプロイを `Redeploy` します。

## 5. 動作確認

独自ドメインで以下を確認します。

- トップページが表示できる
- 予約が送信できる
- 注文が送信できる
- 問い合わせが送信できる
- 管理画面にログインできる
- メール通知が届く
