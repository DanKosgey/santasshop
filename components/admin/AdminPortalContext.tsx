import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile, SubscriptionPlan, CommunityLink } from '../../types';
import {
  fetchAllStudents as fetchAllStudentsService,
  fetchAllTrades as fetchAllTradesService,
  fetchBusinessMetrics as fetchBusinessMetricsService,
  fetchRevenueGrowthData as fetchRevenueGrowthDataService,
  fetchCourseEnrollmentCounts as fetchCourseEnrollmentCountsService,
  fetchRuleViolationsData as fetchRuleViolationsDataService,
  fetchStudentPenalties as fetchStudentPenaltiesService,
  fetchPenaltyTrends as fetchPenaltyTrendsService,
  updateStudentProfile as updateStudentProfileService,
  deleteStudentProfile as deleteStudentProfileService
} from '../../services/adminService';
import { socialMediaService } from '../../services/socialMediaService';

type AdminTab =
  | 'overview'
  | 'directory'
  | 'trades'
  | 'analytics'
  | 'content'
  | 'rules'
  | 'journal'
  | 'admin-analytics'
  | 'settings'
  | 'student-management'
  | 'bot-inquiries';

interface AdminPortalContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  refreshData: () => void;
  isRefreshing: boolean;
  // Data states
  students: StudentProfile[];
  trades: any[];
  communityLinks: CommunityLink[];
  plans: SubscriptionPlan[];
  businessMetrics: any;
  revenueGrowthData: any[];
  courseEnrollmentData: any[];
  ruleViolationsData: any[];
  studentPenaltiesData: any[];
  penaltyTrendsData: any[];
  loading: boolean;
  error: string | null;
  // Data fetching functions
  fetchStudents: () => Promise<void>;
  fetchTrades: () => Promise<void>;
  fetchCommunityLinks: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchBusinessMetrics: () => Promise<void>;
  fetchRevenueGrowthData: () => Promise<void>;
  fetchCourseEnrollmentData: () => Promise<void>;
  fetchRuleViolationsData: () => Promise<void>;
  fetchStudentPenaltiesData: () => Promise<void>;
  fetchPenaltyTrendsData: () => Promise<void>;
  // Student management functions
  updateStudentProfile: (studentId: string, updates: Partial<StudentProfile>) => Promise<void>;
  deleteStudentProfile: (studentId: string) => Promise<void>;
}

const AdminPortalContext = createContext<AdminPortalContextType | undefined>(undefined);

