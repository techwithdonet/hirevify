"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from './components/ui/sonner';
import { AppRouter } from './components/AppRouter';
import { ProUpgradeCleanup } from './components/ProUpgradeCleanup';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { Application, Project, Screen, Job, JobProjectAssignment, Candidate } from './types/app';

const SCREEN_STORAGE_KEY = 'hirevify_current_screen';
const NAVIGATION_CONTEXT_STORAGE_KEY = 'hirevify_navigation_context_v1';
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
 'product-features',
 'product-api',
 'product-integrations',
 'company-about',
 'company-blog',
 'company-careers',
 'company-contact',
 'support-help-center',
 'support-privacy-policy',
 'support-terms-of-service',
 'support-status',
 'pricing',
 'subscription-manager',
 'beta-program',
 'live-interview',
 'one-way-interview',
 'messages',
 'notifications',
];

const PUBLIC_SCREENS = new Set<Screen>([
 'homepage',
 'pricing',
 'product-features',
 'product-api',
 'product-integrations',
 'company-about',
 'company-blog',
 'company-careers',
 'company-contact',
 'support-help-center',
 'support-privacy-policy',
 'support-terms-of-service',
 'support-status',
]);

type NavigationContext = {
 screen: Screen;
 selectedProject: Project | null;
 selectedApplication: Application | null;
 selectedJob: Job | null;
 selectedAssignment: JobProjectAssignment | null;
 selectedConversationId: string | null;
 projectChallengeData: {
   projectId: string;
   projectTitle: string;
   challengeDescription?: string;
 } | null;
 assessmentBuilderData: unknown;
};

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
    if (urlScreen === 'recruiter-candidate-detail' && !window.sessionStorage.getItem('selectedCandidate')) {
      return { screen: 'homepage', candidateId: null };
    }
    return { screen: urlScreen, candidateId };
  }

  return { screen: 'homepage', candidateId: null };
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
  // sessionStorage immediately after hydration and before the next paint.
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hirevify_saved_candidates');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [projectChallengeData, setProjectChallengeData] = useState<{
    projectId: string;
    projectTitle: string;
    challengeDescription?: string;
  } | null>(null);
  const [assessmentBuilderData, setAssessmentBuilderData] = useState<unknown>(null);
  const [navigationStateRestored, setNavigationStateRestored] = useState(false);
  const [loginPromptSignal, setLoginPromptSignal] = useState(0);
  const hasSyncedUrlScreen = useRef(false);

  // Detail routes carry UI context that is intentionally not part of the API
  // contract. Keep it in this browser tab so a refresh restores the same page
  // instead of briefly rendering an unrelated fallback screen.
  useClientLayoutEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(NAVIGATION_CONTEXT_STORAGE_KEY);
      if (stored) {
        const context = JSON.parse(stored) as Partial<NavigationContext>;
        if (context.screen === initialScreen) {
          setSelectedProject(context.selectedProject ?? null);
          setSelectedApplication(context.selectedApplication ?? null);
          setSelectedJob(context.selectedJob ?? null);
          setSelectedAssignment(context.selectedAssignment ?? null);
          setSelectedConversationId(context.selectedConversationId ?? null);
          setProjectChallengeData(context.projectChallengeData ?? null);
          setAssessmentBuilderData(context.assessmentBuilderData ?? null);
        }
      }
    } catch (error) {
      console.warn('Failed to restore navigation context:', error);
      window.sessionStorage.removeItem(NAVIGATION_CONTEXT_STORAGE_KEY);
    } finally {
      setNavigationStateRestored(true);
    }
  }, [initialScreen]);

  useEffect(() => {
    if (!navigationStateRestored) return;

    const context: NavigationContext = {
      screen: currentScreen,
      selectedProject,
      selectedApplication,
      selectedJob,
      selectedAssignment,
      selectedConversationId,
      projectChallengeData,
      assessmentBuilderData,
    };
    const hasContext = Object.entries(context).some(
      ([key, value]) => key !== 'screen' && value != null,
    );

    try {
      if (hasContext) {
        window.sessionStorage.setItem(NAVIGATION_CONTEXT_STORAGE_KEY, JSON.stringify(context));
      } else {
        window.sessionStorage.removeItem(NAVIGATION_CONTEXT_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to persist navigation context:', error);
    }
  }, [
    navigationStateRestored,
    currentScreen,
    selectedProject,
    selectedApplication,
    selectedJob,
    selectedAssignment,
    selectedConversationId,
    projectChallengeData,
    assessmentBuilderData,
  ]);

  const clearNavigationContext = useCallback(() => {
    setSelectedProject(null);
    setSelectedApplication(null);
    setSelectedJob(null);
    setSelectedAssignment(null);
    setSelectedCandidate(null);
    setSelectedConversationId(null);
    setProjectChallengeData(null);
    setAssessmentBuilderData(null);
    window.sessionStorage.removeItem(NAVIGATION_CONTEXT_STORAGE_KEY);
    window.sessionStorage.removeItem('selectedCandidate');
    window.sessionStorage.removeItem('hirevify_candidate_detail_back_screen');
  }, []);

  // Save savedCandidates to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hirevify_saved_candidates', JSON.stringify(savedCandidates));
    }
  }, [savedCandidates]);

  // Populate selectedCandidate from sessionStorage AFTER mount. We can't do
  // this in the useState initializer without creating a server/client
  // mismatch (server has no sessionStorage, so it would render `null` while
  // the client first render would have the real candidate Ã¢â‚¬â€ causing different
  // subtrees to be rendered and a hydration error).
  useClientLayoutEffect(() => {
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

 const openHomepageLogin = useCallback(() => {
 setLoginPromptSignal((signal) => signal + 1);
 navigateScreen('homepage');
 }, [navigateScreen]);

  useClientLayoutEffect(() => {
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

    if (nextScreen === 'recruiter-candidate-detail' && !sessionStorage.getItem('selectedCandidate')) {
      hasSyncedUrlScreen.current = true;
      setCurrentScreenState('homepage');
      window.localStorage.setItem(SCREEN_STORAGE_KEY, 'homepage');
      setSelectedCandidate(null);
      router.replace(getUrlForScreen(pathname, searchParams.toString(), 'homepage', null), { scroll: false });
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
  }, [pathname, router, searchParams]);

  useEffect(() => {
  if (!authInitialized) {
  return;
  }

  if (user) {
  const dashboardScreen: Screen = user.userType === 'recruiter'? 'recruiter-dashboard': 'candidate-dashboard';

  if (currentScreen === 'homepage' || isScreenForOtherRole(currentScreen, user.userType)) {
  clearNavigationContext();
  navigateScreen(dashboardScreen, { replace: true });
  return;
  }

  return;
  }

  clearNavigationContext();

  if (!PUBLIC_SCREENS.has(currentScreen)) {
  navigateScreen('homepage', { replace: true });
  }
  }, [user, currentScreen, authInitialized, navigateScreen, clearNavigationContext]);

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
  const dashboardScreen = userType === 'recruiter' ? 'recruiter-dashboard' : 'candidate-dashboard';
  
  navigateScreen(dashboardScreen, { replace: true });
  };
  }, [navigateScreen]);

 const effectiveScreen = useMemo<Screen>(() => {
   // Until Supabase has verified the session, keep the exact URL page. Role
   // correction belongs to the verified-auth phase and must never cause a
   // refresh-time dashboard swap.
   if (!authInitialized) {
   return currentScreen;
   }

   if (user) {
   const dashboardScreen: Screen = user.userType === 'recruiter'? 'recruiter-dashboard': 'candidate-dashboard';
   return currentScreen === 'homepage' || isScreenForOtherRole(currentScreen, user.userType)
   ? dashboardScreen
   : currentScreen;
   }

   return PUBLIC_SCREENS.has(currentScreen)? currentScreen: 'homepage';
   }, [currentScreen, user, authInitialized]);

  // Scroll to top on mount (browser refresh)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use requestAnimationFrame for immediate but clean scroll
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    }
  }, []);

   const useWorkspaceTheme =
     effectiveScreen !== 'homepage' &&
     effectiveScreen !== 'candidate-profile-editor' &&
     effectiveScreen !== 'recruiter-candidate-detail';

   useEffect(() => {
     if (!useWorkspaceTheme) {
       delete document.body.dataset.hirevifyWorkspace;
       delete document.body.dataset.hirevifyWorkspaceScreen;
       return;
     }

     document.body.dataset.hirevifyWorkspace = 'true';
     document.body.dataset.hirevifyWorkspaceScreen = effectiveScreen;

     return () => {
       delete document.body.dataset.hirevifyWorkspace;
       delete document.body.dataset.hirevifyWorkspaceScreen;
     };
   }, [effectiveScreen, useWorkspaceTheme]);

   return (
   <div
    id="main-content"
    tabIndex={-1}
    data-workspace-screen={useWorkspaceTheme ? effectiveScreen : undefined}
    data-workspace-production={useWorkspaceTheme ? 'true' : undefined}
    className={`min-h-screen ${useWorkspaceTheme ? 'hirevify-workspace-theme' : ''}`}
   >
      <ProUpgradeCleanup />

        <AppRouter

             currentScreen={effectiveScreen}

             user={user}

             navigationStateRestored={navigationStateRestored}

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

             loginPromptSignal={loginPromptSignal}

             onOpenHomepageLogin={openHomepageLogin}

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
  // when the prop is missing Ã¢â‚¬â€ this is harmless because the server already
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
