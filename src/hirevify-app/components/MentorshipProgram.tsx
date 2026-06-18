import { CandidateGrowthPage } from './CandidateGrowthPage';

interface MentorshipProgramProps {
 onBack: () => void;
 onUpgrade: () => void;
}

export function MentorshipProgram({ onBack }: MentorshipProgramProps) {
 return (
 <CandidateGrowthPage
 type="mentorship"
 title="Mentorship Program"
 eyebrow="Accelerate Your Career Growth"
 description="Request database-backed mentorship opportunities from mentors and programs published in Supabase."
 badgeLabel="1-on-1 Guidance"
 availableTabLabel="Browse Mentors"
 mineTabLabel="My Mentorship"
 aboutTabLabel="How It Works"
 searchPlaceholder="Search by mentor, company, or expertise..."
 emptyMineLabel="No Active Mentorships"
 applyLabel="Request Mentorship"
 appliedToastVerb="Mentorship request sent for"
 onBack={onBack}
 />
 );
}
