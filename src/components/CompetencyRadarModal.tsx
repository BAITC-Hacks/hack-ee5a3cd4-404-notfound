import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { X, ShieldAlert, CheckCircle, Award } from 'lucide-react';
import { Employee, Trajectory } from '../types/index.ts';

interface CompetencyRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  trajectory: Trajectory;
}

export const CompetencyRadarModal: React.FC<CompetencyRadarModalProps> = ({
  isOpen,
  onClose,
  employee,
  trajectory,
}) => {
  if (!isOpen) return null;

  // Prepare data for Radar Chart
  const radarData = trajectory.gaps.map((gap) => {
    // Shorten long skill names for clean radar axis labels
    const shortName =
      gap.name.length > 20 ? gap.name.slice(0, 18) + '…' : gap.name;

    return {
      skill_id: gap.skill_id,
      name: shortName,
      fullName: gap.name,
      current: gap.current_level,
      required: gap.required_level,
      gap: gap.gap,
      is_critical: gap.is_critical,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                🕸️
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Радар компетенций (Spider Matrix)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Сравнение текущих навыков {employee.full_name} с требованиями матрицы {trajectory.target_role} ({trajectory.target_grade})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Radar Chart Container */}
          <div className="w-full h-[320px] sm:h-[380px] bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name="Текущий уровень"
                  dataKey="current"
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Radar
                  name={`Требуется (${trajectory.target_grade})`}
                  dataKey="required"
                  stroke="#d97706"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700">
                          <div className="font-bold text-slate-100">{data.fullName}</div>
                          <div className="mt-1 text-emerald-400">
                            Текущий: {data.current} / 5
                          </div>
                          <div className="text-amber-400">
                            Требуется: {data.required} / 5
                          </div>
                          <div className="text-slate-300 mt-1">
                            Разрыв: {data.gap > 0 ? `+${data.gap} ур.` : 'Закрыт ✓'}
                          </div>
                          {data.is_critical && (
                            <div className="mt-1 text-amber-300 text-[10px] font-bold">
                              ⚡ Критическая компетенция грейда
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  iconType="circle"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] text-emerald-800 font-medium block">
                Общая готовность
              </span>
              <span className="text-lg font-bold text-emerald-900">
                {trajectory.overall_readiness_pct}%
              </span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[11px] text-amber-800 font-medium block">
                Критичные разрывы
              </span>
              <span className="text-lg font-bold text-amber-900">
                {trajectory.critical_gaps_count}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-600 font-medium block">
                Всего компетенций
              </span>
              <span className="text-lg font-bold text-slate-800">
                {trajectory.gaps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
