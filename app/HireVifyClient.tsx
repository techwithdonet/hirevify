'use client';

import App from '../src/hirevify-app/App';

type HireVifyClientProps = {
  initialScreen?: any;
  initialCandidateId?: string | null;
};

export default function HireVifyClient({
  initialScreen,
  initialCandidateId,
}: HireVifyClientProps) {
  return <App initialScreen={initialScreen} initialCandidateId={initialCandidateId ?? null} />;
}
