import React, { useState, useEffect, useMemo } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from "./components/ui/sonner";
import { AppRouter } from './components/AppRouter';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { Screen, Project, Application } from './types/app';

// Simplified App State Management Component
function HireVifyApp() {
  const { user, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('homepage');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [projectChallengeData, setProjectChallengeData] = useState<{
    projectId: string;
    projectTitle: string;
    challengeDescription?: string;
  } | null>(null);
  const [assessmentBuilderData, setAssessmentBuilderData] = useState<any>(null);

  // Check for diagnostic mode on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('diagnostic') === 'ats') {
      setCurrentScreen('ats-diagnostic');
    }
    
    // Check for direct screen access
    const screenParam = urlParams.get('screen');
    if (screenParam) {
      switch (screenParam) {
        case 'functional-ats':
          setCurrentScreen('recruiter-functional-ats');
          break;
        case 'accuracy-first-ats':
          setCurrentScreen('recruiter-accuracy-first-ats');
          break;
        case 'professional-ats':
          setCurrentScreen('recruiter-professional-ats');
          break;
        default:
          break;
      }
    }
  }, []);

  // Navigation hook with all methods - memoized to prevent re-creation on every render
  const navigation = useAppNavigation({
    user,
    setCurrentScreen,
    setSelectedProject,
    setSelectedApplication,
    setProjectChallengeData,
    setAssessmentBuilderData,
    signOut
  });

  // Handle user type selection from homepage - memoized to prevent re-creation
  const handleUserTypeSelection = useMemo(() => {
    return (userType: 'recruiter' | 'candidate') => {
      if (!user) {
        console.log(`User type selected: ${userType}, but no user authenticated`);
        return;
      }

      console.log(`Navigating to ${userType} dashboard`);
      if (userType === 'recruiter') {
        navigation.navigateToRecruiterDashboard();
      } else {
        navigation.navigateToCandidateDashboard();
      }
    };
  }, [user, navigation]);

  // Reset screen when user logs out - simplified to prevent infinite loops
  useEffect(() => {
    if (!user) {
      setCurrentScreen('homepage');
      setSelectedProject(null);
      setSelectedApplication(null);
      setProjectChallengeData(null);
      setAssessmentBuilderData(null);
    }
  }, [user]);

  // Prevent render during initial loading state
  if (typeof window !== 'undefined' && !window.document) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <AppRouter
        currentScreen={currentScreen}
        user={user}
        selectedProject={selectedProject}
        selectedApplication={selectedApplication}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
        projectChallengeData={projectChallengeData}
        assessmentBuilderData={assessmentBuilderData}
        navigation={navigation}
        handleLogout={navigation.handleLogout}
        handleUserTypeSelection={handleUserTypeSelection}
        setCurrentScreen={setCurrentScreen}
        setUnreadMessages={setUnreadMessages}
        setUnreadNotifications={setUnreadNotifications}
      />
      <Toaster />
    </div>
  );
}

// Main App with Error Boundary and Auth Provider
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HireVifyApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}




