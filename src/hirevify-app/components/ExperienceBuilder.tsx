import { CandidateGrowthPage } from './CandidateGrowthPage';

interface ExperienceBuilderProps {
 onBack: () => void;
 onUpgrade: () => void;
}

export function ExperienceBuilder({ onBack }: ExperienceBuilderProps) {
 return (
 <CandidateGrowthPage
 type="experience_builder"
 title="Experience Builder Program"
 eyebrow="Gain Real Experience, No Experience Required"
 description="Bridge the experience gap with short-term real project opportunities from the HireVify database."
 badgeLabel="Real Work Experience"
 availableTabLabel="Available Projects"
 mineTabLabel="My Experience"
 aboutTabLabel="How It Works"
 searchPlaceholder="Search projects, companies, or skills..."
 emptyMineLabel="No Experience Yet"
 applyLabel="Apply Now"
 appliedToastVerb="Applied to"
 onBack={onBack}
 />
 );
}
