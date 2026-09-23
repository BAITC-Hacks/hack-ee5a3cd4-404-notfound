import React from 'react';
import { AlertTriangle, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface BenchmarkNoticeProps {
  currentEmployeeId: string;
  onSelectEmployee: (id: string) => void;
}

export const BenchmarkNotice: React.FC<BenchmarkNoticeProps> = ({
  currentEmployeeId,
  onSelectEmployee,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Проверочные кейсы для защиты хакатона (защита от однофакторной ошибки)
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Жюри проверяет решение на профилях, где наивное правило «рекомендуй активность на самый низкий навык» ошибается. 
              В Career Quest скоринг опирается минимум на 3 фактора одновременно: требования целевого грейда, критичность навыка (вес x3) и историю участия (штрафы за отказы/неявки).
            </p>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start shrink-0">
          <button
            onClick={() => onSelectEmployee('EMP_001')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              currentEmployeeId === 'EMP_001'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Тест #1: Алексей Иванов</span>
            {currentEmployeeId === 'EMP_001' && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onSelectEmployee('EMP_002')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              currentEmployeeId === 'EMP_002'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Тест #2: Айгерим Сергазина</span>
            {currentEmployeeId === 'EMP_002' && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onSelectEmployee('EMP_003')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              currentEmployeeId === 'EMP_003'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Тест #3: Данияр Касымбеков</span>
            {currentEmployeeId === 'EMP_003' && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {currentEmployeeId === 'EMP_001' && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-700 bg-emerald-50/50 rounded-lg p-3">
          <div className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Разбор проверочного кейса EMP_001 (Алексей Иванов):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2">
            <div className="bg-white p-2.5 rounded border border-emerald-200/80">
              <span className="font-medium text-slate-900 block mb-0.5">1. Целевые требования:</span>
              <span>Цель: Senior Backend. Критичные навыки: System Design (ур. 4) и PostgreSQL (ур. 4). Public Speaking (ур. 2) — некритичен.</span>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200/80">
              <span className="font-medium text-slate-900 block mb-0.5">2. Разрыв по навыкам:</span>
              <span>Public Speaking: ур. 0 (разрыв 2). System Design: ур. 2 (разрыв 2, критический вес x3). Однофакторный подход ошибочно взял бы Public Speaking.</span>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200/80">
              <span className="font-medium text-slate-900 block mb-0.5">3. Поведенческая история:</span>
              <span>3 отказа/неявки по софт-скилл митапам (штраф -42), но 100% завершаемость тех. воркшопов. Итог: воркшоп System Design побеждает с отрывом!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
