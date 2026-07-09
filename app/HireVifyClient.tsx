'use client';

import dynamic from 'next/dynamic';

const HireVifyApp = dynamic(() => import('../src/hirevify-app/App'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-slate-950" aria-hidden="true" />,
});

export default function HireVifyClient() {
  return <HireVifyApp />;
}
