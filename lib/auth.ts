import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * 驗證密碼雜湊
 */
export function verifyPassword(inputPassword: string, hashedPassword: string): boolean {
  const hash = crypto.createHash("sha256").update(inputPassword).digest("hex");
  return hash === hashedPassword;
}

/**
 * 檢查請求是否已認證（從 cookie）
 */
export function isAuthenticated(req: NextRequest): boolean {
  const cookie = req.cookies.get("toeic_auth");
  return cookie?.value === "true";
}

/**
 * 未認證時的 401 回應
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized - Please log in" },
    { status: 401 }
  );
}

/**
 * 設置認證 cookie
 */
export function setAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set("toeic_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: "/",
  });
  return response;
}

/**
 * 清除認證 cookie
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set("toeic_auth", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
