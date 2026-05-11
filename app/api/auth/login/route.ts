import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = (await req.json()) as { password: string };

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const correctPasswordHash = process.env.SITE_PASSWORD_HASH;
    if (!correctPasswordHash) {
      console.error("SITE_PASSWORD_HASH not set in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 驗證密碼（後端比對，安全）
    if (!verifyPassword(password, correctPasswordHash)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 成功 → 設置 cookie 並回應
    const response = NextResponse.json({ success: true });
    return setAuthCookie(response);
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
