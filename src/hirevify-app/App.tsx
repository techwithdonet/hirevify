import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [assessmentBuilderData, setAssessmentBuilderData] = useState<unknown>(null);
  const hadAuthenticatedUser = useRef(false);

  // Check for diagnostic mode on load
// Route user after login/signup and reset when logged out
useEffect(() => {
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
}, [user, currentScreen]);
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
]);  return (
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



