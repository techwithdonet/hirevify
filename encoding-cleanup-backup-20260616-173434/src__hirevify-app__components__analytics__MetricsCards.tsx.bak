import { Card, CardContent } from '../ui/card';
import { TrendingUp, Users, Clock, Target, BarChart3 } from 'lucide-react';
import { METRICS_CONFIG } from './constants';

const iconMap = {
  Clock,
  Target,
  Users,
  BarChart3,
  TrendingUp
};

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {METRICS_CONFIG.map((metric, index) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap];
        return (
          <Card key={index} className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl text-foreground">{metric.value}</p>
                  <div className="flex items-center text-sm mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600">{metric.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${metric.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}







