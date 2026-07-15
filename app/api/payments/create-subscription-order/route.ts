import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Online payments are not available yet.",
      status: "pending",
      message: "Pro access is currently activated manually by a HireVify administrator.",
    },
    { status: 503 },
  );
}
