import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export async function POST(request: NextRequest) {
  const { parent_name, password } = await request.json();
  if (!parent_name) return NextResponse.json({ error: "申請者名が必要です" }, { status: 400 });
  const { data } = await supabase.from("ticket_settings").select("password").eq("parent_name", parent_name).maybeSingle();
  if (data?.password && password !== data.password) return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
export async function PUT(request: NextRequest) {
  const { parent_name, new_password } = await request.json();
  if (!parent_name) return NextResponse.json({ error: "申請者名が必要です" }, { status: 400 });
  if (!new_password || new_password.length < 4) return NextResponse.json({ error: "パスワードは4文字以上で入力してください" }, { status: 400 });
  const { error } = await supabase.from("ticket_settings").upsert({ parent_name, password: new_password }, { onConflict: "parent_name" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
