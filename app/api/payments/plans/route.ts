import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      status: 'pending',
      checkoutEnabled: false,
      plans: [],
      message: 'Online payment plans will be published when Razorpay is ready.',
    },
    { status: 503 },
  );
}
