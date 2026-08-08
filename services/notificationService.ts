import { supabase } from '../supabase/client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  relatedEntityId?: string;
  relatedEntityType?: 'trade' | 'course' | 'quiz' | 'module';
}

export const notificationService = {
  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification | null> {
    try {
      // Prepare the insert data
      const insertData: any = {
        profile_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        related_entity_id: notification.relatedEntityId,
        related_entity_type: notification.relatedEntityType
      };

      // If we have a related entity ID and type, set the specific foreign key columns
      if (notification.relatedEntityId && notification.relatedEntityType) {
        // Only set the specific foreign key if the relatedEntityId is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(notification.relatedEntityId)) {
          if (notification.relatedEntityType === 'course') {
            insertData.course_id = notification.relatedEntityId;
          } else if (notification.relatedEntityType === 'module') {
            insertData.module_id = notification.relatedEntityId;
          }
        }
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.profile_id,
        title: data.title,
        message: data.message,
        type: data.type,
        read: data.read,
        createdAt: data.created_at,
        relatedEntityId: data.related_entity_id,
        relatedEntityType: data.related_entity_type
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  // Get unread notifications for a user
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(notification => ({
        id: notification.id,
        userId: notification.profile_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.created_at,
        relatedEntityId: notification.related_entity_id,
        relatedEntityType: notification.related_entity_type
      }));
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  },

  // Get all notifications for a user
  async getAllNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(notification => ({
        id: notification.id,
        userId: notification.profile_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.created_at,
        relatedEntityId: notification.related_entity_id,
        relatedEntityType: notification.related_entity_type
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('profile_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  },

  // Create a trade review notification for admin
  async createTradeReviewNotification(tradeId: string, studentName: string, adminId: string): Promise<Notification | null> {
    return this.createNotification({
      userId: adminId,
      title: 'New Trade for Review',
      message: `${studentName} has submitted a new trade for your review.`,
      type: 'info',
      read: false,
      relatedEntityId: tradeId,
      relatedEntityType: 'trade'
    });
  },

  // Create a trade feedback notification for student
  async createTradeFeedbackNotification(tradeId: string, studentId: string, adminName: string, feedback: string): Promise<Notification | null> {
    return this.createNotification({
      userId: studentId,
      title: 'Trade Review Feedback',
      message: `${adminName} has reviewed your trade and provided feedback: ${feedback}`,
      type: 'info',
      read: false,
      relatedEntityId: tradeId,
      relatedEntityType: 'trade'
    });
  },

  // Create a mentor assignment notification
  async createMentorAssignmentNotification(studentId: string, mentorName: string): Promise<Notification | null> {
    return this.createNotification({
      userId: studentId,
      title: 'Mentor Assigned',
      message: `You have been assigned to ${mentorName} as your mentor.`,
      type: 'success',
      read: false
    });
  },

  // Create an application approval notification
  async createApplicationApprovedNotification(studentId: string): Promise<Notification | null> {
    try {
      // Use RPC to create notification as system function
      const { data, error } = await supabase.rpc('create_application_notification', {
        p_profile_id: studentId,
        p_title: 'Application Approved!',
        p_message: 'Congratulations! Your application has been approved. You now have access to the Elite Mentorship program.',
        p_type: 'success'
      });

      if (error) throw error;

      // Wait a moment for the notification to be created and committed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to fetch the notification by ID first (if data is a valid UUID)
      if (data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
        try {
          const { data: notificationData, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', data)
            .single();

          if (!fetchError && notificationData) {
            return {
              id: notificationData.id,
              userId: notificationData.profile_id,
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type,
              read: notificationData.read,
              createdAt: notificationData.created_at,
              relatedEntityId: notificationData.related_entity_id,
              relatedEntityType: notificationData.related_entity_type
            };
          }
        } catch (fetchError) {
          // If fetching by ID fails, fall back to fetching by profile_id
          console.warn('Failed to fetch notification by ID, falling back to profile-based fetch:', fetchError);
        }
      }

      // Fallback: Fetch the most recent notification for this user
      const { data: notificationData, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      return {
        id: notificationData.id,
        userId: notificationData.profile_id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: notificationData.read,
        createdAt: notificationData.created_at,
        relatedEntityId: notificationData.related_entity_id,
        relatedEntityType: notificationData.related_entity_type
      };
    } catch (error) {
      console.error('Error creating application approved notification:', error);
      return null;
    }
  },

  // Create an application rejection notification
  async createApplicationRejectedNotification(studentId: string): Promise<Notification | null> {
    try {
      // Use RPC to create notification as system function
      const { data, error } = await supabase.rpc('create_application_notification', {
        p_profile_id: studentId,
        p_title: 'Application Status Update',
        p_message: 'We\'ve reviewed your application. While you didn\'t qualify for the Elite program this time, you still have access to our Free Community features.',
        p_type: 'info'
      });

      if (error) throw error;

      // Wait a moment for the notification to be created and committed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to fetch the notification by ID first (if data is a valid UUID)
      if (data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
        try {
          const { data: notificationData, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', data)
            .single();

          if (!fetchError && notificationData) {
            return {
              id: notificationData.id,
              userId: notificationData.profile_id,
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type,
              read: notificationData.read,
              createdAt: notificationData.created_at,
              relatedEntityId: notificationData.related_entity_id,
              relatedEntityType: notificationData.related_entity_type
            };
          }
        } catch (fetchError) {
          // If fetching by ID fails, fall back to fetching by profile_id
          console.warn('Failed to fetch notification by ID, falling back to profile-based fetch:', fetchError);
        }
      }

      // Fallback: Fetch the most recent notification for this user
      const { data: notificationData, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      return {
        id: notificationData.id,
        userId: notificationData.profile_id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: notificationData.read,
        createdAt: notificationData.created_at,
        relatedEntityId: notificationData.related_entity_id,
        relatedEntityType: notificationData.related_entity_type
      };
    } catch (error) {
      console.error('Error creating application rejected notification:', error);
      return null;
    }
  },

  // Create an application under review notification
  async createApplicationUnderReviewNotification(studentId: string): Promise<Notification | null> {
    return this.createNotification({
      userId: studentId,
      title: 'Application Received',
      message: 'Thank you for your application! Our team is reviewing your information and will get back to you within 48 hours.',
      type: 'info',
      read: false
    });
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return channel;
  },

  // Update notification preferences
  async updatePreferences(userId: string, preferences: Partial<any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          profile_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  },

  // Get notification preferences
  async getPreferences(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }
};

export default notificationService;
