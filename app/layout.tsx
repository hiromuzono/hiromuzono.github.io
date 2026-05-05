import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "親孝行チケットアプリ",
  description: "大人版お手伝い券 - 親子で使う親孝行サポートアプリ",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="ja"><body className="bg-amber-50 min-h-screen">{children}</body></html>);
}
