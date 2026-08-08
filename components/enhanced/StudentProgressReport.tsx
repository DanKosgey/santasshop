import React from 'react';
import { Course, CourseModule, CourseProgress, Enrollment, StudentProfile } from '../../types';
import { 
  User, BookOpen, CheckCircle, Clock, TrendingUp, 
  Award, Target, Calendar, BarChart3, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';

interface StudentProgressReportProps {
  student: StudentProfile;
  courses: Course[];
  modules: CourseModule[];
  enrollments: Enrollment[];
  progress: CourseProgress[];
  onExportReport: (studentId: string) => void;
}

const StudentProgressReport: React.FC<StudentProgressReportProps> = ({
  student,
  courses,
  modules,
  enrollments,
  progress,
  onExportReport
}) => {
  // Get student's enrollments
  const studentEnrollments = enrollments.filter(e => e.profileId === student.id);
  
  // Get student's progress
  const studentProgress = progress.filter(p => p.profileId === student.id);
  
  // Calculate statistics
  const totalEnrolledCourses = studentEnrollments.length;
  const completedCourses = studentEnrollments.filter(e => e.status === 'completed').length;
  const inProgressCourses = studentEnrollments.filter(e => e.status === 'active').length;
  
  // Calculate overall progress percentage
  const overallProgress = totalEnrolledCourses > 0 
    ? Math.round((completedCourses / totalEnrolledCourses) * 100) 
    : 0;
  
  // Get course progress data
  const getCourseProgress = (courseId: string) => {
    const courseModules = modules.filter(m => m.courseId === courseId);
    if (courseModules.length === 0) return { progress: 0, completed: 0, total: 0 };
    
    const completedModules = courseModules.filter(module => {
      const moduleProgress = studentProgress.find(p => p.moduleId === module.id);
      return moduleProgress?.completed;
    }).length;
    
    return {
      progress: Math.round((completedModules / courseModules.length) * 100),
      completed: completedModules,
      total: courseModules.length
    };
  };
  
  // Get recently completed modules
  const recentlyCompletedModules = studentProgress
    .filter(p => p.completed && p.completedAt)
    .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
    .slice(0, 5)
    .map(progressItem => {
      const module = modules.find(m => m.id === progressItem.moduleId);
      const course = module ? courses.find(c => c.id === module.courseId) : null;
      return { ...progressItem, module, course };
    });
  
  // Get enrolled courses with progress
  const enrolledCoursesWithProgress = studentEnrollments
    .map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      if (!course) return null;
      
      const progressData = getCourseProgress(enrollment.courseId);
      return { ...enrollment, course, progress: progressData };
    })
    .filter(Boolean) as (Enrollment & { course: Course, progress: { progress: number, completed: number, total: number } })[];

  // Get progress trend data (simplified for demo)
  const getProgressTrendData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate progress data
      const progressValue = Math.min(100, Math.floor(Math.random() * (overallProgress + 20)) + (overallProgress - 10));
      
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        progress: Math.max(0, progressValue)
      });
    }
    
    return data;
  };

  // Get module type distribution
  const getModuleTypeDistribution = () => {
    const distribution: Record<string, number> = {
      video: 0,
      text: 0
    };
    
    studentProgress.forEach(progressItem => {
      if (progressItem.completed) {
        const module = modules.find(m => m.id === progressItem.moduleId);
        if (module?.contentType) {
          distribution[module.contentType] = (distribution[module.contentType] || 0) + 1;
        }
      }
    });
    
    return [
      { name: 'Video Modules', value: distribution.video, color: '#3B82F6' },
      { name: 'Text Modules', value: distribution.text, color: '#8B5CF6' }
    ];
  };

  // Data for charts
  const progressTrendData = getProgressTrendData();
  const moduleTypeDistribution = getModuleTypeDistribution();

  return (
    <div className="text-white pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-trade-accent" />
            Student Progress Report
          </h1>
          <p className="text-gray-400 mt-1">Detailed progress report for {student.name}</p>
        </div>
        
        <button
          onClick={() => onExportReport(student.id)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition shadow-lg shadow-blue-900/20"
        >
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>
      
      {/* Student Info */}
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold">
              {student.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{student.name}</h2>
              <p className="text-gray-400">{student.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold capitalize ${
                  student.tier === 'free' ? 'bg-gray-500/20 text-gray-400' :
                  student.tier === 'foundation' ? 'bg-green-500/20 text-green-400' :
                  student.tier === 'professional' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {student.tier} Tier
                </span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                  student.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  student.status === 'at-risk' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{totalEnrolledCourses}</div>
              <div className="text-xs text-gray-400">Courses Enrolled</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{completedCourses}</div>
              <div className="text-xs text-gray-400">Courses Completed</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{overallProgress}%</div>
              <div className="text-xs text-gray-400">Overall Progress</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{studentProgress.filter(p => p.completed).length}</div>
              <div className="text-xs text-gray-400">Modules Completed</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress Trend */}
        <div className="lg:col-span-2 bg-trade-dark border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Progress Trend (Last 7 Days)
          </h3>
          <div className="h-80" style={{minHeight: '200px'}}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={progressTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    borderColor: '#374151', 
                    borderRadius: '0.5rem' 
                  }} 
                  formatter={(value) => [`${value}%`, 'Progress']}
                />
                <Area 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Module Type Distribution */}
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Completed Modules by Type
          </h3>
          <div className="h-80" style={{minHeight: '200px'}}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={moduleTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {moduleTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    borderColor: '#374151', 
                    borderRadius: '0.5rem' 
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Detailed Course Progress */}
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Course Progress Details
        </h3>
        
        {enrolledCoursesWithProgress.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>This student hasn't enrolled in any courses yet.</p>
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
                    <div className="flex items-center gap-6">
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
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        item.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {courseModules.map(module => {
                      const moduleProgress = studentProgress.find(p => p.moduleId === module.id);
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
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                  </svg>
                                  Text
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
      
      {/* Recent Achievements */}
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" /> Recent Completed Modules
        </h3>
        
        {recentlyCompletedModules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No modules completed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
};

export default StudentProgressReport;