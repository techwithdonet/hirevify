import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        {
          name: "Server route",
          status: "error",
          detail: "Missing Supabase environment variables on server.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
      cache: "no-store",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          name: "Server route",
          status: "warning",
          detail: `Server route reached Supabase, but REST returned ${response.status}.`,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      name: "Server route",
      status: "connected",
      detail: "Server route connected to Supabase REST successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        name: "Server route",
        status: "error",
        detail: error instanceof Error ? error.message : "Unknown server route error.",
      },
      { status: 500 },
    );
  }
}
