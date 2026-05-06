import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "親孝行チケット", description: "大人版お手伝い券 - 親子で使う親孝行サポートアプリ" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="ja"><body className="bg-[#f8f7f4] min-h-screen text-[#2d2d2d]">{children}</body></html>);
}
