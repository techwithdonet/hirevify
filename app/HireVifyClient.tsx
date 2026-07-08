'use client';

import dynamic from 'next/dynamic';

const HireVifyApp = dynamic(() => import('../src/hirevify-app/App'), {
  ssr: false,
});

export default function HireVifyClient() {
  return <HireVifyApp />;
}
