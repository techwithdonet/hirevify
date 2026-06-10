import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, X } from 'lucide-react';
import { NewPortfolioItem, PortfolioItem } from './types';

interface AddPortfolioFormProps {
  onAdd: (item: NewPortfolioItem) => void;
  onCancel: () => void;
}

export function AddPortfolioForm({ onAdd, onCancel }: AddPortfolioFormProps) {
  const [newItem, setNewItem] = useState<NewPortfolioItem>({
    title: '',
    description: '',
    type: 'website',
    url: '',
    technologies: []
  });
  const [newTechnology, setNewTechnology] = useState('');

  const addTechnology = () => {
    if (newTechnology.trim() && !newItem.technologies.includes(newTechnology.trim())) {
      setNewItem({
        ...newItem,
        technologies: [...newItem.technologies, newTechnology.trim()]
      });
      setNewTechnology('');
    }
  };

  const removeTechnology = (tech: string) => {
    setNewItem({
      ...newItem,
      technologies: newItem.technologies.filter(t => t !== tech)
    });
  };

  const handleSubmit = () => {
    if (newItem.title && newItem.description && newItem.url) {
      onAdd(newItem);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTechnology();
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Add New Project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Project Title</Label>
            <Input
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="e.g. E-commerce React App"
              className="bg-input-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Type</Label>
            <select
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="website">Website</option>
              <option value="GitBranch">GitBranch Repository</option>
              <option value="design">Design Project</option>
              <option value="document">Document</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Description</Label>
          <Textarea
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Describe your project..."
            rows={3}
            className="bg-input-background border-border text-foreground resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">URL</Label>
          <Input
            value={newItem.url}
            onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            placeholder="https://..."
            className="bg-input-background border-border text-foreground"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-foreground">Technologies</Label>
          <div className="flex gap-2">
            <Input
              value={newTechnology}
              onChange={(e) => setNewTechnology(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add technology"
              className="bg-input-background border-border text-foreground"
            />
            <Button onClick={addTechnology} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {newItem.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              {newItem.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="px-3 py-1">
                  {tech}
                  <button
                    onClick={() => removeTechnology(tech)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!newItem.title || !newItem.description || !newItem.url}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Add Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}





