import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ExternalLink, Edit, Trash2 } from 'lucide-react';
import { PortfolioItem } from './types';
import { getTypeIcon, getTypeColor } from './utils';

interface PortfolioItemCardProps {
  item: PortfolioItem;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
}

export function PortfolioItemCard({ item, onEdit, onDelete }: PortfolioItemCardProps) {
  const IconComponent = getTypeIcon(item.type);

  return (
    <Card className="border border-border hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-foreground">{item.title}</CardTitle>
              <Badge className={getTypeColor(item.type)} variant="secondary">
                {item.type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete?.(item.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{item.description}</p>
        
        <div className="flex flex-wrap gap-2">
          {item.technologies.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-border text-foreground hover:bg-muted"
            onClick={() => window.open(item.url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}





