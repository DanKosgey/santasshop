import type { User, StudentProfile, CourseModule, SubscriptionPlan, CommunityLink, TradeRule, TradeEntry } from '../types';

export interface AdminPortalProps {
  courses: CourseModule[];
  initialTab?: 'overview' | 'trades' | 'analytics' | 'directory' | 'settings' | 'rules' | 'content' | 'applications' | 'journal' | 'admin-analytics';
  user: User;
}