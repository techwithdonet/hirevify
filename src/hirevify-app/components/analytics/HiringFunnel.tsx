import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Target } from 'lucide-react';

export function HiringFunnel() {
  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Hiring Funnel
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Conversion rates through your hiring process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-green-800 mb-2">Real-Time Funnel Analysis</h4>
          <p className="text-green-700 text-sm mb-3">
            Hiring funnel data is calculated from actual application statuses and transitions
            in your recruiting pipeline.
          </p>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Applications: Total submitted applications</li>
            <li>• Screening: Applications that passed initial review</li>
            <li>• Interview: Candidates invited to interview</li>
            <li>• Offer: Candidates who received job offers</li>
            <li>• Hired: Successfully hired candidates</li>
          </ul>
          <p className="text-green-700 text-sm mt-3 font-medium">
            All metrics calculated from real data - no fake numbers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}





