import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!session) {
        const searchParams = new URLSearchParams();
        searchParams.append("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(new URL("/login?" + searchParams.toString(), request.url));
    }
    return NextResponse.next();
}
export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*", "/api/events/admin/:path*"],
};
