import { ArrowLeft, Plus, FileText, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Project } from '../utils/api/projects';

interface ProjectManagementProps {
  onBack: () => void;
  onEditProject: (project?: Project) => void;
  onViewApplications: () => void;
}

export function ProjectManagement({ onBack, onEditProject, onViewApplications }: ProjectManagementProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Project Management</h1>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Your Projects
              </CardTitle>
              <CardDescription>
                Manage all your hiring projects in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first project to start hiring top talent
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => onEditProject()}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Project
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={onViewApplications}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    View Applications
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}