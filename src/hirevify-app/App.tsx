"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from './components/ui/sonner';
import { AppRouter } from './components/AppRouter';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { Application, Project, Screen, Job, JobProjectAssignment, Candidate } from './types/app';

const SCREEN_STORAGE_KEY = 'hirevify_current_screen';

export type ScreenNavigationOptions = {
 replace?: boolean;
 skipScroll?: boolean;
 candidateId?: string | null;
};

const ALL_SCREENS: Screen[] = [
 'homepage',
 'recruiter-dashboard',
 'recruiter-post-project',
 'recruiter-post-job',
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
 'recruiter-candidate-detail',
 'recruiter-interviews',
 'recruiter-enhanced-video-interview',
 'recruiter-settings',
 'recruiter-profile-editor',
 'recruiter-skills-first-hiring',
  'recruiter-employer-education',
  'recruiter-application-detail',
  'recruiter-ongoing-projects',
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
 'candidate-job-detail',
 'candidate-job-apply',
 'candidate-applied-jobs',
 'candidate-saved-jobs',
 'candidate-my-jobs',
  'candidate-interviews',
 'candidate-settings',
 'candidate-profile-editor',
 'candidate-experience-builder',
 'candidate-micro-internships',
 'candidate-mentorship-program',
 'candidate-career-switcher-track',
 'candidate-project-challenge-video',
 'candidate-project-assignment',
 'candidate-project-submission',
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

function getUrlForScreen(
  pathname: string,
  currentSearch: string,
  screen: Screen,
  candidateId?: string | null,
) {
  const params = new URLSearchParams(currentSearch);

  if (screen === 'homepage') {
    params.delete('screen');
  } else {
    params.set('screen', screen);
  }

  if (candidateId) {
    params.set('candidateId', candidateId);
  } else {
    params.delete('candidateId');
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function readScreenFromSearchParams(searchParams: URLSearchParams): { screen: Screen | null; candidateId: string | null } {
  const screen = searchParams.get('screen');
  const candidateId = searchParams.get('candidateId');
  return { screen: isScreen(screen) ? screen : null, candidateId: candidateId || null };
}

function readInitialScreen(): { screen: Screen; candidateId: string | null } {
  if (typeof window === 'undefined') {
    return { screen: 'homepage', candidateId: null };
  }

  const { screen: urlScreen, candidateId } = readScreenFromSearchParams(new URLSearchParams(window.location.search));
  if (urlScreen) {
    return { screen: urlScreen, candidateId };
  }

  const storedScreen = window.localStorage.getItem(SCREEN_STORAGE_KEY);
  return { screen: isScreen(storedScreen) ? storedScreen : 'homepage', candidateId };
}

function isScreenForOtherRole(screen: Screen, userType: 'recruiter' | 'candidate') {
 if (userType === 'recruiter') {
 return screen.startsWith('candidate-');
 }

 return screen.startsWith('recruiter-');
}

function HireVifyApp({ initialScreen, initialCandidateId }: { initialScreen: Screen; initialCandidateId?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut, authInitialized } = useAuth();
  const [currentScreen, setCurrentScreenState] = useState<Screen>(() => {
    return initialScreen;
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<JobProjectAssignment | null>(null);
  // selectedCandidate must start as `null` on BOTH server and client so the
  // initial render is identical (and hydrates cleanly). We populate it from
  // sessionStorage in a useEffect after mount.
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hirevify_saved_candidates');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
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
  const hasSyncedUrlScreen = useRef(false);

  // Save savedCandidates to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hirevify_saved_candidates', JSON.stringify(savedCandidates));
    }
  }, [savedCandidates]);

  // Populate selectedCandidate from sessionStorage AFTER mount. We can't do
  // this in the useState initializer without creating a server/client
  // mismatch (server has no sessionStorage, so it would render `null` while
  // the client first render would have the real candidate — causing different
  // subtrees to be rendered and a hydration error).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initialCandidateId) {
      setSelectedCandidate(null);
      return;
    }
    try {
      const stored = sessionStorage.getItem('selectedCandidate');
      if (stored) {
        setSelectedCandidate(JSON.parse(stored));
      } else {
        setSelectedCandidate(null);
      }
    } catch (e) {
      console.warn('Failed to parse stored candidate:', e);
      setSelectedCandidate(null);
    }
  }, [initialCandidateId]);

  const toggleSavedCandidate = useCallback((candidateId: string) => {
    setSavedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  }, []);

 const navigateScreen = useCallback((screen: Screen, options: ScreenNavigationOptions = {}) => {
 setCurrentScreenState(screen);

 if (typeof window === 'undefined') {
 return;
 }

 window.localStorage.setItem(SCREEN_STORAGE_KEY, screen);

 const currentScreenParam = searchParams.get('screen');
 const url = getUrlForScreen(pathname, searchParams.toString(), screen, options.candidateId);
 const shouldReplace = Boolean(options.replace || currentScreenParam === screen);

 if (shouldReplace) {
 router.replace(url, { scroll: false });
 } else {
 router.push(url, { scroll: false });
 }

 if (!options.skipScroll) {
 window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
 }
 }, [pathname, router, searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const { screen: nextScreen, candidateId: nextCandidateId } = readScreenFromSearchParams(
      new URLSearchParams(searchParams.toString()),
    );

    if (!nextScreen) {
      if (!hasSyncedUrlScreen.current) {
        hasSyncedUrlScreen.current = true;
        return;
      }

      setCurrentScreenState('homepage');
      window.localStorage.setItem(SCREEN_STORAGE_KEY, 'homepage');
      setSelectedCandidate(null);
      return;
    }

    hasSyncedUrlScreen.current = true;
    setCurrentScreenState(nextScreen);
    if (nextCandidateId) {
      const stored = sessionStorage.getItem('selectedCandidate');
      if (stored) {
        try {
          setSelectedCandidate(JSON.parse(stored));
        } catch (e) {
          console.warn('Failed to parse stored candidate:', e);
        }
      }
    } else {
      setSelectedCandidate(null);
    }
    window.localStorage.setItem(SCREEN_STORAGE_KEY, nextScreen);
  }, [searchParams]);

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
    setSelectedCandidate,
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

   const useWorkspaceTheme = effectiveScreen !== 'homepage';

   return (
   <div className={`min-h-screen ${useWorkspaceTheme ? 'hirevify-workspace-theme' : ''}`}>
    <AppRouter
     currentScreen={effectiveScreen}
     user={user}
     selectedProject={selectedProject}
     selectedApplication={selectedApplication}
     selectedJob={selectedJob}
     selectedAssignment={selectedAssignment}
     selectedCandidate={selectedCandidate}
     savedCandidates={savedCandidates}
     onToggleSavedCandidate={toggleSavedCandidate}
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

export default function App({
  initialScreen,
  initialCandidateId,
}: {
  initialScreen?: unknown;
  initialCandidateId?: unknown;
}) {
  // Prefer the server-provided values so the SSR HTML matches the client tree.
  // Fall back to client-only readInitialScreen() (URL / history / localStorage)
  // when the prop is missing — this is harmless because the server already
  // returned the default in that case, and the client will agree.
  const { screen: clientScreen, candidateId: clientCandidateId } = readInitialScreen();

  const safeInitialScreen: Screen = isScreen(initialScreen)
    ? initialScreen
    : (clientScreen ?? 'homepage');

  const candidateId: string | null =
    typeof initialCandidateId === 'string' && initialCandidateId.length > 0
      ? initialCandidateId
      : (clientCandidateId ?? null);

  return (
  <ErrorBoundary>
  <AuthProvider>
  <HireVifyApp initialScreen={safeInitialScreen} initialCandidateId={candidateId} />
  </AuthProvider>
  </ErrorBoundary>
  );
}
