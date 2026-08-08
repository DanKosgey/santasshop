import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { AdminPortal, AdminPortalProvider } from './components/admin';
import AITradeAssistant from './components/AITradeAssistant';
import { supabase } from './supabase/client';
import { User, StudentProfile, TradeRule, TradeEntry, CourseModule, MentorshipApplication } from './types';
import LandingPage from './components/LandingPage';
import EliteApplicationForm from './components/EliteApplicationForm';
import RuleBuilder from './components/RuleBuilder';
import CourseManagementSystem from './components/enhanced/CourseManagementSystem';
import { ShieldAlert, Settings, Cpu as Bot, BarChart, CheckSquare, PlayCircle, ArrowRight, Lock } from 'lucide-react';
import TradeJournal from './components/TradeJournal';
import CommunityHub from './components/CommunityHub';
import QuizPlayer from './components/QuizPlayer';
import TodoList from './components/TodoList';
import { courseService } from './services/courseService';
import UnderReviewPage from './components/UnderReviewPage';
import SignupPage from './components/SignupPage';
import BotDownloadPage from './components/BotDownloadPage';
import BotStore from './components/BotStore';
import TradingBotPurchasePage from './telegram/TradingBotPurchasePage';

// --- MOCK DATA ---

// Mock Classroom Data for Admin Portal
const MOCK_STUDENTS: StudentProfile[] = [
  {
    id: 's1', name: 'Dan Student', email: 'dan@student.com', tier: 'professional', botAccess: true, botPurchaseStatus: 'completed', joinedDate: '2025-09-10',
    status: 'active',
    stats: { winRate: 65, totalPnL: 1250, tradesCount: 42, avgRiskReward: 2.1, currentDrawdown: 3.2 },
    recentTrades: [
      { id: 't1', pair: 'EURUSD', type: 'buy', entryPrice: 1.08, stopLoss: 1.07, takeProfit: 1.1, status: 'win', validationResult: 'approved', notes: 'Clean break', date: '2025-10-24', pnl: 450 },
      { id: 't2', pair: 'US30', type: 'sell', entryPrice: 34000, stopLoss: 34100, takeProfit: 33500, status: 'loss', validationResult: 'warning', notes: 'Forced entry', date: '2025-10-23', pnl: -200 }
    ]
  },
  {
    id: 's2', name: 'Sarah Jenkins', email: 'sarah.j@gmail.com', tier: 'elite', botAccess: false, botPurchaseStatus: 'none', joinedDate: '2025-08-15',
    status: 'active',
    stats: { winRate: 72, totalPnL: 5800, tradesCount: 89, avgRiskReward: 3.5, currentDrawdown: 1.5 },
    recentTrades: [
      { id: 't3', pair: 'XAUUSD', type: 'buy', entryPrice: 1950, stopLoss: 1945, takeProfit: 1970, status: 'win', validationResult: 'approved', notes: 'Gold liquidity sweep', date: '2025-10-24', pnl: 1200 }
    ]
  },
  {
    id: 's3', name: 'Mike Ross', email: 'mike.r@law.com', tier: 'professional', botAccess: true, botPurchaseStatus: 'completed', joinedDate: '2025-10-01',
    status: 'at-risk',
    stats: { winRate: 35, totalPnL: -2100, tradesCount: 15, avgRiskReward: 1.1, currentDrawdown: 18.5 },
    recentTrades: [
      { id: 't4', pair: 'BTCUSD', type: 'buy', entryPrice: 65000, stopLoss: 64000, takeProfit: 68000, status: 'loss', validationResult: 'rejected', notes: 'FOMO buy at top', date: '2025-10-24', pnl: -800 },
      { id: 't5', pair: 'ETHUSD', type: 'buy', entryPrice: 3500, stopLoss: 3400, takeProfit: 3800, status: 'loss', validationResult: 'rejected', notes: 'Revenge trade', date: '2025-10-24', pnl: -600 }
    ]
  },
  {
    id: 's4', name: 'Jessica Pearson', email: 'jessica@firm.com', tier: 'elite', botAccess: true, botPurchaseStatus: 'completed', joinedDate: '2025-07-20',
    status: 'active',
    stats: { winRate: 55, totalPnL: 890, tradesCount: 22, avgRiskReward: 2.8, currentDrawdown: 4.0 },
    recentTrades: []
  },
  {
    id: 's5', name: 'Harvey Specter', email: 'harvey@closer.com', tier: 'foundation', botAccess: false, botPurchaseStatus: 'pending', joinedDate: '2025-10-05',
    status: 'inactive',
    stats: { winRate: 0, totalPnL: 0, tradesCount: 0, avgRiskReward: 0, currentDrawdown: 0 },
    recentTrades: []
  }
];

