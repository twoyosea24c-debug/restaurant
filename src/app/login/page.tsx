import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="login-page">
      <section className="panel login-panel">
        <p className="eyebrow">Admin</p>
        <h1>管理画面ログイン</h1>
        {params.error ? <p className="error-text">パスワードが違います。</p> : null}
        <form action={login} className="settings-form">
          <label>
            メール
            <input name="email" type="email" placeholder="スタッフログイン時のみ" />
          </label>
          <label>
            パスワード
            <input name="password" type="password" required autoFocus />
          </label>
          <button type="submit">ログイン</button>
        </form>
      </section>
    </main>
  );
}
