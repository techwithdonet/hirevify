import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function toAmountInPaise(value: unknown, fallbackPaise: number) {
  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    return fallbackPaise;
  }

  // If already looks like paise, keep it.
  if (num >= 10000) {
    return Math.round(num);
  }

  // Otherwise treat as rupees.
  return Math.round(num * 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          message: 'Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.',
        },
        { status: 503 }
      );
    }

    const plan = String(body.plan || body.planId || body.plan_id || 'pro').toLowerCase();

    const fallbackAmount =
      plan.includes('year') || plan.includes('annual')
        ? 499900
        : 49900;

    const amount = toAmountInPaise(
      body.amount ?? body.price ?? body.amountPaise ?? body.amount_paise,
      fallbackAmount
    );

    const currency = String(body.currency || 'INR').toUpperCase();

    const receipt = `hirevify_${Date.now()}`;

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        payment_capture: 1,
        notes: {
          plan,
          source: 'hirevify',
          userId: body.userId || body.user_id || '',
        },
      }),
    });

    const razorpayData = await razorpayResponse.json().catch(() => ({}));

    if (!razorpayResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            razorpayData?.error?.description ||
            razorpayData?.message ||
            'Failed to create Razorpay order.',
          razorpayError: razorpayData,
        },
        { status: razorpayResponse.status }
      );
    }

    return NextResponse.json({
      success: true,

      // direct shape, in case frontend expects RazorpayOrder directly
      ...razorpayData,

      // nested shape, in case frontend expects data.order
      order: razorpayData,

      keyId,
      razorpayKeyId: keyId,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Unexpected error while creating subscription order.',
      },
      { status: 500 }
    );
  }
}