const MOCK_RULES: TradeRule[] = [
  { id: '1', text: 'Has price taken liquidity from previous day low?', type: 'buy', required: true },
  { id: '2', text: 'Is there an unmitigated Fair Value Gap below current price?', type: 'buy', required: true },
  { id: '3', text: 'Has market structure broken to the upside (MSS)?', type: 'buy', required: true },
  { id: '4', text: 'Is your risk-to-reward ratio at least 1:2?', type: 'buy', required: true },
  { id: '5', text: 'Has price taken liquidity from previous day high?', type: 'sell', required: true },
  { id: '6', text: 'Is there an unmitigated Fair Value Gap above current price?', type: 'sell', required: true },
];

const INITIAL_ENTRIES: TradeEntry[] = [
  {
    id: '101', pair: 'EURUSD', type: 'buy', entryPrice: 1.0850, stopLoss: 1.0820, takeProfit: 1.0910,
    status: 'win', pnl: 320, validationResult: 'approved', notes: 'Clean CRT setup off 1H FVG.', date: '2025-10-10', emotions: ['Confident']
  },
  {
    id: '102', pair: 'GBPUSD', type: 'sell', entryPrice: 1.2100, stopLoss: 1.2130, takeProfit: 1.2040,
    status: 'loss', pnl: -150, validationResult: 'warning', notes: 'Entered too early, missed the sweep.', date: '2025-10-12', emotions: ['FOMO', 'Anxious']
  },
  {
    id: '103', pair: 'NAS100', type: 'buy', entryPrice: 14500, stopLoss: 14450, takeProfit: 14650,
    status: 'win', pnl: 450, validationResult: 'approved', notes: 'News play, waited for displacement.', date: '2025-10-14', emotions: ['Disciplined']
  },
  {
    id: '105', pair: 'US30', type: 'buy', entryPrice: 33000, stopLoss: 32900, takeProfit: 33200,
    status: 'win', pnl: 600, validationResult: 'approved', notes: 'Perfect retest of order block.', date: '2025-10-18', emotions: ['Flow']
  }
];

const MOCK_USER_ELITE_PENDING: User = {
  id: '2',
  name: 'Pending Applicant',
  email: 'applicant@test.com',
  role: 'student',
  subscriptionTier: 'elite-pending',
  progress: 0,
  botAccess: false,
  botPurchaseStatus: 'none'
};

// --- APP COMPONENT ---

type AppViewState = 'landing' | 'login' | 'signup' | 'portal' | 'application';

