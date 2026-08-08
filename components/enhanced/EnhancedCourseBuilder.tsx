import React, { useState, useEffect } from 'react';
import { Course, CourseModule, QuizQuestion, CourseCategory } from '../../types';
import {
  Plus, Edit2, Trash2, Video, FileText, Save, X,
  Layers, GraduationCap, Clock, CheckCircle, CheckSquare, List, HelpCircle,
  BookOpen, Link, Tag, User, Image as ImageIcon
} from 'lucide-react';

interface EnhancedCourseBuilderProps {
  courses: Course[];
  modules: CourseModule[];
  categories: CourseCategory[];
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (id: string, course: Partial<Course>) => void;
  onDeleteCourse: (id: string) => void;
  onAddModule: (module: CourseModule) => void;
  onUpdateModule: (id: string, module: Partial<CourseModule>) => void;
  onDeleteModule: (id: string) => void;
}

const EnhancedCourseBuilder: React.FC<EnhancedCourseBuilderProps> = ({
  courses,
  modules,
  categories,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddModule,
  onUpdateModule,
  onDeleteModule
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'modules'>('courses');
  const [isEditing, setIsEditing] = useState(false);
  const [editingType, setEditingType] = useState<'course' | 'module'>('course');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [courseFormData, setCourseFormData] = useState<Partial<Course>>({
    title: '',
    description: '',
    level: 'beginner',
    duration: '',
    instructor: '',
    categoryId: '',
    thumbnail: ''
  });

  const [moduleFormData, setModuleFormData] = useState<Partial<CourseModule>>({
    title: '',
    description: '',
    duration: '',
    level: 'beginner',
    content: '',
    contentType: 'video',
    courseId: '',
    order: 1
  });

  const handleAddNewCourse = () => {
    setEditingType('course');
    setEditingId(null);
    setCourseFormData({
      title: '',
      description: '',
      level: 'beginner',
      duration: '',
      instructor: '',
      categoryId: '',
      thumbnail: ''
    });
    setIsEditing(true);
  };

  const handleAddNewModule = () => {
    setEditingType('module');
    setEditingId(null);
    // Find the first course to pre-select, or use empty string if no courses exist
    const firstCourseId = courses.length > 0 ? courses[0].id : '';
    // Calculate the next order number for the selected course
    const nextOrder = firstCourseId ?
      (courses.find(c => c.id === firstCourseId)?.modules.length || 0) + 1 :
      1;

    setModuleFormData({
      title: '',
      description: '',
      duration: '',
      level: 'beginner',
      content: '',
      contentType: 'video',
      courseId: firstCourseId,
      order: nextOrder
    });
    setIsEditing(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingType('course');
    setEditingId(course.id);
    setCourseFormData({
      ...course,
      title: course.title || '',
      description: course.description || '',
      duration: course.duration || '',
      instructor: course.instructor || '',
      thumbnail: course.thumbnail || ''
    });
    setIsEditing(true);
  };

  const handleEditModule = (module: CourseModule) => {
    setEditingType('module');
    setEditingId(module.id);
    // Handle potential null values in quiz data
    const processedQuiz = module.quiz ? {
      ...module.quiz,
      questions: module.quiz.questions.map(q => ({
        ...q,
        text: q.text || '',
        options: q.options.map(opt => opt || '')
      }))
    } : undefined;

    setModuleFormData({
      ...module,
      courseId: module.courseId || '', // Ensure courseId is never null
      content: module.content || '',
      order: module.order || 1,
      quiz: processedQuiz
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingType === 'course') {
      if (editingId) {
        // Update existing course
        onUpdateCourse(editingId, courseFormData);
      } else {
        // Create new course
        const newCourse: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules'> = {
          title: courseFormData.title || 'Untitled Course',
          description: courseFormData.description || '',
          level: courseFormData.level || 'beginner',
          duration: courseFormData.duration || '0h',
          instructor: courseFormData.instructor || '',
          categoryId: courseFormData.categoryId || undefined
        };
        onAddCourse(newCourse as Course);
      }
    } else {
      // Module editing
      if (editingId) {
        // Update existing module
        onUpdateModule(editingId, moduleFormData);
      } else {
        // Create new module
        const newModule: Omit<CourseModule, 'id' | 'completed' | 'locked'> = {
          courseId: moduleFormData.courseId || '' as string,
          title: moduleFormData.title || 'Untitled Module',
          description: moduleFormData.description || '',
          duration: moduleFormData.duration || '0m',
          level: moduleFormData.level || 'beginner',
          content: moduleFormData.content || '',
          contentType: moduleFormData.contentType || 'video',
          order: moduleFormData.order && moduleFormData.order > 0 ? moduleFormData.order :
            (moduleFormData.courseId ?
              (modules.filter(m => m.courseId === moduleFormData.courseId).length || 0) + 1 :
              1)
        };
        onAddModule(newModule as CourseModule);
      }
    }
    setIsEditing(false);
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm('Are you sure you want to delete this course? All modules within this course will also be deleted.')) {
      onDeleteCourse(id);
    }
  };

  const handleDeleteModule = (id: string) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      onDeleteModule(id);
    }
  };

  // --- Quiz Builder Helpers ---
  const handleAddQuestion = () => {
    const currentQuiz = moduleFormData.quiz || { id: Date.now().toString(), questions: [], passingScore: 70 };
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    };
    setModuleFormData({
      ...moduleFormData,
      quiz: {
        ...currentQuiz,
        questions: [...currentQuiz.questions, newQuestion]
      }
    });
  };

  const handleUpdateQuestion = (qId: string, field: keyof QuizQuestion, value: any) => {
    if (!moduleFormData.quiz) return;
    const updatedQuestions = moduleFormData.quiz.questions.map(q =>
      q.id === qId ? { ...q, [field]: value } : q
    );
    setModuleFormData({ ...moduleFormData, quiz: { ...moduleFormData.quiz, questions: updatedQuestions } });
  };

  const handleOptionChange = (qId: string, optIndex: number, value: string) => {
    if (!moduleFormData.quiz) return;
    const updatedQuestions = moduleFormData.quiz.questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setModuleFormData({ ...moduleFormData, quiz: { ...moduleFormData.quiz, questions: updatedQuestions } });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!moduleFormData.quiz) return;
    const updatedQuestions = moduleFormData.quiz.questions.filter(q => q.id !== qId);
    setModuleFormData({ ...moduleFormData, quiz: { ...moduleFormData.quiz, questions: updatedQuestions } });
  };

  return (
    <div className="text-white h-full flex flex-col pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
            <span className="truncate">Enhanced Course Curriculum</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Build and organize your complete trading academy content.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 font-bold flex items-center gap-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'courses'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          <BookOpen className="h-4 w-4" /> Courses
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 font-bold flex items-center gap-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'modules'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          <Layers className="h-4 w-4" /> Modules
        </button>
      </div>

      {isEditing ? (
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId
                ? editingType === 'course' ? 'Edit Course' : 'Edit Module'
                : editingType === 'course' ? 'Create New Course' : 'Create New Module'}
            </h2>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {editingType === 'course' ? (
              // Course Form
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Course Title</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      placeholder="e.g. Market Structure Mastery"
                      value={courseFormData.title}
                      onChange={e => setCourseFormData({ ...courseFormData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Instructor</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none pl-10"
                        placeholder="Instructor name"
                        value={courseFormData.instructor}
                        onChange={e => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Description</label>
                  <textarea
                    required
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24 resize-none"
                    placeholder="Brief summary of what students will learn..."
                    value={courseFormData.description}
                    onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-12 gap-6">
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Level</label>
                    <select
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none capitalize"
                      value={courseFormData.level}
                      onChange={e => setCourseFormData({ ...courseFormData, level: e.target.value as any })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Duration</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      placeholder="e.g. 4 hours"
                      value={courseFormData.duration}
                      onChange={e => setCourseFormData({ ...courseFormData, duration: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <select
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none pl-10"
                        value={courseFormData.categoryId}
                        onChange={e => setCourseFormData({ ...courseFormData, categoryId: e.target.value })}
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Module Form
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Module Title</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      placeholder="e.g. Understanding Market Structure"
                      value={moduleFormData.title}
                      onChange={e => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Course</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <select
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none pl-10"
                        value={moduleFormData.courseId}
                        onChange={e => {
                          const newCourseId = e.target.value;
                          // Update the order number when changing courses
                          const nextOrder = newCourseId ?
                            (courses.find(c => c.id === newCourseId)?.modules.length || 0) + 1 :
                            1;
                          setModuleFormData({
                            ...moduleFormData,
                            courseId: newCourseId,
                            order: nextOrder
                          });
                        }}
                      >
                        <option value="">Select a course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Description</label>
                  <textarea
                    required
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24 resize-none"
                    placeholder="Brief summary of what the student will learn..."
                    value={moduleFormData.description}
                    onChange={e => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-12 gap-6">
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Level</label>
                    <select
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none capitalize"
                      value={moduleFormData.level}
                      onChange={e => setModuleFormData({ ...moduleFormData, level: e.target.value as any })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Duration</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      placeholder="45m"
                      value={moduleFormData.duration}
                      onChange={e => setModuleFormData({ ...moduleFormData, duration: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Content Type</label>
                    <div className="flex gap-2 bg-black p-1 rounded-lg border border-gray-700">
                      <button
                        type="button"
                        onClick={() => setModuleFormData({ ...moduleFormData, contentType: 'video' })}
                        className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition ${moduleFormData.contentType === 'video' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                      >
                        <Video className="h-3 w-3" /> Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setModuleFormData({ ...moduleFormData, contentType: 'text' })}
                        className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition ${moduleFormData.contentType === 'text' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                      >
                        <FileText className="h-3 w-3" /> Text
                      </button>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Order</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      placeholder="1"
                      value={moduleFormData.order}
                      onChange={e => setModuleFormData({ ...moduleFormData, order: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">
                    {moduleFormData.contentType === 'video' ? 'Video Embed URL' : 'Article Text / Markdown'}
                  </label>
                  {moduleFormData.contentType === 'video' ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none pl-10"
                          placeholder="https://www.youtube.com/embed/... or https://www.youtube.com/watch?v=..."
                          value={moduleFormData.content}
                          onChange={e => setModuleFormData({ ...moduleFormData, content: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Note: You can use standard YouTube URLs (watch?v=...) and they will be automatically converted to embed format.
                      </p>
                    </div>
                  ) : (
                    <textarea
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-32"
                      placeholder="# Lesson Title..."
                      value={moduleFormData.content}
                      onChange={e => setModuleFormData({ ...moduleFormData, content: e.target.value })}
                    />
                  )}
                </div>

                {/* --- QUIZ BUILDER SECTION --- */}
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-trade-neon" />
                      Interactive Quiz
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold text-trade-neon border border-trade-neon/30 hover:border-trade-neon transition flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Question
                    </button>
                  </div>

                  {moduleFormData.quiz && moduleFormData.quiz.questions.length > 0 ? (
                    <div className="space-y-6">
                      {moduleFormData.quiz.questions.map((q, qIdx) => (
                        <div key={q.id} className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 relative">
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="mb-4 pr-8">
                            <label className="block text-xs text-gray-500 mb-1 uppercase">Question {qIdx + 1}</label>
                            <input
                              type="text"
                              className="w-full bg-black border border-gray-600 rounded p-2 text-white focus:border-trade-neon outline-none"
                              placeholder="Enter question text..."
                              value={q.text}
                              onChange={(e) => handleUpdateQuestion(q.id, 'text', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctOptionIndex === optIdx}
                                  onChange={() => handleUpdateQuestion(q.id, 'correctOptionIndex', optIdx)}
                                  className="accent-trade-neon w-4 h-4"
                                />
                                <input
                                  type="text"
                                  className={`flex-1 bg-black border rounded p-2 text-sm text-white outline-none ${q.correctOptionIndex === optIdx ? 'border-trade-neon text-trade-neon' : 'border-gray-700'
                                    }`}
                                  placeholder={`Option ${optIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800/20 border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500">
                      <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>No questions added yet.</p>
                      <p className="text-xs">Click "Add Question" to create a quiz for this module.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-lg font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2"
              >
                <Save className="h-5 w-5" /> Save {editingType === 'course' ? 'Course' : 'Module'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'courses' ? (
            // Courses View
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-white">Courses</h3>
                <button
                  onClick={handleAddNewCourse}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition shadow-lg shadow-blue-900/20"
                >
                  <Plus className="h-4 w-4" /> Add Course
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="bg-trade-dark border border-dashed border-gray-700 rounded-xl p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-400">No courses found</h3>
                  <p className="text-gray-500">Get started by adding your first course.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-trade-dark border border-gray-700 hover:border-blue-500/50 rounded-xl p-5 transition group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="bg-gray-800 p-3 rounded-lg text-blue-400">
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition">{course.title}</h4>
                            <p className="text-gray-400 text-sm mt-1">{course.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                              <span className={`px-2 py-0.5 rounded capitalize border ${course.level === 'beginner' ? 'border-green-500/20 text-green-400' :
                                  course.level === 'intermediate' ? 'border-yellow-500/20 text-yellow-400' :
                                    'border-red-500/20 text-red-400'
                                }`}>{course.level}</span>
                              <span>{course.modules.length} modules</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Modules View
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-white">Modules</h3>
                <button
                  onClick={handleAddNewModule}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition shadow-lg shadow-blue-900/20"
                >
                  <Plus className="h-4 w-4" /> Add Module
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="bg-trade-dark border border-dashed border-gray-700 rounded-xl p-12 text-center">
                  <Layers className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-400">No modules found</h3>
                  <p className="text-gray-500">Get started by adding your first module.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => {
                    const course = courses.find(c => c.id === module.courseId);
                    return (
                      <div key={module.id} className="bg-trade-dark border border-gray-700 hover:border-blue-500/50 rounded-xl p-5 transition group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className="bg-gray-800 p-3 rounded-lg text-blue-400">
                              {module.contentType === 'text' ? <FileText className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition">{module.title}</h4>
                                {module.order && (
                                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">#{module.order}</span>
                                )}
                              </div>
                              <p className="text-gray-400 text-sm mt-1">{module.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {module.duration}</span>
                                <span className={`px-2 py-0.5 rounded capitalize border ${module.level === 'beginner' ? 'border-green-500/20 text-green-400' :
                                    module.level === 'intermediate' ? 'border-yellow-500/20 text-yellow-400' :
                                      'border-red-500/20 text-red-400'
                                  }`}>{module.level}</span>
                                {course && (
                                  <span className="text-blue-400">Part of: {course.title}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditModule(module)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteModule(module.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCourseBuilder;