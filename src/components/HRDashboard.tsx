import React, { useState, useMemo } from 'react';
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
  Flame,
  ShieldAlert,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { HROverview, AttritionRiskItem } from '../types/index.ts';
import { Language, translations } from '../i18n/translations.ts';

interface HRDashboardProps {
  overview: HROverview;
  onSelectEmployee: (id: string) => void;
  lang?: Language;
  onOpenEventBuilder?: () => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  overview,
  onSelectEmployee,
  lang = 'ru',
  onOpenEventBuilder,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'lagging' | 'activities' | 'no_recs' | 'attrition'>('lagging');
  const [attritionFilter, setAttritionFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [attritionSearch, setAttritionSearch] = useState('');

  const totalCompleted = overview.activity_analytics.by_status.completed || 0;
  const totalRecords = overview.activity_analytics.total_records || 1;
  const overallCompletionRate = Math.round((totalCompleted / totalRecords) * 100);

  const highRiskCount = overview.high_risk_count ?? (overview.attrition_risks?.filter((r) => r.risk_level === 'High').length || 0);

  const filteredAttrition = useMemo(() => {
    const list = overview.attrition_risks || [];
    return list.filter((r) => {
      const matchesLevel = attritionFilter === 'all' || r.risk_level === attritionFilter;
      const matchesSearch =
        r.full_name.toLowerCase().includes(attritionSearch.toLowerCase()) ||
        r.role.toLowerCase().includes(attritionSearch.toLowerCase()) ||
        r.department.toLowerCase().includes(attritionSearch.toLowerCase()) ||
        r.employee_id.toLowerCase().includes(attritionSearch.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [overview.attrition_risks, attritionFilter, attritionSearch]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.hr.totalEmployees}</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {overview.total_employees}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'kz' ? 'Дерекқордағы белсенді мамандар' : 'Инженеры и аналитики в базе данных'}
          </p>
        </div>

        {/* Card 2: Average Grade Readiness */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.hr.avgReadiness}</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {overview.avg_readiness_pct}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'kz' ? 'Құзыреттер матрицасына сәйкестік' : 'Соответствие матрице компетенций'}
          </p>
        </div>

        {/* Card 3: Attrition Flight Risk */}
        <div
          onClick={() => setActiveTab('attrition')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs cursor-pointer hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-rose-700">
              {lang === 'kz' ? 'Жоғары тәуекелдегілер (Flight Risk)' : 'Высокий риск оттока'}
            </span>
            <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {highRiskCount}{' '}
            <span className="text-xs font-normal text-slate-500">
              {lang === 'kz' ? 'қызметкер' : 'сотрудников'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'kz' ? 'Застой немесе шаршау белгілері' : 'Застой на грейде или срывы обучения'}
          </p>
        </div>

        {/* Card 4: Employees without next step */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.hr.withoutNextStep}</span>
            <UserX className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800">
            {overview.employees_without_recommendations.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {overview.employees_without_recommendations.length === 0
              ? (lang === 'kz' ? 'Барлығы қамтылған' : 'Все сотрудники охвачены рекомендациями')
              : (lang === 'kz' ? 'HR назарын қажет етеді' : 'Требуют внимания HR / промоушена')}
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation & Action Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('lagging')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'lagging'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>{t.hr.laggingSkills} ({overview.top_lagging_skills.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('attrition')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'attrition'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>{t.hr.flightRisk}</span>
              {highRiskCount > 0 && (
                <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {highRiskCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'activities'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t.hr.activityConversion}</span>
            </button>

            <button
              onClick={() => setActiveTab('no_recs')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'no_recs'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>{t.hr.withoutNextStep} ({overview.employees_without_recommendations.length})</span>
            </button>
          </div>

          {onOpenEventBuilder && (
            <button
              onClick={onOpenEventBuilder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t.actions.createEvent}</span>
            </button>
          )}
        </div>

        {/* TAB 1: Lagging Skills */}
        {activeTab === 'lagging' && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'kz'
                  ? 'Банк бойынша артта қалған құзыреттердің жиынтық кескіні'
                  : 'Сводный срез проседающих компетенций по банку'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'kz'
                  ? 'Қызметкерлер мен мақсатты грейдтер арасындағы ең үлкен алшақтықты көрсетеді'
                  : 'Ранжирование по совокупной сумме дефицита уровней от требований целевых ролей'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Компетенция</th>
                    <th className="py-2.5 px-3 font-semibold">Категория</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Тип</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Суммарный разрыв</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Сотрудников затронуто</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Критический разрыв</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.top_lagging_skills.map((skill, index) => (
                    <tr
                      key={skill.skill_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-900">
                            {skill.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {skill.category}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            skill.type === 'hard'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {skill.type.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                          {skill.total_gap_sum} ур.
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        {skill.affected_employees_count} чел.
                      </td>

                      <td className="py-3 px-3 text-right">
                        {skill.critical_gap_count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            <AlertOctagon className="w-3 h-3" />
                            {skill.critical_gap_count} критич.
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Attrition Flight Risk AI */}
        {activeTab === 'attrition' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/60 border border-rose-200 rounded-xl p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'kz' ? 'Шаршау және кету тәуекелдерін болжау (AI Flight Risk)' : 'Прогноз рисков выгорания и оттока сотрудников (AI Flight Risk)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {lang === 'kz'
                    ? 'Грейдтегі застой мерзімі, оқудан бас тарту пайызы және критикалық алшақтықтар негізінде есептеледі'
                    : 'Многофакторная предиктивная модель: застой на грейде >24 мес., частота отказов от программ и критический дефицит навыков'}
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={attritionFilter}
                  onChange={(e) => setAttritionFilter(e.target.value as any)}
                  className="bg-white border border-rose-200 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="all">Все уровни риска</option>
                  <option value="High">🔴 Высокий риск (High)</option>
                  <option value="Medium">🟡 Умеренный риск (Medium)</option>
                  <option value="Low">🟢 Низкий риск (Low)</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={attritionSearch}
                    onChange={(e) => setAttritionSearch(e.target.value)}
                    className="bg-white border border-rose-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Сотрудник</th>
                    <th className="py-2.5 px-3 font-semibold">Роль / Грейд</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Стаж</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Готовность</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Риск оттока</th>
                    <th className="py-2.5 px-3 font-semibold">Факторы риска</th>
                    <th className="py-2.5 px-3 font-semibold">Рекомендуемое превентивное действие</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttrition.map((item) => (
                    <tr key={item.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{item.full_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.employee_id} · {item.department}</span>
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        {item.role} <span className="font-semibold">({item.grade})</span>
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600">
                        {item.tenure_months} мес.
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800">{item.readiness_pct}%</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.risk_level === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : item.risk_level === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.risk_level === 'High' ? '🔴' : item.risk_level === 'Medium' ? '🟡' : '🟢'}{' '}
                          {item.risk_score}% ({item.risk_level})
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 max-w-xs">
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {item.primary_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </td>

                      <td className="py-3 px-3 text-emerald-950 font-medium max-w-xs text-[11px] bg-emerald-50/30 rounded">
                        {item.recommended_action}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectEmployee(item.employee_id)}
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
          </div>
        )}

        {/* TAB 3: Activity Analytics */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="mb-2">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'kz' ? 'Оқыту форматтарының конверсиясы' : 'Аналитика форматов развивающих мероприятий'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'kz'
                  ? 'Әрбір формат бойынша аяқталу және бас тарту көрсеткіштері'
                  : 'Завершаемость программ, явка и отказы по типам обучающих активностей за 24 месяца'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(overview.activity_analytics.by_type).map(([type, stats]) => (
                <div key={type} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">
                      {type}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {stats.completion_rate_pct}%
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Всего назначений:</span>
                      <span className="font-semibold text-slate-900">{stats.total}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Завершено:</span>
                      <span className="font-semibold">{stats.completed}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Отказов/срывов:</span>
                      <span className="font-semibold">{stats.declined_or_dropped}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Programs */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">
                {lang === 'kz' ? 'Танымал даму бағдарламалары' : 'Топ самых востребованных программ банка'}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-2 px-3 font-semibold">Программа</th>
                      <th className="py-2 px-3 font-semibold">Тип</th>
                      <th className="py-2 px-3 font-semibold text-center">Участников</th>
                      <th className="py-2 px-3 font-semibold text-center">Завершено</th>
                      <th className="py-2 px-3 font-semibold text-right">Конверсия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.activity_analytics.top_events.map((ev) => (
                      <tr key={ev.event_id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{ev.title}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ev.type}</td>
                        <td className="py-2.5 px-3 text-center">{ev.participants_count}</td>
                        <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">{ev.completed_count}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {ev.completion_rate_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Employees without next step */}
        {activeTab === 'no_recs' && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'kz' ? 'Ұсынылған қадамы жоқ қызметкерлер' : 'Сотрудники без рекомендованного следующего шага'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'kz'
                  ? 'Бұл мамандар 100% дайын болуы немесе жеке бағдарламаны талап етуі мүмкін'
                  : 'Специалисты, у которых закрыты все требования грейда на 100%, либо достигнут грейд Lead'}
              </p>
            </div>

            {overview.employees_without_recommendations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
                {lang === 'kz' ? 'Барлық қызметкерлер үшін ұсыныстар бар' : 'Все сотрудники компании имеют активные рекомендации.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-2.5 px-3 font-semibold">Сотрудник</th>
                      <th className="py-2.5 px-3 font-semibold">Текущая роль</th>
                      <th className="py-2.5 px-3 font-semibold">Целевая роль</th>
                      <th className="py-2.5 px-3 font-semibold">Причина отсутствия шага</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.employees_without_recommendations.map((emp) => (
                      <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{emp.full_name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{emp.employee_id}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{emp.role} ({emp.grade})</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{emp.target_role} ({emp.target_grade})</td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">{emp.reason}</span>
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
