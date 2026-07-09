import { Suspense } from 'react';
import type { Metadata } from 'next';
import HireVifyClient from './HireVifyClient';

export const metadata: Metadata = {
  title: 'HireVify - Hire Smarter. Grow Talent.',
  description:
    'HireVify is an AI-powered skills hiring platform with Skill Match dashboards, candidate proof boards, recruiter workflows, project tracking, and interview-ready talent matching.',
  keywords: [
    'HireVify',
    'AI hiring platform',
    'skills hiring',
    'recruiter dashboard',
    'candidate screening',
    'ATS match',
    'talent matching',
  ],
  openGraph: {
    title: 'HireVify - Hire Smarter. Grow Talent.',
    description:
      'AI-powered skills hiring platform for proof-based recruiting and smarter candidate matching.',
    type: 'website',
  },
};

function firstValue(value: any): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function Home(props: any) {
  const searchParams = await props.searchParams;

  const initialScreen = firstValue(searchParams?.screen);
  const initialCandidateId = firstValue(searchParams?.candidateId);

  return (
    <Suspense fallback={null}>
      <HireVifyClient
        initialScreen={initialScreen}
        initialCandidateId={initialCandidateId}
      />
    </Suspense>
  );
}
