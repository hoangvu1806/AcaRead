import React from 'react';
import { Task } from '@/lib/types';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: Record<string, any>;
}

const PARAGRAPH_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const MatchingInformationTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  return (
    <div className="space-y-5">
      {task.questions.map((q: any, index: number) => {
        const qNum = q.question_number;
        const qKey = `q-${qNum}`;
        const currentAnswer = answers[qKey] || "";
        const correct = correctAnswers?.[index]?.answer || q.correct_paragraph;
        const explanation = correctAnswers?.[index]?.explanation;
        const isCorrect = isSubmitted && currentAnswer.toUpperCase() === (correct || "").toUpperCase();

        return (
          <div
            key={qNum}
            className={`p-5 bg-white/5 border rounded-xl transition-all ${
              isSubmitted
                ? isCorrect
                  ? 'border-green-500/40 bg-green-500/5'
                  : currentAnswer
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-white/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex gap-4">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30 text-sm">
                {qNum}
              </div>
              <div className="flex-1">
                <p className="text-gray-200 mb-3 leading-relaxed">
                  {q.information_statement || q.statement || q.question_text || `Question ${qNum}`}
                </p>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-500">Paragraph:</label>
                  <select
                    value={currentAnswer}
                    onChange={(e) => setAnswer(qKey, e.target.value)}
                    disabled={isSubmitted}
                    className={`bg-black/40 border rounded-lg px-4 py-2 text-white min-w-[100px] focus:outline-none focus:ring-1 transition-all
                      ${isSubmitted
                        ? (isCorrect ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400')
                        : 'border-white/20 focus:border-teal-500 focus:ring-teal-500'
                      }
                    `}
                  >
                    <option value="">Select...</option>
                    {PARAGRAPH_LETTERS.map((letter) => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>

                  {isSubmitted && !isCorrect && correct && (
                    <span className="text-green-400 font-bold text-sm">
                      (Correct: {correct})
                    </span>
                  )}
                </div>

                {isSubmitted && explanation && (
                  <div className="mt-3 p-3 bg-white/5 rounded-lg text-sm text-gray-400 leading-relaxed border border-white/5">
                    {explanation}
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
