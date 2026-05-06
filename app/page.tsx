"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "top" | "select_parent" | "child_auth";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("top");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectParent = (name: "中薗孝幸" | "中薗明子") => {
    sessionStorage.setItem("role", "parent");
    sessionStorage.setItem("parent_name", name);
    router.push("/parent");
  };

  const handleChild = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("role", "child");
        router.push("/child");
      } else {
        const d = await res.json();
        setError(d.error || "パスワードが違います");
      }
    } catch { setError("エラーが発生しました。"); } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-[#f8f7f4]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1f3a] mb-5">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="8" width="28" height="18" rx="1" stroke="#c9a84c" strokeWidth="2"/>
              <line x1="2" y1="14" x2="30" y2="14" stroke="#c9a84c" strokeWidth="1.5" strokeDasharray="3 2"/>
              <line x1="2" y1="20" x2="30" y2="20" stroke="#c9a84c" strokeWidth="1.5" strokeDasharray="3 2"/>
              <circle cx="9" cy="8" r="2.5" fill="#f8f7f4" stroke="#c9a84c" strokeWidth="1.5"/>
              <circle cx="23" cy="8" r="2.5" fill="#f8f7f4" stroke="#c9a84c" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1f3a] tracking-tight">親孝行チケット</h1>
          <p className="text-sm text-gray-500 mt-1">大人版お手伝い券アプリ</p>
        </div>

        {step === "top" && (
          <>
            <div className="bg-white border border-gray-200 p-5 mb-6">
              <h2 className="text-sm font-semibold text-[#1a1f3a] mb-3 uppercase tracking-wide">About</h2>
              <ul className="text-sm text-gray-600 space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 text-[#c9a84c]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="8"/><path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <span>親がやりたいことをチケットで申請できます</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 text-[#c9a84c]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="8"/><path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <span>子が承認・辞退・交渉でリクエストに応答できます</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 text-[#c9a84c]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="8"/><path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <span>チケット枚数で双方の負担を調整できます</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <button onClick={() => setStep("select_parent")} className="w-full bg-[#1a1f3a] hover:bg-[#252b4a] text-white font-semibold py-4 px-6 text-base transition-colors flex items-center justify-center gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="white" strokeWidth="1.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                親として使う
              </button>
              <button onClick={() => { setStep("child_auth"); setPassword(""); setError(""); }} className="w-full bg-white hover:bg-gray-50 text-[#1a1f3a] font-semibold py-4 px-6 text-base border border-[#1a1f3a] transition-colors flex items-center justify-center gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="#1a1f3a" strokeWidth="1.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#1a1f3a" strokeWidth="1.5" strokeLinecap="round"/></svg>
                子として使う
              </button>
            </div>
            <div className="mt-6 text-center">
              <Link href="/guide" className="text-sm text-gray-400 hover:text-[#c9a84c] transition-colors underline underline-offset-4">使い方を見る</Link>
            </div>
          </>
        )}

        {step === "select_parent" && (
          <>
            <div className="mb-6">
              <button onClick={() => setStep("top")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                戻る
              </button>
              <h2 className="text-xl font-bold text-[#1a1f3a] mb-1">どちらですか？</h2>
              <p className="text-sm text-gray-500">申請者のお名前を選んでください</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => selectParent("中薗孝幸")} className="w-full bg-[#1a1f3a] hover:bg-[#252b4a] text-white font-semibold py-5 px-6 text-lg transition-colors">お父さん</button>
              <button onClick={() => selectParent("中薗明子")} className="w-full bg-[#1a1f3a] hover:bg-[#252b4a] text-white font-semibold py-5 px-6 text-lg transition-colors">お母さん</button>
            </div>
          </>
        )}

        {step === "child_auth" && (
          <>
            <div className="mb-6">
              <button onClick={() => setStep("top")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                戻る
              </button>
              <h2 className="text-xl font-bold text-[#1a1f3a] mb-1">パスワードを入力</h2>
              <p className="text-sm text-gray-500">子として使うにはパスワードが必要です</p>
            </div>
            <div className="bg-white border border-gray-200 p-5">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChild()} placeholder="パスワード" className="w-full border border-gray-300 px-4 py-3 text-base mb-3 focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a]" autoFocus />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button onClick={handleChild} disabled={loading || !password} className="w-full bg-[#1a1f3a] hover:bg-[#252b4a] disabled:opacity-40 text-white font-semibold py-3 transition-colors">{loading ? "確認中..." : "入る"}</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
