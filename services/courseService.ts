import { Course, CourseModule, CourseCategory, CourseProgress, Enrollment } from '../types';
import { supabase } from '../supabase/client';

// Simple UUID v4 generator function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Course Service
export const courseService = {
  // Courses
  async getCourses(): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        duration: course.duration,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        categoryId: course.category_id,
        createdAt: new Date(course.created_at),
        updatedAt: new Date(course.updated_at),
        modules: [] // Will be populated separately
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  },

  async getCourseById(id: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        level: data.level,
        duration: data.duration,
        thumbnail: data.thumbnail,
        instructor: data.instructor,
        categoryId: data.category_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        modules: []
      };
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  },

  async createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules'>): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: course.title,
          description: course.description,
          level: course.level,
          duration: course.duration,
          thumbnail: course.thumbnail,
          instructor: course.instructor,
          category_id: course.categoryId || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        level: data.level,
        duration: data.duration,
        thumbnail: data.thumbnail,
        instructor: data.instructor,
        categoryId: data.category_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        modules: []
      };
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: updates.title,
          description: updates.description,
          level: updates.level,
          duration: updates.duration,
          thumbnail: updates.thumbnail,
          instructor: updates.instructor,
          category_id: updates.categoryId,
          updated_at: new Date()
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating course:', error);
      return false;
    }
  },

  async deleteCourse(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      return false;
    }
  },

  // Course Modules
  async getModules(): Promise<CourseModule[]> {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .order('order_number', { ascending: true });
      
      if (error) throw error;
      
      return data.map(module => ({
        id: module.id,
        courseId: module.course_id,
        title: module.title,
        description: module.description,
        duration: module.duration,
        level: module.level,
        content: module.content,
        contentType: module.content_type,
        completed: false, // Will be determined by user progress
        locked: false, // Will be determined by prerequisites
        order: module.order_number
      }));
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  },

  async getModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });
      
      if (error) throw error;
      
      return data.map(module => ({
        id: module.id,
        courseId: module.course_id,
        title: module.title,
        description: module.description,
        duration: module.duration,
        level: module.level,
        content: module.content,
        contentType: module.content_type,
        completed: false,
        locked: false,
        order: module.order_number
      }));
    } catch (error) {
      console.error('Error fetching modules by course ID:', error);
      return [];
    }
  },

  async createModule(module: Omit<CourseModule, 'id' | 'completed' | 'locked'>): Promise<CourseModule | null> {
    try {
      // Generate a UUID for the module since the database column doesn't have a default
      const moduleId = generateUUID();
      
      // Prepare insert data with proper defaults
      const insertData: any = {
        id: moduleId, // Include the generated ID
        title: module.title || 'Untitled Module',
        level: module.level || 'beginner',
        content_type: module.contentType || 'video'
      };
      
      // Add optional fields only if they exist
      if (module.courseId) insertData.course_id = module.courseId;
      if (module.description) insertData.description = module.description;
      if (module.duration) insertData.duration = module.duration;
      if (module.content) insertData.content = module.content;
      if (module.order !== undefined) insertData.order_number = module.order;
      
      // Log the insert data for debugging
      console.log('Inserting module with data:', insertData);
      
      const { data, error } = await supabase
        .from('course_modules')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        courseId: data.course_id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        level: data.level,
        content: data.content,
        contentType: data.content_type,
        completed: false,
        locked: false,
        order: data.order_number
      };
    } catch (error) {
      console.error('Error creating module:', error);
      return null;
    }
  },

  async updateModule(id: string, updates: Partial<CourseModule>): Promise<boolean> {
    try {
      // Build update object with only defined values
      const updateData: any = {};
      
      if (updates.courseId !== undefined) updateData.course_id = updates.courseId;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.level !== undefined) updateData.level = updates.level;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.contentType !== undefined) updateData.content_type = updates.contentType;
      if (updates.order !== undefined) updateData.order_number = updates.order;
      
      // Always update the updated_at timestamp
      updateData.updated_at = new Date();
      
      const { error } = await supabase
        .from('course_modules')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating module:', error);
      return false;
    }
  },

  async deleteModule(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting module:', error);
      return false;
    }
  },

  // Course Categories
  async getCategories(): Promise<CourseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('course_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async createCategory(category: Omit<CourseCategory, 'id'>): Promise<CourseCategory | null> {
    try {
      const { data, error } = await supabase
        .from('course_categories')
        .insert({
          name: category.name,
          description: category.description,
          color: category.color
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color
      };
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  },

  async updateCategory(id: string, updates: Partial<CourseCategory>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('course_categories')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('course_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  },

  // Enrollments
  async getEnrollments(profileId: string): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('profile_id', profileId);
      
      if (error) throw error;
      
      return data.map(enrollment => ({
        id: enrollment.id,
        profileId: enrollment.profile_id,
        courseId: enrollment.course_id,
        enrolledAt: new Date(enrollment.enrolled_at),
        status: enrollment.status,
        progress: enrollment.progress
      }));
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  },

  // For admin use - get all enrollments
  async getAllEnrollments(): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*');
      
      if (error) throw error;
      
      return data.map(enrollment => ({
        id: enrollment.id,
        profileId: enrollment.profile_id,
        courseId: enrollment.course_id,
        enrolledAt: new Date(enrollment.enrolled_at),
        status: enrollment.status,
        progress: enrollment.progress
      }));
    } catch (error) {
      console.error('Error fetching all enrollments:', error);
      return [];
    }
  },

  async enrollInCourse(profileId: string, courseId: string): Promise<Enrollment | null> {
    try {
      // First check if enrollment already exists
      const { data: existingEnrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('profile_id', profileId)
        .eq('course_id', courseId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      // If enrollment exists, return it
      if (existingEnrollment) {
        return {
          id: existingEnrollment.id,
          profileId: existingEnrollment.profile_id,
          courseId: existingEnrollment.course_id,
          enrolledAt: new Date(existingEnrollment.enrolled_at),
          status: existingEnrollment.status,
          progress: existingEnrollment.progress
        };
      }
      
      // Log the profileId and courseId for debugging
      console.log('Attempting to enroll user:', profileId, 'in course:', courseId);
      
      // Check current user authentication
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current user session:', session?.user?.id);
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error checking profile:', profileError);
        throw profileError;
      }
      
      if (!profile) {
        console.error('Profile not found for user:', profileId);
        throw new Error('User profile not found');
      }
      
      console.log('Profile found:', profile);
      
      // Check if course exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
      
      if (courseError) {
        console.error('Error checking course:', courseError);
        throw courseError;
      }
      
      if (!course) {
        console.error('Course not found:', courseId);
        throw new Error('Course not found');
      }
      
      console.log('Course found:', course);
      
      // Otherwise create new enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          profile_id: profileId,
          course_id: courseId,
          status: 'active',
          progress: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        profileId: data.profile_id,
        courseId: data.course_id,
        enrolledAt: new Date(data.enrolled_at),
        status: data.status,
        progress: data.progress
      };
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return null;
    }
  },

  async updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({
          status: updates.status,
          progress: updates.progress,
          completed_at: updates.status === 'completed' ? new Date() : undefined
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating enrollment:', error);
      return false;
    }
  },

  // Progress Tracking
  async getProgress(profileId: string): Promise<CourseProgress[]> {
    try {
      const { data, error } = await supabase
        .from('module_progress')
        .select('*')
        .eq('profile_id', profileId);
      
      if (error) throw error;
      
      return data.map(progress => ({
        profileId: progress.profile_id,
        moduleId: progress.module_id,
        completed: progress.completed,
        quizScore: progress.quiz_score,
        completedAt: progress.completed_at ? new Date(progress.completed_at) : undefined,
        timeSpent: progress.time_spent
      }));
    } catch (error) {
      console.error('Error fetching progress:', error);
      return [];
    }
  },

  // For admin use - get all progress
  async getAllProgress(): Promise<CourseProgress[]> {
    try {
      const { data, error } = await supabase
        .from('module_progress')
        .select('*');
      
      if (error) throw error;
      
      return data.map(progress => ({
        profileId: progress.profile_id,
        moduleId: progress.module_id,
        completed: progress.completed,
        quizScore: progress.quiz_score,
        completedAt: progress.completed_at ? new Date(progress.completed_at) : undefined,
        timeSpent: progress.time_spent
      }));
    } catch (error) {
      console.error('Error fetching all progress:', error);
      return [];
    }
  },

  // Get student course progress using RPC function
  async getStudentCourseProgress(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_student_course_progress', { user_id: userId });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student course progress:', error);
      return [];
    }
  },

  async updateModuleProgress(profileId: string, moduleId: string, updates: Partial<CourseProgress>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('module_progress')
        .upsert({
          profile_id: profileId,
          module_id: moduleId,
          completed: updates.completed,
          quiz_score: updates.quizScore,
          completed_at: updates.completedAt,
          time_spent: updates.timeSpent
        }, {
          onConflict: 'profile_id,module_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating module progress:', error);
      return false;
    }
  }
};