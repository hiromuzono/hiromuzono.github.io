import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export async function GET() {
  const [sr, rr] = await Promise.all([
    supabase.from("ticket_settings").select("total_limit").eq("id", 1).single(),
    supabase.from("requests").select("tickets_requested,tickets_negotiated,status").in("status", ["approved","pending","negotiating"]),
  ]);
  if (sr.error) return NextResponse.json({ error: sr.error.message }, { status: 500 });
  const totalLimit = sr.data?.total_limit ?? 40;
  let used = 0, pending = 0;
  for (const r of rr.data ?? []) {
    if (r.status === "approved") used += r.tickets_negotiated ?? r.tickets_requested;
    else pending += r.tickets_negotiated ?? r.tickets_requested;
  }
  return NextResponse.json({ total_limit: totalLimit, used, pending, remaining: totalLimit - used - pending });
}
export async function PUT(request: NextRequest) {
  const { total_limit } = await request.json();
  if (!total_limit || total_limit < 1) return NextResponse.json({ error: "上限枚数は1以上で入力してください" }, { status: 400 });
  const { data, error } = await supabase.from("ticket_settings").upsert({ id: 1, total_limit }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
