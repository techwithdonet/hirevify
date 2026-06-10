import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Briefcase, Plus, Crown } from 'lucide-react';
import hirevifyLogo from 'figma:asset/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { PortfolioItem, NewPortfolioItem } from './portfolio/types';
import { PortfolioItemCard } from './portfolio/PortfolioItemCard';
import { AddPortfolioForm } from './portfolio/AddPortfolioForm';
import { MOCK_PORTFOLIO_ITEMS } from './portfolio/constants';

interface CandidatePortfolioProps {
  onBack: () => void;
  onUpgrade: () => void;
}

export function CandidatePortfolio({ onBack, onUpgrade }: CandidatePortfolioProps) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(MOCK_PORTFOLIO_ITEMS);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = (newItem: NewPortfolioItem) => {
    const portfolioItem: PortfolioItem = {
      ...newItem,
      id: Date.now().toString()
    };
    setPortfolioItems([...portfolioItems, portfolioItem]);
    setIsAddingItem(false);
  };

  const handleDeleteItem = (id: string) => {
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <img src={hirevifyLogo} alt="HireVify" className="h-16" />
                <div>
                  <h1 className="text-xl text-foreground">Portfolio Manager</h1>
                  <p className="text-sm text-muted-foreground">Showcase your work and projects</p>
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Portfolio Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl text-foreground mb-2">Your Portfolio</h1>
            <p className="text-muted-foreground">
              Showcase your best work to stand out to recruiters
            </p>
          </div>
          {!isAddingItem && (
            <Button 
              onClick={() => setIsAddingItem(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Project
            </Button>
          )}
        </div>

        {/* Add Portfolio Form */}
        {isAddingItem && (
          <div className="mb-8">
            <AddPortfolioForm 
              onAdd={handleAddItem}
              onCancel={() => setIsAddingItem(false)}
            />
          </div>
        )}

        {/* Portfolio Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {portfolioItems.map((item) => (
            <PortfolioItemCard
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>

        {/* Empty State */}
        {portfolioItems.length === 0 && !isAddingItem && (
          <Card className="border border-dashed border-border p-12">
            <div className="text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">Add your first project to start building your portfolio</p>
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

        {/* Upgrade Prompt */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-2xl text-yellow-800 mb-4">Unlock Portfolio Features</h3>
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