import React, { useState, useEffect } from 'react';
import { Course, CourseModule, CourseCategory, CourseProgress, Enrollment, StudentProfile } from '../../types';
import { courseService } from '../../services/courseService';
import { notificationService, Notification } from '../../services/notificationService';
import EnhancedCourseBuilder from './EnhancedCourseBuilder';
import EnhancedCourseViewer from './EnhancedCourseViewer';
import DifficultyLevelManager from './DifficultyLevelManager';
import EnrollmentManager from './EnrollmentManager';
import AdminDashboardAnalytics from './AdminDashboardAnalytics';
import ProgressTracker from './ProgressTracker';
import StudentProgressReport from './StudentProgressReport';
import CourseExportImport from './CourseExportImport';
import CourseVersioning from './CourseVersioning';
import NotificationSystem from './NotificationSystem';
import CategoryManager from './CategoryManager';
import { supabase } from '../../supabase/client';
import {
  BookOpen, Users, BarChart3, Settings,
  Download, Bell, User, TrendingUp
} from 'lucide-react';

interface CourseManagementSystemProps {
  currentUser: StudentProfile;
  isAdmin: boolean;
}

const CourseManagementSystem: React.FC<CourseManagementSystemProps> = ({
  currentUser,
  isAdmin
}) => {
  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'courses' | 'analytics' | 'enrollments' | 'progress' | 'settings'>('courses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data on component mount
  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  // Load notifications and preferences
  useEffect(() => {
    // Only load notifications for real users with valid UUIDs
    // Admin users should not load notifications since they don't have profiles
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) && currentUser.id !== '00000000-0000-0000-0000-000000000000';
    if (isValidUuid) {
      loadNotifications();
      loadNotificationPreferences();
    }
  }, [currentUser.id]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    // Only set up real-time for real users with valid UUIDs
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) && currentUser.id !== '00000000-0000-0000-0000-000000000000';
    if (!isValidUuid) return;

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${currentUser.id}`
        },
        (payload) => {
          // Add new notification to the list
          const newNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.profile_id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            read: payload.new.read,
            createdAt: payload.new.created_at, // Keep as string, not Date
            relatedEntityId: payload.new.related_entity_id,
            relatedEntityType: payload.new.related_entity_type
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${currentUser.id}`
        },
        (payload) => {
          // Update existing notification
          const updatedNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.profile_id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            read: payload.new.read,
            createdAt: payload.new.created_at, // Keep as string, not Date
            relatedEntityId: payload.new.related_entity_id,
            relatedEntityType: payload.new.related_entity_type
          };
          setNotifications(prev => prev.map(notification =>
            notification.id === updatedNotification.id ? updatedNotification : notification
          ));

          // Update unread count if notification was marked as read
          if (payload.old.read === false && payload.new.read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${currentUser.id}`
        },
        (payload) => {
          // Remove deleted notification
          setNotifications(prev => prev.filter(notification => notification.id !== payload.old.id));

          // Update unread count if deleted notification was unread
          if (payload.old.read === false) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]);

  // Load all system data
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all modules first
      const modulesData = await courseService.getModules();
      setModules(modulesData);

      // Load all courses and populate them with their modules
      const coursesData = await courseService.getCourses();
      const coursesWithModules = coursesData.map(course => ({
        ...course,
        modules: modulesData.filter(module => module.courseId === course.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      }));
      setCourses(coursesWithModules);

      // Update modules state to ensure it's in sync
      setModules(modulesData);

      // Load categories
      const categoriesData = await courseService.getCategories();
      setCategories(categoriesData);

      // Load enrollments (for admin) or user enrollments
      const enrollmentsData = isAdmin
        ? await courseService.getAllEnrollments()
        : await courseService.getEnrollments(currentUser.id);
      setEnrollments(enrollmentsData);

      // Load progress (for admin) or user progress
      const progressData = isAdmin
        ? await courseService.getAllProgress()
        : await courseService.getProgress(currentUser.id);
      setProgress(progressData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load course data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    // Skip loading notifications for admin users
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) && currentUser.id !== '00000000-0000-0000-0000-000000000000';
    if (!isValidUuid || !currentUser.id) return; // Added check for currentUser.id

    try {
      const notificationsData = await notificationService.getAllNotifications(currentUser.id); // Changed from getNotifications to getAllNotifications
      setNotifications(notificationsData);

      const unread = await notificationService.getUnreadNotifications(currentUser.id); // Changed to get unread count properly
      setUnreadCount(unread.length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  // Load notification preferences
  const loadNotificationPreferences = async () => {
    // Skip loading notification preferences for admin users
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) && currentUser.id !== '00000000-0000-0000-0000-000000000000';
    if (!isValidUuid || !currentUser.id) return; // Added check for currentUser.id

    try {
      const preferences = await notificationService.getPreferences(currentUser.id);
      setNotificationPreferences(preferences);
    } catch (err) {
      console.error('Error loading notification preferences:', err);
    }
  };

  // Course management functions
  const handleAddCourse = async (course: Course) => {
    try {
      const newCourse = await courseService.createCourse(course);
      if (newCourse) {
        setCourses([...courses, { ...newCourse, modules: [] }]);
        // Notify users if this is an update to an existing course
        if (course.id) {
          // Use the generic createNotification function instead
          await notificationService.createNotification({
            userId: currentUser.id,
            title: 'Course Updated',
            message: `${currentUser.name} has updated the course content.`,
            type: 'info',
            read: false,
            relatedEntityId: course.id,
            relatedEntityType: 'course'
          });
        }
      }
    } catch (err) {
      console.error('Error adding course:', err);
      setError('Failed to add course. Please try again.');
    }
  };

  const handleUpdateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      const success = await courseService.updateCourse(id, updates);
      if (success) {
        setCourses(courses.map(course =>
          course.id === id ? { ...course, ...updates } : course
        ));
        // Notify enrolled users of the update
        await notificationService.createNotification({
          userId: currentUser.id,
          title: 'Course Updated',
          message: `${currentUser.name} has updated the course content.`,
          type: 'info',
          read: false,
          relatedEntityId: id,
          relatedEntityType: 'course'
        });
      }
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please try again.');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const success = await courseService.deleteCourse(id);
      if (success) {
        setCourses(courses.filter(course => course.id !== id));
        setModules(modules.filter(module => module.courseId !== id));
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. Please try again.');
    }
  };

  const handleAddModule = async (module: CourseModule) => {
    try {
      const newModule = await courseService.createModule(module);
      if (newModule) {
        setModules([...modules, newModule]);
        // Update the corresponding course with the new module
        setCourses(courses.map(course => {
          if (course.id === module.courseId) {
            return {
              ...course,
              modules: [...course.modules, newModule]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
            };
          }
          return course;
        }));

        // Also update the modules state to ensure consistency
        setModules([...modules, newModule]);
        // Notify users if this is a new module in an existing course
        if (module.courseId) {
          await notificationService.createNotification({
            userId: currentUser.id,
            title: 'New Module Added',
            message: `${currentUser.name} has added a new module to the course.`,
            type: 'info',
            read: false,
            relatedEntityId: module.courseId,
            relatedEntityType: 'course'
          });
        }
      }
    } catch (err) {
      console.error('Error adding module:', err);
      setError('Failed to add module. Please try again.');
    }
  };

  // Category management functions
  const handleAddCategory = async (category: Omit<CourseCategory, 'id'>) => {
    try {
      const newCategory = await courseService.createCategory(category);
      if (newCategory) {
        setCategories([...categories, newCategory]);
      }
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<CourseCategory>) => {
    try {
      const success = await courseService.updateCategory(id, updates);
      if (success) {
        setCategories(categories.map(category =>
          category.id === id ? { ...category, ...updates } : category
        ));
      }
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const success = await courseService.deleteCategory(id);
      if (success) {
        setCategories(categories.filter(category => category.id !== id));
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    }
  };

  const handleUpdateModule = async (id: string, updates: Partial<CourseModule>) => {
    try {
      const success = await courseService.updateModule(id, updates);
      if (success) {
        const updatedModule = modules.find(m => m.id === id);
        if (updatedModule) {
          setModules(modules.map(module =>
            module.id === id ? { ...module, ...updates } : module
          ));

          // Update the corresponding course with the updated module
          // Handle case where module might be moved to a different course
          setCourses(courses.map(course => {
            // Remove module from old course if courseId changed
            if (updatedModule.courseId && course.id === updatedModule.courseId && updates.courseId && updates.courseId !== updatedModule.courseId) {
              return {
                ...course,
                modules: course.modules.filter(m => m.id !== id)
              };
            }
            // Add/update module in new course
            if (updates.courseId && course.id === updates.courseId) {
              const newModuleData = { ...updatedModule, ...updates };
              return {
                ...course,
                modules: [...course.modules.filter(m => m.id !== id), newModuleData]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
              };
            }
            // Update module in same course
            if (course.id === updatedModule.courseId && (!updates.courseId || updates.courseId === updatedModule.courseId)) {
              return {
                ...course,
                modules: course.modules.map(m =>
                  m.id === id ? { ...m, ...updates } : m
                ).sort((a, b) => (a.order || 0) - (b.order || 0))
              };
            }
            return course;
          }));
        }

        // Notify enrolled users of the update
        const module = modules.find(m => m.id === id);
        if (module?.courseId) {
          await notificationService.createNotification({
            userId: currentUser.id,
            title: 'Module Updated',
            message: `${currentUser.name} has updated a module.`,
            type: 'info',
            read: false,
            relatedEntityId: id,
            relatedEntityType: 'module'
          });
        }
      }
    } catch (err) {
      console.error('Error updating module:', err);
      setError('Failed to update module. Please try again.');
    }
  };

  const handleDeleteModule = async (id: string) => {
    try {
      const success = await courseService.deleteModule(id);
      if (success) {
        const deletedModule = modules.find(m => m.id === id);
        setModules(modules.filter(module => module.id !== id));

        // Remove the module from its course
        if (deletedModule) {
          setCourses(courses.map(course => {
            if (course.id === deletedModule.courseId) {
              return {
                ...course,
                modules: course.modules.filter(m => m.id !== id)
              };
            }
            return course;
          }));

          // Also update the modules state to ensure consistency
          setModules(modules.filter(module => module.id !== id));
        }
      }
    } catch (err) {
      console.error('Error deleting module:', err);
      setError('Failed to delete module. Please try again.');
    }
  };

  // Enrollment functions
  const handleEnrollStudent = async (profileId: string, courseId: string) => {
    try {
      console.log('Enrolling user:', profileId, 'in course:', courseId);
      const enrollment = await courseService.enrollInCourse(profileId, courseId);
      if (enrollment) {
        setEnrollments([...enrollments, enrollment]);
      } else {
        setError('Failed to enroll in course. Please try again.');
      }
    } catch (err) {
      console.error('Error enrolling student:', err);
      setError('Failed to enroll student. Please try again.');
    }
  };

  const handleUpdateEnrollment = async (id: string, updates: Partial<Enrollment>) => {
    try {
      const success = await courseService.updateEnrollment(id, updates);
      if (success) {
        setEnrollments(enrollments.map(enrollment =>
          enrollment.id === id ? { ...enrollment, ...updates } : enrollment
        ));
      }
    } catch (err) {
      console.error('Error updating enrollment:', err);
      setError('Failed to update enrollment. Please try again.');
    }
  };

  // Progress tracking functions
  const handleCompleteModule = async (moduleId: string) => {
    try {
      const success = await courseService.updateModuleProgress(
        currentUser.id,
        moduleId,
        { completed: true, completedAt: new Date() }
      );

      if (success) {
        // Update the progress state to include the newly completed module
        const updatedProgress = progress.map(p =>
          p.moduleId === moduleId
            ? { ...p, completed: true, completedAt: new Date() }
            : p
        );

        // If the module wasn't in the progress array before, add it
        if (!progress.some(p => p.moduleId === moduleId)) {
          updatedProgress.push({
            profileId: currentUser.id,
            moduleId,
            completed: true,
            completedAt: new Date()
          });
        }

        setProgress(updatedProgress);

        // Update enrollment progress
        const module = modules.find(m => m.id === moduleId);
        if (module?.courseId) {
          // Recalculate course progress and update enrollment using the updated progress
          const courseModules = modules.filter(m => m.courseId === module.courseId);
          const completedModules = courseModules.filter(m =>
            updatedProgress.some(p => p.moduleId === m.id && p.completed)
          ).length;

          const courseProgress = Math.round((completedModules / courseModules.length) * 100);

          // Find enrollment for this course and update progress
          const enrollment = enrollments.find(e =>
            e.profileId === currentUser.id && e.courseId === module.courseId
          );

          if (enrollment) {
            // Always update progress
            await handleUpdateEnrollment(enrollment.id, { progress: courseProgress });

            // Check if all modules are completed and update enrollment status if needed
            if (completedModules === courseModules.length && enrollment.status !== 'completed') {
              await handleUpdateEnrollment(enrollment.id, {
                progress: 100,
                status: 'completed'
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error completing module:', err);
      setError('Failed to mark module as complete. Please try again.');
    }
  };

  // Notification functions
  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await notificationService.markAsRead(id);
      if (success) {
        setNotifications(notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        ));
        setUnreadCount(unreadCount - 1);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await notificationService.markAllAsRead(currentUser.id);
      if (success) {
        setNotifications(notifications.map(notification =>
          ({ ...notification, read: true })
        ));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const success = await notificationService.deleteNotification(id);
      if (success) {
        setNotifications(notifications.filter(notification =>
          notification.id !== id
        ));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleUpdateNotificationPreferences = async (preferences: Partial<any>) => {
    try {
      const success = await notificationService.updatePreferences(
        currentUser.id,
        preferences
      );
      if (success && notificationPreferences) {
        setNotificationPreferences({
          ...notificationPreferences,
          ...preferences
        });
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err);
    }
  };

  // Export/Import functions
  const handleImportCourses = async (data: {
    courses: Course[],
    modules: CourseModule[],
    categories: CourseCategory[]
  }) => {
    try {
      // Import courses
      for (const course of data.courses) {
        await courseService.createCourse(course);
      }

      // Import modules
      for (const module of data.modules) {
        await courseService.createModule(module);
      }

      // Note: Category creation is not implemented in courseService
      // Categories are managed separately in the database

      // Reload data
      loadData();
    } catch (err) {
      console.error('Error importing courses:', err);
      setError('Failed to import course data. Please try again.');
    }
  };

  // Versioning functions
  const handleCreateVersion = async (courseId: string) => {
    try {
      // This would call a service function to create a new version
      // For now, we'll simulate the process
      setTimeout(() => {
        loadData(); // Reload data to show new version
      }, 2000);
    } catch (err) {
      console.error('Error creating course version:', err);
      setError('Failed to create course version. Please try again.');
    }
  };

  const handleSwitchVersion = async (courseId: string) => {
    try {
      // This would switch to a different version of the course
      // For now, we'll just reload the data
      loadData();
    } catch (err) {
      console.error('Error switching course version:', err);
      setError('Failed to switch course version. Please try again.');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading course management system...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 m-4">
        <div className="text-red-400 font-bold">Error</div>
        <div className="text-red-300">{error}</div>
        <button
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  // Admin view
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-trade-dark">
        {/* Admin Header */}
        <div className="bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between py-4 md:h-16 gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-trade-accent" />
                <h1 className="text-lg md:text-xl font-bold text-white truncate max-w-[250px] sm:max-w-none">
                  Course Management System
                </h1>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <NotificationSystem
                  notifications={notifications}
                  preferences={notificationPreferences}
                  unreadCount={unreadCount}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDelete={handleDeleteNotification}
                  onUpdatePreferences={handleUpdateNotificationPreferences}
                />

                <div className="flex items-center gap-2 text-white bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-800 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium truncate max-w-[100px]">{currentUser.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-6 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'courses', label: 'Courses', icon: BookOpen },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'enrollments', label: 'Enrollments', icon: Users },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                        ? 'border-trade-accent text-trade-accent'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'
                      }`}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Admin Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'courses' && (
            <EnhancedCourseBuilder
              courses={courses}
              modules={modules}
              categories={categories}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onAddModule={handleAddModule}
              onUpdateModule={handleUpdateModule}
              onDeleteModule={handleDeleteModule}
            />
          )}

          {activeTab === 'analytics' && (
            <AdminDashboardAnalytics
              courses={courses}
              modules={modules}
              enrollments={enrollments}
              progress={progress}
            />
          )}

          {activeTab === 'enrollments' && (
            <EnrollmentManager
              courses={courses}
              enrollments={enrollments}
              students={[]} // This would come from a student service
              onEnrollStudent={handleEnrollStudent}
              onUpdateEnrollment={handleUpdateEnrollment}
            />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <CategoryManager
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
              <CourseExportImport
                courses={courses}
                modules={modules}
                categories={categories}
                onImportCourses={handleImportCourses}
              />
              <DifficultyLevelManager
                levels={[]} // This would come from a levels service
                onSaveLevel={() => { }}
                onDeleteLevel={() => { }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Student view
  return (
    <div className="min-h-screen bg-trade-dark">
      {/* Student Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-trade-accent" />
              <h1 className="text-xl font-bold text-white">Learning Center</h1>
            </div>

            <div className="flex items-center gap-4">
              {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) && currentUser.id !== '00000000-0000-0000-0000-000000000000' && (
                <NotificationSystem
                  userId={currentUser.id} // Add the missing userId prop
                  notifications={notifications}
                  preferences={notificationPreferences}
                  unreadCount={unreadCount}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDelete={handleDeleteNotification}
                  onUpdatePreferences={handleUpdateNotificationPreferences}
                />
              )}

              <div className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                <span>{currentUser.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'courses'
                  ? 'border-trade-accent text-trade-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              <BookOpen className="h-4 w-4" /> Courses
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'progress'
                  ? 'border-trade-accent text-trade-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              <TrendingUp className="h-4 w-4" /> Progress
            </button>
          </div>
        </div>
      </div>

      {/* Student Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'courses' && (
          <EnhancedCourseViewer
            courses={courses}
            modules={modules}
            categories={categories}
            enrollments={enrollments.filter(e => e.profileId === currentUser.id)}
            progress={progress.filter(p => p.profileId === currentUser.id)}
            onEnroll={(courseId) => {
              console.log('Enroll button clicked for course:', courseId);
              handleEnrollStudent(currentUser.id, courseId);
            }}
            onCompleteModule={handleCompleteModule}
          />
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <ProgressTracker
              courses={courses}
              modules={modules}
              enrollments={enrollments.filter(e => e.profileId === currentUser.id)}
              progress={progress.filter(p => p.profileId === currentUser.id)}
              userId={currentUser.id}
            />
            <StudentProgressReport
              student={currentUser}
              courses={courses}
              modules={modules}
              enrollments={enrollments.filter(e => e.profileId === currentUser.id)}
              progress={progress.filter(p => p.profileId === currentUser.id)}
              onExportReport={() => { }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagementSystem;