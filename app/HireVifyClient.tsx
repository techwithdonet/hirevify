'use client';

import App from '../src/hirevify-app/App';

type HireVifyClientProps = {
  initialScreen?: any;
  requestedScreen?: any;
  initialCandidateId?: string | null;
};

export default function HireVifyClient({
  initialScreen,
  requestedScreen,
  initialCandidateId,
}: HireVifyClientProps) {
  return (
    <App
      initialScreen={requestedScreen || initialScreen}
      initialCandidateId={initialCandidateId ?? null}
    />
  );
}
