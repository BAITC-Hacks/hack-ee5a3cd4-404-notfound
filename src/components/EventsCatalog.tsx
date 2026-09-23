import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Employee, LearningEvent } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';

interface EventsCatalogProps {
  currentEmployee: Employee;
  onCompleteActivity: (eventId: string) => Promise<void>;
  isCompleting: boolean;
}

export const EventsCatalog: React.FC<EventsCatalogProps> = ({
  currentEmployee,
  onCompleteActivity,
  isCompleting,
}) => {
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [completedId, setCompletedId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
      })
      .catch((err) => console.error('Error fetching events:', err))
      .finally(() => setLoading(false));
  }, []);

  // Formats and skills lists for filters
  const formats = useMemo(() => {
    const set = new Set<string>();
    events.forEach((ev) => {
      if (ev.format) set.add(ev.format);
    });
    return Array.from(set);
  }, [events]);

  const skillOptions = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((ev) => {
      ev.develops_skills?.forEach((d: any) => {
        if (!map.has(d.skill_id)) {
          map.set(d.skill_id, d.skill_id);
        }
      });
    });
    return Array.from(map.keys());
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFormat =
        selectedFormat === 'all' || ev.format === selectedFormat;

      const matchSkill =
        selectedSkill === 'all' ||
        ev.develops_skills?.some((d: any) => d.skill_id === selectedSkill);

      return matchSearch && matchFormat && matchSkill;
    });
  }, [events, searchQuery, selectedFormat, selectedSkill]);

  const handleEnrollAndComplete = async (eventId: string) => {
    setCompletedId(eventId);
    try {
      await onCompleteActivity(eventId);
    } finally {
      setCompletedId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Корпоративный каталог обучения · Halyk Academy
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Доступные обучающие мероприятия, воркшопы, сертификации и митапы для сотрудника{' '}
            <span className="font-semibold text-slate-800">
              {currentEmployee.full_name} ({currentEmployee.role})
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
            Всего в каталоге: {events.length} мероприятий
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или описанию..."
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Format filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="all">Все форматы</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Skill filter */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="all">Все навыки</option>
            {skillOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500">Загрузка каталога Halyk Academy...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
          Мероприятий по заданным фильтрам не найдено.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const isCurrentlyCompleting = isCompleting && completedId === ev.event_id;

            // Check if prerequisites are satisfied by employee
            let prereqsMet = true;
            for (const [pSkillId, minLvl] of Object.entries(ev.prerequisites || {})) {
              if ((currentEmployee.skills[pSkillId] || 0) < minLvl) {
                prereqsMet = false;
                break;
              }
            }

            return (
              <div
                key={ev.event_id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-slate-400 text-[11px] font-semibold">
                          {ev.event_id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {ev.format}
                        </span>
                        {ev.mandatory && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Обязательный (Compliance)
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                        {ev.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium shrink-0 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.duration_hours} ч.</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ev.description}
                  </p>

                  {/* Skills developed */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Развивает компетенции:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ev.develops_skills?.map((d: any) => (
                        <span
                          key={d.skill_id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200"
                        >
                          <span>{d.skill_id}</span>
                          <span className="font-bold text-emerald-700">
                            +{d.gain} ур.
                          </span>
                          <span className="text-slate-400 text-[9px]">
                            (макс {d.max_level})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {ev.prerequisites && Object.keys(ev.prerequisites).length > 0 && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      <span className="font-medium text-slate-600">Пререквизиты: </span>
                      {Object.entries(ev.prerequisites).map(([skId, minLvl]) => {
                        const hasLevel = (currentEmployee.skills[skId] || 0) >= minLvl;
                        return (
                          <span
                            key={skId}
                            className={`inline-block mr-2 ${
                              hasLevel ? 'text-emerald-700' : 'text-rose-600 font-semibold'
                            }`}
                          >
                            {skId} ≥ {minLvl} {hasLevel ? '✓' : '(недостаточно)'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Enroll / Complete Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    {prereqsMet ? (
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Пререквизиты выполнены
                      </span>
                    ) : (
                      <span className="text-amber-700 inline-flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Требуются базовые уровни
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleEnrollAndComplete(ev.event_id)}
                    disabled={!prereqsMet || isCompleting}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {isCurrentlyCompleting ? 'Применение...' : 'Пройти и обновить навыки'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
