import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  Plus, Send, Lightbulb, Star, Clock, CheckCircle, 
  ExternalLink, Heart, TrendingUp
} from 'lucide-react';

interface AddIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: IntegrationRequest) => void;
}

interface IntegrationRequest {
  name: string;
  category: string;
  description: string;
  businessCase: string;
  urgency: 'low' | 'medium' | 'high';
  userEmail?: string;
  companyName?: string;
}

const POPULAR_INTEGRATION_SUGGESTIONS = [
  { name: 'BambooHR', category: 'ats', description: 'HRIS and talent management platform', votes: 124 },
  { name: 'Indeed', category: 'productivity', description: 'Job posting and candidate sourcing', votes: 98 },
  { name: 'Link Talent Hub', category: 'ats', description: 'Link recruiting platform integration', votes: 156 },
  { name: 'Zapier', category: 'productivity', description: 'Connect HireVify with 5000+ apps', votes: 203 },
  { name: 'Docusign', category: 'productivity', description: 'Digital document signing for offer letters', votes: 87 },
  { name: 'Asana', category: 'productivity', description: 'Project management for hiring workflows', votes: 76 }
];

export function AddIntegrationDialog({ open, onOpenChange, onSubmit }: AddIntegrationDialogProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'suggestions'>('request');
  const [formData, setFormData] = useState<IntegrationRequest>({
    name: '',
    category: '',
    description: '',
    businessCase: '',
    urgency: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success('Integration request submitted successfully!', {
        description: 'Our team will review your request and get back to you soon.'
      });
      onOpenChange(false);
      setFormData({
        name: '',
        category: '',
        description: '',
        businessCase: '',
        urgency: 'medium'
      });
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionVote = (suggestion: any) => {
    toast.success(`Voted for ${suggestion.name}!`, {
      description: 'Your vote helps us prioritize which integrations to build next.'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Request New Integration
          </DialogTitle>
          <DialogDescription>
            Can't find the integration you need? Request it and we'll consider building it for the HireVify community.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'request' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Submit Request
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'suggestions' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Popular Requests
          </button>
        </div>

        {activeTab === 'request' && (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Integration Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Integration Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Jira, Notion, Salesforce"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select integration category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ats">ATS Systems</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="scheduling">Scheduling</SelectItem>
                  <SelectItem value="background-check">Background Check</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="assessment">Assessment Tools</SelectItem>
                  <SelectItem value="hr-platform">HR Platforms</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Briefly describe what this integration does and how it would help your hiring process..."
                rows={3}
                required
              />
            </div>

            {/* Business Case */}
            <div className="space-y-2">
              <Label htmlFor="businessCase">Business Case</Label>
              <Textarea
                id="businessCase"
                value={formData.businessCase}
                onChange={(e) => setFormData(prev => ({ ...prev, businessCase: e.target.value }))}
                placeholder="Optional: Explain the business value, ROI, or specific problems this integration would solve..."
                rows={3}
              />
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label htmlFor="urgency">Priority Level</Label>
              <Select value={formData.urgency} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, urgency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      Low - Nice to have
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Medium - Would improve workflow
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-red-500" />
                      High - Critical for our process
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Integration Development Process</p>
                    <p>We review all requests and prioritize based on user demand, technical feasibility, and business impact. Popular requests get built first!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4 mt-6">
            <div className="text-center py-4">
              <h3 className="font-semibold mb-2">Most Requested Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Vote for integrations you'd like to see built next. We prioritize based on community demand!
              </p>
            </div>

            <div className="space-y-3">
              {POPULAR_INTEGRATION_SUGGESTIONS.map((suggestion, index) => (
                <Card key={suggestion.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-lg">#{index + 1}</span>
                          <div>
                            <h4 className="font-semibold">{suggestion.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {suggestion.votes} votes
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSuggestionVote(suggestion)}
                          className="whitespace-nowrap"
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Vote
                        </Button>
                        {suggestion.name === 'Zapier' && (
                          <Button size="sm" variant="ghost" className="text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Learn More
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Don't see your integration?</p>
                    <p>Switch to the "Submit Request" tab to suggest a new integration that's not on this list.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}





