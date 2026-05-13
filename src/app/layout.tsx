import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Small Store Base",
  description: "小規模店舗向けの予約・商品販売・顧客管理ベースアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
