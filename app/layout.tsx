import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restaurant Reserve",
  description: "飲食店向け予約Webアプリ",
};

const navItems = [
  { href: "/", label: "トップ" },
  { href: "/store", label: "店舗案内" },
  { href: "/menu", label: "メニュー" },
  { href: "/reserve", label: "予約" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-amber-50 text-zinc-900">
        <header className="sticky top-0 z-10 border-b border-amber-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
            <p className="text-lg font-semibold">Restaurant Reserve</p>
            <nav>
              <ul className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md px-3 py-2 text-zinc-700 transition hover:bg-amber-100 hover:text-zinc-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