const App: React.FC = () => {
  // App Logic State
  const [viewState, setViewState] = useState<AppViewState>('landing');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [portalView, setPortalView] = useState('dashboard'); // Internal view within layout
  const [activeLesson, setActiveLesson] = useState<CourseModule | null>(null);
  const [lessonTab, setLessonTab] = useState<'content' | 'quiz'>('content');

  // Data State
  const [journalEntries, setJournalEntries] = useState<TradeEntry[]>(INITIAL_ENTRIES);
  const [draftJournalEntry, setDraftJournalEntry] = useState<Partial<TradeEntry> | null>(null);
  const [tradeRules, setTradeRules] = useState<TradeRule[]>(MOCK_RULES);
  const [courses, setCourses] = useState<CourseModule[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Add event listener for custom navigation events
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const view = event.detail;
      if (view) {
        setPortalView(view);
      }
    };

    window.addEventListener('navigateToView', handleNavigate as EventListener);

    return () => {
      window.removeEventListener('navigateToView', handleNavigate as EventListener);
    };
  }, []);

  // Fetch real courses data
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const courseModules = await courseService.getModules();
        setCourses(courseModules);
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Fallback to mock data on error
        const mockCourses: CourseModule[] = [
          { id: '1', title: 'Market Structure & CRT', description: 'Understanding the foundation.', duration: '45m', level: 'beginner', completed: true, locked: false, contentType: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          {
            id: '2', title: 'Fair Value Gaps Mastery', description: 'Identifying high probability gaps.', duration: '60m', level: 'intermediate', completed: false, locked: false, contentType: 'text', content: '## Fair Value Gaps\n\nAn FVG is a 3-candle pattern...',
            quiz: {
              id: 'q2',
              passingScore: 70,
              questions: [
                { id: '2a', text: 'What is the minimum number of candles required to form an FVG?', options: ['2 Candles', '3 Candles', '5 Candles', '1 Candle'], correctOptionIndex: 1 },
                { id: '2b', text: 'For a Bullish FVG, the gap exists between:', options: ['Candle 1 Low and Candle 3 High', 'Candle 1 High and Candle 3 Low', 'Candle 2 High and Candle 2 Low', 'None of the above'], correctOptionIndex: 1 },
                { id: '2c', text: 'An FVG is considered "mitigated" when:', options: ['Price touches the gap', 'Price closes above the gap', 'Price never returns', 'The gap is too small'], correctOptionIndex: 0 },
              ]
            }
          },
          { id: '3', title: 'Liquidity Concepts', description: 'Where are the stops?', duration: '55m', level: 'intermediate', completed: false, locked: true, contentType: 'video' },
          { id: '4', title: 'Advanced Executions', description: 'Precision entries.', duration: '90m', level: 'advanced', completed: false, locked: true, contentType: 'video' },
        ];
        setCourses(mockCourses);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // --- SUPABASE AUTH ---
  React.useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
        setViewState('portal');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
        // Only set view state to portal if we're not already in the middle of signup
        if (viewState !== 'signup') {
          setViewState('portal');
        }
      } else {
        setUser(null);
        if (viewState !== 'signup' && viewState !== 'login') {
          setViewState('landing');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [viewState]);

  // Real-time profile sync: re-fetch user profile whenever it changes in DB
  // This ensures bot access, tier changes, etc. reflect immediately without re-login
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as any;
          console.log('Profile updated in real-time:', updated);
          setUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              name: updated.full_name || prev.name,
              role: updated.role || prev.role,
              subscriptionTier: updated.subscription_tier || prev.subscriptionTier,
              botAccess: updated.bot_access ?? prev.botAccess,
              botPurchaseStatus: updated.bot_purchase_status ?? prev.botPurchaseStatus,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Polling fallback: re-fetch profile every 30s for students
  // This ensures bot access / tier changes reflect even without Supabase Realtime configured
  useEffect(() => {
    if (!user?.id || user?.role === 'admin') return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('bot_access, bot_purchase_status, subscription_tier, role')
        .eq('id', user.id)
        .single();

      if (data) {
        setUser(prev => {
          if (!prev) return prev;
          // Only update if there's an actual change to avoid unnecessary re-renders
          if (
            prev.botAccess === data.bot_access &&
            prev.botPurchaseStatus === data.bot_purchase_status &&
            prev.subscriptionTier === data.subscription_tier &&
            prev.role === data.role
          ) return prev;

          console.log('Profile polled and updated:', data);
          return {
            ...prev,
            botAccess: data.bot_access ?? prev.botAccess,
            botPurchaseStatus: data.bot_purchase_status ?? prev.botPurchaseStatus,
            subscriptionTier: data.subscription_tier ?? prev.subscriptionTier,
            role: data.role ?? prev.role,
          };
        });
      }
    }, 10000); // reduced to 10 seconds for a "live" feel

    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  // Handle cross-component navigation events (e.g. from Dashboard cards)
  useEffect(() => {
    const handleNavigation = (e: any) => {
      if (e.detail) {
        setPortalView(e.detail);
      }
    };

    window.addEventListener('navigateToView' as any, handleNavigation);
    return () => window.removeEventListener('navigateToView' as any, handleNavigation);
  }, []);

  // Proactive Navigation: Automatically push the student to new content when upgraded/granted access
  useEffect(() => {
    if (!user || user.role === 'admin') return;

    const isPending = user.subscriptionTier.includes('-pending');
    const isFree = user.subscriptionTier === 'free';

    // If student was on "Under Review" or restricted "Community" and just got upgraded
    if (portalView === 'dashboard' && isPending) {
      // Stay on dashboard, the UnderReviewPage is rendered there
    } else if (portalView === 'dashboard' && !isPending && !isFree) {
      // If they were pending and are now active, and already on dashboard, just let it render Dashboard
    } else if (portalView === 'community' && !isPending && !isFree) {
      // Automatically push from community to dashboard upon upgrade
      console.log('Student upgraded! Proactively navigating to Dashboard.');
      setPortalView('dashboard');
    }
  }, [user?.subscriptionTier, user?.botAccess]);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found, which we handle below

      if (data) {
        console.log('Profile found:', data);
        setUser({
          id: data.id,
          name: data.full_name || email.split('@')[0],
          email: email,
          role: data.role as any,
          subscriptionTier: data.subscription_tier as any,
          progress: 0,
          botAccess: data.bot_access || false,
          botPurchaseStatus: data.bot_purchase_status || 'none'
        });

        // Set default view based on Role and Subscription Tier
        if (data.role === 'admin') {
          setPortalView('admin-dashboard');
        } else {
          // Redirect based on subscription tier
          if (data.subscription_tier.includes('-pending')) {
            setPortalView('dashboard'); // Will show under review page
          } else if (data.subscription_tier === 'free') {
            setPortalView('community');
          } else {
            setPortalView('dashboard');
          }
        }
      } else {
        console.log('No profile found for user, creating one:', userId);
        // Create a default profile for the user
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            full_name: email.split('@')[0],
            subscription_tier: 'free',
            role: 'student'
          })
          .select()
          .single();

        if (insertError) throw insertError;

        console.log('Profile created:', newProfile);
        setUser({
          id: newProfile.id,
          name: newProfile.full_name || email.split('@')[0],
          email: email,
          role: newProfile.role as any,
          subscriptionTier: newProfile.subscription_tier as any,
          progress: 0,
          botAccess: newProfile.bot_access || false,
          botPurchaseStatus: newProfile.bot_purchase_status || 'none'
        });

        // Set default view for new users
        setPortalView('community');
      }
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
      // Even if we can't fetch/create profile, still set a basic user object
      setUser({
        id: userId,
        name: email.split('@')[0],
        email: email,
        role: 'student',
        subscriptionTier: 'free',
        progress: 0,
        botAccess: false,
        botPurchaseStatus: 'none'
      });
      setPortalView('community');
    }
  };

  // --- HANDLERS ---

  const handleNavigationRequest = (tier: 'free' | 'foundation' | 'professional' | 'elite' | 'login' | 'signup') => {
    if (tier === 'login') {
      // Redirect to login page
      setViewState('login');
    } else if (tier === 'signup') {
      // Redirect to signup page
      setViewState('signup');
    } else {
      // For all plans, redirect to signup page instead of application form
      setViewState('signup');
    }
  };

  const handlePlanSelection = (planName: string) => {
    if (planName === 'signup') {
      // Handle signup navigation
      setViewState('signup');
      return;
    }

    // For all plans, redirect to signup page instead of application form
    setViewState('signup');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setViewState('portal');

    // Set default view based on Role
    if (loggedInUser.role === 'admin') {
      setPortalView('admin-dashboard');
    } else {
      setPortalView('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      // Check if there's an active session before attempting to sign out
      const { data: { session } } = await supabase.auth.getSession();

      // Only attempt to sign out if there's an active session
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Error during logout:', error);
          // Even if there's an error, still clear the user state and redirect
        }
      }

      // Clear user state and redirect regardless of session status
      setUser(null);
      setViewState('landing');
      setPortalView('dashboard');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      // Still clear the user state and redirect even if there's an unexpected error
      setUser(null);
      setViewState('landing');
      setPortalView('dashboard');
    }
  };

  const handleApplicationSubmit = (data: any) => {
    // Set the user's subscription tier based on their selection
    const subscriptionTier = data.subscriptionTier || 'free';

    const applicantUser: User = {
      ...MOCK_USER_ELITE_PENDING,
      name: data.fullName,
      email: data.email,
      subscriptionTier: subscriptionTier as any,
      botAccess: false
    };

    // Auto-login as the pending user
    setUser(applicantUser);
    setViewState('portal');

    // If it's a free tier, redirect to community immediately
    if (subscriptionTier === 'free' || subscriptionTier === 'foundation') {
      setPortalView('community');
    } else {
      // For paid tiers, show under review page
      setPortalView('dashboard'); // Will show under review page for elite-pending users
    }
  };

  // Journal Handlers
  const handleAddJournalEntry = (entry: TradeEntry) => {
    setJournalEntries(prev => [entry, ...prev]);
  };

  const handleLogTradeFromAI = (tradeData: Partial<TradeEntry>) => {
    setDraftJournalEntry(tradeData);
    setPortalView('journal');
  };

  // Rule Engine Handlers
  const handleAddRule = (rule: TradeRule) => {
    setTradeRules(prev => [...prev, rule]);
  };

  const handleUpdateRule = (id: string, updates: Partial<TradeRule>) => {
    setTradeRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleDeleteRule = (id: string) => {
    setTradeRules(prev => prev.filter(r => r.id !== id));
  };

  const handleReorderRules = (newRules: TradeRule[]) => {
    setTradeRules(newRules);
  };

  // Course Builder Handlers
  const handleAddCourse = (module: CourseModule) => {
    setCourses(prev => [...prev, module]);
  };

  const handleUpdateCourse = (id: string, updates: Partial<CourseModule>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleStartLesson = (module: CourseModule) => {
    setActiveLesson(module);
    setLessonTab('content');
    setPortalView('lesson');
  };

  const handleQuizCompletion = (moduleId: string, score: number, passed: boolean) => {
    if (passed) {
      handleUpdateCourse(moduleId, { completed: true });
      // Optional: Show toast notification or celebration logic here
    }
  };

  // --- RENDER LOGIC ---

  if (viewState === 'landing') {
    return <LandingPage
      onSelectTier={handleNavigationRequest}
      onPlanSelection={handlePlanSelection}
    />;
  }

  if (viewState === 'application') {
    return (
      <EliteApplicationForm
        selectedPlan={selectedPlan}
        onSubmit={handleApplicationSubmit}
        onCancel={() => setViewState('landing')}
      />
    );
  }

  if (viewState === 'login') {
    return (
      <LoginPage
        onBack={() => setViewState('landing')}
      />
    );
  }

  if (viewState === 'signup') {
    return (
      <SignupPage
        onBack={() => setViewState('landing')}
        onSignupSuccess={() => setViewState('portal')}
      />
    );
  }

  // Authenticated Portal View
  if (user) {
    const renderContent = () => {
      // --- ACCESS CONTROL CHECK ---
      // truly admin-only views that students should NEVER access
      const isAdminView = ['overview', 'admin-dashboard', 'directory', 'student-management', 'trades', 'analytics', 'content', 'rules', 'admin-analytics', 'settings', 'bot-inquiries'].includes(portalView);

      if (user.role !== 'admin' && isAdminView) {
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20">
              <ShieldAlert className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Unauthorized Access</h2>
            <p className="text-gray-400 max-w-md mb-8">
              You do not have permission to view this area. This incident has been logged.
            </p>
            <button
              onClick={() => setPortalView('dashboard')}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition border border-gray-700"
            >
              Return to Dashboard
            </button>
          </div>
        );
      }

      // --- ADMIN VIEWS ---
      if (user.role === 'admin') {
        switch (portalView) {
          case 'overview':
          case 'admin-dashboard':
          case 'dashboard':
          case 'directory':
          case 'student-management':
          case 'trades':
          case 'analytics':
          case 'settings':
          case 'journal':
          case 'admin-analytics':
          case 'bot-inquiries':
          case 'bot':
            return (
              <AdminPortal
                courses={courses}
                user={user}
                initialTab={portalView === 'admin-dashboard' || portalView === 'dashboard' ? 'overview' : portalView}
              />
            );
          case 'rules':
            return (
              <div className="h-full">
                <RuleBuilder
                  userId={user.id}
                  rules={tradeRules}
                  onRulesChange={setTradeRules}
                />
              </div>
            );
          case 'content': {
            // Map User to StudentProfile for CourseManagementSystem
            const adminProfile: StudentProfile = {
              id: user.id,
              name: user.name,
              email: user.email,
              tier: user.subscriptionTier || 'foundation',
              joinedDate: new Date().toISOString(),
              stats: {
                winRate: 0,
                totalPnL: 0,
                tradesCount: 0,
                avgRiskReward: 0,
                currentDrawdown: 0
              },
              recentTrades: [],
              status: 'active',
              botAccess: true,
              botPurchaseStatus: 'completed'
            };

            return (
              <CourseManagementSystem
                currentUser={adminProfile}
                isAdmin={true}
              />
            );
          }
          default: {
            // Check if it's an admin tab that should use AdminPortal
            const isAdminTab = ['overview', 'admin-dashboard', 'dashboard', 'directory', 'student-management', 'trades', 'analytics', 'content', 'rules', 'journal', 'admin-analytics', 'settings', 'bot-inquiries', 'bot'].includes(portalView);

            if (isAdminTab) {
              return (
                <AdminPortal courses={courses} user={user} initialTab={portalView} />
              );
            }

            return (
              <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
                <Settings className="h-12 w-12 mb-4 text-gray-700" />
                <h2 className="text-2xl font-bold mb-2 text-white">Module Under Construction</h2>
                <p>The {portalView} is being built by the engineering team.</p>
              </div>
            );
          }
        }
      }

      // --- STUDENT VIEWS ---
      switch (portalView) {
        case 'dashboard':
          // Check if user is under review
          if (user.subscriptionTier.includes('-pending')) {
            return <UnderReviewPage userTier={user.subscriptionTier} onLogout={handleLogout} />;
          }

          // Show dashboard for foundation and above
          return (
            <Dashboard
              user={user}
              courses={courses}
              onContinueCourse={() => setPortalView('courses')}
            />
          );
        case 'ai':
          // Access Control: Only Professional and Elite tiers can access AI
          // Pending users and free users cannot access
          const hasAIAccess = (user.subscriptionTier === 'professional' || user.subscriptionTier === 'elite') &&
            !user.subscriptionTier.includes('-pending');

          if (!hasAIAccess) {
            // For users without access, show the professional feature message
            return (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
                <div className="bg-gray-800 p-6 rounded-full mb-6 relative">
                  <Lock className="h-12 w-12 mb-4 text-gray-500" />
                  <div className="absolute -top-1 -right-1 bg-trade-neon/20 text-trade-neon text-xs font-bold px-2 py-1 rounded-full border border-trade-neon/50">PRO</div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">Professional Feature</h2>

                {user.subscriptionTier.includes('-pending') ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl text-yellow-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Application Under Review</p>
                    <p className="text-sm opacity-80">
                      Your application for the {user.subscriptionTier.replace('-pending', '').charAt(0).toUpperCase() + user.subscriptionTier.replace('-pending', '').slice(1)} tier is currently being processed by our team.
                      Access to the AI Assistant will be unlocked upon approval.
                    </p>
                  </div>
                ) : user.subscriptionTier === 'free' ? (
                  <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl text-gray-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Free Tier Limitation</p>
                    <p className="text-sm opacity-80">
                      The AI Trade Assistant is exclusively available to <span className="text-trade-neon font-bold">Professional</span> and <span className="text-purple-500 font-bold">Elite</span> members.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                      The AI Trade Assistant is exclusively available to <span className="text-trade-neon font-bold">Professional</span> and <span className="text-purple-500 font-bold">Elite</span> members.
                    </p>

                    <div className="space-y-3 w-full max-w-sm text-left">
                      <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 flex gap-4 items-center">
                        <div className="bg-trade-neon/10 p-2 rounded-lg text-trade-neon"><Bot className="h-5 w-5" /></div>
                        <div>
                          <div className="text-white font-bold text-sm">AI Trade Guard</div>
                          <p className="text-xs text-gray-500">Real-time setup validation</p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 flex gap-4 items-center">
                        <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400"><BarChart className="h-5 w-5" /></div>
                        <div>
                          <div className="text-white font-bold text-sm">Advanced Analytics</div>
                          <p className="text-xs text-gray-500">Performance breakdown by pair</p>
                        </div>
                      </div>
                    </div>

                    <button className="mt-8 w-full max-w-sm py-4 bg-trade-neon text-black font-black text-lg rounded-xl hover:bg-green-400 transition shadow-lg shadow-trade-neon/20">
                      Upgrade to Professional
                    </button>
                  </>
                )}
              </div>
            );
          }

          // For users with access, render the AI Trade Assistant
          return (
            <AITradeAssistant
              userId={user.id}
              onLogTrade={handleLogTradeFromAI}
            />
          );
        case 'journal':
          // Access Control: Only foundation, professional, and elite tiers can access journals
          // Pending users cannot access
          const hasJournalAccess = (user.subscriptionTier === 'foundation' ||
            user.subscriptionTier === 'professional' ||
            user.subscriptionTier === 'elite') &&
            !user.subscriptionTier.includes('-pending');

          if (!hasJournalAccess) {
            return (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
                <div className="bg-gray-800 p-6 rounded-full mb-6 relative">
                  <Lock className="h-12 w-12 mb-4 text-gray-500" />
                  <div className="absolute -top-1 -right-1 bg-trade-neon/20 text-trade-neon text-xs font-bold px-2 py-1 rounded-full border border-trade-neon/50">PRO</div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">Premium Feature</h2>

                {user.subscriptionTier.includes('-pending') ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl text-yellow-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Application Under Review</p>
                    <p className="text-sm opacity-80">
                      Your application for the {user.subscriptionTier.replace('-pending', '').charAt(0).toUpperCase() + user.subscriptionTier.replace('-pending', '').slice(1)} tier is currently being processed by our team.
                      Access to the Trade Journal will be unlocked upon approval.
                    </p>
                  </div>
                ) : user.subscriptionTier === 'free' ? (
                  <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl text-gray-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Free Tier Limitation</p>
                    <p className="text-sm opacity-80">
                      The Trade Journal is exclusively available to <span className="text-trade-neon font-bold">Foundation</span> tier and above members.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                      The Trade Journal is exclusively available to <span className="text-trade-neon font-bold">Foundation</span> tier and above members.
                    </p>

                    <button
                      onClick={() => setPortalView('community')}
                      className="mt-8 w-full max-w-sm py-4 bg-trade-neon text-black font-black text-lg rounded-xl hover:bg-green-400 transition shadow-lg shadow-trade-neon/20"
                    >
                      Back to Community
                    </button>
                  </>
                )}
              </div>
            );
          }

          return (
            <TradeJournal
              user={user}
              entries={journalEntries}
              onAddEntry={handleAddJournalEntry}
              draftEntry={draftJournalEntry}
              onClearDraft={() => setDraftJournalEntry(null)}
            />
          );
        case 'bot':
          // Access Control: Check if user has been granted access or has a completed purchase
          const hasBotAccess = user.botAccess === true || user.botPurchaseStatus === 'completed';

          if (hasBotAccess) {
            return <BotDownloadPage user={user} />;
          }

          return <BotStore 
            user={user} 
            onUpdateUser={setUser}
            onNavigateToPurchase={() => setPortalView('bot-purchase')}
          />;
        case 'bot-purchase':
          // Trading Bot Purchase Page with Mastercard Payment
          return (
            <TradingBotPurchasePage
              user={user}
              onUpdateUser={setUser}
              onBack={() => setPortalView('bot')}
            />
          );
        case 'todos':
          // Access Control: Only foundation, professional, and elite tiers can access todos
          // Pending users cannot access
          const hasTodoAccess = (user.subscriptionTier === 'foundation' ||
            user.subscriptionTier === 'professional' ||
            user.subscriptionTier === 'elite') &&
            !user.subscriptionTier.includes('-pending');

          if (!hasTodoAccess) {
            return (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
                <div className="bg-gray-800 p-6 rounded-full mb-6 relative">
                  <Lock className="h-12 w-12 mb-4 text-gray-500" />
                  <div className="absolute -top-1 -right-1 bg-trade-neon/20 text-trade-neon text-xs font-bold px-2 py-1 rounded-full border border-trade-neon/50">PRO</div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">Premium Feature</h2>

                {user.subscriptionTier.includes('-pending') ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl text-yellow-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Application Under Review</p>
                    <p className="text-sm opacity-80">
                      Your application for the {user.subscriptionTier.replace('-pending', '').charAt(0).toUpperCase() + user.subscriptionTier.replace('-pending', '').slice(1)} tier is currently being processed by our team.
                      Access to the Task Manager will be unlocked upon approval.
                    </p>
                  </div>
                ) : user.subscriptionTier === 'free' ? (
                  <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl text-gray-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Free Tier Limitation</p>
                    <p className="text-sm opacity-80">
                      The Task Manager is exclusively available to <span className="text-trade-neon font-bold">Foundation</span> tier and above members.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                      The Task Manager is exclusively available to <span className="text-trade-neon font-bold">Foundation</span> tier and above members.
                    </p>

                    <button
                      onClick={() => setPortalView('community')}
                      className="mt-8 w-full max-w-sm py-4 bg-trade-neon text-black font-black text-lg rounded-xl hover:bg-green-400 transition shadow-lg shadow-trade-neon/20"
                    >
                      Back to Community
                    </button>
                  </>
                )}
              </div>
            );
          }

          return <TodoList userId={user.id} />;
        case 'courses':
          // Access Control: Only foundation, professional, and elite tiers can access courses
          // Pending users cannot access
          const hasCourseAccess = (user.subscriptionTier === 'foundation' ||
            user.subscriptionTier === 'professional' ||
            user.subscriptionTier === 'elite') &&
            !user.subscriptionTier.includes('-pending');

          if (!hasCourseAccess) {
            return (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
                <div className="bg-gray-800 p-6 rounded-full mb-6 relative">
                  <Lock className="h-12 w-12 mb-4 text-gray-500" />
                  <div className="absolute -top-1 -right-1 bg-trade-neon/20 text-trade-neon text-xs font-bold px-2 py-1 rounded-full border border-trade-neon/50">PRO</div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">Premium Feature</h2>

                {user.subscriptionTier.includes('-pending') ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl text-yellow-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Application Under Review</p>
                    <p className="text-sm opacity-80">
                      Your application for the {user.subscriptionTier.replace('-pending', '').charAt(0).toUpperCase() + user.subscriptionTier.replace('-pending', '').slice(1)} tier is currently being processed by our team.
                      Access to the Course Curriculum will be unlocked upon approval.
                    </p>
                  </div>
                ) : user.subscriptionTier === 'free' ? (
                  <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl text-gray-200 max-w-md">
                    <p className="font-bold mb-2 text-lg">Free Tier Limitation</p>
                    <p className="text-sm opacity-80">
                      The Course Curriculum is exclusively available to <span className="text-trade-neon font-bold">Foundation</span> tier and above members.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                      The Course Curriculum is exclusively available to <span className="text-trade-neon font-bold">Foundation</span> tier and above members.
                    </p>

                    <button
                      onClick={() => setPortalView('community')}
                      className="mt-8 w-full max-w-sm py-4 bg-trade-neon text-black font-black text-lg rounded-xl hover:bg-green-400 transition shadow-lg shadow-trade-neon/20"
                    >
                      Back to Community
                    </button>
                  </>
                )}
              </div>
            );
          }

          // Map User to StudentProfile for CourseManagementSystem
          const studentProfile: StudentProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            tier: user.subscriptionTier || 'foundation',
            joinedDate: new Date().toISOString(),
            stats: {
              winRate: 0,
              totalPnL: 0,
              tradesCount: 0,
              avgRiskReward: 0,
              currentDrawdown: 0
            },
            recentTrades: [],
            status: 'active',
            botAccess: user.botAccess,
            botPurchaseStatus: user.botPurchaseStatus
          };

          return (
            <CourseManagementSystem
              currentUser={studentProfile}
              isAdmin={false}
            />
          );

        case 'lesson':
          if (!activeLesson) return <div>Lesson not found</div>;

          return (
            <div className="max-w-4xl mx-auto text-white pb-10">
              <button
                onClick={() => setPortalView('courses')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
              >
                ← Back to Curriculum
              </button>

              <div className="flex items-center gap-4 mb-6 border-b border-gray-800">
                <button
                  onClick={() => setLessonTab('content')}
                  className={`px-4 py-3 font-bold text-sm border-b-2 transition ${lessonTab === 'content'
                    ? 'border-trade-accent text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  Lesson Content
                </button>
                {activeLesson.quiz && (
                  <button
                    onClick={() => setLessonTab('quiz')}
                    className={`px-4 py-3 font-bold text-sm border-b-2 transition flex items-center gap-2 ${lessonTab === 'quiz'
                      ? 'border-trade-accent text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <CheckSquare className="h-4 w-4" /> Quiz
                  </button>
                )}
              </div>

              <div className="bg-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl mb-8 min-h-[500px]">
                {lessonTab === 'content' ? (
                  <>
                    {activeLesson.contentType === 'video' ? (
                      <div className="aspect-video bg-gray-900">
                        {/* Function to convert YouTube URLs to embed format */}
                        {(() => {
                          const getEmbedUrl = (url: string | undefined) => {
                            if (!url) return null;

                            // Handle YouTube URLs
                            if (url.includes('youtube.com/watch')) {
                              const videoId = url.split('v=')[1]?.split('&')[0];
                              if (videoId) {
                                return `https://www.youtube.com/embed/${videoId}`;
                              }
                            } else if (url.includes('youtu.be/')) {
                              const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                              if (videoId) {
                                return `https://www.youtube.com/embed/${videoId}`;
                              }
                            }

                            // Return the original URL if it's already an embed URL or not a YouTube URL
                            return url.includes('embed') || !url.includes('youtube.com') ? url : null;
                          };

                          const embedUrl = getEmbedUrl(activeLesson.content);

                          return embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={activeLesson.title}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : activeLesson.content ? (
                            <div className="w-full h-full flex items-center justify-center p-6">
                              <div className="text-center">
                                <PlayCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400 mb-2">Unable to Embed Video</h3>
                                <p className="text-gray-500 mb-4">This video cannot be embedded. Please use a direct embed URL.</p>
                                <p className="text-sm text-gray-600 bg-gray-800 p-3 rounded-lg break-words">{activeLesson.content}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <PlayCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500">No video content available</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="p-12 bg-trade-dark min-h-[400px]">
                        <h2 className="text-3xl font-bold mb-8">{activeLesson.title}</h2>
                        <div className="prose prose-invert max-w-none">
                          {/* Simple markdown-like rendering for demo */}
                          {activeLesson.content?.split('\n').map((line, i) => {
                            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 text-white">{line.substring(2)}</h1>;
                            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mb-3 text-white mt-8">{line.substring(3)}</h2>;
                            if (line.trim() === '') return <br key={i} />;
                            return <p key={i} className="text-gray-300 leading-relaxed mb-4">{line}</p>;
                          })}
                          {!activeLesson.content && (
                            <div className="text-center text-gray-500 py-10">
                              <div className="mb-4">No text content available for this module.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 bg-trade-dark h-full">
                    {activeLesson.quiz ? (
                      <QuizPlayer
                        quiz={activeLesson.quiz}
                        onComplete={(score, passed) => handleQuizCompletion(activeLesson.id, score, passed)}
                        onRetake={() => { }}
                      />
                    ) : (
                      <div className="text-center p-12 text-gray-500">No quiz available for this module.</div>
                    )}
                  </div>
                )}
              </div>

              {lessonTab === 'content' && (
                <div className="flex justify-between items-center bg-trade-dark p-6 rounded-xl border border-gray-800">
                  <div>
                    <h3 className="font-bold text-lg mb-1">Lesson Complete?</h3>
                    <p className="text-sm text-gray-400">
                      {activeLesson.quiz ? "Take the quiz to complete this module." : "Mark this module as finished to unlock the next chapter."}
                    </p>
                  </div>
                  {activeLesson.quiz ? (
                    <button
                      onClick={() => setLessonTab('quiz')}
                      className="px-8 py-3 bg-trade-accent hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition flex items-center gap-2"
                    >
                      Proceed to Quiz <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <button className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition flex items-center gap-2">
                      Complete & Continue →
                    </button>
                  )}
                </div>
              )}
            </div>
          );

        case 'community':
          return <CommunityHub />;
        default:
          return <div>View Not Found</div>;
      }
    };

    const content = (
      <main className="flex-1 p-8">
        {loadingCourses ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    );

    return (
      <Layout
        user={user}
        currentView={portalView}
        onChangeView={setPortalView}
        onLogout={handleLogout}
      >
        {user.role === 'admin' ? (
          <AdminPortalProvider>
            {content}
          </AdminPortalProvider>
        ) : (
          content
        )}
      </Layout>
    );
  }

  return null; // Should not reach here
};

export default App;
