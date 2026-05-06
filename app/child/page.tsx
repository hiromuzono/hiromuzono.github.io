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
    setLimitLoading(parentName);
    setLimitMsg(prev => ({ ...prev, [parentName]: "" }));
    try {
      const res = await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_name: parentName, total_limit: parseInt(val) }),
      });
      if (res.ok) {
        setLimitMsg(prev => ({ ...prev, [parentName]: "更新しました" }));
        await fetchData();
        setTimeout(() => setLimitMsg(prev => ({ ...prev, [parentName]: "" })), 3000);
      } else {
        const d = await res.json();
        setLimitMsg(prev => ({ ...prev, [parentName]: "エラー: " + d.error }));
      }
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
        <div>
          <h1 className="text-base font-semibold tracking-wide">子の画面</h1>
          <p className="text-xs text-[#c9a84c] mt-0.5">親孝行チケット</p>
        </div>
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
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-[#1a1f3a]">{s.remaining}</span>
                <span className="text-xs text-gray-400">/ {s.total_limit}枚</span>
              </div>
              <div className="w-full bg-gray-100 h-1 mb-2">
                <div className="bg-[#c9a84c] h-1 transition-all" style={{ width: `${Math.min(100, ((s.total_limit - s.remaining) / s.total_limit) * 100)}%` }} />
              </div>
              <div className="text-xs text-gray-400 space-y-0.5">
                <p>使用済み {s.used}枚</p>
                <p>申請中 {s.pending}枚</p>
              </div>
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
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
            ) : pendReqs.length === 0 && negReqs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">新しいリクエストはありません</div>
            ) : (
              <div className="space-y-3">
                {negReqs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">交渉中（親の返答待ち）</p>
                    {negReqs.map(req => (
                      <div key={req.id} className="bg-white border border-gray-200 p-4 mb-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            {req.parent_name && <p className="text-xs text-[#c9a84c] font-semibold mb-0.5">{req.parent_name}</p>}
                            <p className="font-semibold text-[#1a1f3a]">{req.title}</p>
                          </div>
                          <span className="text-xs px-2 py-1 font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shrink-0">交渉中</span>
                        </div>
                        <p className="text-sm text-gray-500">{req.tickets_requested}枚申請 → カウンター: {req.tickets_negotiated}枚</p>
                        {req.child_comment && <p className="text-sm text-gray-600 bg-[#f8f7f4] border-l-2 border-blue-300 px-3 py-2 mt-2">{req.child_comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {pendReqs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">対応が必要なリクエスト</p>
                    {pendReqs.map(req => (
                      <div key={req.id} className="bg-white border border-gray-200 p-4 mb-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            {req.parent_name && <p className="text-xs text-[#c9a84c] font-semibold mb-0.5">{req.parent_name}</p>}
                            <p className="font-semibold text-[#1a1f3a]">{req.title}</p>
                          </div>
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
                          <button onClick={() => setActionState({ id: req.id, type: "negotiate", childComment: "", ticketsNegotiated: "" })} className="flex-1 bg-white hover:bg-blue-50 text-blue-700 font-semibold py-2.5 text-sm border border-blue-300 transition-colors">交渉</button>
                          <button onClick={() => setActionState({ id: req.id, type: "decline", childComment: "", ticketsNegotiated: "" })} className="flex-1 bg-white hover:bg-red-50 text-[#c0714f] font-semibold py-2.5 text-sm border border-red-200 transition-colors">辞退</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
            ) : histReqs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">まだ履歴がありません</div>
            ) : histReqs.map(req => {
              const s = STATUS[req.status] ?? { label: req.status, cls: "bg-gray-100 text-gray-500" };
              return (
                <div key={req.id} className="bg-white border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      {req.parent_name && <p className="text-xs text-[#c9a84c] font-semibold mb-0.5">{req.parent_name}</p>}
                      <p className="font-semibold text-[#1a1f3a]">{req.title}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 font-semibold whitespace-nowrap shrink-0 ${s.cls}`}>{s.label}</span>
                  </div>
                  <div className="flex gap-4 text-sm mb-2 flex-wrap">
                    <span className="text-[#c9a84c]">
                      {req.tickets_requested}枚
                      {req.tickets_negotiated && req.tickets_negotiated !== req.tickets_requested && (
                        <span className="text-blue-600"> → {req.tickets_negotiated}枚</span>
                      )}
                    </span>
                  </div>
                  {req.parent_comment && <p className="text-sm text-gray-600 bg-[#f8f7f4] border-l-2 border-[#c9a84c] px-3 py-2 mb-2">{req.parent_comment}</p>}
                  {req.child_comment && <p className="text-sm text-gray-600 bg-blue-50 border-l-2 border-blue-300 px-3 py-2 mb-2">{req.child_comment}</p>}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{fmt(req.created_at)}</p>
                    {deleteConfirm === req.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-200">キャンセル</button>
                        <button onClick={() => handleDelete(req.id)} disabled={deleteLoading === req.id} className="text-xs text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 px-2 py-1">{deleteLoading === req.id ? "削除中..." : "削除する"}</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(req.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4 3v7h4V3H4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        削除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-4">
            <div className="bg-[#f8f7f4] border border-gray-200 p-4 text-sm text-gray-500">
              <p className="text-xs text-[#c9a84c] font-medium">チケット上限は申請者ごとに個別に設定できます</p>
              <p className="text-xs text-gray-400 mt-1">残り枚数 = 上限 − 使用済み − 申請中</p>
            </div>
            {PARENTS.map(parentName => {
              const s = allStats.find(st => st.parent_name === parentName);
              return (
                <div key={parentName} className="bg-white border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#1a1f3a]">{parentName}</h2>
                    {s && <span className="text-sm text-gray-500">残り <span className="text-xl font-bold text-[#1a1f3a]">{s.remaining}</span> / {s.total_limit}枚</span>}
                  </div>
                  {s && <div className="w-full bg-gray-100 h-1 mb-4"><div className="bg-[#c9a84c] h-1 transition-all" style={{ width: `${Math.min(100, ((s.total_limit - s.remaining) / s.total_limit) * 100)}%` }} /></div>}
                  {s && <div className="flex text-xs text-gray-400 gap-4 mb-4"><span>使用済み {s.used}枚</span><span>申請中 {s.pending}枚</span></div>}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">上限枚数を変更</label>
                    <div className="flex gap-3">
                      <input type="number" value={limits[parentName] ?? "40"} onChange={e => setLimits(prev => ({ ...prev, [parentName]: e.target.value }))} min={1} className="flex-1 border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a]" />
                      <button onClick={() => handleLimit(parentName)} disabled={limitLoading === parentName || !limits[parentName]} className="bg-[#1a1f3a] hover:bg-[#252b4a] disabled:opacity-40 text-white font-semibold px-5 py-3 text-sm transition-colors">
                        {limitLoading === parentName ? "更新中..." : "更新"}
                      </button>
                    </div>
                    {limitMsg[parentName] && <p className="mt-2 text-sm text-gray-600">{limitMsg[parentName]}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-10" />

      {actionState && activeReq && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center p-4 z-50">
          <div className="bg-white shadow-2xl p-5 w-full max-w-md">
            <h3 className="text-base font-bold text-[#1a1f3a] mb-1">
              {actionState.type === "approve" && "承認する"}
              {actionState.type === "decline" && "辞退する"}
              {actionState.type === "negotiate" && "交渉する"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{activeReq.title}</p>
            {actionState.type === "negotiate" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">カウンター提案の枚数 <span className="text-[#c0714f]">*</span></label>
                <p className="text-xs text-gray-400 mb-2">元の申請: {activeReq.tickets_requested}枚</p>
                <input type="number" value={actionState.ticketsNegotiated} onChange={e => setActionState({ ...actionState, ticketsNegotiated: e.target.value })} placeholder="提案枚数" min={0.5} step={0.5} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a]" />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">コメント <span className="font-normal text-gray-400 normal-case">(任意)</span></label>
              <textarea value={actionState.childComment} onChange={e => setActionState({ ...actionState, childComment: e.target.value })} placeholder={actionState.type === "approve" ? "一言添えてみましょう" : actionState.type === "decline" ? "辞退の理由など" : "交渉の意図など"} rows={3} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1f3a] focus:border-[#1a1f3a] resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActionState(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 text-sm transition-colors">キャンセル</button>
              <button onClick={handleAction} disabled={actionLoading === actionState.id || (actionState.type === "negotiate" && !actionState.ticketsNegotiated)} className={`flex-1 text-white font-semibold py-3 text-sm disabled:opacity-40 transition-colors ${actionState.type === "approve" ? "bg-[#1a1f3a] hover:bg-[#252b4a]" : actionState.type === "decline" ? "bg-[#c0714f] hover:bg-[#a85e3e]" : "bg-blue-600 hover:bg-blue-700"}`}>
                {actionLoading === actionState.id ? "送信中..." : actionState.type === "approve" ? "承認する" : actionState.type === "decline" ? "辞退する" : "提案を送る"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
