import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Crown } from 'lucide-react';
import hirevifyLogo from '../../assets/hirevify-logo-transparent.png';
import { MetricsCards } from './analytics/MetricsCards';
import { HiringFunnel } from './analytics/HiringFunnel';
import { SourceEffectiveness } from './analytics/SourceEffectiveness';
import { DiversityMetrics } from './analytics/DiversityMetrics';


interface RecruiterAnalyticsProps {
 onBack: () => void;
 onUpgrade: () => void;
}

export function RecruiterAnalytics({ onBack, onUpgrade }: RecruiterAnalyticsProps) {
 return (
<div className="premium-page">
 {/* Header */}
 <header className="premium-header workspace-page-header recruiter-analytics-header">
 <div className="premium-header-inner">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex min-w-0 items-center gap-4">
  <Button
   variant="ghost"
   onClick={onBack}
   aria-label="Back to Dashboard"
   className="workspace-header-back inline-flex shrink-0 items-center gap-2 whitespace-nowrap"
  >
  <ArrowLeft className="w-5 h-5" />
  <span>Back to Dashboard</span>
  </Button>
  <div className="min-w-0">
  <h1 className="text-xl font-bold text-foreground">Advanced Analytics</h1>
  <p className="text-sm text-muted-foreground">Data-driven insights into your hiring performance</p>
  </div>
  </div>
 <div className="recruiter-analytics-actions flex flex-wrap items-center justify-end gap-3">
 <Badge variant="secondary" className="workspace-premium-badge bg-yellow-100 text-yellow-800">
 <Crown className="w-3 h-3 mr-1" />
 Premium Feature
 </Badge>
  <Button onClick={onUpgrade} className="workspace-premium-action bg-primary text-primary-foreground hover:bg-primary/90">
  Upgrade to Unlock
  </Button>
  <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="workspace-header-logo" />
  </div>
</div>
 </div>
 </header>
 
 <main className="premium-content">
 {/* Overview Cards */}
 <MetricsCards />

 {/* Charts Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
 <HiringFunnel />
 <SourceEffectiveness />
 </div>

 {/* Diversity Metrics */}
 <DiversityMetrics />

 {/* Upgrade Prompt */}
 <Card className="mt-8 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
 <CardContent className="p-8 text-center">
 <Crown className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
 <h3 className="text-2xl text-yellow-800 mb-4">Unlock Advanced Analytics</h3>
 <p className="text-yellow-700 mb-6 max-w-2xl mx-auto">
 Get deeper insights with custom reports, predictive analytics, and advanced filtering. 
 Make data-driven hiring decisions that improve your success rate.
 </p>
 <Button 
 onClick={onUpgrade}
 size="lg"
 className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3"
 >
 Upgrade to Premium
 </Button>
 </CardContent>
 </Card>
 </main>
 </div>
 );
}







