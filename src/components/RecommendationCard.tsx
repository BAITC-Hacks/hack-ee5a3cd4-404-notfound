import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Laptop,
  Check,
  Award,
  Layers,
  ShieldCheck,
  TrendingUp,
  AlertOctagon,
} from 'lucide-react';
import { Recommendation } from '../types/index.ts';

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
  onComplete: (eventId: string) => Promise<void>;
  isCompleting: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  rank,
  onComplete,
  isCompleting,
}) => {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleCompleteClick = async () => {
    try {
      await onComplete(recommendation.event_id);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const typeLabels: Record<string, string> = {
    workshop: 'Практический воркшоп',
    course: 'Курс повышения квалификации',
    certification: 'Профессиональная сертификация',
    mentoring: 'Программа наставничества',
    meetup: 'Митап / Tech Talk',
    onboarding: 'Онбординг',
    compliance: 'Обязательный комплаенс',
  };

  const formatLabels: Record<string, string> = {
    online: 'Онлайн',
    offline: 'Офлайн в офисе',
    hybrid: 'Гибридный формат',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300">
      {/* Top Header: Rank, Title, Format, Duration */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-sm shrink-0 mt-0.5">
            #{rank}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {typeLabels[recommendation.type] || recommendation.type}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                {formatLabels[recommendation.format] || recommendation.format}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {recommendation.duration_hours} ч.
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {recommendation.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {recommendation.description}
            </p>
          </div>
        </div>

        {/* Score & Complete Button */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block font-medium">AI-скор ценности:</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-lg">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{recommendation.score}</span>
            </div>
          </div>

          <button
            onClick={handleCompleteClick}
            disabled={isCompleting || justCompleted}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              justCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98 disabled:opacity-50'
            }`}
          >
            {justCompleted ? (
              <>
                <Check className="w-4 h-4" />
                <span>Выполнено!</span>
              </>
            ) : isCompleting ? (
              <span>Обновление...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Отметить выполненным</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Developed Skills Bar */}
      <div className="mt-3.5 pt-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Развиваемые навыки:
        </span>
        <div className="flex flex-wrap gap-2">
          {recommendation.develops_skills.map((d) => (
            <div
              key={d.skill_id}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs flex items-center gap-2"
            >
              <span className="font-medium text-slate-800">{d.skill_name}</span>
              <span className="text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px]">
                +{d.gain} ур. (макс. {d.max_level})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Factor Explainability Card (MANDATORY REQUIREMENT) */}
      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Обоснование AI-рекомендации (3 подтвержденных фактора)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Вес разрыва: {recommendation.metrics.skill_score} pt / История: {recommendation.metrics.history_score} pt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          {/* Factor 1 */}
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">1</span>
              Требования грейда / роли:
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {recommendation.factors.target_role_factor}
            </p>
          </div>

          {/* Factor 2 */}
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">2</span>
              Критичность & разрыв навыка:
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {recommendation.factors.gap_criticality_factor}
            </p>
          </div>

          {/* Factor 3 */}
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">3</span>
              История участия сотрудника:
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {recommendation.factors.history_behavior_factor}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
