import React from 'react';
import { Task } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: Record<string, any>;
}

export const SentenceCompletionTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  return (
    <div className="space-y-6">
      {task.questions.map((q, index) => {
        const qNum = q.question_number;
        const qKey = `q-${qNum}`;
        const currentAnswer = answers[qKey] || "";
        const correct = correctAnswers?.[index]?.answer;
        const isCorrect = isSubmitted && currentAnswer.toLowerCase().trim() === correct?.toLowerCase().trim();
        

        const textData = q.question_text || q.statement || (q as any).text || (q as any).sentence || (q as any).stem || "";
        
        // Simple regex to find gaps like "______" or "......" or "[...]"
        // Also split by just "..." if no brackets
        const parts = textData.split(/(\[?\.\.\.\]?|_+)/);

        
        return (
          <div key={q.question_number} className="p-4 bg-white/5 border border-white/10 rounded-xl transition-all hover:border-white/20">
            <div className="flex gap-4 items-baseline">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30 self-start mt-1">
                {qNum}
              </div>
              
              <div className="flex-1 text-lg text-gray-200 leading-loose">
                  {parts.length > 1 ? (
                    // Render with inline input

                    <div>
                      {parts.map((part: string, i: number) => {
                        if (part.match(/(\[?\.\.\.\]?|_+)/)) {
                           return (
                             <span key={i} className="inline-block relative px-1">

                                <input
                                  type="text"
                                  value={currentAnswer}
                                  onChange={(e) => !isSubmitted && setAnswer(qKey, e.target.value)}
                                  disabled={isSubmitted}
                                  className={`bg-black/30 border-b-2 px-3 py-1 text-center min-w-[150px] focus:outline-none transition-all
                                    ${isSubmitted 
                                      ? (isCorrect ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10')
                                      : 'border-white/30 focus:border-orange-500 text-white'
                                    }
                                  `}
                                />
                                {isSubmitted && !isCorrect && (
                                  <span className="text-[10px] text-green-400 absolute -bottom-4 left-0 w-full text-center font-bold">
                                    {correct}
                                  </span>
                                )}
                             </span>
                           );
                        }
                        return <span key={i}><ReactMarkdown components={{p: 'span'}}>{part}</ReactMarkdown></span>;
                      })}
                    </div>
                  ) : (
                    // Fallback: Text then input
                    <div className="flex flex-col gap-3">
                       <div><ReactMarkdown components={{p: 'span'}}>{textData}</ReactMarkdown></div>
                       <div className="relative max-w-sm">
                          <input
                             type="text"
                             value={currentAnswer}
                             onChange={(e) => !isSubmitted && setAnswer(qKey, e.target.value)}
                             disabled={isSubmitted}
                             placeholder="Answer..."
                             className={`w-full bg-black/30 border rounded-lg px-4 py-2 focus:outline-none transition-all
                               ${isSubmitted 
                                 ? (isCorrect ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10')
                                 : 'border-white/20 focus:border-orange-500 text-white'
                               }
                             `}
                          />
                          {isSubmitted && !isCorrect && (
                             <div className="text-xs text-green-400 mt-1">Correct: {correct}</div>
                          )}
                       </div>
                    </div>
                  )}

                  {isSubmitted && correctAnswers?.[index]?.explanation && (
                    <div className="mt-3 text-sm text-gray-400 italic bg-white/5 p-2 rounded border-l-2 border-orange-500/50">
                       {correctAnswers[index].explanation}
                    </div>
                  )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
