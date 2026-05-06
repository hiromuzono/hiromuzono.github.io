import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("requests").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { title, tickets_requested, preferred_datetime, parent_comment, parent_name } = await request.json();
  if (!title || !tickets_requested) return NextResponse.json({ error: "タイトルとチケット枚数は必須です" }, { status: 400 });
  const { data: settings } = await supabase.from("ticket_settings").select("total_limit").eq("parent_name", parent_name ?? "").maybeSingle();
  let query = supabase.from("requests").select("tickets_requested,tickets_negotiated,status").in("status", ["approved", "pending", "negotiating"]);
  if (parent_name) query = query.eq("parent_name", parent_name);
  const { data: reqs } = await query;
  let used = 0, pending = 0;
  for (const r of reqs ?? []) {
    if (r.status === "approved") used += r.tickets_negotiated ?? r.tickets_requested;
    else pending += r.tickets_negotiated ?? r.tickets_requested;
  }
  const remaining = (settings?.total_limit ?? 40) - used - pending;
  if (tickets_requested > remaining) return NextResponse.json({ error: "チケットが不足しています。残り: " + remaining + "枚" }, { status: 400 });
  const { data, error } = await supabase.from("requests").insert({ title, tickets_requested, preferred_datetime: preferred_datetime || null, parent_comment: parent_comment || null, parent_name: parent_name || null, status: "pending" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
