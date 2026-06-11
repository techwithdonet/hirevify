import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from "./components/ui/sonner";
import { AppRouter } from './components/AppRouter';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { Screen, Project, Application } from './types/app';

// Simplified App State Management Component
function HireVifyApp() {
  const { user, signOut, isLoading, authInitialized } = useAuth();
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
  const [assessmentBuilderData, setAssessmentBuilderData] = useState<unknown>(null);
  const hadAuthenticatedUser = useRef(false);

  // Route user after login/signup and reset when logged out
  useEffect(() => {
    // Wait for auth initialization before routing
    if (!authInitialized) {
      return;
    }

    if (user) {
      hadAuthenticatedUser.current = true;

      if (currentScreen === 'homepage') {
        if (user.userType === 'recruiter') {
          setSelectedProject(null);
          setSelectedApplication(null);
          setCurrentScreen('recruiter-dashboard');
        } else {
          setCurrentScreen('candidate-dashboard');
        }
      }

      return;
    }

    if (!hadAuthenticatedUser.current) {
      return;
    }

    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      setCurrentScreen('homepage');
      setSelectedProject(null);
      setSelectedApplication(null);
      setProjectChallengeData(null);
      setAssessmentBuilderData(null);
    });

    return () => {
      active = false;
    };
  }, [user, currentScreen, authInitialized]);
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
    console.log(`Force opening ${userType} dashboard from homepage test button`);

    setSelectedProject(null);
    setSelectedApplication(null);

    if (userType === 'recruiter') {
      setCurrentScreen('recruiter-dashboard');
    } else {
      setCurrentScreen('candidate-dashboard');
    }
  };
}, [setCurrentScreen, setSelectedProject, setSelectedApplication]);

  // Route user after login/signup and reset when logged out
useEffect(() => {
  if (user) {
    hadAuthenticatedUser.current = true;

    // Open correct dashboard after login/signup
    if (currentScreen === 'homepage') {
      if (user.userType === 'recruiter') {
        setSelectedProject(null);
        setSelectedApplication(null);
        setCurrentScreen('recruiter-dashboard');
      } else {
        setCurrentScreen('candidate-dashboard');
      }
    }

    return;
  }

  if (!hadAuthenticatedUser.current) {
    return;
  }

  let active = true;

  queueMicrotask(() => {
    if (!active) {
      return;
    }

    setCurrentScreen('homepage');
    setSelectedProject(null);
    setSelectedApplication(null);
    setProjectChallengeData(null);
    setAssessmentBuilderData(null);
  });

  return () => {
    active = false;
  };
}, [
  user,
  currentScreen,
  setCurrentScreen,
  setSelectedProject,
  setSelectedApplication,
  setProjectChallengeData,
  setAssessmentBuilderData,
]);

  // Show full-page loading screen while auth is initializing
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading HireVify...</p>
        </div>
      </div>
    );
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



