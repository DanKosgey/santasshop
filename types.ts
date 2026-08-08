
export type UserRole = 'admin' | 'student' | 'pending';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionTier: 'free' | 'foundation' | 'professional' | 'elite' | 'elite-pending';
  progress: number;
  botAccess: boolean;
  botPurchaseStatus: 'none' | 'pending' | 'completed';
}

export interface TradeRule {
  id: string;
  text: string;
  type: 'buy' | 'sell';
  required: boolean;
}

export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'pending';
export type TradeValidationStatus = 'approved' | 'warning' | 'rejected' | 'none';

export interface TradeEntry {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice?: number;
  status: TradeOutcome;
  validationResult: TradeValidationStatus;
  notes: string;
  date: string;
  emotions?: string[]; // e.g., 'confident', 'fomo', 'anxious'
  pnl?: number;        // Realized P&L
  screenshotUrl?: string;

  // Enhanced fields for better analytics and admin oversight
  strategy?: string;
  timeFrame?: string;
  marketCondition?: string;
  confidenceLevel?: number; // 1-10
  riskAmount?: number;
  positionSize?: number;
  tradeDuration?: string; // ISO 8601 duration format
  tags?: string[];
  adminNotes?: string;
  adminReviewStatus?: 'pending' | 'reviewed' | 'flagged';
  reviewTimestamp?: string;
  mentorId?: string;
  sessionId?: string;
  tradeSource?: 'demo' | 'live' | 'paper';
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  passingScore?: number; // Percentage
}

// Enhanced CourseModule interface for full end-to-end system
export interface CourseModule {
  id: string;
  courseId?: string; // Reference to the course this module belongs to
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  locked: boolean;
  content?: string; // Video ID or text content
  contentType?: 'video' | 'text';
  quiz?: Quiz;
  // New fields for enhanced functionality
  order?: number; // For sequencing modules within a course
  prerequisites?: string[]; // IDs of modules that must be completed first
  tags?: string[]; // For search and filtering
  createdAt?: Date;
  updatedAt?: Date;
}

// New interfaces for the enhanced course system
export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  modules: CourseModule[];
  duration: string; // Total duration of all modules
  thumbnail?: string; // URL to course thumbnail
  instructor?: string; // Instructor name
  categoryId?: string; // Reference to category
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseProgress {
  profileId: string;
  moduleId: string;
  completed: boolean;
  quizScore?: number;
  completedAt?: Date;
  timeSpent?: number; // In minutes
}

export interface Enrollment {
  id: string;
  profileId: string;
  courseId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'dropped';
  progress: number; // Percentage
}

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  color: string; // For UI display
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface MentorshipApplication {
  fullName: string;
  email: string;
  discordId: string;
  experienceYears: string;
  currentCapital: string;
  biggestStruggle: string;
  motivation: string; // Why they want to join
  commitmentAgreement: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  tier: 'free' | 'foundation' | 'professional' | 'elite';
  botAccess: boolean;
  botPurchaseStatus: 'none' | 'pending' | 'completed';
  joinedDate: string;
  stats: {
    winRate: number;
    totalPnL: number;
    tradesCount: number;
    avgRiskReward: number;
    currentDrawdown: number; // Percentage
  };
  recentTrades: TradeEntry[];
  status: 'active' | 'at-risk' | 'inactive';
}

// Social Media Interfaces
export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userTier: 'free' | 'foundation' | 'professional' | 'elite';
  content: string;
  postType: 'discussion' | 'chart_analysis' | 'signal' | 'question';
  chartImageUrl?: string;
  pair?: string;
  signalType?: 'buy' | 'sell' | 'hold';
  confidenceLevel?: number;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userTier: 'free' | 'foundation' | 'professional' | 'elite';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'one-time' | 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureName: string;
  featureDescription: string;
  isIncluded: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CommunityLink {
  id: string;
  platformName: string;
  platformKey: string;
  linkUrl: string;
  description: string;
  iconColor: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Todo interface for task management
export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotAsset {
  id: string;
  name: string;
  description: string;
  url: string;
  fileSize: string;
  version: string;
  type: 'mql5' | 'manual' | 'preset' | 'folder';
  createdAt: string;
}
