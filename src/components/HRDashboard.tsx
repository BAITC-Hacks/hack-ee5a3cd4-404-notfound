import React, { useState } from 'react';
import {
  Users,
  TrendingDown,
  UserX,
  PieChart,
  BarChart3,
  Award,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { HROverview } from '../types/index.ts';

interface HRDashboardProps {
  overview: HROverview;
  onSelectEmployee: (id: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  overview,
  onSelectEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'lagging' | 'no_recs' | 'activities'>('lagging');

  const totalCompleted = overview.activity_analytics.by_status.completed || 0;
  const totalRecords = overview.activity_analytics.total_records || 1;
  const overallCompletionRate = Math.round((totalCompleted / totalRecords) * 100);

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Штат сотрудников</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {overview.total_employees}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Инженеры и аналитики в базе данных
          </p>
        </div>

        {/* Card 2: Average Grade Readiness */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Средняя готовность к грейду</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {overview.avg_readiness_pct}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Соответствие матрице компетенций
          </p>
        </div>

        {/* Card 3: Overall Completion Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Завершаемость активностей</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {overallCompletionRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalCompleted} из {totalRecords} назначений завершены
          </p>
        </div>

        {/* Card 4: Employees without next step */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Без рекомендованного шага</span>
            <UserX className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800">
            {overview.employees_without_recommendations.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {overview.employees_without_recommendations.length === 0
              ? 'Все сотрудники охвачены рекомендациями'
              : 'Требуют внимания HR / промоушена'}
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
          <button
            onClick={() => setActiveTab('lagging')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'lagging'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Проседающие навыки ({overview.top_lagging_skills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Участие и завершаемость</span>
          </button>

          <button
            onClick={() => setActiveTab('no_recs')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'no_recs'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Без рекомендаций ({overview.employees_without_recommendations.length})</span>
          </button>
        </div>

        {/* TAB 1: Lagging Skills */}
        {activeTab === 'lagging' && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Сводный срез проседающих компетенций по банку
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ранжировано по совокупному дефициту уровней до целевых грейдов сотрудников
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Компетенция</th>
                    <th className="py-2.5 px-3">Категория</th>
                    <th className="py-2.5 px-3 text-center">Суммарный разрыв</th>
                    <th className="py-2.5 px-3 text-center">Сотрудников с дефицитом</th>
                    <th className="py-2.5 px-3 text-center">Критических разрывов</th>
                    <th className="py-2.5 px-3">Доля в штате</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.top_lagging_skills.map((s, idx) => {
                    const pctOfEmployees = Math.round(
                      (s.affected_employees_count / overview.total_employees) * 100
                    );

                    return (
                      <tr key={s.skill_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-slate-400 font-mono text-[11px] w-5">
                              #{idx + 1}
                            </span>
                            <span>{s.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono ml-7">
                            {s.skill_id} · {s.type === 'hard' ? 'Hard Skill' : 'Soft Skill'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {s.category}
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">
                            {s.total_gap_sum} ур.
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-semibold text-slate-800">
                          {s.affected_employees_count} чел. ({pctOfEmployees}%)
                        </td>

                        <td className="py-3 px-3 text-center">
                          {s.critical_gap_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertOctagon className="w-3 h-3 text-amber-700" />
                              {s.critical_gap_count} критич.
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                s.critical_gap_count > 20
                                  ? 'bg-amber-600'
                                  : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.min(100, pctOfEmployees)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Participation & Completion */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Статистика участия по типам развивающих активностей
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Сравнение конверсии в завершение по форматам обучения
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(overview.activity_analytics.by_type).map(([type, stats]) => (
                  <div
                    key={type}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {type}
                      </span>
                      <span className="text-sm font-bold text-emerald-800">
                        {stats.completion_rate_pct}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${stats.completion_rate_pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-600 pt-1">
                      <span>Назначено: {stats.total}</span>
                      <span className="text-emerald-700 font-medium">Завершено: {stats.completed}</span>
                      <span className="text-rose-600">Срывов: {stats.declined_or_dropped}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Events Table */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3">
                Топ активностей по вовлеченности участников
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Программа</th>
                      <th className="py-2.5 px-3">Тип</th>
                      <th className="py-2.5 px-3 text-center">Участников</th>
                      <th className="py-2.5 px-3 text-center">Завершили</th>
                      <th className="py-2.5 px-3 text-center">Завершаемость</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.activity_analytics.top_events.map((ev) => (
                      <tr key={ev.event_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {ev.title}
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {ev.event_id}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 capitalize">
                          {ev.type}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {ev.participants_count} чел.
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-700 font-medium">
                          {ev.completed_count}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-slate-900 font-mono">
                            {ev.completion_rate_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Employees without recommendations */}
        {activeTab === 'no_recs' && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Сотрудники без рекомендованного следующего шага ({overview.employees_without_recommendations.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Сотрудники, закрывшие 100% требований грейда, либо достигшие максимальной ступени Lead
              </p>
            </div>

            {overview.employees_without_recommendations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">
                  Все сотрудники обеспечены рекомендациями
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Каждый инженер банка имеет актуальный следующий шаг развития в Career Quest
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Сотрудник</th>
                      <th className="py-2.5 px-3">Роль и грейд</th>
                      <th className="py-2.5 px-3">Целевой грейд</th>
                      <th className="py-2.5 px-3">Причина отсутствия рекомендации</th>
                      <th className="py-2.5 px-3 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.employees_without_recommendations.map((emp) => (
                      <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">
                            {emp.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {emp.employee_id}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-700">
                          {emp.role} ({emp.grade})
                        </td>

                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {emp.target_role} ({emp.target_grade})
                        </td>

                        <td className="py-3 px-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {emp.reason}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onSelectEmployee(emp.employee_id)}
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                          >
                            <span>Открыть</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
