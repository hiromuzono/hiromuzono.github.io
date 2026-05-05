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
export default function ParentPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"request"|"history">("request");
  const [stats, setStats] = useState<TicketStats|null>(null);
  const [requests, setRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(""); const [tickets, setTickets] = useState("");
  const [dt, setDt] = useState(""); const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(""); const [submitSuccess, setSubmitSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  useEffect(() => {
    if (sessionStorage.getItem("role") !== "parent") { router.push("/"); return; }
    fetchData();
  }, [router]);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, rr] = await Promise.all([fetch("/api/tickets"), fetch("/api/requests")]);
      if (sr.ok) setStats(await sr.json());
      if (rr.ok) setRequests(await rr.json());
    } finally { setLoading(false); }
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setSubmitError(""); setSubmitSuccess(false);
    try {
      const res = await fetch("/api/requests", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title, tickets_requested: parseInt(tickets), preferred_datetime: dt||null, parent_comment: comment||null }) });
      if (res.ok) {
        setTitle(""); setTickets(""); setDt(""); setComment(""); setSubmitSuccess(true);
        await fetchData(); setTimeout(() => setSubmitSuccess(false), 3000);
      } else { const d = await res.json(); setSubmitError(d.error||"申請に失敗しました"); }
    } catch { setSubmitError("エラーが発生しました"); } finally { setSubmitting(false); }
  };
  const handleNegResp = async (id: string, action: "agree"|"withdraw") => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/requests/"+id, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action}) });
      if (res.ok) await fetchData();
    } finally { setActionLoading(null); }
  };
  const negReqs = requests.filter(r => r.status==="negotiating");
  const pendReqs = requests.filter(r => r.status==="pending");
  const histReqs = requests.filter(r => ["approved","declined","withdrawn"].includes(r.status));
  const fmt = (s: string) => new Date(s).toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-400 text-white px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2"><span className="text-2xl">👴</span><h1 className="text-xl font-bold">親の画面</h1></div>
        <button onClick={()=>{sessionStorage.removeItem("role");router.push("/");}} className="text-amber-100 hover:text-white text-sm underline">ホームへ</button>
      </header>
      {stats && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">チケット残数</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-amber-600">{stats.remaining}<span className="text-base font-normal text-gray-500"> / {stats.total_limit}枚</span></span>
              <span className="text-2xl">🎟️</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="bg-amber-400 h-3 rounded-full transition-all" style={{width:`${Math.min(100,((stats.total_limit-stats.remaining)/stats.total_limit)*100)}%`}} />
            </div>
            <div className="flex text-xs text-gray-500 gap-4"><span>使用済み: {stats.used}枚</span><span>申請中: {stats.pending}枚</span></div>
            {stats.remaining===0 && <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ チケットが残っていないため新規申請できません</p>}
          </div>
        </div>
      )}
      {negReqs.length > 0 && (
        <div className="px-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h2 className="text-base font-bold text-blue-800 mb-3">💬 交渉中のリクエスト</h2>
            {negReqs.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-4 shadow-sm mb-3">
                <p className="font-semibold text-gray-800 mb-1">{req.title}</p>
                <p className="text-sm text-gray-500 mb-2">元の申請: {req.tickets_requested}枚 → <span className="font-bold text-blue-700">カウンター提案: {req.tickets_negotiated}枚</span></p>
                {req.child_comment && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-3">子のコメント: {req.child_comment}</p>}
                <div className="flex gap-2">
                  <button onClick={()=>handleNegResp(req.id,"agree")} disabled={actionLoading===req.id} className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-sm">同意する ({req.tickets_negotiated}枚で承認)</button>
                  <button onClick={()=>handleNegResp(req.id,"withdraw")} disabled={actionLoading===req.id} className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-semibold py-2 rounded-xl text-sm">取り下げ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button onClick={()=>setTab("request")} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${tab==="request"?"bg-amber-400 text-white":"bg-white text-gray-600 hover:bg-amber-50"}`}>申請する</button>
          <button onClick={()=>setTab("history")} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${tab==="history"?"bg-amber-400 text-white":"bg-white text-gray-600 hover:bg-amber-50"}`}>履歴・申請中</button>
        </div>
        {tab==="request" && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">新しいリクエストを申請</h2>
            {stats?.remaining===0 ? (
              <div className="text-center py-8 text-gray-500"><p className="text-4xl mb-2">🎟️</p><p>チケットが残っていません</p><p className="text-sm mt-1">子にチケット上限を増やしてもらいましょう</p></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">やりたいこと <span className="text-red-500">*</span></label>
                  <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="例：温泉旅行に連れて行ってほしい" required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">チケット枚数 <span className="text-red-500">*</span>{stats&&<span className="font-normal text-gray-500 ml-1">(残り {stats.remaining}枚)</span>}</label>
                  <input type="number" value={tickets} onChange={e=>setTickets(e.target.value)} placeholder="枚数" min={1} max={stats?.remaining??999} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">希望日時 <span className="text-gray-400 font-normal">(任意)</span></label>
                  <input type="datetime-local" value={dt} onChange={e=>setDt(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">一言コメント <span className="text-gray-400 font-normal">(任意)</span></label>
                  <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="一言添えてみましょう" rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                </div>
                {submitError && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{submitError}</p>}
                {submitSuccess && <p className="text-green-600 text-sm bg-green-50 rounded-lg p-3">✅ 申請を送りました！子の確認を待ちましょう。</p>}
                <button type="submit" disabled={submitting||!title||!tickets} className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors">{submitting?"送信中...":"申請する 🌸"}</button>
              </form>
            )}
          </div>
        )}
        {tab==="history" && (
          <div className="space-y-3">
            {loading ? <div className="text-center py-10 text-gray-400">読み込み中...</div>
            : requests.length===0 ? <div className="text-center py-10 text-gray-400"><p className="text-4xl mb-2">📋</p><p>まだリクエストがありません</p></div>
            : (
              <>
                {pendReqs.length>0 && <div><h3 className="text-sm font-semibold text-gray-500 mb-2">申請中</h3>{pendReqs.map(r=><RCard key={r.id} req={r} fmt={fmt}/>)}</div>}
                {histReqs.length>0 && <div><h3 className="text-sm font-semibold text-gray-500 mb-2 mt-4">過去の履歴</h3>{histReqs.map(r=><RCard key={r.id} req={r} fmt={fmt}/>)}</div>}
              </>
            )}
          </div>
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}
function RCard({req,fmt}:{req:TicketRequest;fmt:(d:string)=>string}) {
  const s = SL[req.status]??{label:req.status,color:"bg-gray-100 text-gray-600",icon:"?"};
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-gray-800 flex-1">{req.title}</p>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${s.color}`}>{s.icon} {s.label}</span>
      </div>
      <div className="flex gap-3 text-sm text-gray-500 mb-2 flex-wrap">
        <span>🎟️ {req.tickets_requested}枚{req.tickets_negotiated&&req.tickets_negotiated!==req.tickets_requested&&<span className="text-blue-600"> → {req.tickets_negotiated}枚</span>}</span>
        {req.preferred_datetime&&<span>📅 {new Date(req.preferred_datetime).toLocaleDateString("ja-JP")}</span>}
      </div>
      {req.parent_comment&&<p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-2 mb-1">あなたのコメント: {req.parent_comment}</p>}
      {req.child_comment&&<p className="text-sm text-gray-600 bg-teal-50 rounded-lg p-2 mb-1">子のコメント: {req.child_comment}</p>}
      <p className="text-xs text-gray-400 mt-1">{fmt(req.created_at)}</p>
    </div>
  );
}
