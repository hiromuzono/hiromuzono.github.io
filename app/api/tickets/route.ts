import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PARENTS = ["中薗孝幸", "中薗明子"];

async function calcStats(parentName: string) {
  const { data: settings } = await supabase
    .from("ticket_settings")
    .select("total_limit")
    .eq("parent_name", parentName)
    .maybeSingle();

  const totalLimit = settings?.total_limit ?? 40;

  const { data: reqs } = await supabase
    .from("requests")
    .select("tickets_requested,tickets_negotiated,status")
    .in("status", ["approved", "pending", "negotiating"])
    .eq("parent_name", parentName);

  let used = 0, pending = 0;
  for (const r of reqs ?? []) {
    if (r.status === "approved") used += r.tickets_negotiated ?? r.tickets_requested;
    else pending += r.tickets_negotiated ?? r.tickets_requested;
  }

  return { parent_name: parentName, total_limit: totalLimit, used, pending, remaining: totalLimit - used - pending };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentName = searchParams.get("parent_name");

  if (parentName) {
    return NextResponse.json(await calcStats(parentName));
  }

  const results = await Promise.all(PARENTS.map(calcStats));
  return NextResponse.json(results);
}

export async function PUT(request: NextRequest) {
  const { parent_name, total_limit } = await request.json();
  if (!total_limit || total_limit < 1) return NextResponse.json({ error: "上限枚数は1以上で入力してください" }, { status: 400 });
  if (!parent_name) return NextResponse.json({ error: "申請者名が必要です" }, { status: 400 });

  const { data, error } = await supabase
    .from("ticket_settings")
    .upsert({ parent_name, total_limit }, { onConflict: "parent_name" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
