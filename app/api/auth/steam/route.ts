import { NextResponse } from "next/server";

export async function GET() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const backendUrl = `${apiUrl}/auth/steam`;

    return NextResponse.redirect(backendUrl);
}