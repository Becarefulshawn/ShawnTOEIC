import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PASSWORD_HASH = process.env.TOEIC_PASSWORD_HASH || "";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json() as { password: string };

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const hash = hashPassword(password);

    if (hash !== PASSWORD_HASH) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 成功 → 設置 cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("toeic_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
