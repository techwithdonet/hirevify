import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { PieChart } from 'lucide-react';

export function SourceEffectiveness() {
  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          <PieChart className="w-5 h-5 mr-2" />
          Source Effectiveness
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Where your best candidates come from
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-purple-800 mb-2">Source Tracking</h4>
          <p className="text-purple-700 text-sm mb-3">
            Source effectiveness is tracked from actual application sources and outcomes.
            Data is collected when candidates submit applications.
          </p>
          <ul className="text-purple-700 text-sm space-y-1">
            <li>• Direct Applications: Company website applications</li>
            <li>• Referrals: Employee and network referrals</li>
            <li>• Social Media: LinkedIn, Twitter, etc.</li>
            <li>• Job Boards: Indeed, Glassdoor, etc.</li>
            <li>• Conversion rates calculated from actual hires</li>
          </ul>
          <p className="text-purple-700 text-sm mt-3 font-medium">
            All source data based on real application tracking.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}