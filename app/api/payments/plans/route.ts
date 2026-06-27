import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      amount: 0,
      currency: 'INR',
      interval: 'month',
      features: [
        'Basic profile access',
        'Limited applications',
        'Standard dashboard',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 499,
      amount: 49900,
      currency: 'INR',
      interval: 'month',
      features: [
        'Unlimited access',
        'Advanced AI tools',
        'Priority visibility',
        'Premium dashboard features',
      ],
    },
  ];

  return NextResponse.json({
    success: true,
    plans,
    data: plans,
  });
}
