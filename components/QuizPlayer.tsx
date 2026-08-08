import React, { useState } from 'react';
import { Quiz } from '../types';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, Trophy } from 'lucide-react';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (score: number, passed: boolean) => void;
  onRetake: () => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onComplete, onRetake }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    const correctCount = quiz.questions.filter(q => answers[q.id] === q.correctOptionIndex).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= (quiz.passingScore || 70);
    setSubmitted(true);
    onComplete(score, passed);
  };

  if (submitted) {
    const correctCount = quiz.questions.filter(q => answers[q.id] === q.correctOptionIndex).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= (quiz.passingScore || 70);

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-12 text-center animate-in fade-in zoom-in duration-300">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-green-500/20 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}>
          {passed ? <Trophy className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">{passed ? 'Assessment Passed!' : 'Assessment Failed'}</h2>
        <div className="text-6xl font-black text-white mb-6 tracking-tighter">{score}%</div>
        
        <p className="text-gray-400 mb-8 text-lg max-w-md mx-auto">
          {passed 
            ? 'Excellent work. You have demonstrated mastery of this concept and are ready to proceed.' 
            : 'You did not meet the passing threshold. Please review the course material and try again.'}
        </p>
        
        <div className="flex justify-center gap-4">
           {!passed ? (
             <button 
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                  onRetake();
                }}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold flex items-center gap-2 transition border border-gray-600"
             >
               <RefreshCw className="h-5 w-5" /> Retake Quiz
             </button>
           ) : (
            <div className="px-6 py-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Module Completed
            </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Knowledge Check</h2>
        <p className="text-gray-400">Answer all questions to complete this module. Passing score: {quiz.passingScore || 70}%</p>
      </div>

      <div className="space-y-8">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 transition hover:border-gray-700">
            <h3 className="text-lg font-bold text-white mb-6 flex gap-4">
              <span className="bg-gray-800 text-gray-400 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-mono">
                {idx + 1}
              </span>
              {q.text}
            </h3>
            <div className="space-y-3 pl-12">
              {q.options.map((opt, optIdx) => (
                <div 
                  key={optIdx}
                  onClick={() => handleSelectOption(q.id, optIdx)}
                  className={`p-4 rounded-lg border cursor-pointer transition flex items-center gap-4 group ${
                    answers[q.id] === optIdx
                      ? 'bg-trade-accent/10 border-trade-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-black/20 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                    answers[q.id] === optIdx ? 'border-trade-accent' : 'border-gray-600 group-hover:border-gray-400'
                  }`}>
                    {answers[q.id] === optIdx && <div className="w-3 h-3 rounded-full bg-trade-accent" />}
                  </div>
                  <span className="font-medium">{opt}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 flex justify-end border-t border-gray-800 pt-6">
        <button 
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < quiz.questions.length}
          className="px-10 py-4 bg-trade-accent hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 transition transform hover:-translate-y-1"
        >
          Submit Assessment <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default QuizPlayer;
