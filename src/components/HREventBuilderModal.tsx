import React, { useState } from 'react';
import { ActivityType, Grade, LearningEvent } from '../types/index.ts';
import { Language, translations } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { Plus, X, Calendar, Clock, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface HREventBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onEventCreated: (event: LearningEvent) => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const HREventBuilderModal: React.FC<HREventBuilderModalProps> = ({
  isOpen,
  onClose,
  lang,
  onEventCreated,
  onShowToast,
}) => {
  const t = translations[lang];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActivityType>('workshop');
  const [format, setFormat] = useState<'online' | 'offline' | 'hybrid'>('online');
  const [durationHours, setDurationHours] = useState(16);
  const [mandatory, setMandatory] = useState(false);
  const [targetRole, setTargetRole] = useState('Backend Developer');
  const [targetGrade, setTargetGrade] = useState<Grade>('Senior');
  const [primarySkillId, setPrimarySkillId] = useState('SK_001');
  const [skillGain, setSkillGain] = useState(2);
  const [maxLevel, setMaxLevel] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      onShowToast(
        lang === 'kz' ? 'Атауы мен сипаттамасын толтырыңыз' : 'Заполните название и описание мероприятия',
        'error'
      );
      return;
    }

    try {
      setSubmitting(true);
      const newEventPayload: LearningEvent = {
        event_id: `EV_HR_${Date.now()}`,
        title,
        description,
        type,
        format,
        duration_hours: Number(durationHours),
        mandatory,
        target_roles: [targetRole],
        target_grades: [targetGrade],
        develops_skills: [
          {
            skill_id: primarySkillId,
            gain: Number(skillGain),
            max_level: Number(maxLevel),
          },
        ],
        prerequisites: {},
        upcoming_sessions: ['2026-10-15', '2026-11-01'],
      };

      const res = await apiFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventPayload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка создания мероприятия');

      onShowToast(json.message, 'success');
      onEventCreated(json.event);
      onClose();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'kz'
                  ? 'HR Іс-шара конструкторы (Halyk Academy)'
                  : 'Конструктор обучающих мероприятий HR (Halyk Academy)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'kz'
                  ? 'Жаңа даму бағдарламасын құру және құзыреттер матрицасына байланыстыру'
                  : 'Создание новой развивающей программы с привязкой к матрице компетенций'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'kz' ? 'Іс-шара атауы' : 'Название программы / курса'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Интенсив: HighLoad Архитектура и Kafka в Процессинге"
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'kz' ? 'Сипаттамасы мен мақсаты' : 'Описание и цели обучения'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Практическая проработка паттернов шардирования, очередей сообщений и отказоустойчивости..."
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'kz' ? 'Форматы' : 'Формат'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="workshop">Воркшоп (Workshop)</option>
                <option value="course">Онлайн-курс (Course)</option>
                <option value="meetup">Митап (Meetup)</option>
                <option value="mentoring">Менторинг (Mentoring)</option>
                <option value="certification">Сертификация</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'kz' ? 'Өткізу түрі' : 'Локация'}
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="online">Online</option>
                <option value="offline">Offline (Алматы / Астана)</option>
                <option value="hybrid">Гибрид</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'kz' ? 'Ұзақтығы (сағат)' : 'Часов'}
              </label>
              <input
                type="number"
                min={2}
                max={120}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'kz' ? 'Мақсатты рөл' : 'Целевая роль'}
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Data Engineer">Data Engineer</option>
                <option value="System Analyst">System Analyst</option>
                <option value="QA Automation Engineer">QA Automation Engineer</option>
                <option value="Product Manager">Product Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'kz' ? 'Мақсатты грейд' : 'Целевой грейд'}
              </label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value as Grade)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="Junior">Junior</option>
                <option value="Middle">Middle</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>

          {/* Skill Gain rules per Hackathon Dataset spec */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>
                {lang === 'kz'
                  ? 'Дамитын құзыреттілік және деңгей өсімі (Gain & Max Level)'
                  : 'Развиваемая компетенция и правила роста навыка (Gain & Max Level)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {lang === 'kz' ? 'Құзыреттілік' : 'Компетенция'}
                </label>
                <select
                  value={primarySkillId}
                  onChange={(e) => setPrimarySkillId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="SK_001">System Design & Архитектура</option>
                  <option value="SK_002">PostgreSQL & Базы данных</option>
                  <option value="SK_003">Python / Backend-разработка</option>
                  <option value="SK_004">Docker & Контейнеризация</option>
                  <option value="SK_005">Kubernetes & Оркестрация</option>
                  <option value="SK_006">CI/CD & Деплой</option>
                  <option value="SK_009">Кросс-функциональное взаимодействие</option>
                  <option value="SK_010">Наставничество и менторинг</option>
                  <option value="SK_011">Ораторское мастерство</option>
                  <option value="SK_012">Управление стейкхолдерами</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {lang === 'kz' ? 'Өсім (+ ур.)' : 'Прирост (Gain)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={skillGain}
                  onChange={(e) => setSkillGain(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mandatory_check"
              checked={mandatory}
              onChange={(e) => setMandatory(e.target.checked)}
              className="rounded text-emerald-700 focus:ring-emerald-700 h-4 w-4"
            />
            <label htmlFor="mandatory_check" className="text-xs text-slate-700">
              {lang === 'kz'
                ? 'Міндетті комплаенс-бағдарламасы (ұсыныстар скорингінен шығарылады)'
                : 'Обязательный регуляторный комплаенс-курс (исключается из добровольных рекомендаций)'}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.simulator.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {submitting ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{t.actions.createEvent}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
