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

export default function Home() {
  return (
    <Suspense fallback={<div />}>
      <HireVifyClient />
    </Suspense>
  );
}