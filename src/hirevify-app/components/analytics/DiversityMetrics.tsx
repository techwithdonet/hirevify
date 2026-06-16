import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Calendar } from 'lucide-react';

export function DiversityMetrics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Diversity Metrics</CardTitle>
          <CardDescription className="text-muted-foreground">
            Track diversity in your hiring pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-yellow-800 mb-2">Data Collection Required</h4>
            <p className="text-yellow-700 text-sm mb-3">
              Diversity metrics require opt-in demographic data collection from candidates.
              This ensures privacy compliance and accurate representation.
            </p>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li> Gender: Self-identification required</li>
              <li> Experience Level: Calculated from actual application data</li>
              <li> All data anonymized and aggregated</li>
              <li> No fake or estimated data displayed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Time Analysis
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Hiring timeline breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-blue-800 mb-2">Real-Time Calculation</h4>
            <p className="text-blue-700 text-sm mb-3">
              Time analysis metrics are calculated from actual application timestamps
              and status changes in your hiring pipeline.
            </p>
            <ul className="text-blue-700 text-sm space-y-1">
              <li> Application to Screening: Calculated from real data</li>
              <li> Screening to Interview: Based on actual transitions</li>
              <li> Interview to Offer: Real timeline tracking</li>
              <li> Offer to Acceptance: Actual response times</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








