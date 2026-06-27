"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from './components/ui/sonner';
import { AppRouter } from './components/AppRouter';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { Application, Project, Screen, Job, JobProjectAssignment } from './types/app';

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
 'recruiter-job-applicants',
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
  'recruiter-application-detail',
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
'candidate-jobs',
 'candidate-job-apply',
 'candidate-applied-jobs',
 'candidate-saved-jobs',
 'candidate-my-jobs',
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
 return isScreen(screen)? screen: null;
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
 return isScreen(storedScreen)? storedScreen: 'homepage';
}

function isScreenForOtherRole(screen: Screen, userType: 'recruiter' | 'candidate') {
 if (userType === 'recruiter') {
 return screen.startsWith('candidate-');
 }

 return screen.startsWith('recruiter-');
}

function HireVifyApp({ initialScreen }: { initialScreen: Screen }) {
 const { user, signOut, authInitialized } = useAuth();
  const [currentScreen, setCurrentScreenState] = useState<Screen>(() => {
    return initialScreen;
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<JobProjectAssignment | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
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

 const state = {...(window.history.state || {}),
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

 const initialScreen = readInitialScreen();
 setCurrentScreenState(initialScreen);
 window.localStorage.setItem(SCREEN_STORAGE_KEY, initialScreen);
 window.history.replaceState({
 ...(window.history.state || {}),
 [HISTORY_SCREEN_KEY]: initialScreen,
 }, '', getUrlForScreen(initialScreen));
 const handlePopState = (event: PopStateEvent) => {
 const stateScreen = event.state?.[HISTORY_SCREEN_KEY];
 const nextScreen = isScreen(stateScreen)? stateScreen: readScreenFromLocation();

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
 const dashboardScreen: Screen = user.userType === 'recruiter'? 'recruiter-dashboard': 'candidate-dashboard';

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
    setSelectedJob,
    setSelectedAssignment,
    setSelectedConversationId,
    setProjectChallengeData,
    setAssessmentBuilderData,
    signOut,
  });

 const handleUserTypeSelection = useMemo(() => {
 return (userType: 'recruiter' | 'candidate') => {
 console.log(`Force opening ${userType} dashboard from homepage test button`);

 setSelectedProject(null);
 setSelectedApplication(null);
 navigateScreen(userType === 'recruiter'? 'recruiter-dashboard': 'candidate-dashboard', { replace: true });
 };
 }, [navigateScreen]);

const effectiveScreen = useMemo<Screen>(() => {
  if (user) {
  const dashboardScreen: Screen = user.userType === 'recruiter'? 'recruiter-dashboard': 'candidate-dashboard';
  return currentScreen === 'homepage' || isScreenForOtherRole(currentScreen, user.userType)
  ? dashboardScreen
  : currentScreen;
  }

  // While auth is still initializing, preserve whatever screen was resolved
  // from the URL / history / localStorage. Falling back to `homepage` here
  // causes a flash of the marketing page on every hard refresh from the
  // candidate or recruiter portal (e.g. user refreshes the dashboard, the
  // session is briefly null while Supabase hydrates, and the homepage hero
  // shows for a frame before the portal re-renders).
  if (!authInitialized) {
  return currentScreen;
  }

  return PUBLIC_SCREENS.has(currentScreen)? currentScreen: 'homepage';
  }, [currentScreen, user, authInitialized]);

 return (
 <div className="min-h-screen">
  <AppRouter
   currentScreen={effectiveScreen}
   user={user}
   selectedProject={selectedProject}
   selectedApplication={selectedApplication}
   selectedJob={selectedJob}
   selectedAssignment={selectedAssignment}
   unreadNotifications={unreadNotifications}
   unreadMessages={unreadMessages}
   selectedConversationId={selectedConversationId}
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

export default function App({ initialScreen }: { initialScreen?: unknown }) {
 const safeInitialScreen = isScreen(initialScreen) ? initialScreen : 'homepage';

 return (
 <ErrorBoundary>
 <AuthProvider>
 <HireVifyApp initialScreen={safeInitialScreen} />
 </AuthProvider>
 </ErrorBoundary>
 );
}
