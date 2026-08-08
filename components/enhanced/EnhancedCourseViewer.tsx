import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Course, CourseModule, CourseCategory, CourseProgress, Enrollment
} from '../../types';
import {
  GraduationCap, Clock, CheckCircle, Lock, PlayCircle,
  BookOpen, Filter, Search, ChevronDown, ChevronRight,
  User, Tag, Layers, FileText, Heart, Award, ArrowRight
} from 'lucide-react';

interface EnhancedCourseViewerProps {
  courses: Course[];
  modules: CourseModule[];
  categories: CourseCategory[];
  enrollments: Enrollment[];
  progress: CourseProgress[];
  onEnroll: (courseId: string) => void;
  onCompleteModule: (moduleId: string) => void;
}

type ViewerTab = 'all' | 'enrolled' | 'completed' | 'bookmarked';

const STORAGE_VIEW_KEY = 'courseViewerState';
const STORAGE_BOOKMARKS_KEY = 'courseBookmarks';

const EnhancedCourseViewer: React.FC<EnhancedCourseViewerProps> = ({
  courses,
  modules,
  categories,
  enrollments,
  progress,
  onEnroll,
  onCompleteModule
}) => {
  const [activeTab, setActiveTab] = useState<ViewerTab>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical' | 'duration' | 'level'>('newest');
  const [courseLastModules, setCourseLastModules] = useState<Record<string, string>>({});
  const [bookmarkedCourses, setBookmarkedCourses] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Restore state on mount
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      if (savedBookmarks) {
        setBookmarkedCourses(JSON.parse(savedBookmarks));
      }
    } catch { }

    try {
      const saved = localStorage.getItem(STORAGE_VIEW_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveTab(parsed.activeTab || 'all');
        setSearchTerm(parsed.searchTerm || '');
        setSelectedCategory(parsed.selectedCategory || 'all');
        setSortBy(parsed.sortBy || 'newest');
        setExpandedCourses(parsed.expandedCourses || {});
        setCourseLastModules(parsed.courseLastModules || {});
        if (parsed.selectedCourseId) {
          const course = courses.find(c => c.id === parsed.selectedCourseId);
          if (course && enrollments.some(e => e.courseId === course.id && (e.status === 'active' || e.status === 'completed'))) {
            setSelectedCourse(course);
            if (parsed.selectedModuleId) {
              const mod = modules.find(m => m.id === parsed.selectedModuleId && m.courseId === course.id);
              if (mod) {
                setSelectedModule(mod);
              }
            }
          }
        }
      }
    } catch { }
  }, [courses, modules, enrollments]);

  // Save view state
  useEffect(() => {
    const state = {
      activeTab,
      searchTerm,
      selectedCategory,
      sortBy,
      expandedCourses,
      courseLastModules,
      selectedCourseId: selectedCourse?.id,
      selectedModuleId: selectedModule?.id,
    };
    localStorage.setItem(STORAGE_VIEW_KEY, JSON.stringify(state));
  }, [activeTab, searchTerm, selectedCategory, sortBy, expandedCourses, courseLastModules, selectedCourse, selectedModule]);

  // Save bookmarks
  useEffect(() => {
    localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarkedCourses));
  }, [bookmarkedCourses]);

  const parseDuration = useCallback((duration: string): number => {
    let totalMinutes = 0;
    const hourMatch = duration.match(/(\d+)h/);
    const minuteMatch = duration.match(/(\d+)m/);
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);
    return totalMinutes;
  }, []);

  const getCourseModules = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? [...course.modules].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  };

  const getModuleProgress = (moduleId: string) => {
    return progress.find(p => p.moduleId === moduleId);
  };

  const getCourseProgress = (courseId: string) => {
    const courseModules = getCourseModules(courseId);
    if (courseModules.length === 0) return 0;

    const completedModules = courseModules.filter(module => {
      const moduleProgress = getModuleProgress(module.id);
      return moduleProgress?.completed;
    }).length;

    return Math.round((completedModules / courseModules.length) * 100);
  };

  const isModuleUnlocked = (module: CourseModule) => {
    const courseModules = getCourseModules(module.courseId || '');
    const moduleIndex = courseModules.findIndex(m => m.id === module.id);

    if (moduleIndex === 0) return true;

    const previousModule = courseModules[moduleIndex - 1];
    const previousProgress = getModuleProgress(previousModule.id);
    return previousProgress?.completed || false;
  };

  const getResumeModule = (courseId: string): CourseModule | null => {
    const courseModules = getCourseModules(courseId);
    if (courseModules.length === 0) return null;

    const unlockedModules = courseModules.filter(isModuleUnlocked);

    const lastModuleId = courseLastModules[courseId];
    let resumeModule = lastModuleId ? courseModules.find(m => m.id === lastModuleId) : null;

    if (resumeModule && getModuleProgress(resumeModule.id)?.completed) {
      resumeModule = null;
    }

    if (!resumeModule) {
      resumeModule = unlockedModules.find(m => !getModuleProgress(m.id)?.completed) || unlockedModules[0];
    }

    return resumeModule;
  };

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const handleSelectModule = (module: CourseModule) => {
    if (isModuleUnlocked(module)) {
      setSelectedModule(module);
      setCourseLastModules(prev => ({
        ...prev,
        [module.courseId || '']: module.id
      }));
    }
  };

  const toggleBookmark = (courseId: string) => {
    setBookmarkedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || course.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (b.createdAt || 0) - (a.createdAt || 0); // Assuming courses have createdAt timestamp
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'duration':
        return parseDuration(a.duration) - parseDuration(b.duration);
      case 'level':
        const levels = { beginner: 0, intermediate: 1, advanced: 2 };
        return levels[a.level] - levels[b.level];
      default:
        return 0;
    }
  });

  const enrolledCourses = filteredCourses.filter(course =>
    enrollments.some(e => e.courseId === course.id && e.status === 'active')
  );

  const completedCourses = filteredCourses.filter(course =>
    enrollments.some(e => e.courseId === course.id && e.status === 'completed')
  );

  const bookmarkedFiltered = filteredCourses.filter(course =>
    bookmarkedCourses.includes(course.id)
  );

  const getCoursesToShow = () => {
    switch (activeTab) {
      case 'enrolled': return enrolledCourses;
      case 'completed': return completedCourses;
      case 'bookmarked': return bookmarkedFiltered;
      default: return filteredCourses;
    }
  };

  const renderCourseCard = (course: Course) => {
    const courseProgress = getCourseProgress(course.id);
    const isEnrolled = enrollments.some(e => e.courseId === course.id && e.status === 'active');
    const isCompleted = enrollments.some(e => e.courseId === course.id && e.status === 'completed');
    const courseModules = getCourseModules(course.id);
    const category = categories.find(c => c.id === course.categoryId);
    const isBookmarked = bookmarkedCourses.includes(course.id);

    return (
      <div
        key={course.id}
        className="group relative bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl bg-gray-800/50 text-blue-400 group-hover:scale-110 transition-transform`}>
              <BookOpen className="h-6 w-6" />
            </div>
            <button
              onClick={() => toggleBookmark(course.id)}
              className={`p-2 rounded-xl transition-all ${isBookmarked ? 'bg-red-500/10 text-red-500' : 'bg-gray-800/50 text-gray-500 hover:text-white'}`}
            >
              <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              {category && (
                <span
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                    border: `1px solid ${category.color}30`
                  }}
                >
                  {category.name}
                </span>
              )}
              {isCompleted && (
                <span className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-500/20">
                  <CheckCircle className="h-3 w-3" /> Mastered
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors">
              {course.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-black/20 rounded-2xl p-3 border border-gray-800/50">
              <span className="text-[10px] text-gray-600 block uppercase font-black mb-1">Duration</span>
              <span className="text-xs text-gray-300 font-bold flex items-center gap-1.5 font-mono">
                <Clock className="h-3 w-3 text-blue-500" /> {course.duration}
              </span>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 border border-gray-800/50">
              <span className="text-[10px] text-gray-600 block uppercase font-black mb-1">Difficulty</span>
              <span className={`text-xs font-bold capitalize flex items-center gap-1.5 ${course.level === 'beginner' ? 'text-green-400' :
                course.level === 'intermediate' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                <Layers className="h-3 w-3" /> {course.level}
              </span>
            </div>
          </div>

          {isEnrolled && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-gray-600 uppercase font-black">Progression</span>
                <span className="text-xs font-black text-blue-400">{courseProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                  style={{ width: `${courseProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!isEnrolled && !isCompleted ? (
              <button
                onClick={() => onEnroll(course.id)}
                className="w-full px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              >
                Start Curriculum
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedCourse(course);
                  const resumeModule = getResumeModule(course.id);
                  if (resumeModule && !isCompleted) {
                    handleSelectModule(resumeModule);
                  }
                }}
                className="w-full px-4 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black text-sm transition-all border border-gray-700 active:scale-[0.98]"
              >
                {isCompleted ? 'Review Concept' : 'Continue Path'}
              </button>
            )}

            <button
              onClick={() => toggleCourseExpansion(course.id)}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors text-xs font-bold"
            >
              {expandedCourses[course.id] ? 'Hide Syllabus' : 'View Syllabus Overview'}
            </button>
          </div>

          {isCompleted && (
            <button
              onClick={() => { }}
              className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
            >
              <Award className="h-4 w-4" /> Claim Certificate
            </button>
          )}
        </div>

        {expandedCourses[course.id] && (
          <div className="border-t border-gray-800 bg-black/40">
            <div className="p-6">
              <div className="space-y-2">
                {courseModules.map((module, index) => {
                  const mProgress = getModuleProgress(module.id);
                  const unlocked = isModuleUnlocked(module);
                  const done = mProgress?.completed;

                  return (
                    <div
                      key={module.id}
                      onClick={() => unlocked && handleSelectModule(module)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${done ? 'bg-green-500/5 border-green-500/20' :
                        unlocked ? 'bg-gray-800/30 border-gray-700 hover:border-blue-500/50 cursor-pointer' :
                          'opacity-40 border-gray-800 grayscale cursor-not-allowed'
                        }`}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${done ? 'bg-green-500 text-white' :
                        unlocked ? 'bg-blue-600 text-white' :
                          'bg-gray-800 text-gray-500'
                        }`}>
                        {done ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{module.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {module.duration}</span>
                          {module.contentType === 'video' ? <span className="text-blue-400/80">Video</span> : <span className="text-purple-400/80">Guide</span>}
                        </div>
                      </div>
                      {!unlocked && <Lock className="h-3 w-3 text-gray-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCourseDetail = () => {
    if (!selectedCourse) return null;

    const courseModules = getCourseModules(selectedCourse.id);
    const courseProgress = getCourseProgress(selectedCourse.id);
    const isEnrolled = enrollments.some(e => e.courseId === selectedCourse.id && e.status === 'active');
    const category = categories.find(c => c.id === selectedCourse.categoryId);

    return (
      <div className="text-white animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <button
          onClick={() => setSelectedCourse(null)}
          className="group flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-all"
        >
          <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Curriculum</span>
        </button>

        <div className="relative overflow-hidden rounded-3xl bg-gray-900/60 backdrop-blur-md border border-gray-800 p-6 md:p-10 mb-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <BookOpen className="h-48 w-48" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {category && (
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest"
                    style={{
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                      border: `1px solid ${category.color}30`
                    }}
                  >
                    {category.name}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-500/20">
                  {selectedCourse.level}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                {selectedCourse.title}
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                {selectedCourse.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" /> {selectedCourse.duration}
                </span>
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" /> {courseModules.length} Modules
                </span>
                {selectedCourse.instructor && (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" /> {selectedCourse.instructor}
                  </span>
                )}
              </div>
            </div>

            <div className="lg:w-80 shrink-0">
              <div className="bg-black/40 rounded-3xl p-6 border border-gray-800">
                {!isEnrolled ? (
                  <button
                    onClick={() => onEnroll(selectedCourse.id)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                  >
                    Enroll Now
                  </button>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Progress</span>
                      <span className="text-2xl font-black text-blue-400">{courseProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                        style={{ width: `${courseProgress}%` }}
                      ></div>
                    </div>
                    <button
                      onClick={() => {
                        const resumeModule = getResumeModule(selectedCourse.id);
                        if (resumeModule) handleSelectModule(resumeModule);
                      }}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      {courseProgress > 0 ? 'Continue' : 'Start Now'}
                    </button>
                    {courseProgress === 100 && (
                      <button
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-green-600/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Award className="h-5 w-5" /> Certificate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white flex items-center gap-3 ml-2">
            <Layers className="h-6 w-6 text-blue-500" />
            Curriculum Roadmap
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {courseModules.map((module, index) => {
              const mProgress = getModuleProgress(module.id);
              const unlocked = isModuleUnlocked(module);
              const done = mProgress?.completed;

              return (
                <div
                  key={module.id}
                  onClick={() => unlocked && handleSelectModule(module)}
                  className={`group p-5 rounded-3xl border transition-all duration-300 ${done ? 'bg-green-500/5 border-green-500/20' :
                    unlocked ? 'bg-gray-900/40 border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/40 cursor-pointer shadow-lg' :
                      'bg-gray-900/20 border-gray-800/50 opacity-50 grayscale cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transition-transform group-hover:scale-110 ${done ? 'bg-green-500 text-white shadow-green-500/20' :
                      unlocked ? 'bg-blue-600 text-white shadow-blue-600/20' :
                        'bg-gray-800 text-gray-500'
                      }`}>
                      {done ? <CheckCircle className="h-6 w-6" /> : index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-black text-lg transition-colors truncate ${unlocked ? 'text-white' : 'text-gray-500'
                          }`}>
                          {module.title}
                        </h3>
                        {done && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-lg font-black uppercase">Done</span>}
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-1">{module.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-500" /> {module.duration}</span>
                        {module.contentType === 'video' ? (
                          <span className="flex items-center gap-1.5 text-blue-400/80"><PlayCircle className="h-3.5 w-3.5" /> Video Lecture</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-purple-400/80"><FileText className="h-3.5 w-3.5" /> Technical Guide</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!unlocked ? (
                        <div className="p-2 bg-gray-800/80 rounded-xl">
                          <Lock className="h-4 w-4 text-gray-500" />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-xl transition-all ${done ? 'text-green-500' : 'text-gray-700 group-hover:text-blue-500'}`}>
                          <ChevronRight className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderModuleDetail = () => {
      if (!selectedModule) return null;

      const moduleProgress = getModuleProgress(selectedModule.id);
      const isCompleted = moduleProgress?.completed;

      const getEmbedUrl = (url: string | undefined) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=1`;
        } else if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=1`;
        }
        return url;
      };

      const embedUrl = selectedModule.contentType === 'video' ? getEmbedUrl(selectedModule.content) : null;

      return (
        <div className="text-white max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-20">
          <button
            onClick={() => setSelectedModule(null)}
            className="group flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-all"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-black uppercase tracking-widest">Back to Overview</span>
          </button>

          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
            {selectedModule.contentType === 'video' ? (
              <div className="relative group/player">
                <div className="aspect-video bg-black relative">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={selectedModule.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-gray-900/50">
                      <PlayCircle className="h-20 w-20 mb-4 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-sm">Media stream unavailable</p>
                    </div>
                  )}
                </div>
                <div className="p-8 bg-gradient-to-b from-gray-900/50 to-gray-900">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">{selectedModule.title}</h2>
                      <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-500">
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-blue-500" /> {selectedModule.duration}</span>
                        <span className="flex items-center gap-1.5 text-blue-400"><PlayCircle className="h-4 w-4" /> Professional Lecture</span>
                      </div>
                    </div>

                    {!isCompleted ? (
                      <button
                        onClick={() => onCompleteModule(selectedModule.id)}
                        className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                      >
                        Complete Lecture <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 px-6 py-3 bg-green-500/10 text-green-400 rounded-2xl font-black border border-green-500/20">
                        <CheckCircle className="h-5 w-5" /> Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedModule.title}</h2>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Technical Publication</p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none text-gray-300">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{selectedModule.content}</p>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 flex justify-between items-center">
                  <div className="text-sm font-bold text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Est. Reading Time: {selectedModule.duration}
                  </div>
                  {!isCompleted ? (
                    <button
                      onClick={() => onCompleteModule(selectedModule.id)}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      Mark as Read & Complete
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 px-6 py-3 bg-green-500/10 text-green-400 rounded-2xl font-black border border-green-500/20">
                      <CheckCircle className="h-5 w-5" /> Verified Knowledge
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    if (selectedModule) return renderModuleDetail();
    if (selectedCourse) return renderCourseDetail();

    const lastAccessedCourse = useMemo(() => {
      const active = enrollments.find(e => e.status === 'active');
      return active ? courses.find(c => c.id === active.courseId) : courses[0];
    }, [enrollments, courses]);

    return (
      <div className="text-white space-y-8 pb-20">
        {/* Premium Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-900 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <GraduationCap className="h-32 w-32" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Award className="h-4 w-4 text-yellow-400" />
              <span>Zeta Expert Learning</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Accelerate Your <br />
              <span className="text-blue-200">Trading Journey</span>
            </h1>
            <p className="text-blue-100 text-sm md:text-base opacity-90 mb-6 max-w-md">
              Master the markets with institutional-grade curriculum and real-time strategy analysis.
            </p>

            {lastAccessedCourse && (
              <button
                onClick={() => setSelectedCourse(lastAccessedCourse)}
                className="group flex items-center gap-3 bg-white text-blue-900 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95"
              >
                Resume Learning <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </section>

        {/* Navigation & Search Panel */}
        <div className="sticky top-0 z-40 bg-trade-dark/80 backdrop-blur-xl border-y border-gray-800 -mx-4 px-4 py-4 md:rounded-2xl md:mx-0 md:border md:static">
          <div className="flex flex-col gap-4">
            {/* Top Row: Tabs & Search Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex overflow-x-auto no-scrollbar gap-2 snap-x">
                {[
                  { id: 'all', label: 'All', icon: Layers },
                  { id: 'enrolled', label: 'Enrolled', icon: BookOpen },
                  { id: 'completed', label: 'Done', icon: CheckCircle },
                  { id: 'bookmarked', label: 'Saved', icon: Heart }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ViewerTab)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-start ${activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105'
                      : 'bg-gray-800/50 text-gray-400 hover:text-white'
                      }`}
                  >
                    <tab.icon className="h-4 w-4" /> {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="p-2.5 bg-gray-800 rounded-xl border border-gray-700 text-white lg:hidden"
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Desktop Filters */}
            <div className={`flex flex-col md:flex-row gap-3 ${showMobileFilters ? 'flex' : 'hidden lg:flex'}`}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search curriculum..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                >
                  <option value="all">All Channels</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                >
                  <option value="newest">Recent</option>
                  <option value="alphabetical">A-Z</option>
                  <option value="duration">Length</option>
                  <option value="level">Skill</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getCoursesToShow().length > 0 ? (
            getCoursesToShow().map(renderCourseCard)
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-900/40 rounded-3xl border border-dashed border-gray-800">
              <BookOpen className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No courses found</h3>
              <p className="text-gray-600 mt-2">Adjust your filters or try a different search term.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  export default EnhancedCourseViewer;