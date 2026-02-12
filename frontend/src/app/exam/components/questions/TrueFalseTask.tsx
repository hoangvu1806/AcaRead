import React from 'react';
import { Task } from '@/lib/types';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: Record<string, any>;
}

export const TrueFalseTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  const isYesNo = task.task_key?.includes('yes_no') || task.instruction?.toLowerCase().includes('yes');
  const options = isYesNo 
    ? ["YES", "NO", "NOT GIVEN"] 
    : ["TRUE", "FALSE", "NOT GIVEN"];

  return (
    <div className="space-y-6">
      {task.questions.map((q, index) => {
        const qNum = q.question_number;
        const qKey = `q-${qNum}`;
        const currentAnswer = answers[qKey] || "";
        const correct = correctAnswers?.[index]?.answer;
        const explanation = correctAnswers?.[index]?.explanation;
        const isCorrect = isSubmitted && currentAnswer === correct;

        return (
          <div key={q.question_number} className="p-4 bg-white/5 border border-white/10 rounded-xl transition-all hover:border-white/20">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                {qNum}
              </div>
              <div className="flex-1">
                <p className="text-lg text-gray-200 mb-4 font-medium">{q.question_text || q.statement}</p>
                
                <div className="flex flex-wrap gap-3">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => !isSubmitted && setAnswer(qKey, opt)}
                      disabled={isSubmitted}
                      className={`px-6 py-2 rounded-lg border font-medium transition-all
                        ${currentAnswer === opt 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                        }
                         ${isSubmitted && opt === correct ? '!bg-green-500/20 !border-green-500 !text-green-200' : ''}
                         ${isSubmitted && currentAnswer === opt && currentAnswer !== correct ? '!bg-red-500/20 !border-red-500 !text-red-200' : ''}
                      `}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {isSubmitted && (
                   <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm">
                      <div className="flex items-center gap-2 font-bold mb-1">
                         <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                           {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                         </span>
                         {!isCorrect && <span className="text-gray-400">Correct Answer: <span className="text-green-400">{correct}</span></span>}
                      </div>
                      {explanation && <p className="text-gray-400 mt-1 italic">{explanation}</p>}
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
