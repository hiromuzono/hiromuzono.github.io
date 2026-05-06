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
const PARENTS = ["中薗孝幸", "中薗明子"] as const;
type AT = "approve" | "decline" | "negotiate";
interface AS { id: string; type: AT; childComment: string; ticketsNegotiated: string; }

export default function ChildPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"requests" | "history" | "settings">("requests");
  const [allStats, setAllStats] = useState<TicketStats[]>([]);
  const [requests, setRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<AS | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [limitLoading, setLimitLoading] = useState<string | null>(null);
  const [limitMsg, setLimitMsg] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("role") !== "child") { router.push("/"); return; }
    fetchData();
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, rr] = await Promise.all([fetch("/api/tickets"), fetch("/api/requests")]);
      if (sr.ok) {
        const stats: TicketStats[] = await sr.json();
        setAllStats(stats);
        const lim: Record<string, string> = {};
        stats.forEach(s => { if (s.parent_name) lim[s.parent_name] = String(s.total_limit); });
        setLimits(lim);
      }
      if (rr.ok) setRequests(await rr.json());
    } finally { setLoading(false); }
  }, []);

  const handleAction = async () => {
    if (!actionState) return;
    setActionLoading(actionState.id);
    try {
      const body: Record<string, unknown> = { action: actionState.type, child_comment: actionState.childComment || null };
      if (actionState.type === "negotiate") body.tickets_negotiated = parseFloat(actionState.ticketsNegotiated);
      const res = await fetch("/api/requests/" + actionState.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setActionState(null); await fetchData(); }
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const res = await fetch("/api/requests/" + id, { method: "DELETE" });
      if (res.ok) { setDeleteConfirm(null); await fetchData(); }
    } catch { /* ignore */ } finally { setDeleteLoading(null); }
  };

  const handleLimit = async (parentName: string) => {
    const val = limits[parentName];
    if (!val) return;
    setLimitLoading(parentName); setLimitMsg(prev => ({ ...prev, [parentName]: "" }));
    try {
      const res = await fetch("/api/tickets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parent_name: parentName, total_limit: parseInt(val) }) });
      if (res.ok) { setLimitMsg(prev => ({ ...prev, [parentName]: "更新しました" })); await fetchData(); setTimeout(() => setLimitMsg(prev => ({ ...prev, [parentName]: "" })), 3000); }
      else { const d = await res.json(); setLimitMsg(prev => ({ ...prev, [parentName]: "エラー: " + d.error })); }
    } finally { setLimitLoading(null); }
  };

  const fmt = (s: string) => new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const pendReqs = requests.filter(r => r.status === "pending");
  const negReqs = requests.filter(r => r.status === "negotiating");
  const histReqs = requests.filter(r => ["approved", "declined", "withdrawn"].includes(r.status));
  const activeReq = actionState ? requests.find(r => r.id === actionState.id) : null;

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="bg-[#1a1f3a] text-white px-5 py-4 flex items-center justify-between">
        <div><h1 className="text-base font-semibold tracking-wide">子の画面</h1><p className="text-xs text-[#c9a84c] mt-0.5">親孝行チケット</p></div>
        <div className="flex items-center gap-4">
          <Link href="/guide" className="text-xs text-white/60 hover:text-[#c9a84c] transition-colors underline underline-offset-2">使い方</Link>
          <button onClick={() => { sessionStorage.removeItem("role"); router.push("/"); }} className="text-xs text-white/60 hover:text-white transition-colors">ホームへ</button>
        </div>
      </header>

      {allStats.length > 0 && (
        <div className="px-5 pt-5 grid grid-cols-2 gap-3">
          {allStats.map(s => (
            <div key={s.parent_name} className="bg-white border border-gray-200 p-4">
              <p className="text-xs font-semibold text-[#c9a84c] mb-2 truncate">{s.parent_name}</p>
              <div className="flex items-baseline gap-1 mb-2"><span className="text-3xl font-bold text-[#1a1f3a]">{s.remaining}</span><span className="text-xs text-gray-400">/ {s.total_limit}枚</span></div>
              <div className="w-full bg-gray-100 h-1 mb-2"><div className="bg-[#c9a84c] h-1 transition-all" style={{ width: `${Math.min(100, ((s.total_limit - s.remaining) / s.total_limit) * 100)}%` }} /></div>
              <div className="text-xs text-gray-400 space-y-0.5"><p>使用済み {s.used}枚</p><p>申請中 {s.pending}枚</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 pt-4">
        <div className="flex gap-0 mb-5 border border-gray-200 overflow-hidden">
          {(["requests", "history", "settings"] as const).map((t, i) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 font-semibold text-xs transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${tab === t ? "bg-[#1a1f3a] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              {t === "requests" ? "新着" : t === "history" ? "履歴" : "設定"}
            </button>
          ))}
        </div>

        {tab === "requests" && (
          <div>
            {loading ? <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
            : pendReqs.length === 0 && negReqs.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">新しいリクエストはありません</div>
            : (
              <div className="space-y-3">
                {negReqs.length > 0 && <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">交渉中（親の返答待ち）</p>
                  {negReqs.map(req => (
                    <div key={req.id} className="bg-white border border-gray-200 p-4 mb-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>{req.parent_name && <p className="text-xs text-[#c9a84c] font-semibold mb-0.5">{req.parent_name}</p>}<p className="font-semibold text-[#1a1f3a]">{req.title}</p></div>
                        <span className="text-xs px-2 py-1 font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shrink-0">交渉中</span>
                      </div>
                      <p className="text-sm text-gray-500">{req.tickets_requested}枚申請 → カウンター: {req.tickets_negotiated}枚</p>
                      {req.child_comment && <p className="text-sm text-gray-600 bg-[#f8f7f4] border-l-2 border-blue-300 px-3 py-2 mt-2">{req.child_comment}</p>}
                    </div>
                  ))}
                </div>}
                {pendReqs.length > 0 && <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">対応が必要なリクエスト</p>
                  {pendReqs.map(req => (
                    <div key={req.id} className="bg-white border border-gray-200 p-4 mb-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>{req.parent_name && <p className="text-xs text-[#c9a84c] font-semibold mb-0.5">{req.parent_name}</p>}<p className="font-semibold text-[#1a1f3a]">{req.title}</p></div>
                        <span className="text-xs px-2 py-1 font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">申請中</span>
                      </div>
                      <div className="flex gap-4 text-sm mb-2 flex-wrap">
                        <span className="text-[#c9a84c]">{req.tickets_requested}枚</span>
                        {req.preferred_datetime && <span className="text-gray-400 text-xs">{new Date(req.preferred_datetime).toLocaleDateString("ja-JP")}</span>}
                      </div>
                      {req.parent_comment && <p className="text-sm text-gray-600 bg-[#f8f7f4] border-l-2 border-[#c9a84c] px-3 py-2 mb-3">{req.parent_comment}</p>}
                      <p className="text-xs text-gray-400 mb-3">{fmt(req.created_at)}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setActionState({ id: req.id, type: "approve", childComment: "", ticketsNegotiated: "" })} className="flex-1 bg-[#1a1f3a] hover:bg-[#252b4a] text-white font-semibold py-2.5 text-sm transition-colors">承認</button>
                        <button onClick={() => setActionState({ id: req.id, type: "negotiate", childComment: "", ticketsNegotiated: "" })} className="flex-1 bg-white hover:bg-blue-50 text-blue-700 font-semibold py-2.5
