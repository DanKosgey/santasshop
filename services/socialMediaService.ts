import { supabase } from '../supabase/client';

// Types for social media features
export interface SocialPost {
  id: string;
  userId: string;
  content: string;
  postType: 'discussion' | 'chart_analysis' | 'signal' | 'question';
  chartImageUrl?: string;
  pair?: string;
  signalType?: 'buy' | 'sell' | 'hold';
  confidenceLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
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

// Social Media Service
export const socialMediaService = {
  // Community Links
  async getCommunityLinks(): Promise<CommunityLink[]> {
    try {
      const { data, error } = await supabase
        .from('community_links')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(link => ({
        id: link.id,
        platformName: link.platform_name,
        platformKey: link.platform_key,
        linkUrl: link.link_url,
        description: link.description,
        iconColor: link.icon_color,
        isActive: link.is_active,
        sortOrder: link.sort_order,
        createdAt: link.created_at,
        updatedAt: link.updated_at
      }));
    } catch (error) {
      console.error('Error fetching community links:', error);
      return [];
    }
  },

  async getAllCommunityLinks(): Promise<CommunityLink[]> {
    try {
      const { data, error } = await supabase
        .from('community_links')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(link => ({
        id: link.id,
        platformName: link.platform_name,
        platformKey: link.platform_key,
        linkUrl: link.link_url,
        description: link.description,
        iconColor: link.icon_color,
        isActive: link.is_active,
        sortOrder: link.sort_order,
        createdAt: link.created_at,
        updatedAt: link.updated_at
      }));
    } catch (error) {
      console.error('Error fetching all community links:', error);
      return [];
    }
  },

  async createCommunityLink(link: Omit<CommunityLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunityLink | null> {
    try {
      const { data, error } = await supabase
        .from('community_links')
        .insert({
          platform_name: link.platformName,
          platform_key: link.platformKey,
          link_url: link.linkUrl,
          description: link.description,
          icon_color: link.iconColor,
          is_active: link.isActive,
          sort_order: link.sortOrder
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Ensure we return the correct format
      if (data) {
        return {
          id: data.id,
          platformName: data.platform_name,
          platformKey: data.platform_key,
          linkUrl: data.link_url,
          description: data.description,
          iconColor: data.icon_color,
          isActive: data.is_active,
          sortOrder: data.sort_order,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
      return null;
    } catch (error: any) {
      console.error('Error creating community link:', error);
      // Re-throw the error so the calling function can handle it appropriately
      throw error;
    }
  },

  async updateCommunityLink(id: string, updates: Partial<CommunityLink>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('community_links')
        .update({
          platform_name: updates.platformName,
          platform_key: updates.platformKey,
          link_url: updates.linkUrl,
          description: updates.description,
          icon_color: updates.iconColor,
          is_active: updates.isActive,
          sort_order: updates.sortOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error updating community link:', error);
      // Re-throw the error so the calling function can handle it appropriately
      throw error;
    }
  },

  async deleteCommunityLink(id: string): Promise<boolean> {
    try {
      console.log('Deleting community link with ID:', id);
      const { data, error } = await supabase
        .from('community_links')
        .delete()
        .eq('id', id)
        .select(); // Add select() to get the deleted record
      
      console.log('Delete operation result:', { data, error });
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting community link:', error);
      throw error; // Re-throw the error so the calling function can handle it appropriately
    }
  },

  async updateLastCommunityPlatform(userId: string, platformKey: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          last_community_platform: platformKey
        })
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating last community platform:', error);
      return false;
    }
  },

  // Posts
  async getPosts(): Promise<SocialPost[]> {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles (full_name, subscription_tier)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get likes count for each post
      const postIds = data.map(post => post.id);
      const { data: likesData } = await supabase
        .from('social_likes')
        .select('post_id')
        .in('post_id', postIds);
      
      // Count likes per post
      const likesCount: Record<string, number> = {};
      likesData?.forEach(like => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
      });
      
      // Get comments count for each post
      const { data: commentsData } = await supabase
        .from('social_comments')
        .select('post_id')
        .in('post_id', postIds);
      
      // Count comments per post
      const commentsCount: Record<string, number> = {};
      commentsData?.forEach(comment => {
        commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
      });
      
      return data.map(post => ({
        id: post.id,
        userId: post.user_id,
        userName: post.profiles?.full_name || 'Unknown User',
        userTier: post.profiles?.subscription_tier || 'free',
        content: post.content,
        postType: post.post_type,
        chartImageUrl: post.chart_image_url,
        pair: post.pair,
        signalType: post.signal_type,
        confidenceLevel: post.confidence_level,
        likesCount: likesCount[post.id] || 0,
        commentsCount: commentsCount[post.id] || 0,
        isLiked: false, // This would be set based on current user in the frontend
        createdAt: post.created_at,
        updatedAt: post.updated_at
      }));
    } catch (error) {
      console.error('Error fetching social posts:', error);
      return [];
    }
  },

  async createPost(post: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialPost | null> {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: post.userId,
          content: post.content,
          post_type: post.postType,
          chart_image_url: post.chartImageUrl,
          pair: post.pair,
          signal_type: post.signalType,
          confidence_level: post.confidenceLevel
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        postType: data.post_type,
        chartImageUrl: data.chart_image_url,
        pair: data.pair,
        signalType: data.signal_type,
        confidenceLevel: data.confidence_level,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating social post:', error);
      return null;
    }
  },

  async updatePost(id: string, updates: Partial<SocialPost>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({
          content: updates.content,
          post_type: updates.postType,
          chart_image_url: updates.chartImageUrl,
          pair: updates.pair,
          signal_type: updates.signalType,
          confidence_level: updates.confidenceLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating social post:', error);
      return false;
    }
  },

  async deletePost(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting social post:', error);
      return false;
    }
  },

  // Comments
  async getComments(postId: string): Promise<SocialComment[]> {
    try {
      const { data, error } = await supabase
        .from('social_comments')
        .select(`
          *,
          profiles (full_name, subscription_tier)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return data.map(comment => ({
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        userName: comment.profiles?.full_name || 'Unknown User',
        userTier: comment.profiles?.subscription_tier || 'free',
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
      }));
    } catch (error) {
      console.error('Error fetching social comments:', error);
      return [];
    }
  },

  async createComment(comment: Omit<SocialComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialComment | null> {
    try {
      const { data, error } = await supabase
        .from('social_comments')
        .insert({
          post_id: comment.postId,
          user_id: comment.userId,
          content: comment.content
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        postId: data.post_id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating social comment:', error);
      return null;
    }
  },

  async deleteComment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_comments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting social comment:', error);
      return false;
    }
  },

  // Likes
  async getLikes(postId: string): Promise<SocialLike[]> {
    try {
      const { data, error } = await supabase
        .from('social_likes')
        .select('*')
        .eq('post_id', postId);
      
      if (error) throw error;
      
      return data.map(like => ({
        id: like.id,
        postId: like.post_id,
        userId: like.user_id,
        createdAt: like.created_at
      }));
    } catch (error) {
      console.error('Error fetching social likes:', error);
      return [];
    }
  },

  async addLike(like: Omit<SocialLike, 'id' | 'createdAt'>): Promise<SocialLike | null> {
    try {
      const { data, error } = await supabase
        .from('social_likes')
        .insert({
          post_id: like.postId,
          user_id: like.userId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        postId: data.post_id,
        userId: data.user_id,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error adding social like:', error);
      return null;
    }
  },

  async removeLike(postId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing social like:', error);
      return false;
    }
  },

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features) : []),
        isActive: plan.is_active,
        sortOrder: plan.sort_order,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      }));
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  },

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features) : []),
        isActive: plan.is_active,
        sortOrder: plan.sort_order,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      }));
    } catch (error) {
      console.error('Error fetching all subscription plans:', error);
      return [];
    }
  },

  async createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan | null> {
    try {
      console.log('Creating subscription plan with data:', plan);
      
      // Ensure features is properly formatted as array
      let formattedFeatures: string[] = [];
      if (Array.isArray(plan.features)) {
        formattedFeatures = plan.features;
      } else if (typeof plan.features === 'string') {
        // Handle empty string case properly
        formattedFeatures = plan.features ? (plan.features as string).split('\n').filter(f => f.trim()) : [];
      }
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: plan.name,
          description: plan.description,
          price: plan.price,
          interval: plan.interval,
          features: formattedFeatures,
          is_active: plan.isActive,
          sort_order: plan.sortOrder
        })
        .select()
        .single();
    
      console.log('Supabase response:', { data, error });
    
      if (error) throw error;
    
      // Ensure we return the correct format
      if (data) {
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          interval: data.interval,
          features: Array.isArray(data.features) ? data.features : (typeof data.features === 'string' ? JSON.parse(data.features) : []),
          isActive: data.is_active,
          sortOrder: data.sort_order,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
      return null;
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      return null;
    }
  },

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<boolean> {
    try {
      // Format features properly if provided
      if (updates.features !== undefined) {
        if (typeof updates.features === 'string') {
          updates.features = (updates.features as string).split('\n').filter(f => f.trim());
        }
      }
      
      const updateData: any = {
        name: updates.name,
        description: updates.description,
        price: updates.price,
        interval: updates.interval,
        is_active: updates.isActive,
        sort_order: updates.sortOrder,
        updated_at: new Date().toISOString()
      };
      
      // Only include features in update if provided
      if (updates.features !== undefined) {
        updateData.features = updates.features;
      }
      
      const { error } = await supabase
        .from('subscription_plans')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      return false;
    }
  },

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    try {
      // First, delete all associated plan features to avoid foreign key constraint issues
      const { error: featureError } = await supabase
        .from('plan_features')
        .delete()
        .eq('plan_id', id);
      
      if (featureError) throw featureError;
      
      // Then delete the subscription plan
      const { error: planError } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);
      
      if (planError) throw planError;
      return true;
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      return false;
    }
  },

  // Plan Features
  async getPlanFeatures(planId: string): Promise<PlanFeature[]> {
    try {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_id', planId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(feature => ({
        id: feature.id,
        planId: feature.plan_id,
        featureName: feature.feature_name,
        featureDescription: feature.feature_description,
        isIncluded: feature.is_included,
        sortOrder: feature.sort_order,
        createdAt: feature.created_at
      }));
    } catch (error) {
      console.error('Error fetching plan features:', error);
      return [];
    }
  },

  async createPlanFeature(feature: Omit<PlanFeature, 'id' | 'createdAt'>): Promise<PlanFeature | null> {
    try {
      const { data, error } = await supabase
        .from('plan_features')
        .insert({
          plan_id: feature.planId,
          feature_name: feature.featureName,
          feature_description: feature.featureDescription,
          is_included: feature.isIncluded,
          sort_order: feature.sortOrder
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        planId: data.plan_id,
        featureName: data.feature_name,
        featureDescription: data.feature_description,
        isIncluded: data.is_included,
        sortOrder: data.sort_order,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error creating plan feature:', error);
      return null;
    }
  },

  async updatePlanFeature(id: string, updates: Partial<PlanFeature>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('plan_features')
        .update({
          feature_name: updates.featureName,
          feature_description: updates.featureDescription,
          is_included: updates.isIncluded,
          sort_order: updates.sortOrder
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating plan feature:', error);
      return false;
    }
  },

  async deletePlanFeature(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('plan_features')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting plan feature:', error);
      return false;
    }
  }
};