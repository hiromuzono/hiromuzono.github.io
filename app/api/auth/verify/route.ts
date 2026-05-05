import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return NextResponse.json({ error: "ADMIN_PASSWORD が設定されていません" }, { status: 500 });
  if (password === adminPassword) return NextResponse.json({ success: true });
  return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
}
