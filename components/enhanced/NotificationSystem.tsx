import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { notificationService, Notification } from '../../services/notificationService';
import { supabase } from '../../supabase/client';

interface NotificationSystemProps {
  userId: string;
  isAdmin?: boolean;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ userId, isAdmin = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    // Add a check to ensure userId is valid before fetching notifications
    if (!userId || userId === 'undefined' || userId === '00000000-0000-0000-0000-000000000000') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications(userId);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    // Add a check to ensure userId is valid before subscribing
    if (!userId || userId === 'undefined' || userId === '00000000-0000-0000-0000-000000000000') {
      return;
    }
    
    fetchNotifications();

    const channel = notificationService.subscribeToNotifications(userId, (payload) => {
      // When a new notification is inserted, fetch all notifications again
      fetchNotifications();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const success = await notificationService.markAsRead(id);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Add a check to ensure userId is valid before marking all as read
    if (!userId || userId === 'undefined' || userId === '00000000-0000-0000-0000-000000000000') {
      return;
    }
    
    try {
      const success = await notificationService.markAllAsRead(userId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const success = await notificationService.deleteNotification(id);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // If the notification was unread, decrease the unread count
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(prev => prev - 1);
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  // Get background color based on notification type
  const getBackgroundColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-800';
    
    switch (type) {
      case 'success':
        return 'bg-green-900/30 border-green-500/30';
      case 'warning':
        return 'bg-yellow-900/30 border-yellow-500/30';
      case 'error':
        return 'bg-red-900/30 border-red-500/30';
      default:
        return 'bg-blue-900/30 border-blue-500/30';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-trade-dark border border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-trade-accent hover:text-blue-400 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center text-gray-400">
              Loading notifications...
            </div>
          )}

          {/* Empty State */}
          {!loading && notifications.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">We'll notify you when something important happens</p>
            </div>
          )}

          {/* Notifications List */}
          {!loading && notifications.length > 0 && (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b border-gray-700/50 ${getBackgroundColor(notification.type, notification.read)} transition-colors`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className={`text-sm font-bold ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-300'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-trade-accent hover:text-blue-400 transition-colors flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Mark as read
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-800/50 text-center text-xs text-gray-500">
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationSystem;