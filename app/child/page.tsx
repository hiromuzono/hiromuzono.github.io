"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { TicketRequest, TicketStats } from "@/lib/types";
const SL: Record<string,{label:string;color:string;icon:string}> = {
  pending:{label:"申請中",color:"bg-yellow-100 text-yellow-800",icon:"⏳"},
  approved:{label:"承認済み",color:"bg-green-100 text-green-800",icon:"✅"},
  declined:{label:"辞退",color:"bg-red-100 text-red-800",icon:"❌"},
  negotiating:{label:"交渉中",color:"bg-blue-100 text-blue-800",icon:"💬"},
  withdrawn:{label:"取り下げ",color:"bg-gray-100 text-gray-600",icon:"↩️"},
};
type AT = "approve"|"decline"|"negotiate";
interface AS { id:string; type:AT; childComment:string; ticketsNegotiated:string; }
export default function ChildPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"requests"|"history"|"settings">("requests");
  const [stats, setStats] = useState<TicketStats|null>(null);
  const [requests, setRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<AS|null>(null);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [newLimit, setNewLimit] = useState(""); const [limitLoading, setLimitLoading] = useState(false); const [limitMsg, setLimitMsg] = useState("");
  useEffect(() => {
    if (sessionStorage.getItem("role") !== "child") { router.push("/"); return; }
    fetchData();
  }, [router]);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, rr] = await Promise.all([fetch("/api/tickets"), fetch("/api/requests")]);
      if (sr.ok) { const s = await sr.json(); setStats(s); setNewLimit(String(s.total_limit)); }
      if (rr.ok) setRequests(await rr.json());
    } finally { setLoading(false); }
  }, []);
  const handleAction = async () => {
    if (!actionState) return;
    setActionLoading(actionState.id);
    try {
      const body: Record<string,unknown> = { action: actionState.type, child_comment: actionState.childComment||null };
      if (actionState.type==="negotiate") body.tickets_negotiated = parseInt(actionState.ticketsNegotiated);
      const res = await fetch("/api/requests/"+actionState.id, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      if (res.ok) { setActionState(null); await fetchData(); }
    } finally { setActionLoading(null); }
  };
  const handleLimit = async () => {
    setLimitLoading(true); setLimitMsg("");
    try {
      const res = await fetch("/api/tickets", { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({total_limit:parseInt(newLimit)}) });
      if (res.ok) { setLimitMsg("✅ 上限枚数を更新しました"); await fetchData(); setTimeout(()=>setLimitMsg(""),3000); }
      else { const d = await res.json(); setLimitMsg("❌ "+d.error); }
    } finally { setLimitLoading(false); }
  };
  const fmt = (s: string) => new Date(s).toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const pendReqs = requests.filter(r=>r.status==="pending");
  const negReqs = requests.filter(r=>r.status==="negotiating");
  const histReqs = requests.filter(r=>["approved","declined","withdrawn"].includes(r.status));
  const activeReq = actionState ? requests.find(r=>r.id===actionState.id) : null;
  return (
    <div className="min-h-screen bg-teal-50">
      <header className="bg-teal-500 text-white px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2"><span className="text-2xl">👧</span><h1 className="text-xl font-bold">子の画面</h1></div>
        <button onClick={()=>{sessionStorage.removeItem("role");router.push("/");}} className="text-teal-100 hover:text-white text-sm underline">ホームへ</button>
      </header>
      {stats && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">チケット残数</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-teal-600">{stats.remaining}<span className="text-base font-normal text-gray-500"> / {stats.total_limit}枚</span></span>
              <span className="text-2xl">🎟️</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="bg-teal-400 h-3 rounded-full transition-all" style={{width:`${Math.min(100,((stats.total_limit-stats.remaining)/stats.total_limit)*100)}%`}} />
            </div>
            <div className="flex text-xs text-gray-500 gap-4"><span>使用済み: {stats.used}枚</span><span>申請中: {stats.pending}枚</span></div>
          </div>
        </div>
      )}
      <div className="px-4 pt-4">
        <div className="flex gap-1 mb-4">
          {(["requests","history","settings"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-3 rounded-xl font-semibold text-xs transition-colors ${tab===t?"bg-teal-500 text-white":"bg-white text-gray-600 hover:bg-teal-50"}`}>
              {t==="requests"?"新着リクエスト":t==="history"?"履歴":"設定"}
            </button>
          ))}
        </div>
        {tab==="requests" && (
          <div>
            {loading ? <div className="text-center py-10 text-gray-400">読み込み中...</div>
            : pendReqs.length===0&&negReqs.length===0 ? <div className="text-center py-10 text-gray-400"><p className="text-4xl mb-2">📬</p><p>新しいリクエストはありません</p></div>
            : (
              <div className="space-y-3">
                {negReqs.length>0&&(
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">交渉中（親の返答待ち）</h3>
                    {negReqs.map(req=>(
                      <div key={req.id} className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                        <div className="flex items-start justify-between gap-2 mb-2"><p className="font-semibold text-gray-800">{req.title}</p><span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">💬 交渉中</span></div>
                        <p className="text-sm text-gray-500">{req.tickets_requested}枚申請 → カウンター: {req.tickets_negotiated}枚</p>
                        {req.child_comment&&<p className="text-sm text-gray-600 bg-teal-50 rounded-lg p-2 mt-2">あなたのコメント: {req.child_comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {pendReqs.length>0&&(
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">対応が必要なリクエスト</h3>
                    {pendReqs.map(req=>(
                      <div key={req.id} className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                        <div className="flex items-start justify-between gap-2 mb-2"><p className="font-semibold text-gray-800 flex-1">{req.title}</p><span className="text-xs px-2 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-800 whitespace-nowrap">⏳ 申請中</span></div>
                        <div className="flex gap-3 text-sm text-gray-500 mb-2 flex-wrap">
                          <span>🎟️ {req.tickets_requested}枚</span>
                          {req.preferred_datetime&&<span>📅 {new Date(req.preferred_datetime).toLocaleDateString("ja-JP")}</span>}
                        </div>
                        {req.parent_comment&&<p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-2 mb-3">親のコメント: {req.parent_comment}</p>}
                        <p className="text-xs text-gray-400 mb-3">{fmt(req.created_at)}</p>
                        <div className="flex gap-2">
                          <button onClick={()=>setActionState({id:req.id,type:"approve",childComment:"",ticketsNegotiated:""})} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl text-sm">✅ 承認</button>
                          <button onClick={()=>setActionState({id:req.id,type:"negotiate",childComment:"",ticketsNegotiated:""})} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm">💬 交渉</button>
                          <button onClick={()=>setActionState({id:req.id,type:"decline",childComment:"",ticketsNegotiated:""})} className="flex-1 bg-red-400 hover:bg-red-500 text-white font-semibold py-2 rounded-xl text-sm">❌ 辞退</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {tab==="history" && (
          <div className="space-y-3">
            {loading ? <div className="text-center py-10 text-gray-400">読み込み中...</div>
            : histReqs.length===0 ? <div className="text-center py-10 text-gray-400"><p className="text-4xl mb-2">📋</p><p>まだ履歴がありません</p></div>
            : histReqs.map(req=>{
                const s=SL[req.status];
                return (
                  <div key={req.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-2"><p className="font-semibold text-gray-800 flex-1">{req.title}</p><span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${s.color}`}>{s.icon} {s.label}</span></div>
                    <div className="flex gap-3 text-sm text-gray-500 mb-2 flex-wrap">
                      <span>🎟️ {req.tickets_requested}枚{req.tickets_negotiated&&req.tickets_negotiated!==req.tickets_requested&&<span className="text-blue-600"> → {req.tickets_negotiated}枚</span>}</span>
                      {req.preferred_datetime&&<span>📅 {new Date(req.preferred_datetime).toLocaleDateString("ja-JP")}</span>}
                    </div>
                    {req.parent_comment&&<p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-2 mb-1">親のコメント: {req.parent_comment}</p>}
                    {req.child_comment&&<p className="text-sm text-gray-600 bg-teal-50 rounded-lg p-2 mb-1">あなたのコメント: {req.child_comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{fmt(req.created_at)}</p>
                  </div>
                );
              })
            }
          </div>
        )}
        {tab==="settings" && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-5">チケット上限の設定</h2>
            <div className="mb-4"><p className="text-sm text-gray-500 mb-1">現在の上限</p><p className="text-3xl font-bold text-teal-600">{stats?.total_limit??"—"} 枚</p></div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">新しい上限枚数</label>
              <div className="flex gap-3">
                <input type="number" value={newLimit} onChange={e=>setNewLimit(e.target.value)} min={1} className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <button onClick={handleLimit} disabled={limitLoading||!newLimit} className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl">{limitLoading?"更新中...":"更新"}</button>
              </div>
              {limitMsg&&<p className="mt-3 text-sm text-gray-700">{limitMsg}</p>}
            </div>
            <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">チケットの計算方法</p>
              <p>残り枚数 = 上限 − 使用済み − 申請中</p>
              <p className="mt-2 text-xs text-gray-400">※ 交渉中のリクエストは、交渉枚数を申請中として計上します</p>
            </div>
          </div>
        )}
      </div>
      <div className="h-8" />
      {actionState && activeReq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {actionState.type==="approve"&&"✅ 承認する"}{actionState.type==="decline"&&"❌ 辞退する"}{actionState.type==="negotiate"&&"💬 交渉する"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{activeReq.title}</p>
            {actionState.type==="negotiate" && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">カウンター提案の枚数 <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-2">元の申請: {activeReq.tickets_requested}枚</p>
                <input type="number" value={actionState.ticketsNegotiated} onChange={e=>setActionState({...actionState,ticketsNegotiated:e.target.value})} placeholder="提案枚数" min={1} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">コメント <span className="text-gray-400 font-normal">(任意)</span></label>
              <textarea value={actionState.childComment} onChange={e=>setActionState({...actionState,childComment:e.target.value})} placeholder={actionState.type==="approve"?"一言添えてみましょう":actionState.type==="decline"?"辞退の理由など":"交渉の意図など"} rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setActionState(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl">キャンセル</button>
              <button onClick={handleAction} disabled={actionLoading===actionState.id||(actionState.type==="negotiate"&&!actionState.ticketsNegotiated)} className={`flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-50 ${actionState.type==="approve"?"bg-green-500 hover:bg-green-600":actionState.type==="decline"?"bg-red-400 hover:bg-red-500":"bg-blue-500 hover:bg-blue-600"}`}>
                {actionLoading===actionState.id?"送信中...":actionState.type==="approve"?"承認する":actionState.type==="decline"?"辞退する":"提案を送る"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
