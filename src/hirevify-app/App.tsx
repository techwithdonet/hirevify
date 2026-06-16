import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from './components/ui/sonner';
import { AppRouter } from './components/AppRouter';
import { LoadingState } from './components/layout/AppLayout';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { Application, Project, Screen } from './types/app';

const SCREEN_STORAGE_KEY = 'hirevify_current_screen';
const HISTORY_SCREEN_KEY = 'hirevifyScreen';

export type ScreenNavigationOptions = {
  replace?: boolean;
  skipScroll?: boolean;
};

const ALL_SCREENS: Screen[] = [
  'homepage',
  'recruiter-dashboard',
  'recruiter-post-project',
  'recruiter-projects',
  'recruiter-ats',
  'recruiter-ats-scanner',
  'recruiter-functional-ats',
  'recruiter-accuracy-first-ats',
  'recruiter-professional-ats',
  'recruiter-automated-screening',
  'recruiter-analytics',
  'recruiter-advanced-analytics',
  'recruiter-ai-matching-dashboard',
  'recruiter-market-intelligence',
  'recruiter-skills-assessment',
  'recruiter-custom-assessment-builder',
  'recruiter-integrations',
  'recruiter-search-candidates',
  'recruiter-interviews',
  'recruiter-enhanced-video-interview',
  'recruiter-settings',
  'recruiter-skills-first-hiring',
  'recruiter-employer-education',
  'candidate-dashboard',
  'candidate-ai-resume-builder',
  'candidate-resume-builder',
  'candidate-ai-interview-coach',
  'candidate-skills-development-ai',
  'candidate-market-intelligence',
  'candidate-portfolio',
  'candidate-knowledge-assessment',
  'candidate-video-interview',
  'candidate-enhanced-video-interview',
  'candidate-search-projects',
  'candidate-interviews',
  'candidate-settings',
  'candidate-experience-builder',
  'candidate-micro-internships',
  'candidate-mentorship-program',
  'candidate-career-switcher-track',
  'candidate-project-challenge-video',
  'candidate-ats-scanner',
  'candidate-functional-ats',
  'candidate-accuracy-first-ats',
  'candidate-professional-ats',
  'ai-smart-notifications',
  'ats-diagnostic',
  'pricing',
  'subscription-manager',
  'beta-program',
  'live-interview',
  'one-way-interview',
  'messages',
  'notifications',
];

const PUBLIC_SCREENS = new Set<Screen>(['homepage', 'pricing']);

function isScreen(value: unknown): value is Screen {
  return typeof value === 'string' && ALL_SCREENS.includes(value as Screen);
}

function getUrlForScreen(screen: Screen) {
  const url = new URL(window.location.href);

  if (screen === 'homepage') {
    url.searchParams.delete('screen');
  } else {
    url.searchParams.set('screen', screen);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function readScreenFromLocation() {
  if (typeof window === 'undefined') {
    return null;
  }

  const screen = new URL(window.location.href).searchParams.get('screen');
  return isScreen(screen) ? screen : null;
}

function readInitialScreen(): Screen {
  if (typeof window === 'undefined') {
    return 'homepage';
  }

  const urlScreen = readScreenFromLocation();
  if (urlScreen) {
    return urlScreen;
  }

  const stateScreen = window.history.state?.[HISTORY_SCREEN_KEY];
  if (isScreen(stateScreen)) {
    return stateScreen;
  }

  const storedScreen = window.localStorage.getItem(SCREEN_STORAGE_KEY);
  return isScreen(storedScreen) ? storedScreen : 'homepage';
}

function isScreenForOtherRole(screen: Screen, userType: 'recruiter' | 'candidate') {
  if (userType === 'recruiter') {
    return screen.startsWith('candidate-');
  }

  return screen.startsWith('recruiter-');
}

function HireVifyApp() {
  const { user, signOut, isLoading, authInitialized } = useAuth();
  const [currentScreen, setCurrentScreenState] = useState<Screen>(() => readInitialScreen());
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

  const navigateScreen = useCallback((screen: Screen, options: ScreenNavigationOptions = {}) => {
    setCurrentScreenState(screen);

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SCREEN_STORAGE_KEY, screen);

    const state = {
      ...(window.history.state || {}),
      [HISTORY_SCREEN_KEY]: screen,
    };
    const url = getUrlForScreen(screen);
    const currentHistoryScreen = window.history.state?.[HISTORY_SCREEN_KEY];
    const shouldReplace = Boolean(options.replace || currentHistoryScreen === screen);

    if (shouldReplace) {
      window.history.replaceState(state, '', url);
    } else {
      window.history.pushState(state, '', url);
    }

    if (!options.skipScroll) {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    navigateScreen(currentScreen, { replace: true, skipScroll: true });

    const handlePopState = (event: PopStateEvent) => {
      const stateScreen = event.state?.[HISTORY_SCREEN_KEY];
      const nextScreen = isScreen(stateScreen) ? stateScreen : readScreenFromLocation();

      if (!nextScreen) {
        setCurrentScreenState('homepage');
        window.localStorage.setItem(SCREEN_STORAGE_KEY, 'homepage');
        return;
      }

      setCurrentScreenState(nextScreen);
      window.localStorage.setItem(SCREEN_STORAGE_KEY, nextScreen);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!authInitialized) {
      return;
    }

    if (user) {
      hadAuthenticatedUser.current = true;
      const dashboardScreen: Screen = user.userType === 'recruiter' ? 'recruiter-dashboard' : 'candidate-dashboard';

      if (currentScreen === 'homepage' || isScreenForOtherRole(currentScreen, user.userType)) {
        setSelectedProject(null);
        setSelectedApplication(null);
        navigateScreen(dashboardScreen, { replace: true });
      }

      return;
    }

    if (!PUBLIC_SCREENS.has(currentScreen)) {
      navigateScreen('homepage', { replace: true });
      setSelectedProject(null);
      setSelectedApplication(null);
      setProjectChallengeData(null);
      setAssessmentBuilderData(null);
    }
  }, [user, currentScreen, authInitialized, navigateScreen]);

  const navigation = useAppNavigation({
    user,
    setCurrentScreen: navigateScreen,
    setSelectedProject,
    setSelectedApplication,
    setProjectChallengeData,
    setAssessmentBuilderData,
    signOut,
  });

  const handleUserTypeSelection = useMemo(() => {
    return (userType: 'recruiter' | 'candidate') => {
      console.log(`Force opening ${userType} dashboard from homepage test button`);

      setSelectedProject(null);
      setSelectedApplication(null);
      navigateScreen(userType === 'recruiter' ? 'recruiter-dashboard' : 'candidate-dashboard', { replace: true });
    };
  }, [navigateScreen]);

  if (!authInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ecfdf5_100%)]">
        <LoadingState label="Loading HireVify..." className="min-h-screen" />
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
        setCurrentScreen={navigateScreen}
        setUnreadMessages={setUnreadMessages}
        setUnreadNotifications={setUnreadNotifications}
      />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HireVifyApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
