import { CandidateGrowthPage } from './CandidateGrowthPage';

interface MicroInternshipsProps {
 onBack: () => void;
 onUpgrade: () => void;
}

export function MicroInternships({ onBack }: MicroInternshipsProps) {
 return (
 <CandidateGrowthPage
 type="micro_internship"
 title="Micro-Internships"
 eyebrow="Rapid Skill Building and Income"
 description="Complete short-term opportunities loaded from Supabase that build skills, portfolio evidence, and recruiter connections."
 badgeLabel="Quick Experience Wins"
 availableTabLabel="Available Projects"
 mineTabLabel="My Applications"
 aboutTabLabel="About Micro-Internships"
 searchPlaceholder="Search by title, company, or skills..."
 emptyMineLabel="No Applications Yet"
 applyLabel="Apply Now"
 appliedToastVerb="Applied to"
 onBack={onBack}
 />
 );
}
