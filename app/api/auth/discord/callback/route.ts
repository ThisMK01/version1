import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const targetUrl = new URL(`${apiUrl.replace(/\/$/, "")}/auth/discord/callback`);

  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(targetUrl.toString());
}
