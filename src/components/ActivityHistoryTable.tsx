import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, User, History } from 'lucide-react';
import { ActivityRecord, ActivityStatus } from '../types/index.ts';

interface ActivityHistoryTableProps {
  history: ActivityRecord[];
}

export const ActivityHistoryTable: React.FC<ActivityHistoryTableProps> = ({
  history,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredHistory = history.filter((h) => {
    if (filterStatus === 'all') return true;
    return h.status === filterStatus;
  });

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Завершено
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-900 border border-sky-300">
            <Clock className="w-3 h-3 text-sky-700" />
            В процессе
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-700" />
            Отказ
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300">
            <AlertTriangle className="w-3 h-3 text-purple-700" />
            Неявка
          </span>
        );
      case 'dropped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <XCircle className="w-3 h-3 text-amber-700" />
            Брошено
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-900 border border-orange-300">
            <Clock className="w-3 h-3 text-orange-700" />
            Просрочено
          </span>
        );
      default:
        return <span className="text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            История участия в развивающих активностях ({history.length})
          </h3>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 mr-1">Статус:</span>
          {['all', 'completed', 'declined', 'dropped', 'no_show'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all'
                ? 'Все'
                : st === 'completed'
                ? 'Завершено'
                : st === 'declined'
                ? 'Отказ'
                : st === 'dropped'
                ? 'Брошено'
                : 'Неявка'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Активность / Программа</th>
              <th className="py-2.5 px-3">Дата</th>
              <th className="py-2.5 px-3 text-center">Статус</th>
              <th className="py-2.5 px-3 text-center">Прогресс</th>
              <th className="py-2.5 px-3 text-center">Балл / Оценка</th>
              <th className="py-2.5 px-3 text-center">Инициатор</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Нет записей по выбранному фильтру
                </td>
              </tr>
            ) : (
              filteredHistory.map((h) => (
                <tr key={h.record_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {h.event_title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>{h.event_id}</span>
                      {h.event_type && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{h.event_type}</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                    {h.date}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {getStatusBadge(h.status)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-slate-800">
                      {h.completion_pct}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {h.status === 'completed' && h.score > 0 ? (
                      <span className="font-bold text-emerald-800">
                        {h.score}/100
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="text-slate-600 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100">
                      {h.assigned_by}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
