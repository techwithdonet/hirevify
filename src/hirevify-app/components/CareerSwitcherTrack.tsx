import { CandidateGrowthPage } from './CandidateGrowthPage';

interface CareerSwitcherTrackProps {
 onBack: () => void;
 onUpgrade: () => void;
}

export function CareerSwitcherTrack({ onBack }: CareerSwitcherTrackProps) {
 return (
 <CandidateGrowthPage
 type="career_switch"
 title="Career Switcher Track"
 eyebrow="Your Career Transformation Journey"
 description="Start structured career-switch tracks that are published and managed through Supabase."
 badgeLabel="Structured Learning"
 availableTabLabel="Learning Paths"
 mineTabLabel="My Progress"
 aboutTabLabel="Success Path"
 searchPlaceholder="Search learning paths, careers, or skills..."
 emptyMineLabel="No Active Learning Path"
 applyLabel="Start Learning Path"
 appliedToastVerb="Enrolled in"
 onBack={onBack}
 />
 );
}
