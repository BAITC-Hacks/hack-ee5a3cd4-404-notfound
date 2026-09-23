import React from 'react';
import { Target, TrendingUp, Calendar, MapPin, Globe, Award, ShieldAlert } from 'lucide-react';
import { Employee, Trajectory } from '../types/index.ts';

interface ProfileCardProps {
  employee: Employee;
  trajectory: Trajectory;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  employee,
  trajectory,
}) => {
  const readinessColor =
    trajectory.overall_readiness_pct >= 85
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : trajectory.overall_readiness_pct >= 60
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : 'text-slate-800 bg-slate-100 border-slate-200';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role & Target Trajectory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Карьерная траектория
              </span>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold text-slate-900">
                    {employee.role}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {employee.grade}
                  </span>
                </div>

                <span className="text-slate-400 font-bold">→</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold text-emerald-800">
                    {trajectory.target_role}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {trajectory.target_grade}
                  </span>
                  {trajectory.is_goal_custom && (
                    <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                      Цель сотрудника
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Gap Counters */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Разрывов</span>
                <span className="text-sm font-bold text-slate-900">
                  {trajectory.total_gaps_count}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-right">
                <span className="text-xs text-amber-700 block font-medium">Критичных</span>
                <span className="text-sm font-bold text-amber-800">
                  {trajectory.critical_gaps_count}
                </span>
              </div>
            </div>
          </div>

          {/* Readiness Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                Готовность к целевому грейду {trajectory.target_grade}
              </span>
              <span className="font-bold text-slate-900">
                {trajectory.overall_readiness_pct}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, trajectory.overall_readiness_pct)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Текущий уровень компетенций</span>
              <span>
                {trajectory.critical_gaps_count === 0
                  ? 'Все критические компетенции закрыты'
                  : `Требуется закрыть ${trajectory.critical_gaps_count} критических разрыва`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata info */}
        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex flex-col justify-between text-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Карточка сотрудника
          </span>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Стаж в банке:
              </span>
              <span className="font-medium text-slate-800">
                {employee.tenure_months} мес. ({Math.floor(employee.tenure_months / 12)} г. {employee.tenure_months % 12} мес.)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Формат работы:
              </span>
              <span className="font-medium text-slate-800 capitalize">
                {employee.work_format === 'remote' ? 'Удаленный' : employee.work_format === 'hybrid' ? 'Гибридный' : 'Офис'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Язык обучения:
              </span>
              <span className="font-medium text-slate-800 uppercase">
                {employee.preferred_language}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                Руководитель:
              </span>
              <span className="font-medium text-slate-800 font-mono">
                {employee.manager_id}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-slate-500 text-xs flex justify-between">
            <span>Последний Review:</span>
            <span className="font-mono text-slate-700">{employee.last_review_date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
