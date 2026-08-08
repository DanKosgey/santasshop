import React, { useState } from 'react';
import { CourseModule, Quiz, QuizQuestion } from '../../types';
import { 
  CheckSquare, Plus, Edit2, Trash2, Save, X, 
  HelpCircle, ArrowRight, ArrowLeft, CheckCircle, XCircle
} from 'lucide-react';

interface QuizIntegrationProps {
  module: CourseModule;
  onSaveQuiz: (moduleId: string, quiz: Quiz) => void;
  onDeleteQuiz: (moduleId: string) => void;
}

const QuizIntegration: React.FC<QuizIntegrationProps> = ({
  module,
  onSaveQuiz,
  onDeleteQuiz
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quizData, setQuizData] = useState<Quiz>(module.quiz || {
    id: Date.now().toString(),
    questions: [],
    passingScore: 70
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResults, setQuizResults] = useState<{score: number, passed: boolean} | null>(null);

  // Handle adding a new question
  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    };
    
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, newQuestion]
    });
    
    setCurrentQuestionIndex(quizData.questions.length);
  };

  // Handle updating a question
  const handleUpdateQuestion = (questionId: string, field: keyof QuizQuestion, value: any) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    });
  };

  // Handle updating an option
  const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    });
  };

  // Handle deleting a question
  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = quizData.questions.filter(q => q.id !== questionId);
    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });
    
    // Adjust current question index if needed
    if (currentQuestionIndex >= updatedQuestions.length && updatedQuestions.length > 0) {
      setCurrentQuestionIndex(updatedQuestions.length - 1);
    } else if (updatedQuestions.length === 0) {
      setCurrentQuestionIndex(0);
    }
  };

  // Handle saving the quiz
  const handleSaveQuiz = () => {
    onSaveQuiz(module.id, quizData);
    setIsEditing(false);
  };

  // Handle starting the quiz
  const handleStartQuiz = () => {
    setIsTakingQuiz(true);
    setAnswers({});
    setQuizResults(null);
    setCurrentQuestionIndex(0);
  };

  // Handle answering a question
  const handleAnswerQuestion = (questionId: string, optionIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex
    });
  };

  // Handle submitting the quiz
  const handleSubmitQuiz = () => {
    // Calculate score
    let correctAnswers = 0;
    quizData.questions.forEach(question => {
      if (answers[question.id] === question.correctOptionIndex) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / quizData.questions.length) * 100);
    const passed = score >= (quizData.passingScore || 70);
    
    setQuizResults({ score, passed });
  };

  // Handle resetting the quiz
  const handleResetQuiz = () => {
    setIsTakingQuiz(false);
    setAnswers({});
    setQuizResults(null);
  };

  // Render quiz editor
  const renderQuizEditor = () => {
    if (!isEditing) return null;
    
    return (
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-trade-neon" /> 
            Quiz Editor for "{module.title}"
          </h3>
          <button 
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Quiz Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Passing Score (%)</label>
              <input 
                type="number" 
                min="0" 
                max="100"
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-trade-neon outline-none"
                value={quizData.passingScore || 70}
                onChange={(e) => setQuizData({...quizData, passingScore: parseInt(e.target.value) || 70})}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Total Questions</label>
              <div className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white">
                {quizData.questions.length}
              </div>
            </div>
          </div>
          
          {/* Questions List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-white">Questions</h4>
              <button 
                onClick={handleAddQuestion}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold text-trade-neon border border-trade-neon/30 hover:border-trade-neon transition flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Question
              </button>
            </div>
            
            {quizData.questions.length === 0 ? (
              <div className="bg-gray-800/20 border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500">
                <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No questions added yet.</p>
                <p className="text-xs">Click "Add Question" to create your first quiz question.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizData.questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      currentQuestionIndex === index 
                        ? 'border-trade-neon bg-gray-800/30' 
                        : 'border-gray-700 bg-gray-800/10 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <button
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`font-bold flex items-center gap-2 ${
                          currentQuestionIndex === index ? 'text-trade-neon' : 'text-gray-400'
                        }`}
                      >
                        Question {index + 1}
                        {currentQuestionIndex === index && (
                          <div className="w-2 h-2 bg-trade-neon rounded-full"></div>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {currentQuestionIndex === index && (
                      <div className="space-y-4 pt-4 border-t border-gray-700">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 uppercase">Question Text</label>
                          <input 
                            type="text"
                            className="w-full bg-black border border-gray-600 rounded p-2 text-white focus:border-trade-neon outline-none"
                            placeholder="Enter question text..."
                            value={question.text}
                            onChange={(e) => handleUpdateQuestion(question.id, 'text', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 uppercase">Options</label>
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  name={`correct-${question.id}`}
                                  checked={question.correctOptionIndex === optIndex}
                                  onChange={() => handleUpdateQuestion(question.id, 'correctOptionIndex', optIndex)}
                                  className="accent-trade-neon w-4 h-4"
                                />
                                <input 
                                  type="text" 
                                  className={`flex-1 bg-black border rounded p-2 text-sm text-white outline-none ${
                                    question.correctOptionIndex === optIndex 
                                      ? 'border-trade-neon text-trade-neon' 
                                      : 'border-gray-700'
                                  }`}
                                  placeholder={`Option ${optIndex + 1}`}
                                  value={option}
                                  onChange={(e) => handleUpdateOption(question.id, optIndex, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveQuiz}
              disabled={quizData.questions.length === 0}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                quizData.questions.length === 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-trade-neon text-black hover:bg-green-400'
              }`}
            >
              <Save className="h-4 w-4" /> Save Quiz
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render quiz taker
  const renderQuizTaker = () => {
    if (!isTakingQuiz) return null;
    
    if (quizResults) {
      // Show results
      return (
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-8 text-center">
          <div className="mb-6">
            {quizResults.passed ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h3 className="text-2xl font-bold text-white mb-2">
              {quizResults.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
            </h3>
            <p className="text-gray-400">
              You scored {quizResults.score}% (required: {quizData.passingScore || 70}%)
            </p>
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={handleResetQuiz}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold"
            >
              Back to Module
            </button>
            {!quizResults.passed && (
              <button
                onClick={() => {
                  setAnswers({});
                  setQuizResults(null);
                  setCurrentQuestionIndex(0);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }
    
    // Show current question
    const currentQuestion = quizData.questions[currentQuestionIndex];
    
    return (
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Quiz: {module.title}</h3>
            <div className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </div>
          </div>
          
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-xl font-bold text-white">{currentQuestion.text}</h4>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerQuestion(currentQuestion.id, index)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  answers[currentQuestion.id] === index
                    ? 'border-trade-neon bg-trade-neon/10 text-trade-neon'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    answers[currentQuestion.id] === index
                      ? 'border-trade-neon bg-trade-neon'
                      : 'border-gray-500'
                  }`}>
                    {answers[currentQuestion.id] === index && (
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                currentQuestionIndex === 0
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            
            {currentQuestionIndex === quizData.questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={answers[currentQuestion.id] === undefined}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                  answers[currentQuestion.id] === undefined
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-trade-neon text-black hover:bg-green-400'
                }`}
              >
                Submit Quiz <CheckCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                disabled={answers[currentQuestion.id] === undefined}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                  answers[currentQuestion.id] === undefined
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-trade-neon" /> 
            Quiz Integration
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {module.quiz 
              ? `Quiz with ${module.quiz.questions.length} questions` 
              : 'No quiz created for this module'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {module.quiz && (
            <button
              onClick={handleStartQuiz}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" /> Take Quiz
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" /> {module.quiz ? 'Edit Quiz' : 'Create Quiz'}
          </button>
        </div>
      </div>
      
      {/* Quiz Info */}
      {module.quiz && !isEditing && !isTakingQuiz && (
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{module.quiz.questions.length}</div>
              <div className="text-sm text-gray-400">Questions</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{module.quiz.passingScore || 70}%</div>
              <div className="text-sm text-gray-400">Passing Score</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">
                {Math.round(module.quiz.questions.length * 0.7)}
              </div>
              <div className="text-sm text-gray-400">Min. Correct Answers</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-bold text-white mb-3">Questions Preview</h4>
            <div className="space-y-3">
              {module.quiz.questions.slice(0, 3).map((question, index) => (
                <div key={question.id} className="p-3 bg-gray-800/20 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Question {index + 1}</div>
                  <div className="text-white">{question.text}</div>
                </div>
              ))}
              {module.quiz.questions.length > 3 && (
                <div className="text-center text-gray-500 text-sm">
                  + {module.quiz.questions.length - 3} more questions
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Editor or Quiz Taker */}
      {isEditing ? renderQuizEditor() : isTakingQuiz ? renderQuizTaker() : null}
      
      {/* Empty State */}
      {!module.quiz && !isEditing && !isTakingQuiz && (
        <div className="bg-trade-dark border border-dashed border-gray-700 rounded-xl p-12 text-center">
          <CheckSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-400">No Quiz Created</h3>
          <p className="text-gray-500 mb-4">Create a quiz to assess student understanding of this module.</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" /> Create Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizIntegration;