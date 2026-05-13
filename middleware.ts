import { NextRequest, NextResponse } from "next/server";
import { session, verifySessionValue } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const verified = await verifySessionValue(request.cookies.get(session.name)?.value);

  if (!verified) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
