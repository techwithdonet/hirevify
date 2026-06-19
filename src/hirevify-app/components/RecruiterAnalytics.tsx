import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Crown } from 'lucide-react';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { MetricsCards } from './analytics/MetricsCards';
import { HiringFunnel } from './analytics/HiringFunnel';
import { SourceEffectiveness } from './analytics/SourceEffectiveness';
import { DiversityMetrics } from './analytics/DiversityMetrics';
import { dashboardTheme } from '../theme/dashboardTheme';

interface RecruiterAnalyticsProps {
 onBack: () => void;
 onUpgrade: () => void;
}

export function RecruiterAnalytics({ onBack, onUpgrade }: RecruiterAnalyticsProps) {
 return (
 <div className={dashboardTheme.page}>
 {/* Header */}
 <header className="border-b border-border bg-card">
 <div className="px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
 <ArrowLeft className="w-5 h-5" />
 </Button>
 <div className="flex items-center space-x-3">
 <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-16" />
 <div>
 <h1 className="text-xl text-foreground">Advanced Analytics</h1>
 <p className="text-sm text-muted-foreground">Data-driven insights into your hiring performance</p>
 </div>
 </div>
 </div>
 <div className="flex items-center space-x-3">
 <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
 <Crown className="w-3 h-3 mr-1" />
 Premium Feature
 </Badge>
 <Button onClick={onUpgrade} className="bg-primary hover:bg-primary/90 text-primary-foreground">
 Upgrade to Unlock
 </Button>
 </div>
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-6 py-8">
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







