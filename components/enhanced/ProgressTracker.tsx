import React from 'react';
import { Course, CourseModule, CourseProgress, Enrollment } from '../../types';
import { 
  CheckCircle, Clock, BookOpen, User, TrendingUp, 
  Award, Target, Calendar, BarChart3, FileText
} from 'lucide-react';

interface ProgressTrackerProps {
  courses: Course[];
  modules: CourseModule[];
  enrollments: Enrollment[];
  progress: CourseProgress[];
  userId: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  courses,
  modules,
  enrollments,
  progress,
  userId
}) => {
  // Get user's enrolled courses
  const userEnrollments = enrollments.filter(e => e.profileId === userId);
  
  // Get user's progress
  const userProgress = progress.filter(p => p.profileId === userId);
  
  // Calculate statistics
  const totalEnrolledCourses = userEnrollments.length;
  const completedCourses = userEnrollments.filter(e => e.status === 'completed').length;
  const inProgressCourses = userEnrollments.filter(e => e.status === 'active').length;
  
  // Calculate overall progress percentage
  const overallProgress = totalEnrolledCourses > 0 
    ? Math.round((completedCourses / totalEnrolledCourses) * 100) 
    : 0;
  
  // Get course progress data
  const getCourseProgress = (courseId: string) => {
    const courseModules = modules.filter(m => m.courseId === courseId);
    if (courseModules.length === 0) return { progress: 0, completed: 0, total: 0 };
    
    const completedModules = courseModules.filter(module => {
      const moduleProgress = userProgress.find(p => p.moduleId === module.id);
      return moduleProgress?.completed;
    }).length;
    
    return {
      progress: Math.round((completedModules / courseModules.length) * 100),
      completed: completedModules,
      total: courseModules.length
    };
  };
  
  // Get recently completed modules
  const recentlyCompletedModules = userProgress
    .filter(p => p.completed && p.completedAt)
    .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
    .slice(0, 5)
    .map(progressItem => {
      const module = modules.find(m => m.id === progressItem.moduleId);
      const course = module ? courses.find(c => c.id === module.courseId) : null;
      return { ...progressItem, module, course };
    });
  
  // Get enrolled courses with progress
  const enrolledCoursesWithProgress = userEnrollments
    .map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      if (!course) return null;
      
      const progressData = getCourseProgress(enrollment.courseId);
      return { ...enrollment, course, progress: progressData };
    })
    .filter(Boolean) as (Enrollment & { course: Course, progress: { progress: number, completed: number, total: number } })[];

  return (
    <div className="text-white pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-trade-accent" />
            Learning Progress
          </h1>
          <p className="text-gray-400 mt-1">Track your course completion and achievements.</p>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalEnrolledCourses}</div>
              <div className="text-sm text-gray-400">Courses Enrolled</div>
            </div>
          </div>
        </div>
        
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedCourses}</div>
              <div className="text-sm text-gray-400">Courses Completed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Target className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{inProgressCourses}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
          </div>
        </div>
        
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <div className="text-sm text-gray-400">Overall Progress</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Progress Chart */}
        <div className="lg:col-span-2 bg-trade-dark border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Course Progress Overview
          </h3>
          
          {enrolledCoursesWithProgress.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrolledCoursesWithProgress.map(item => (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-white">{item.course.title}</span>
                    <span className="text-gray-400">{item.progress.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${item.progress.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{item.progress.completed} of {item.progress.total} modules completed</span>
                    <span>
                      {item.status === 'completed' ? 'Completed' : 
                       item.status === 'active' ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Achievements */}
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" /> Recent Achievements
          </h3>
          
          {recentlyCompletedModules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Complete modules to earn achievements.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentlyCompletedModules.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                  <div className="p-2 bg-green-500/20 rounded-lg mt-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">
                      {item.module?.title || 'Unknown Module'}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">
                      {item.course?.title || 'Unknown Course'}
                    </p>
                    {item.completedAt && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed Course Progress */}
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Detailed Course Progress
        </h3>
        
        {enrolledCoursesWithProgress.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>You haven't enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {enrolledCoursesWithProgress.map(item => {
              const courseModules = modules.filter(m => m.courseId === item.courseId);
              
              return (
                <div key={item.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="font-bold text-white text-lg">{item.course.title}</h4>
                      <p className="text-gray-400 text-sm">{item.course.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold">{item.progress.progress}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                      <div className="w-16 h-16">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="3"
                          />
                          <path className="circle"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            strokeDasharray={`${item.progress.progress}, 100`}
                          />
                          <text x="18" y="20.5" className="percentage" fill="#fff" fontSize="8" textAnchor="middle" dy="0.3em">
                            {item.progress.progress}%
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {courseModules.map(module => {
                      const moduleProgress = userProgress.find(p => p.moduleId === module.id);
                      const isCompleted = moduleProgress?.completed;
                      
                      return (
                        <div 
                          key={module.id} 
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/20"
                        >
                          <div className={`p-1.5 rounded ${isCompleted ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-500"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className={`font-medium ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                              {module.title}
                            </h5>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {module.duration}
                              </span>
                              {module.contentType === 'video' ? (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                  </svg>
                                  Video
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-purple-400">
                                  <FileText className="h-3 w-3" /> Text
                                </span>
                              )}
                            </div>
                          </div>
                          {isCompleted && moduleProgress?.completedAt && (
                            <div className="text-xs text-gray-500">
                              {new Date(moduleProgress.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;