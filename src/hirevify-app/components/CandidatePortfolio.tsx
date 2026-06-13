import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Briefcase, Plus, Crown, Loader } from 'lucide-react';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { PortfolioItem, NewPortfolioItem } from './portfolio/types';
import { PortfolioItemCard } from './portfolio/PortfolioItemCard';
import { AddPortfolioForm } from './portfolio/AddPortfolioForm';
import { useAuth } from './AuthProvider';
import { portfolioService } from '../services/portfolioService';
import { toast } from 'sonner';

interface CandidatePortfolioProps {
  onBack: () => void;
  onUpgrade: () => void;
}

export function CandidatePortfolio({ onBack, onUpgrade }: CandidatePortfolioProps) {
  const { user } = useAuth();

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapPortfolioItem = (item: any): PortfolioItem => {
    const tags = item.tags || item.technologies || item.skills || [];

    return {
      ...(item as any),
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      url: item.url || item.projectUrl || item.project_url || '',
      projectUrl: item.projectUrl || item.project_url || item.url || '',
      githubUrl: item.githubUrl || item.github_url || '',
      imageUrl: item.imageUrl || item.image_url || '',
      tags,
      technologies: tags,
      skills: tags,
      category: item.category || 'Project',
      createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      isFeatured: item.isFeatured || item.is_featured || false,
    } as PortfolioItem;
  };

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data, error } = await portfolioService.getUserPortfolio(user.id);

      if (error) {
        console.warn('Failed to load portfolio:', error);
        toast.error('Failed to load portfolio');
        setPortfolioItems([]);
      } else {
        setPortfolioItems((data || []).map(mapPortfolioItem));
      }

      setIsLoading(false);
    };

    loadPortfolio();
  }, [user?.id]);

  const handleAddItem = async (newItem: NewPortfolioItem) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    const { data, error } = await portfolioService.addPortfolioItem({
      title: newItem.title,
      description: newItem.description ?? '',
      projectUrl: (newItem as any).url || (newItem as any).projectUrl || '',
      githubUrl: (newItem as any).githubUrl || '',
      imageUrl: (newItem as any).imageUrl || '',
      technologies:
        (newItem as any).tags ||
        (newItem as any).technologies ||
        (newItem as any).skills ||
        [],
      category: (newItem as any).category || 'Project',
    });

    if (error) {
      console.warn('Failed to add portfolio item:', error);
      toast.error('Failed to add portfolio item');
      return;
    }

    if (data) {
      setPortfolioItems((prev) => [mapPortfolioItem(data), ...prev]);
      toast.success('Portfolio item added successfully');
      setIsAddingItem(false);
    }
  };

  const handleEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setIsAddingItem(false);
  };

  const handleUpdateItem = async (updatedItem: NewPortfolioItem) => {
    if (!editingItem) return;

    const { data, error } = await portfolioService.updatePortfolioItem(editingItem.id, {
      title: updatedItem.title,
      description: updatedItem.description ?? undefined,
      projectUrl: (updatedItem as any).url || (updatedItem as any).projectUrl || '',
      githubUrl: (updatedItem as any).githubUrl || '',
      imageUrl: (updatedItem as any).imageUrl || '',
      technologies:
        (updatedItem as any).tags ||
        (updatedItem as any).technologies ||
        (updatedItem as any).skills ||
        [],
      category: (updatedItem as any).category || 'Project',
    });

    if (error) {
      console.warn('Failed to update portfolio item:', error);
      toast.error('Failed to update portfolio item');
      return;
    }

    if (data) {
      const savedItem = mapPortfolioItem(data);

      setPortfolioItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? savedItem : item))
      );

      toast.success('Portfolio item updated successfully');
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    const { error } = await portfolioService.deletePortfolioItem(id);

    if (error) {
      console.warn('Failed to delete portfolio item:', error);
      toast.error('Failed to delete portfolio item');
      return;
    }

    setPortfolioItems((prev) => prev.filter((item) => item.id !== id));
    toast.success('Portfolio item deleted successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-3">
                <img
                  src={(hirevifyLogo as any).src ?? hirevifyLogo}
                  alt="HireVify"
                  className="h-16"
                />
                <div>
                  <h1 className="text-xl text-foreground">Portfolio Manager</h1>
                  <p className="text-sm text-muted-foreground">
                    Showcase your work and projects
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Premium Feature
              </Badge>

              <Button
                onClick={onUpgrade}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Upgrade to Unlock
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl text-foreground mb-2">Your Portfolio</h1>
            <p className="text-muted-foreground">
              Showcase your best work to stand out to recruiters
            </p>
          </div>

          {!isAddingItem && !editingItem && (
            <Button
              onClick={() => setIsAddingItem(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Project
            </Button>
          )}
        </div>

        {isAddingItem && (
          <div className="mb-8">
            <AddPortfolioForm
              onAdd={handleAddItem}
              onCancel={() => setIsAddingItem(false)}
            />
          </div>
        )}

        {editingItem && (
          <div className="mb-8">
            <AddPortfolioForm
              mode="edit"
              initialItem={editingItem}
              onAdd={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
            />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your portfolio...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {portfolioItems.map((item) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}

        {!isLoading && portfolioItems.length === 0 && !isAddingItem && !editingItem && (
          <Card className="border border-dashed border-border p-12">
            <div className="text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first project to start building your portfolio
              </p>

              <Button
                onClick={() => setIsAddingItem(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Project
              </Button>
            </div>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-2xl text-yellow-800 mb-4">
              Unlock Portfolio Features
            </h3>
            <p className="text-yellow-700 mb-6 max-w-2xl mx-auto">
              Get premium portfolio features including custom themes, analytics tracking,
              and priority visibility to recruiters.
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


