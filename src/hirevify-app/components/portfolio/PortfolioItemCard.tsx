import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ExternalLink, Edit, Trash2 } from 'lucide-react';
import { PortfolioItem } from './types';

interface PortfolioItemCardProps {
  item: PortfolioItem;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
}

export function PortfolioItemCard({ item, onEdit, onDelete }: PortfolioItemCardProps) {
  return (
    <Card className="border border-border hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-foreground">{item.title}</CardTitle>
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
          {item.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-border text-foreground hover:bg-muted"
            onClick={() => {
  const rawUrl = item.url || (item as any).projectUrl || '';
  const finalUrl =
    rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;

  window.open(finalUrl, '_blank');
}}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}







