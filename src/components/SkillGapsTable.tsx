import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  TrendingUp,
  Minus,
  Activity,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  ActivityRecord,
  Employee,
  LearningEvent,
  SkillGap,
  SkillProgressionPoint,
} from '../types/index.ts';
import eventsDataRaw from '../../data/events.json';

export interface SkillGapsTableProps {
  gaps?: SkillGap[];
  targetGrade?: string;
  activity_history?: ActivityRecord[];
  activityHistory?: ActivityRecord[];
  history?: ActivityRecord[];
  employees?: Employee | Employee[];
  employee?: Employee;
  events?: LearningEvent[] | any[];
}

interface SparklineTooltipProps {
  active?: boolean;
  payload?: any[];
}

const SparklineTooltip: React.FC<SparklineTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as SkillProgressionPoint;
    return (
      <div className="bg-slate-900/95 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700 pointer-events-none z-50 backdrop-blur-xs">
        <div className="font-semibold text-slate-200 flex items-center justify-between gap-3">
          <span className="font-mono text-emerald-400 font-bold">
            {data.activity_label || data.period}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{data.date}</span>
        </div>
        <div className="text-emerald-300 font-bold mt-0.5 flex items-center gap-1.5">
          <span>Уровень навыка:</span>
          <span className="text-white bg-slate-800 px-1.5 py-0.2 rounded text-[10px] font-mono border border-slate-700">
            {data.level} / 5
          </span>
        </div>
        {data.event_title && (
          <div className="text-[10px] text-slate-300 mt-1 max-w-[210px] leading-tight">
            <div className="text-slate-300 truncate font-medium">{data.event_title}</div>
            {typeof data.gain === 'number' && data.gain > 0 ? (
              <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5 mt-0.5">
                <span>🎯</span> Прирост: +{data.gain} ур.
              </span>
            ) : (
              <span className="text-slate-400 text-[9px] block mt-0.5">
                {data.event_title.includes('Базовый') ? 'Базовый уровень' : 'Событие'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Calculates historical proficiency trends for a specific skill by filtering
 * activity_history for completed events that modify the specific skill_id.
 * Produces exactly 5 data points showing the progression curve and slope velocity.
 */
export function calculateHistoricalSkillProgression(
  skillId: string,
  currentLevel: number,
  requiredLevel: number,
  activityHistory?: ActivityRecord[],
  employee?: Employee,
  eventsList?: any[]
): {
  progression: SkillProgressionPoint[];
  velocity_label: string;
  velocity_trend: 'up' | 'stable' | 'slow';
  learning_velocity: number;
  velocity_badge: string;
} {
  const events = eventsList || (eventsDataRaw as any)?.events || [];
  const eventsMap = new Map<string, any>();
  for (const ev of events) {
    eventsMap.set(ev.event_id, ev);
  }

  const empId = employee?.employee_id;

  // 1. Filter activity_history for completed events that modify this specific skill_id
  const skillModifyingEvents = (activityHistory || [])
    .filter((h) => {
      const matchEmp = empId ? h.employee_id === empId : true;
      if (!matchEmp || h.status !== 'completed') return false;
      const ev = eventsMap.get(h.event_id);
      const develops = ev?.develops_skills || [];
      return develops.some((d: any) => d.skill_id === skillId && Number(d.gain) > 0);
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  // Extract events details
  const skillEventsWithGain = skillModifyingEvents.map((h) => {
    const ev = eventsMap.get(h.event_id);
    const develops = ev?.develops_skills || [];
    const devItem = develops.find((d: any) => d.skill_id === skillId);
    const gain = devItem ? Number(devItem.gain) || 0 : 0;
    return {
      date: h.date,
      event_id: h.event_id,
      event_title: h.event_title || ev?.title || h.event_id,
      gain,
    };
  });

  // Calculate starting baseline level before these recorded skill gains
  const totalSkillGains = skillEventsWithGain.reduce((sum, a) => sum + a.gain, 0);
  const baseline = Math.max(0, currentLevel - totalSkillGains);

  // Take the last 5 events (or pad to 5 if fewer than 5 events modified this skill)
  const lastEvents = skillEventsWithGain.slice(-5);
  const progression: SkillProgressionPoint[] = [];
  const missingCount = 5 - lastEvents.length;

  // Pad beginning with baseline points
  for (let i = 0; i < missingCount; i++) {
    const ptNum = i + 1;
    progression.push({
      activity_index: ptNum,
      activity_label: `Точка ${ptNum}`,
      period: `Точка ${ptNum}`,
      date: employee?.hire_date || '2025-01-01',
      level: baseline,
      event_title: 'Базовый срез (до развивающих активностей)',
      gain: 0,
    });
  }

  // Roll through the events modifying this skill
  let rollingLevel = baseline;
  for (let i = 0; i < lastEvents.length; i++) {
    const act = lastEvents[i];
    rollingLevel = Math.min(5, rollingLevel + act.gain);
    if (i === lastEvents.length - 1) {
      rollingLevel = currentLevel;
    }
    const ptNum = missingCount + i + 1;
    progression.push({
      activity_index: ptNum,
      activity_label: `Точка ${ptNum}`,
      period: `Точка ${ptNum}`,
      date: act.date,
      level: rollingLevel,
      event_title: act.event_title,
      gain: act.gain,
    });
  }

  // Velocity calculation: slope of proficiency gain over the 5 data points
  const netGrowth = currentLevel - baseline;
  const slope = Number((netGrowth / 5).toFixed(2));
  const velocity_badge = slope > 0 ? `+${slope}/act` : `0.0/act`;

  let velocity_label = '0 ур. (плато)';
  let velocity_trend: 'up' | 'stable' | 'slow' = 'stable';

  if (netGrowth >= 2) {
    velocity_label = `+${netGrowth} ур. (высокий темп 🚀)`;
    velocity_trend = 'up';
  } else if (netGrowth === 1) {
    velocity_label = `+1 ур. (уверенный рост ↑)`;
    velocity_trend = 'up';
  } else {
    if (currentLevel >= requiredLevel) {
      velocity_label = 'Норма грейда (стабильно ✓)';
      velocity_trend = 'stable';
    } else {
      velocity_label = '0 ур. (плато — нужен фокус)';
      velocity_trend = 'slow';
    }
  }

  return {
    progression,
    velocity_label,
    velocity_trend,
    learning_velocity: slope,
    velocity_badge,
  };
}

export const SkillGapsTable: React.FC<SkillGapsTableProps> = ({
  gaps = [],
  targetGrade = '',
  activity_history,
  activityHistory,
  history,
  employees,
  employee,
  events,
}) => {
  // Normalize incoming history array
  const effectiveHistory = useMemo(() => {
    return activity_history || activityHistory || history || [];
  }, [activity_history, activityHistory, history]);

  // Normalize incoming employee object
  const effectiveEmployee = useMemo(() => {
    if (Array.isArray(employees)) {
      return employees[0] || employee;
    }
    return employees || employee;
  }, [employees, employee]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Требования грейда {targetGrade || 'целевой должности'} и разрывы компетенций
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Сравнение с целевой матрицей Halyk Bank, динамика навыка за последние 5 активностей и Learning Velocity (наклон кривой прироста)
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            Learning Velocity
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3">Компетенция</th>
              <th className="py-2.5 px-3">Категория</th>
              <th className="py-2.5 px-3 text-center">Текущий / Цель</th>
              <th className="py-2.5 px-3 text-center">Шкала (0–5)</th>
              <th className="py-2.5 px-3 text-center min-w-[125px]">
                <div className="inline-flex items-center justify-center gap-1">
                  <span>Динамика (Sparkline)</span>
                  <span
                    title="Кривая изменения уровня навыка по событиям, развивающим данную компетенцию (LineChart, последние 5 точек)"
                    className="cursor-help"
                  >
                    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                  </span>
                </div>
              </th>
              <th className="py-2.5 px-3 text-center min-w-[110px]">
                <div className="inline-flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Learning Velocity</span>
                  <span
                    title="Наклон кривой прироста (Slope = Δуровень / 5 активностей). Показывает скорость и эффективность освоения компетенции"
                    className="cursor-help"
                  >
                    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                  </span>
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Разрыв (Gap)</th>
              <th className="py-2.5 px-3 text-center">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gaps.map((g) => {
              const isClosed = g.gap === 0;

              // Color determination
              let strokeColor = '#059669'; // Emerald default
              if (g.is_critical && g.gap > 0) {
                strokeColor = '#d97706'; // Amber for critical gap
              } else if (g.gap > 0) {
                strokeColor = '#2563eb'; // Blue for standard gap
              }

              // Compute progression from activity_history for events modifying this specific skill
              let progressionData = g.progression;
              let velocityLabel = g.velocity_label;
              let velocityTrend = g.velocity_trend;
              let velocityBadge = g.velocity_badge;
              let learningVelocity = g.learning_velocity ?? 0;

              if (effectiveHistory.length > 0 || effectiveEmployee) {
                const calculated = calculateHistoricalSkillProgression(
                  g.skill_id,
                  g.current_level,
                  g.required_level,
                  effectiveHistory,
                  effectiveEmployee,
                  events
                );
                progressionData = calculated.progression;
                velocityLabel = calculated.velocity_label;
                velocityTrend = calculated.velocity_trend;
                velocityBadge = calculated.velocity_badge;
                learningVelocity = calculated.learning_velocity;
              }

              // Fallback 5 points if still empty
              if (!progressionData || progressionData.length === 0) {
                progressionData = [
                  { activity_index: 1, activity_label: 'Точка 1', period: 'Точка 1', date: '2025-09-01', level: g.current_level, gain: 0 },
                  { activity_index: 2, activity_label: 'Точка 2', period: 'Точка 2', date: '2025-12-01', level: g.current_level, gain: 0 },
                  { activity_index: 3, activity_label: 'Точка 3', period: 'Точка 3', date: '2026-03-01', level: g.current_level, gain: 0 },
                  { activity_index: 4, activity_label: 'Точка 4', period: 'Точка 4', date: '2026-06-01', level: g.current_level, gain: 0 },
                  { activity_index: 5, activity_label: 'Точка 5', period: 'Точка 5', date: '2026-09-23', level: g.current_level, gain: 0 },
                ];
              }

              // Fallback for velocity badge if not pre-computed
              if (!velocityBadge) {
                const firstPt = progressionData[0]?.level ?? g.current_level;
                const lastPt = progressionData[progressionData.length - 1]?.level ?? g.current_level;
                const slopeVal = Number(Math.max(0, (lastPt - firstPt) / 5).toFixed(2));
                learningVelocity = slopeVal;
                velocityBadge = slopeVal > 0 ? `+${slopeVal}/act` : `0.0/act`;
              }

              return (
                <tr
                  key={g.skill_id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    g.is_critical && g.gap > 0 ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Skill Name & ID */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{g.name}</span>
                      {g.is_critical && (
                        <span
                          title="Критический навык для целевого грейда"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                        >
                          <ShieldAlert className="w-3 h-3 text-amber-700" />
                          Критичный
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {g.skill_id}
                    </span>
                  </td>

                  {/* Category & Type */}
                  <td className="py-3 px-3 text-slate-600">
                    <span className="text-slate-700 font-medium">{g.category}</span>
                    <span className="text-slate-400 block text-[10px]">
                      {g.type === 'hard' ? 'Hard Skill' : 'Soft Skill'}
                    </span>
                  </td>

                  {/* Current vs Target */}
                  <td className="py-3 px-3 text-center font-mono font-semibold">
                    <span className={g.gap > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                      {g.current_level}
                    </span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-slate-700">{g.required_level}</span>
                  </td>

                  {/* Visual 5-pip scale */}
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => {
                        const isFilled = lvl <= g.current_level;
                        const isRequired = lvl <= g.required_level;

                        let pipClass = 'bg-slate-100 border-slate-200';
                        if (isFilled) {
                          pipClass = g.is_critical
                            ? 'bg-amber-500 border-amber-600'
                            : 'bg-emerald-600 border-emerald-700';
                        } else if (isRequired) {
                          pipClass = 'bg-white border-dashed border-slate-300';
                        }

                        return (
                          <div
                            key={lvl}
                            title={`Уровень ${lvl}${
                              isRequired ? ' (Требуется)' : ''
                            }`}
                            className={`w-3.5 h-3.5 rounded-sm border ${pipClass}`}
                          />
                        );
                      })}
                    </div>
                  </td>

                  {/* Recharts LineChart Sparkline */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-[110px] h-[30px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={28}>
                          <LineChart
                            data={progressionData}
                            margin={{ top: 3, right: 4, left: 4, bottom: 3 }}
                          >
                            <YAxis domain={[0, 5]} hide />
                            <Tooltip content={<SparklineTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="level"
                              stroke={strokeColor}
                              strokeWidth={2}
                              isAnimationActive={false}
                              dot={{ r: 1.5, fill: strokeColor }}
                              activeDot={{
                                r: 3.5,
                                stroke: '#ffffff',
                                strokeWidth: 1.5,
                                fill: strokeColor,
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </td>

                  {/* Dedicated Learning Velocity Column */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      {/* Slope badge (e.g., '+0.5/act', '+0.2/act', '0.0/act') */}
                      <span
                        title={`Скорость прироста (slope): ${velocityBadge} по последним 5 активностям`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold shadow-2xs border ${
                          learningVelocity >= 0.4
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : learningVelocity > 0
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {learningVelocity > 0 ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <Minus className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                        <span>{velocityBadge}</span>
                      </span>

                      {/* Micro context label */}
                      <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                        {velocityTrend === 'up'
                          ? 'высокий темп'
                          : velocityTrend === 'slow'
                          ? 'плато'
                          : 'стабильно'}
                      </span>
                    </div>
                  </td>

                  {/* Gap Value */}
                  <td className="py-3 px-3 text-center font-bold">
                    {isClosed ? (
                      <span className="text-emerald-700 text-xs font-semibold">0</span>
                    ) : (
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono ${
                          g.is_critical
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        +{g.gap} ур.
                      </span>
                    )}
                  </td>

                  {/* Status Indicator */}
                  <td className="py-3 px-3 text-center">
                    {isClosed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Закрыт
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          g.is_critical ? 'text-amber-800' : 'text-slate-600'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {g.is_critical ? 'Требует закрытия' : 'В развитии'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
