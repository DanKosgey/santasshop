import { supabase } from '../supabase/client';
import { StudentProfile, CourseModule, TradeEntry, BotAsset } from '../types';

// Function to fetch all students with their stats for admin portal
export const fetchAllStudents = async (): Promise<StudentProfile[]> => {
  try {
    // Using RPC to call our custom function
    const { data, error } = await supabase.rpc('get_all_students_for_admin');

    if (error) throw error;

    // Transform the data to match StudentProfile interface
    return data.map((student: any) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      tier: student.tier,
      botAccess: student.bot_access || false,
      botPurchaseStatus: student.bot_purchase_status || 'none',
      joinedDate: student.joined_date,
      status: student.status,
      stats: {
        winRate: student.win_rate || 0,
        totalPnL: student.total_pnl || 0,
        tradesCount: student.trades_count || 0,
        avgRiskReward: student.avg_risk_reward || 0,
        currentDrawdown: student.current_drawdown || 0
      },
      recentTrades: [] // Will be populated separately if needed
    }));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// Function to fetch all trades with student info for admin portal
export const fetchAllTrades = async (): Promise<(TradeEntry & { studentId: string; studentName: string; studentTier: string })[]> => {
  try {
    // Using RPC to call our enhanced custom function
    const { data, error } = await supabase.rpc('get_all_trades_for_admin_enhanced');

    if (error) throw error;

    // Transform the data to match TradeEntry interface
    return data.map((trade: any) => ({
      id: trade.id,
      pair: trade.pair,
      type: trade.type,
      entryPrice: trade.entry_price,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      status: trade.status,
      validationResult: trade.validation_result,
      notes: trade.notes,
      date: trade.date,
      pnl: trade.pnl,
      strategy: trade.strategy,
      confidenceLevel: trade.confidence_level,
      adminReviewStatus: trade.admin_review_status,
      reviewTimestamp: trade.review_timestamp,
      tags: trade.tags,
      studentId: trade.user_id,
      studentName: trade.student_name,
      studentTier: trade.student_tier
    }));
  } catch (error) {
    console.error('Error fetching trades:', error);
    throw error;
  }
};

// Function to fetch business metrics
export const fetchBusinessMetrics = async () => {
  try {
    // Using RPC to call our custom function
    const { data, error } = await supabase.rpc('get_business_metrics');

    if (error) throw error;

    if (data && data.length > 0) {
      const metrics = data[0];
      return {
        mrr: metrics.mrr || 0,
        totalRevenue: metrics.total_revenue || 0,
        churnRate: metrics.churn_rate || 0,
        // Calculate growth percentage based on MRR and total revenue
        growthPercentage: metrics.mrr > 0 && metrics.total_revenue > metrics.mrr
          ? Math.max(0, Math.min(100, Math.round((metrics.mrr / (metrics.total_revenue - metrics.mrr)) * 100)))
          : 0,
        tierData: [
          { name: 'Foundation', value: metrics.foundation_count || 0, color: '#94a3b8' },
          { name: 'Professional', value: metrics.professional_count || 0, color: '#00ff94' },
          { name: 'Elite', value: metrics.elite_count || 0, color: '#a855f7' }
        ]
      };
    }

    return {
      mrr: 0,
      totalRevenue: 0,
      churnRate: 0,
      growthPercentage: 0,
      tierData: [
        { name: 'Foundation', value: 0, color: '#94a3b8' },
        { name: 'Professional', value: 0, color: '#00ff94' },
        { name: 'Elite', value: 0, color: '#a855f7' }
      ]
    };
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    throw error;
  }
};

