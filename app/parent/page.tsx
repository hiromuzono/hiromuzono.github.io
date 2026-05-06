"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TicketRequest, TicketStats } from "@/lib/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:     { label: "申請中",   cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  approved:    { label: "承認済み", cls: "bg-green-50 text-green-700 border border-green-200" },
  declined:    { label: "辞退",     cls: "bg-red-50 text-red-600 border border-red-200" },
  negotiating: { label: "交渉中",   cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  withdrawn:   { label: "取り下げ", cls: "bg-gray-100 text-gray-500 border border-gray-200" },
};

const TicketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
    <rect x="1" y="4" width="16" height="10" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="1" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5"/>
    <line x1="1" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5"/>
    <circle cx="4.5" cy="4" r="1.5" fill="#f8f7f4" stroke="currentColor" strokeWidth="1"/>
    <circle cx="13.5" cy="4" r="1.5" fill="#f8f7f4" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
    <rect x="1" y="2.5" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="1" y1="6.5" x2="15" y2="6.5" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="4.5" y1="1" x2="4.5" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="11.5" y1="1" x2="11.5" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export default function ParentPage() {
  const router = useRouter();
  const [parentName, setParentName] = useState("");
  const [tab, setTab] = useState<"request" | "history">("request");
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [requests, setRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [tickets, setTickets] = useState("");
  const [dt, setDt] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("role") !== "parent") { router.push("/"); return; }
    setParentName(sessionStorage.getItem("parent_name") || "");
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
    e.preventDefault();
    setSubmitting(true); setSubmitError(""); setSubmitSuccess(false);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tickets_requested: parseFloat(tickets),
          preferred_datetime: dt || null,
          parent_comment: comment || null,
          parent_name: parentName || null,
        }),
      });
      if (res.ok) {
        setTitle(""); setTickets(""); setDt(""); setComment("");
        setSubmitSuccess(true);
        await fetchData();
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        const d = await res.json();
        setSubmitError(d.error || "申請に失敗しました");
      }
    } catch { setSubmitError("エラーが発生しました"); } finally { setSubmitting(false); }
  };

  const handleNegResp = async (id: string, action: "agree" | "withdraw") => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/requests/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await fetchData();
    } finally { setActionLoading(null); }
  };

  const negReqs = requests.filter(r => r.status === "negotiating");
  const pendReqs = requests.filter(r => r.status === "pending");
  const histReqs = requests.filter(r => ["approved", "declined", "withdrawn"].includes(r.status));
  const fmt = (s: string) => new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="bg-[#1a1f3a] text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-wide">{parentName ? `${parentName}の画面` : "親の画面"}</h1>
          <p className="text-xs text-[#c9a84c] mt-0.5">親孝行チケット</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/guide" className="text-xs text-white/60 hover:text-[#c9a84c] transition-colors underline underline-offset-2">使い方</Link>
          <button onClick={() => { sessionStorage.removeItem("role"); sessionStorage.removeItem("parent_name"); router.push("/"); }} className="text-xs text-white/60 hover:text-white transition-colors">ホームへ</button>
        </div>
      </header>

      {stats && (
        <div className="px-5 pt-5">
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">チケット残数</p>
              <span className="text-[#c9a84c]"><TicketIcon /></span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-[#1a1f3a]">{stats.remaining}</span>
              <span className="text-sm text-gray-400">/ {stats.total_limit}枚</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 mb-3">
              <div className="bg-[#c9a84c] h-1.5 transition-all" style={{width:`${Math.min(100,((stats.total_limit-stats.remaining)/stats.total_limit)*100)}%`}} />
            </div>
            <div className="flex text-xs text-gray-400 gap-5">
              <span>使用済み {stats.used}枚</span><span>申請中 {stats.pending}枚</span>
            </div>
            {stats.remaining === 0 && <p className="mt-3 text-sm text-[#c0714f] font-medium border-t border-gray-100 pt-3">チケットが残っていないため新規申請できません</p>}
          </div>
        </div>
      )}

      {negReqs.length > 0 && (
        <div className="px-5 pt-4">
          <div className="bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12v8H9l-3 3v-3H2V3z" stroke="#1d4ed8" strokeWidth="1.4" strokeLinejoin="round"/></svg>
              交渉中のリクエスト
            </p>
            {negReqs.map(req => (
              <div key={req.id} className="bg-white border border-blue-100 p-4 mb-3 last:mb-0">
                <p className="font-semibold text-[#1a1f3a] mb-1">{req.title}</p>
                <p className="text-sm text-gray-500 mb-1">元の申請: {req.tickets_requested}枚 → <span className="font-semibold text-blue-700">提案: {req.tickets_negotiated}枚</span></p>
                {req.child_comment && <p className="text-sm text-gray-600 bg-gray-50 p-2.5 mb-3 border-l-2 border-blue-200">{req.child_comment}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleNegResp(req.id, "agree")} disabled={actionLoading === req.id} className="flex-1 bg-[#1a1f3a] hover:bg-[#252b4a] disabled:opacity-40 text-white font-semibold py-2.5 text-sm transition-colors">{req.tickets_negotiated}枚で承認する</button>
                  <button onClick={() => handleNegResp(req.id, "withdraw")} disabled={actionLoading === req.id} className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-600 font-semibold py-2.5 text-sm border border-gray-300 transition-colors">取り下げ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 pt-4">
        <div className="flex gap-0 mb-5 border border-gray-200 overflow-hidden">
          <button onClick={() => setTab("request")} className={`flex-1 py-3 font-semibold text-sm transition-colors ${tab === "request" ? "bg-[#1a1f3a] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>申請する</button>
          <button onClick={() => setTab("history")} className={`flex-1 py-3 font-semibold text-sm transition-colors border-l border-gray-200 ${tab === "history" ? "bg-[#1a1f3a] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>履歴・申請中</button>
        </div>

        {tab === "request" && (
          <div className="bg-white border border-gray-200 p-5">
            <h2 className="text-base font-bold text-[#1a1f3a] mb-5">新しいリクエストを申請</h2>
            {stats?.remaining === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm"><p>チケットが残っていません</p><p className="text-xs mt-1 text-gray-400">子にチケット上限を増やしてもらいましょう</p></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">やりたいこと <span className="text-[#c0714f]">*</span></label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：温泉旅行に連れて行ってほしい" required className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">チケット枚数 <span className="text-[#c0714f]">*</span>{stats && <span className="font-normal text-gray-400 ml-1 normal-case">(残り {stats.remaining}枚)</span>}</label>
                  <input type="number" value={tickets} onChange={e => setTickets(e.target.value)} placeholder="枚数（例: 1）" min={0.5} step={0.5} max={stats?.remaining ?? 999} required className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">希望日時 <span className="font-normal text-gray-400 normal-case">(任意)</span></label>
                  <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">一言コメント <span className="font-normal text-gray-400 normal-case">(任意)</span></label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="一言添えてみましょう" rows={3} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a] resize-none" />
                </div>
                {submitError && <p className="text-[#c0714f] text-sm bg-red-50 border border-red-200 p-3">{submitError}</p>}
                {submitSuccess && <p className="text-green-700 text-sm bg-green-50 border border-green-200 p-3">申請を送りました。子の確認をお待ちください。</p>}
                <button type="submit" disabled={submitting || !title || !tickets} className="w-full bg-[#c9a84c] hover:bg-[#b8963e] disabled:opacity-40 text-white font-bold py-3.5 text-base transition-colors">{submitting ? "送信中..." : "申請する"}</button>
              </form>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3">
            {loading ? <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
            : requests.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">まだリクエストがありません</div>
            : (
              <>
                {pendReqs.length > 0 && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">申請中</p>{pendReqs.map(r => <RCard key={r.id} req={r} fmt={fmt} />)}</div>}
                {histReqs.length > 0 && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-4">過去の履歴</p>{histReqs.map(r => <RCard key={r.id} req={r} fmt={fmt} />)}</div>}
              </>
            )}
          </div>
        )}
      </div>
      <div className="h-10" />
    </div>
  );
}

function RCard({ req, fmt }: { req: TicketRequest; fmt: (d: string) => string }) {
  const s = STATUS[req.status] ?? { label: req.status, cls: "bg-gray-100 text-gray-600" };
  return (
    <div className="bg-white border border-gray-200 p-4 mb-2.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          {req.parent_name && <p className="text-xs text-[#c9a84c] font-semibold mb-0.5">{req.parent_name}</p>}
          <p className="font-semibold text-[#1a1f3a]">{req.title}</p>
        </div>
        <span className={`text-xs px-2 py-1 font-semibold whitespace-nowrap shrink-0 ${s.cls}`}>{s.label}</span>
      </div>
      <div className="flex gap-4 text-sm text-gray-500 mb-2 flex-wrap items-center">
        <span className="flex items-center gap-1.5 text-[#c9a84c]">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="shrink-0"><rect x="1" y="4" width="16" height="10" rx="1" stroke="currentColor" strokeWidth="1.4"/><line x1="1" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5"/><line x1="1" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5"/><circle cx="4.5" cy="4" r="1.5" fill="#f8f7f4" stroke="currentColor" strokeWidth="1"/><circle cx="13.5" cy="4" r="1.5" fill="#f8f7f4" stroke="currentColor" strokeWidth="1"/></svg>
          <span className="text-gray-600">{req.tickets_requested}枚{req.tickets_negotiated&&req.tickets_negotiated!==req.tickets_requested&&<span className="text-blue-600"> → {req.tickets_negotiated}枚</span>}</span>
        </span>
        {req.preferred_datetime && <span className="text-gray-400 text-xs">{new Date(req.preferred_datetime).toLocaleDateString("ja-JP")}</span>}
      </div>
      {req.parent_comment && <p className="text-sm text-gray-600 bg-[#f8f7f4] border-l-2 border-[#c9a84c] px-3 py-2 mb-2">{req.parent_comment}</p>}
      {req.child_comment && <p className="text-sm text-gray-600 bg-blue-50 border-l-2 border-blue-300 px-3 py-2 mb-2">{req.child_comment}</p>}
      <p className="text-xs text-gray-400 mt-2">{fmt(req.created_at)}</p>
    </div>
  );
}
