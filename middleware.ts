import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 允許訪問認證相關頁面和 API
  if (pathname.startsWith("/auth") || pathname === "/api/auth/login" || pathname === "/api/auth/logout") {
    return NextResponse.next();
  }

  // 檢查認證 cookie
  const auth = request.cookies.get("toeic_auth");

  // 只保護頁面，不保護其他 API（API 會自己檢查）
  if (pathname === "/" && !auth) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 排除：
     * - api（API 由路由自己檢查）
     * - _next/static、_next/image、favicon.ico（靜態資源）
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
