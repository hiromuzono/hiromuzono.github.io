import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { action, child_comment, tickets_negotiated } = await request.json();
  const validActions = ["approve", "decline", "negotiate", "agree", "withdraw"];
  if (!action || !validActions.includes(action)) return NextResponse.json({ error: "無効なアクションです" }, { status: 400 });
  const { data: req, error: fetchErr } = await supabase.from("requests").select("*").eq("id", id).single();
  if (fetchErr || !req) return NextResponse.json({ error: "リクエストが見つかりません" }, { status: 404 });
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (action === "approve") {
    if (req.status !== "pending") return NextResponse.json({ error: "申請中のリクエストのみ承認できます" }, { status: 400 });
    updateData.status = "approved"; updateData.child_comment = child_comment ?? null;
  } else if (action === "decline") {
    if (req.status !== "pending") return NextResponse.json({ error: "申請中のリクエストのみ辞退できます" }, { status: 400 });
    updateData.status = "declined"; updateData.child_comment = child_comment ?? null;
  } else if (action === "negotiate") {
    if (req.status !== "pending") return NextResponse.json({ error: "申請中のリクエストのみ交渉できます" }, { status: 400 });
    if (!tickets_negotiated || tickets_negotiated < 1) return NextResponse.json({ error: "交渉枚数を入力してください" }, { status: 400 });
    updateData.status = "negotiating"; updateData.tickets_negotiated = tickets_negotiated; updateData.child_comment = child_comment ?? null;
  } else if (action === "agree") {
    if (req.status !== "negotiating") return NextResponse.json({ error: "交渉中のリクエストのみ同意できます" }, { status: 400 });
    updateData.status = "approved"; updateData.tickets_negotiated = req.tickets_negotiated;
  } else if (action === "withdraw") {
    if (!["pending", "negotiating"].includes(req.status)) return NextResponse.json({ error: "取り下げできないリクエストです" }, { status: 400 });
    updateData.status = "withdrawn";
  }
  const { data, error } = await supabase.from("requests").update(updateData).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data: req } = await supabase.from("requests").select("status").eq("id", id).single();
  if (!req) return NextResponse.json({ error: "リクエストが見つかりません" }, { status: 404 });
  if (!["approved", "declined", "withdrawn"].includes(req.status)) return NextResponse.json({ error: "申請中・交渉中のリクエストは削除できません" }, { status: 400 });
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
