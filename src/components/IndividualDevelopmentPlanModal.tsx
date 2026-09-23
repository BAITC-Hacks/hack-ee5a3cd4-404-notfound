import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  Calendar,
  User,
  Building,
  Target,
  Award,
  CheckCircle2,
} from 'lucide-react';
import {
  Employee,
  Trajectory,
  Recommendation,
  ActivityRecord,
} from '../types/index.ts';

interface IndividualDevelopmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  trajectory: Trajectory;
  recommendations: Recommendation[];
  history: ActivityRecord[];
  onShowToast: (text: string, type?: 'success' | 'error') => void;
}

export const IndividualDevelopmentPlanModal: React.FC<
  IndividualDevelopmentPlanModalProps
> = ({
  isOpen,
  onClose,
  employee,
  trajectory,
  recommendations,
  history,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# Индивидуальный план развития (ИПР) · Halyk Bank`);
    lines.push(`**Сотрудник:** ${employee.full_name} (${employee.employee_id})`);
    lines.push(`**Департамент:** ${employee.department}`);
    lines.push(`**Текущая позиция:** ${employee.role} (${employee.grade})`);
    lines.push(`**Целевая позиция:** ${trajectory.target_role} (${trajectory.target_grade})`);
    lines.push(`**Текущая готовность к грейду:** ${trajectory.overall_readiness_pct}%`);
    lines.push(`**Дата формирования:** ${new Date().toLocaleDateString('ru-RU')}`);
    lines.push('');
    lines.push(`## 1. Дефицит компетенций (Skill Gaps)`);
    trajectory.gaps.forEach((g) => {
      lines.push(
        `- **${g.name}** [${g.skill_id}]: текущий ${g.current_level}/5 -> цель ${g.required_level}/5 (Разрыв: +${g.gap})${
          g.is_critical ? ' [КРИТИЧНЫЙ]' : ''
        }`
      );
    });
    lines.push('');
    lines.push(`## 2. Рекомендованные развивающие мероприятия`);
    recommendations.forEach((rec, idx) => {
      lines.push(`### ${idx + 1}. [${rec.event_id}] ${rec.title}`);
      lines.push(`- **Формат:** ${rec.format} (${rec.duration_hours} ч.)`);
      lines.push(
        `- **Развивает:** ${rec.develops_skills
          .map((s) => `${s.skill_name} (+${s.gain} ур.)`)
          .join(', ')}`
      );
      lines.push(`- **Обоснование:** ${rec.explanation}`);
      lines.push('');
    });
    lines.push(`## 3. Согласование`);
    lines.push(`- Руководитель направления: ___________________`);
    lines.push(`- Сотрудник: ${employee.full_name} ___________________`);
    lines.push(`- HR Business Partner: ___________________`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    onShowToast('ИПР скопирован в буфер обмена в формате Markdown!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fade-in relative max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:p-2">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Индивидуальный план развития (ИПР)
              </h2>
              <p className="text-xs text-slate-500">
                Документ согласования карьерного перехода и карты развития Halyk Bank
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Копировать Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 text-slate-900 print:overflow-visible">
          {/* Official Document Header */}
          <div className="flex items-start justify-between border-b-2 border-emerald-700 pb-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-800">
                АО «Народный Банк Казахстана» · Halyk Bank
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                ИНДИВИДУАЛЬНЫЙ ПЛАН РАЗВИТИЯ (ИПР)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Программа профессионального роста сотрудника на 2026–2027 гг.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">
                {employee.employee_id}
              </span>
              <span className="inline-block px-2.5 py-1 mt-1 text-xs font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                Готовность: {trajectory.overall_readiness_pct}%
              </span>
            </div>
          </div>

          {/* Employee & Career Target Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Сотрудник
              </span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {employee.full_name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Департамент
              </span>
              <span className="font-medium text-slate-800 block mt-0.5">
                {employee.department}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Текущий грейд
              </span>
              <span className="font-medium text-slate-800 block mt-0.5">
                {employee.role} ({employee.grade})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Целевой грейд
              </span>
              <span className="font-bold text-emerald-800 block mt-0.5">
                {trajectory.target_role} ({trajectory.target_grade})
              </span>
            </div>
          </div>

          {/* Section 1: Competency Gaps */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-xs">
                1
              </span>
              <span>Матрица разрывов компетенций (Target Competency Gaps)</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Компетенция</th>
                    <th className="py-2 px-3">Категория</th>
                    <th className="py-2 px-3 text-center">Текущий</th>
                    <th className="py-2 px-3 text-center">Целевой</th>
                    <th className="py-2 px-3 text-center">Разрыв</th>
                    <th className="py-2 px-3 text-center">Приоритет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trajectory.gaps.map((g) => (
                    <tr key={g.skill_id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {g.name}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{g.category}</td>
                      <td className="py-2 px-3 text-center font-mono">{g.current_level}</td>
                      <td className="py-2 px-3 text-center font-mono">{g.required_level}</td>
                      <td className="py-2 px-3 text-center font-bold">
                        {g.gap > 0 ? (
                          <span className="text-amber-800">+{g.gap} ур.</span>
                        ) : (
                          <span className="text-emerald-700">Закрыт ✓</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {g.is_critical ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Критичный (x3)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Стандартный</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Recommended Training Roadmap */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-xs">
                2
              </span>
              <span>План мероприятий по развитию (Development Action Plan)</span>
            </h3>

            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.event_id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {rec.title}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        ({rec.event_id})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px]">
                      {rec.format} · {rec.duration_hours} ч.
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {rec.explanation}
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 text-[11px] font-medium">
                      Развивает компетенции:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.develops_skills.map((s) => (
                        <span
                          key={s.skill_id}
                          className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold text-[10px] border border-emerald-300"
                        >
                          {s.skill_name} (+{s.gain} ур.)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Signatures */}
          <div className="pt-6 border-t-2 border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">
              Лист согласования и подписи
            </h3>
            <div className="grid grid-cols-3 gap-6 text-xs text-slate-700">
              <div className="space-y-6">
                <div>
                  <span className="font-bold block">Сотрудник:</span>
                  <span className="text-slate-500">{employee.full_name}</span>
                </div>
                <div className="border-b border-slate-400 w-full" />
                <span className="text-[10px] text-slate-400 block -mt-4">
                  (подпись, дата)
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="font-bold block">Непосредственный руководитель:</span>
                  <span className="text-slate-500">Team Lead / Head of Unit</span>
                </div>
                <div className="border-b border-slate-400 w-full" />
                <span className="text-[10px] text-slate-400 block -mt-4">
                  (подпись, дата)
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="font-bold block">HR Business Partner:</span>
                  <span className="text-slate-500">Департамент развития талантов</span>
                </div>
                <div className="border-b border-slate-400 w-full" />
                <span className="text-[10px] text-slate-400 block -mt-4">
                  (подпись, дата)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="pt-4 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
