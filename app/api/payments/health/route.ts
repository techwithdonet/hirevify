import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      service: "payments",
      status: "pending",
      checkoutEnabled: false,
      message: "Razorpay checkout has not been enabled yet.",
    },
    { status: 503 },
  );
}
