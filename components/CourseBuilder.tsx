
import React, { useState } from 'react';
import { CourseModule, QuizQuestion } from '../types';
import { 
  Plus, Edit2, Trash2, Video, FileText, Save, X, 
  Layers, GraduationCap, Clock, CheckCircle, CheckSquare, List, HelpCircle 
} from 'lucide-react';

interface CourseBuilderProps {
  courses: CourseModule[];
  onAdd: (module: CourseModule) => void;
  onUpdate: (id: string, module: Partial<CourseModule>) => void;
  onDelete: (id: string) => void;
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ courses, onAdd, onUpdate, onDelete }) => {
  const [activeLevel, setActiveLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CourseModule>>({
    title: '',
    description: '',
    duration: '',
    level: 'beginner',
    content: '',
    contentType: 'video'
  });

  const filteredCourses = courses.filter(c => c.level === activeLevel);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      duration: '',
      level: activeLevel,
      content: '',
      contentType: 'video'
    });
    setIsEditing(true);
  };

  const handleEdit = (course: CourseModule) => {
    setEditingId(course.id);
    setFormData({ ...course });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing
      onUpdate(editingId, formData);
    } else {
      // Create new
      const newModule: CourseModule = {
        id: Date.now().toString(),
        title: formData.title || 'Untitled Module',
        description: formData.description || '',
        duration: formData.duration || '0m',
        level: formData.level || activeLevel,
        completed: false,
        locked: false, 
        content: formData.content,
        contentType: formData.contentType || 'video',
        quiz: formData.quiz
      };
      onAdd(newModule);
    }
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      onDelete(id);
    }
  };

  // --- Quiz Builder Helpers ---
  const handleAddQuestion = () => {
    const currentQuiz = formData.quiz || { id: Date.now().toString(), questions: [], passingScore: 70 };
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    };
    setFormData({
      ...formData,
      quiz: {
        ...currentQuiz,
        questions: [...currentQuiz.questions, newQuestion]
      }
    });
  };

  const handleUpdateQuestion = (qId: string, field: keyof QuizQuestion, value: any) => {
    if (!formData.quiz) return;
    const updatedQuestions = formData.quiz.questions.map(q => 
      q.id === qId ? { ...q, [field]: value } : q
    );
    setFormData({ ...formData, quiz: { ...formData.quiz, questions: updatedQuestions } });
  };

  const handleOptionChange = (qId: string, optIndex: number, value: string) => {
    if (!formData.quiz) return;
    const updatedQuestions = formData.quiz.questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setFormData({ ...formData, quiz: { ...formData.quiz, questions: updatedQuestions } });
  };

  const handleDeleteQuestion = (qId: string) => {
     if (!formData.quiz) return;
     const updatedQuestions = formData.quiz.questions.filter(q => q.id !== qId);
     setFormData({ ...formData, quiz: { ...formData.quiz, questions: updatedQuestions } });
  };

  return (
    <div className="text-white h-full flex flex-col pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-500" /> 
            Course Curriculum
          </h1>
          <p className="text-gray-400 mt-1">Build and organize your trading academy content.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Left Sidebar: Level Selector */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-trade-dark border border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Difficulty Levels</h3>
            <div className="space-y-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => { setActiveLevel(level); setIsEditing(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-bold capitalize flex justify-between items-center transition ${
                    activeLevel === level 
                      ? level === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {level}
                  <span className="text-xs bg-black/30 px-2 py-1 rounded">
                    {courses.filter(c => c.level === level).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-trade-dark border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-black text-white mb-2">{courses.length}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">Total Modules</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          {isEditing ? (
            <div className="bg-trade-dark border border-gray-700 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingId ? 'Edit Module' : 'Create New Module'}
                </h2>
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Module Title</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      placeholder="e.g. Understanding Market Structure"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Level</label>
                    <select 
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none capitalize"
                      value={formData.level}
                      onChange={e => setFormData({...formData, level: e.target.value as any})}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Description</label>
                  <textarea 
                    required
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24 resize-none"
                    placeholder="Brief summary of what the student will learn..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-12 gap-6">
                   <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Duration</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                      placeholder="45m"
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                    />
                   </div>
                   <div className="col-span-3">
                      <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Content Type</label>
                      <div className="flex gap-2 bg-black p-1 rounded-lg border border-gray-700">
                         <button
                            type="button"
                            onClick={() => setFormData({...formData, contentType: 'video'})}
                            className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition ${formData.contentType === 'video' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                         >
                           <Video className="h-3 w-3" /> Video
                         </button>
                         <button
                            type="button"
                            onClick={() => setFormData({...formData, contentType: 'text'})}
                            className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition ${formData.contentType === 'text' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                         >
                           <FileText className="h-3 w-3" /> Text
                         </button>
                      </div>
                   </div>
                   <div className="col-span-6">
                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">
                       {formData.contentType === 'video' ? 'Video Embed URL' : 'Article Text / Markdown'}
                    </label>
                    {formData.contentType === 'video' ? (
                        <input 
                        type="text" 
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        placeholder="https://www.youtube.com/embed/..."
                        value={formData.content}
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        />
                    ) : (
                        <textarea
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-32"
                        placeholder="# Lesson Title..."
                        value={formData.content}
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        />
                    )}
                   </div>
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

                  {formData.quiz && formData.quiz.questions.length > 0 ? (
                    <div className="space-y-6">
                      {formData.quiz.questions.map((q, qIdx) => (
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
                                      className={`flex-1 bg-black border rounded p-2 text-sm text-white outline-none ${
                                          q.correctOptionIndex === optIdx ? 'border-trade-neon text-trade-neon' : 'border-gray-700'
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
                    <Save className="h-5 w-5" /> Save Module
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold capitalize text-white">{activeLevel} Modules</h3>
                <button 
                  onClick={handleAddNew}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition shadow-lg shadow-blue-900/20"
                >
                  <Plus className="h-4 w-4" /> Add Module
                </button>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="bg-trade-dark border border-dashed border-gray-700 rounded-xl p-12 text-center">
                  <Layers className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-400">No modules found</h3>
                  <p className="text-gray-500">Get started by adding your first lesson.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-trade-dark border border-gray-700 hover:border-blue-500/50 rounded-xl p-5 transition group flex justify-between items-center">
                      <div className="flex items-start gap-4">
                        <div className="bg-gray-800 p-3 rounded-lg text-blue-400">
                           {course.contentType === 'text' ? <FileText className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition">{course.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                             {course.description}
                             {course.quiz && (
                                <span className="text-[10px] bg-trade-neon/10 text-trade-neon border border-trade-neon/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                  <CheckSquare className="h-3 w-3" /> {course.quiz.questions.length} Qs
                                </span>
                             )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                             <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                             <span className={`px-2 py-0.5 rounded capitalize border ${
                                course.level === 'beginner' ? 'border-green-500/20 text-green-400' :
                                course.level === 'intermediate' ? 'border-yellow-500/20 text-yellow-400' :
                                'border-red-500/20 text-red-400'
                             }`}>{course.level}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(course)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(course.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseBuilder;
