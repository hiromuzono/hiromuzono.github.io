"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleParent = () => { sessionStorage.setItem("role","parent"); router.push("/parent"); };
  const handleChild = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({password}) });
      if (res.ok) { sessionStorage.setItem("role","child"); router.push("/child"); }
      else { const d = await res.json(); setError(d.error || "パスワードが違います"); }
    } catch { setError("エラーが発生しました。"); } finally { setLoading(false); }
  };
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-3xl font-bold text-amber-800 mb-2">親孝行チケット</h1>
          <p className="text-amber-700 text-sm">大人版お手伝い券アプリ</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">このアプリについて</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2"><span>🌸</span><span>親がやりたいことをチケットで申請できます</span></li>
            <li className="flex items-start gap-2"><span>✅</span><span>子が承認・辞退・交渉でリクエストに応答できます</span></li>
            <li className="flex items-start gap-2"><span>🎟️</span><span>チケット枚数で双方の負担を調整できます</span></li>
            <li className="flex items-start gap-2"><span>📋</span><span>すべての履歴を確認できます</span></li>
          </ul>
        </div>
        <div className="space-y-4">
          <button onClick={handleParent} className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-5 px-6 rounded-2xl text-xl shadow-md transition-colors flex items-center justify-center gap-3">
            <span>👴</span><span>親として使う</span>
          </button>
          <button onClick={() => { setShowModal(true); setPassword(""); setError(""); }} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-5 px-6 rounded-2xl text-xl shadow-md transition-colors flex items-center justify-center gap-3">
            <span>👧</span><span>子として使う</span>
          </button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">パスワードを入力</h2>
            <p className="text-sm text-gray-500 mb-4 text-center">子として使うにはパスワードが必要です</p>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleChild()} placeholder="パスワード" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-teal-400" autoFocus />
            {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={()=>setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl">キャンセル</button>
              <button onClick={handleChild} disabled={loading||!password} className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">{loading?"確認中...":"入る"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