// Function to fetch comprehensive analytics data
export const fetchComprehensiveAnalytics = async () => {
  try {
    console.log('Fetching comprehensive analytics...');
    const { data, error } = await supabase.rpc('get_comprehensive_analytics');

    if (error) {
      console.error('RPC Error in fetchComprehensiveAnalytics:', error);
      throw error;
    }

    console.log('Comprehensive analytics data:', data);

    if (data && data.length > 0) {
      const analytics = data[0];
      return {
        totalStudents: parseInt(analytics.total_students) || 0,
        activeStudents: parseInt(analytics.active_students) || 0,
        atRiskStudents: parseInt(analytics.at_risk_students) || 0,
        totalRevenue: analytics.total_revenue || 0,
        mrr: analytics.mrr || 0,
        churnRate: analytics.churn_rate || 0,
        avgWinRate: analytics.avg_win_rate || 0,
        totalTrades: parseInt(analytics.total_trades) || 0,
        totalPnL: analytics.total_pnl || 0
      };
    }

    return {
      totalStudents: 0,
      activeStudents: 0,
      atRiskStudents: 0,
      totalRevenue: 0,
      mrr: 0,
      churnRate: 0,
      avgWinRate: 0,
      totalTrades: 0,
      totalPnL: 0
    };
  } catch (error: any) {
    console.error('Error fetching comprehensive analytics:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
};

// Function to fetch revenue growth data
export const fetchRevenueGrowthData = async () => {
  try {
    console.log('Fetching revenue growth data...');
    const { data, error } = await supabase.rpc('get_revenue_growth_data');

    if (error) {
      console.error('RPC Error in fetchRevenueGrowthData:', error);
      throw error;
    }

    console.log('Revenue growth data:', data);

    // Convert to the format expected by the UI
    return data.map((item: any) => ({
      month: item.month_year || 'Unknown',
      revenue: parseFloat(item.revenue) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching revenue growth data:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch course completion data
export const fetchCourseCompletionData = async () => {
  try {
    console.log('Fetching course completion data...');
    const { data, error } = await supabase.rpc('get_course_completion_data');

    if (error) {
      console.error('RPC Error in fetchCourseCompletionData:', error);
      throw error;
    }

    console.log('Course completion data:', data);

    return data.map((item: any) => ({
      moduleId: item.module_id || '',
      name: item.module_title || 'Unknown Module',
      completion: parseFloat(item.completion_rate) || 0,
      totalStudents: parseInt(item.total_students) || 0,
      completedStudents: parseInt(item.completed_students) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching course completion data:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch rule violations data
export const fetchRuleViolationsData = async () => {
  try {
    console.log('Fetching rule violations data...');
    const { data, error } = await supabase.rpc('get_rule_violations_data');

    if (error) {
      console.error('RPC Error in fetchRuleViolationsData:', error);
      throw error;
    }

    console.log('Rule violations data:', data);

    return data.map((item: any) => ({
      rule: item.rule_name || 'Unknown Rule',
      count: parseInt(item.violation_count) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching rule violations data:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch student penalties (top 20 students by rejected/warning trades)
export const fetchStudentPenalties = async () => {
  try {
    console.log('Fetching student penalties data...');

    // Use the new database function for better performance
    const { data, error } = await supabase.rpc('get_student_penalties');

    if (error) throw error;

    console.log('Top 20 students by penalties:', data);

    return data || [];
  } catch (error: any) {
    console.error('Error fetching student penalties data:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch penalty trends data
export const fetchPenaltyTrends = async () => {
  try {
    console.log('Fetching penalty trends data...');
    const { data, error } = await supabase.rpc('get_penalty_trends');

    if (error) {
      console.error('RPC Error in fetchPenaltyTrends:', error);
      throw error;
    }

    console.log('Penalty trends data:', data);

    // Convert to the format expected by the UI
    return data.map((item: any) => ({
      date: item.date_period || 'Unknown',
      rejected: parseInt(item.rejected_count) || 0,
      warning: parseInt(item.warning_count) || 0,
      total: parseInt(item.total_penalties) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching penalty trends data:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch a specific student with their recent trades
export const fetchStudentWithTrades = async (studentId: string): Promise<StudentProfile | null> => {
  try {
    // First get the student profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError) throw profileError;
    if (!profileData) return null;

    // Get student stats
    const { data: statsData, error: statsError } = await supabase.rpc('get_student_stats', { user_id: studentId });

    if (statsError) throw statsError;

    const stats = statsData && statsData.length > 0 ? statsData[0] : {
      win_rate: 0,
      total_pnl: 0,
      trades_count: 0,
      avg_risk_reward: 0,
      current_drawdown: 0
    };

    // Get recent trades for this student
    const { data: tradesData, error: tradesError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', studentId)
      .order('date', { ascending: false })
      .limit(10); // Limit to recent 10 trades

    if (tradesError) throw tradesError;

    // Transform trades data
    const recentTrades: TradeEntry[] = tradesData.map((trade: any) => ({
      id: trade.id,
      pair: trade.pair,
      type: trade.type,
      entryPrice: trade.entry_price,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      status: trade.status,
      validationResult: trade.validation_result,
      notes: trade.notes,
      date: trade.date,
      pnl: trade.pnl
    }));

    // Determine student status based on stats
    let status: 'active' | 'at-risk' | 'inactive' = 'active';
    if (stats.win_rate < 40) {
      status = 'at-risk';
    } else if (stats.trades_count === 0) {
      status = 'inactive';
    }

    return {
      id: profileData.id,
      name: profileData.full_name,
      email: profileData.email,
      tier: profileData.subscription_tier,
      botAccess: profileData.bot_access || false,
      botPurchaseStatus: profileData.bot_purchase_status || 'none',
      joinedDate: profileData.joined_date,
      status,
      stats: {
        winRate: stats.win_rate || 0,
        totalPnL: stats.total_pnl || 0,
        tradesCount: stats.trades_count || 0,
        avgRiskReward: stats.avg_risk_reward || 0,
        currentDrawdown: stats.current_drawdown || 0
      },
      recentTrades
    };
  } catch (error) {
    console.error('Error fetching student with trades:', error);
    throw error;
  }
};

// Function to fetch course enrollment trends
export const fetchCourseEnrollmentTrends = async (days: number = 30) => {
  try {
    console.log('Fetching course enrollment trends...');
    const { data, error } = await supabase.rpc('get_course_enrollment_trends', { days });

    if (error) {
      console.error('RPC Error in fetchCourseEnrollmentTrends:', error);
      throw error;
    }

    console.log('Course enrollment trends data:', data);

    return data.map((item: any) => ({
      date: item.date || 'Unknown',
      enrollments: parseInt(item.enrollments) || 0,
      completions: parseInt(item.completions) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching course enrollment trends:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch module completion rates
export const fetchModuleCompletionRates = async () => {
  try {
    console.log('Fetching module completion rates...');
    const { data, error } = await supabase.rpc('get_module_completion_rates');

    if (error) {
      console.error('RPC Error in fetchModuleCompletionRates:', error);
      throw error;
    }

    console.log('Module completion rates data:', data);

    return data.map((item: any) => ({
      courseId: item.course_id || '',
      name: item.course_title || 'Unknown Course',
      completion: parseFloat(item.completion_rate) || 0,
      total: parseInt(item.total_modules) || 0,
      completed: parseInt(item.completed_modules) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching module completion rates:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch course enrollment counts
export const fetchCourseEnrollmentCounts = async () => {
  try {
    console.log('Fetching course enrollment counts...');
    const { data, error } = await supabase.rpc('get_course_enrollment_counts');

    if (error) {
      console.error('RPC Error in fetchCourseEnrollmentCounts:', error);
      throw error;
    }

    console.log('Course enrollment counts data:', data);

    return data.map((item: any) => ({
      courseId: item.course_id || '',
      name: item.course_title || 'Unknown Course',
      count: parseInt(item.total_enrollments) || 0,
      completed: parseInt(item.completed_enrollments) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching course enrollment counts:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch course difficulty distribution
export const fetchCourseDifficultyDistribution = async () => {
  try {
    console.log('Fetching course difficulty distribution...');
    const { data, error } = await supabase.rpc('get_course_difficulty_distribution');

    if (error) {
      console.error('RPC Error in fetchCourseDifficultyDistribution:', error);
      throw error;
    }

    console.log('Course difficulty distribution data:', data);

    return data.map((item: any) => ({
      name: item.level ? item.level.charAt(0).toUpperCase() + item.level.slice(1) : 'Unknown',
      value: parseInt(item.count) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching course difficulty distribution:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch content type distribution
export const fetchContentTypeDistribution = async () => {
  try {
    console.log('Fetching content type distribution...');
    const { data, error } = await supabase.rpc('get_content_type_distribution');

    if (error) {
      console.error('RPC Error in fetchContentTypeDistribution:', error);
      throw error;
    }

    console.log('Content type distribution data:', data);

    return data.map((item: any) => ({
      name: item.content_type ? item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1) : 'Unknown',
      value: parseInt(item.count) || 0
    }));
  } catch (error: any) {
    console.error('Error fetching content type distribution:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Return empty array as fallback
    return [];
  }
};

// Function to fetch all trade rules for a user
export const fetchUserRules = async (userId?: string): Promise<any[]> => {
  try {
    console.log('Fetching user rules for userId:', userId);

    // If no userId is provided or it's undefined, return only global rules
    if (!userId || userId === 'undefined') {
      console.log('No valid userId provided, fetching global rules only');
      const { data, error } = await supabase
        .from('trade_rules')
        .select('*')
        .is('created_by', null)
        .order('order_number', { ascending: true });

      if (error) throw error;
      return data || [];
    }

    // First try to fetch user-specific rules and global rules
    const { data, error } = await supabase
      .from('trade_rules')
      .select('*')
      .or(`created_by.eq.${userId},created_by.is.null`)
      .order('order_number', { ascending: true });

    if (error) {
      console.error('Error fetching user rules with OR condition:', error);
      // Fallback: fetch global rules only if user-specific query fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('trade_rules')
        .select('*')
        .is('created_by', null)
        .order('order_number', { ascending: true });

      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user rules:', error);
    // Return empty array as fallback instead of throwing error
    return [];
  }
};

// Function to create a new trade rule
export const createTradeRule = async (rule: any) => {
  try {
    console.log('Creating trade rule with data:', rule);

    // If created_by is undefined, null, or an invalid UUID, set it to null
    if (!rule.created_by ||
      rule.created_by === 'undefined' ||
      rule.created_by === '00000000-0000-0000-0000-000000000000') {
      console.log('Invalid or missing created_by, setting to null for global rule');
      rule.created_by = null;
    } else {
      // Validate that created_by references an existing profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', rule.created_by)
        .single();

      if (profileError || !profileData) {
        console.warn(`Profile with id ${rule.created_by} not found. Setting created_by to null.`);
        rule.created_by = null;
      }
    }

    const { data, error } = await supabase
      .from('trade_rules')
      .insert([rule])
      .select()
      .single();

    if (error) throw error;
    console.log('Trade rule created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating trade rule:', error);
    throw error;
  }
};

// Function to update a trade rule
export const updateTradeRule = async (ruleId: string, updates: any) => {
  try {
    console.log('Updating trade rule:', ruleId, updates);

    const { data, error } = await supabase
      .from('trade_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    console.log('Trade rule updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating trade rule:', error);
    throw error;
  }
};

// Function to delete a trade rule
export const deleteTradeRule = async (ruleId: string) => {
  try {
    console.log('Deleting trade rule:', ruleId);

    const { error } = await supabase
      .from('trade_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
    console.log('Trade rule deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting trade rule:', error);
    throw error;
  }
};

// Function to reorder trade rules
export const reorderTradeRules = async (ruleIds: string[]) => {
  try {
    console.log('Reordering trade rules:', ruleIds);

    const updates = ruleIds.map((id, index) => ({
      id,
      order_number: index
    }));

    const { error } = await supabase
      .from('trade_rules')
      .upsert(updates);

    if (error) throw error;
    console.log('Trade rules reordered successfully');
    return true;
  } catch (error) {
    console.error('Error reordering trade rules:', error);
    throw error;
  }
};

// Function to fetch pending applications (users with any pending subscription tier)
export const fetchPendingApplications = async (): Promise<StudentProfile[]> => {
  try {
    console.log('Fetching users with pending subscription tiers...');
    // Fetch users with any pending subscription tier
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or('subscription_tier.eq.elite-pending,subscription_tier.eq.foundation-pending,subscription_tier.eq.professional-pending')
      .eq('role', 'student')
      .order('joined_date', { ascending: true });

    if (error) {
      console.error('Error fetching pending applications:', error);
      throw error;
    }

    console.log('Pending applications data:', data);

    // Transform the data to match StudentProfile interface
    return data.map((user: any) => ({
      id: user.id,
      name: user.full_name,
      email: user.email,
      tier: user.subscription_tier,
      botAccess: user.bot_access || false,
      botPurchaseStatus: user.bot_purchase_status || 'none',
      joinedDate: user.joined_date,
      status: 'active', // Pending applications are considered active
      stats: {
        winRate: 0,
        totalPnL: 0,
        tradesCount: 0,
        avgRiskReward: 0,
        currentDrawdown: 0
      },
      recentTrades: [] // Will be populated separately if needed
    }));
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    throw error;
  }
};

// Function to update a student's profile
export const updateStudentProfile = async (studentId: string, updates: Partial<StudentProfile>) => {
  try {
    console.log('Updating student profile:', studentId, updates);

    // Map StudentProfile fields to database fields
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.tier !== undefined) dbUpdates.subscription_tier = updates.tier;
    if (updates.botAccess !== undefined) dbUpdates.bot_access = updates.botAccess;
    if (updates.botPurchaseStatus !== undefined) dbUpdates.bot_purchase_status = updates.botPurchaseStatus;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', studentId)
      .select();

    if (error) throw error;

    // Check if any rows were updated
    if (!data || data.length === 0) {
      throw new Error('No profile found for the given student ID');
    }

    console.log('Student profile updated successfully:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};

// Function to fetch all bot assets
export const fetchBotAssets = async (): Promise<BotAsset[]> => {
  try {
    const { data, error } = await supabase
      .from('bot_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('bot_assets table might not exist, using mock data');
      return [
        {
          id: '1',
          name: 'Alpha-V5.mq5',
          description: 'Core trading bot file for MetaTrader 5',
          url: '#',
          fileSize: '1.2 MB',
          version: '5.0.1',
          type: 'mql5',
          createdAt: new Date().toISOString()
        }
      ];
    }

    return data.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      description: asset.description,
      url: asset.url,
      fileSize: asset.file_size,
      version: asset.version,
      type: asset.type,
      createdAt: asset.created_at
    }));
  } catch (error) {
    console.error('Error fetching bot assets:', error);
    return [];
  }
};

// Function to upload bot asset
export const uploadBotAsset = async (file: File, metadata: Partial<BotAsset>) => {
  try {
    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `bot-files/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('bot-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bot-assets')
      .getPublicUrl(filePath);

    // 3. Save reference in DB
    const { data, error: dbError } = await supabase
      .from('bot_assets')
      .insert([{
        name: metadata.name || file.name,
        description: metadata.description,
        url: publicUrl,
        file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        version: metadata.version || '1.0.0',
        type: metadata.type || 'mql5'
      }])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  } catch (error) {
    console.error('Error uploading bot asset:', error);
    throw error;
  }
};

// Function to delete bot asset
export const deleteBotAsset = async (assetId: string, fileUrl: string) => {
  try {
    // 1. Delete from DB
    const { error: dbError } = await supabase
      .from('bot_assets')
      .delete()
      .eq('id', assetId);

    if (dbError) throw dbError;

    // 2. Delete from Storage (optional, but good practice)
    const filePath = fileUrl.split('/').pop();
    if (filePath) {
      await supabase.storage
        .from('bot-assets')
        .remove([`bot-files/${filePath}`]);
    }

    return true;
  } catch (error) {
    console.error('Error deleting bot asset:', error);
    throw error;
  }
};

// Function to delete a student's profile
export const deleteStudentProfile = async (studentId: string) => {
  try {
    console.log('Deleting student profile:', studentId);

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', studentId);

    if (error) throw error;
    console.log('Student profile deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting student profile:', error);
    throw error;
  }
};