export const AdminPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Data states
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [communityLinks, setCommunityLinks] = useState<CommunityLink[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<any>({});
  const [revenueGrowthData, setRevenueGrowthData] = useState<any[]>([]);
  const [courseEnrollmentData, setCourseEnrollmentData] = useState<any[]>([]);
  const [ruleViolationsData, setRuleViolationsData] = useState<any[]>([]);
  const [studentPenaltiesData, setStudentPenaltiesData] = useState<any[]>([]);
  const [penaltyTrendsData, setPenaltyTrendsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load active tab from localStorage on initial render
  useEffect(() => {
    const savedTab = localStorage.getItem('adminPortalActiveTab');
    if (savedTab && isValidTab(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminPortalActiveTab', activeTab);
  }, [activeTab]);

  const isValidTab = (tab: string): tab is AdminTab => {
    return [
      'overview', 'directory', 'trades', 'analytics',
      'content', 'rules', 'journal', 'admin-analytics', 'settings', 'student-management', 'bot-inquiries'
    ].includes(tab);
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        studentsData,
        tradesData,
        linksData,
        plansData,
        metricsData,
        revenueData,
        enrollmentData,
        violationsData,
        penaltiesData,
        penaltyTrendsData
      ] = await Promise.all([
        fetchAllStudentsService(),
        fetchAllTradesService(),
        socialMediaService.getAllCommunityLinks(),
        socialMediaService.getAllSubscriptionPlans(),
        fetchBusinessMetricsService(),
        fetchRevenueGrowthDataService(),
        fetchCourseEnrollmentCountsService(),
        fetchRuleViolationsDataService(),
        fetchStudentPenaltiesService(),
        fetchPenaltyTrendsService()
      ]);

      setStudents(studentsData || []);
      setTrades(tradesData || []);
      setCommunityLinks(linksData || []);
      setPlans(plansData || []);
      setBusinessMetrics(metricsData || {});
      setRevenueGrowthData(revenueData || []);
      setCourseEnrollmentData(enrollmentData || []);
      setRuleViolationsData(violationsData || []);
      setStudentPenaltiesData(penaltiesData || []);
      setPenaltyTrendsData(penaltyTrendsData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  // Individual fetch functions
  const fetchStudents = async () => {
    try {
      const studentsData = await fetchAllStudentsService();
      setStudents(studentsData || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const updateStudentProfile = async (studentId: string, updates: Partial<StudentProfile>) => {
    try {
      await updateStudentProfileService(studentId, updates);
      // Optimistically update the local students state immediately
      // (avoids relying on the RPC re-fetch which doesn't return bot_access yet)
      setStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, ...updates } : s
      ));
    } catch (err) {
      console.error('Error updating student profile:', err);
      throw err;
    }
  };

  const deleteStudentProfile = async (studentId: string) => {
    try {
      await deleteStudentProfileService(studentId);
      // Refresh the student data after deletion
      await fetchStudents();
    } catch (err) {
      console.error('Error deleting student profile:', err);
      throw err;
    }
  };

  const fetchTrades = async () => {
    try {
      const tradesData = await fetchAllTradesService();
      setTrades(tradesData || []);
    } catch (err) {
      console.error('Error fetching trades:', err);
    }
  };

  // refreshPendingApplications function removed

  const fetchCommunityLinks = async () => {
    try {
      const linksData = await socialMediaService.getAllCommunityLinks();
      setCommunityLinks(linksData || []);
    } catch (err) {
      console.error('Error fetching community links:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const plansData = await socialMediaService.getAllSubscriptionPlans();
      setPlans(plansData || []);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
  };

  const fetchBusinessMetrics = async () => {
    try {
      const metricsData = await fetchBusinessMetricsService();
      setBusinessMetrics(metricsData || {});
    } catch (err) {
      console.error('Error fetching business metrics:', err);
    }
  };

  const fetchRevenueGrowthData = async () => {
    try {
      const revenueData = await fetchRevenueGrowthDataService();
      setRevenueGrowthData(revenueData || []);
    } catch (err) {
      console.error('Error fetching revenue growth data:', err);
    }
  };

  const fetchCourseEnrollmentData = async () => {
    try {
      const enrollmentData = await fetchCourseEnrollmentCountsService();
      setCourseEnrollmentData(enrollmentData || []);
    } catch (err) {
      console.error('Error fetching course enrollment data:', err);
    }
  };

  const fetchRuleViolationsData = async () => {
    try {
      const violationsData = await fetchRuleViolationsDataService();
      setRuleViolationsData(violationsData || []);
    } catch (err) {
      console.error('Error fetching rule violations data:', err);
    }
  };

  const fetchStudentPenaltiesData = async () => {
    try {
      const penaltiesData = await fetchStudentPenaltiesService();
      setStudentPenaltiesData(penaltiesData || []);
    } catch (err) {
      console.error('Error fetching student penalties data:', err);
    }
  };

  const fetchPenaltyTrendsData = async () => {
    try {
      const penaltyTrendsData = await fetchPenaltyTrendsService();
      setPenaltyTrendsData(penaltyTrendsData || []);
    } catch (err) {
      console.error('Error fetching penalty trends data:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return (
    <AdminPortalContext.Provider value={{
      activeTab,
      setActiveTab,
      refreshData,
      isRefreshing,
      // Data states
      students,
      trades,
      communityLinks,
      plans,
      businessMetrics,
      revenueGrowthData,
      courseEnrollmentData,
      ruleViolationsData,
      studentPenaltiesData,
      penaltyTrendsData,
      loading,
      error,
      // Data fetching functions
      fetchStudents,
      fetchTrades,
      fetchCommunityLinks,
      fetchPlans,
      fetchBusinessMetrics,
      fetchRevenueGrowthData,
      fetchCourseEnrollmentData,
      fetchRuleViolationsData,
      fetchStudentPenaltiesData,
      fetchPenaltyTrendsData,
      // Student management functions
      updateStudentProfile,
      deleteStudentProfile
    }}>
      {children}
    </AdminPortalContext.Provider>
  );
};

export const useAdminPortal = () => {
  const context = useContext(AdminPortalContext);
  if (context === undefined) {
    throw new Error('useAdminPortal must be used within an AdminPortalProvider');
  }
  return context;
};

export default AdminPortalContext;