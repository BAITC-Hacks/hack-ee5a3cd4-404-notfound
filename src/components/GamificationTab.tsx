import React, { useState, useEffect, useCallback } from 'react';
import {
  EmployeeGamification,
  RewardItem,
  Employee,
  SimpleEmployeeInfo,
} from '../types/index.ts';
import { Language, translations } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import {
  Coins,
  Trophy,
  Gift,
  Heart,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
} from 'lucide-react';

interface GamificationTabProps {
  currentEmployee: Employee;
  allEmployees: SimpleEmployeeInfo[];
  lang: Language;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const GamificationTab: React.FC<GamificationTabProps> = ({
  currentEmployee,
  allEmployees,
  lang,
  onShowToast,
}) => {
  const t = translations[lang];
  const [data, setData] = useState<
    (EmployeeGamification & { catalog: RewardItem[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Kudos modal/form state
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);
  const [kudosRecipientId, setKudosRecipientId] = useState('');
  const [kudosSkillId, setKudosSkillId] = useState('SK_001');
  const [kudosMessage, setKudosMessage] = useState('');
  const [sendingKudos, setSendingKudos] = useState(false);

  const fetchGamification = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/employees/${currentEmployee.employee_id}/gamification`);
      if (!res.ok) throw new Error('Ошибка загрузки данных геймификации');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentEmployee.employee_id, onShowToast]);

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  const handleRedeem = async (reward: RewardItem) => {
    if (!data || data.coins < reward.cost) {
      onShowToast(
        lang === 'kz'
          ? `Coins жеткіліксіз (қалдық: ${data?.coins || 0}, қажет: ${reward.cost})`
          : `Недостаточно Halyk Coins (баланс: ${data?.coins || 0}, требуется: ${reward.cost})`,
        'error'
      );
      return;
    }

    try {
      setRedeemingId(reward.id);
      const res = await apiFetch(
        `/api/employees/${currentEmployee.employee_id}/rewards/redeem`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reward_id: reward.id }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка списания баллов');
      onShowToast(json.message, 'success');
      fetchGamification();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kudosRecipientId) {
      onShowToast(
        lang === 'kz' ? 'Әріптесті таңдаңыз' : 'Выберите коллегу-получателя',
        'error'
      );
      return;
    }
    if (!kudosMessage.trim()) {
      onShowToast(
        lang === 'kz' ? 'Алғыс мәтінін жазыңыз' : 'Введите текст благодарности',
        'error'
      );
      return;
    }

    try {
      setSendingKudos(true);
      const res = await apiFetch(`/api/employees/${currentEmployee.employee_id}/kudos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_employee_id: kudosRecipientId,
          skill_id: kudosSkillId,
          message: kudosMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка отправки Kudos');
      onShowToast(json.message, 'success');
      setIsKudosModalOpen(false);
      setKudosMessage('');
      fetchGamification();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setSendingKudos(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2 text-emerald-700" />
        {lang === 'kz' ? 'Жүктелуде...' : 'Загрузка профиля геймификации...'}
      </div>
    );
  }

  const otherEmployees = allEmployees.filter(
    (e) => e.employee_id !== currentEmployee.employee_id
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Coins Balance & Gamification Ethics Notice */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-700/60 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Halyk Voluntary Growth System
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t.gamification.title}
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
              {t.gamification.subtitle}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-inner">
              🪙
            </div>
            <div>
              <div className="text-xs text-emerald-200 font-medium">
                {t.gamification.balance}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {data.coins}{' '}
                <span className="text-sm font-normal text-amber-300">Coins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ethical Notice Banner per Hackathon TZ */}
        <div className="mt-4 pt-4 border-t border-emerald-700/50 flex items-center gap-2 text-[11px] text-emerald-200">
          <AlertCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>
            {lang === 'kz'
              ? 'Этикалық сәйкестік: Балдар таймшиттерге немесе міндетті процестерге берілмейді. Қоғамдық рейтингтер жоқ. Тек ерікті оқу мен құзыреттерді дамыту марапатталады.'
              : 'Этический контур: Баллы начисляются исключительно за добровольное развитие компетенций (без баллов за таймшиты и без токсичных публичных рейтингов).'}
          </span>
        </div>
      </div>

      {/* Grid: Challenges & Peer Kudos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Challenges */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {t.gamification.challengesTitle}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Q3 2026</span>
          </div>

          <div className="space-y-3.5">
            {data.challenges.map((ch) => {
              const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
              return (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    ch.completed
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {ch.title}
                        </span>
                        {ch.completed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {lang === 'kz' ? 'Орындалды' : 'Завершен'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {ch.description}
                      </p>
                    </div>
                    <span className="shrink-0 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                      +{ch.reward_coins} 🪙
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{lang === 'kz' ? 'Орындалуы' : 'Прогресс'}</span>
                      <span className="font-semibold text-slate-700">
                        {ch.current} / {ch.target}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          ch.completed ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peer Kudos (Признание от коллег) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t.gamification.kudosTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsKudosModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                {t.gamification.sendKudosButton}
              </button>
            </div>

            {data.kudos_received.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                {lang === 'kz'
                  ? 'Әзірге алғыстар жоқ. Әріптестеріңізге бірінші болып алғыс жолдаңыз!'
                  : 'Пока нет полученных благодарностей. Отправьте первое спасибо коллегам!'}
              </div>
            ) : (
              <div className="space-y-3">
                {data.kudos_received.map((kudos, i) => (
                  <div
                    key={i}
                    className="p-3 bg-rose-50/40 border border-rose-100 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                      <span>{kudos.from_name}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {kudos.date}
                      </span>
                    </div>
                    <div className="inline-block bg-white text-rose-700 border border-rose-200 text-[10px] font-medium px-2 py-0.5 rounded-full mb-1.5">
                      ⭐ {kudos.skill_name}
                    </div>
                    <p className="text-slate-600 italic">«{kudos.message}»</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              {lang === 'kz'
                ? 'Алғыс алғанда: +15 Coins, жолдағанда: +5 Coins'
                : 'За полученное спасибо: +15 Coins, за отправку: +5 Coins'}
            </span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
        </div>
      </div>

      {/* Corporate Rewards Store (Halyk Store) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t.gamification.storeTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'kz'
                  ? 'Даму ұпайларын Halyk Benefits корпоративтік жеңілдіктері мен мерчіне айырбастаңыз'
                  : 'Обменивайте баллы развития на корпоративные бонусы, мерч и билеты на IT-события'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.catalog.map((reward) => {
            const canAfford = data.coins >= reward.cost;
            return (
              <div
                key={reward.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-all bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl p-2 bg-white rounded-lg shadow-xs border border-slate-100">
                      {reward.icon}
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-amber-100 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-md">
                      {reward.cost} Coins
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {reward.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    {reward.category}
                  </span>
                  <button
                    disabled={!canAfford || redeemingId === reward.id}
                    onClick={() => handleRedeem(reward)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                      canAfford
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {redeemingId === reward.id ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Gift className="w-3.5 h-3.5" />
                    )}
                    <span>{t.actions.redeemReward}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Redeemed History */}
        {data.redeemed_rewards.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-2">
              {lang === 'kz' ? 'Алынған сыйлықтар' : 'История полученных вознаграждений'}
            </h4>
            <div className="space-y-1.5">
              {data.redeemed_rewards.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200"
                >
                  <span className="font-medium text-slate-800">{r.title}</span>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>-{r.cost} Coins</span>
                    <span className="text-[11px]">{r.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Send Kudos */}
      {isKudosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'kz' ? 'Әріптеске алғыс айту (Kudos)' : 'Сказать спасибо коллеге (Kudos)'}
                </h3>
              </div>
              <button
                onClick={() => setIsKudosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendKudos} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'kz' ? 'Әріптесті таңдаңыз' : 'Коллега-получатель'}
                </label>
                <select
                  value={kudosRecipientId}
                  onChange={(e) => setKudosRecipientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  required
                >
                  <option value="">
                    {lang === 'kz' ? '-- Әріптесті таңдаңыз --' : '-- Выберите коллегу --'}
                  </option>
                  {otherEmployees.map((e) => (
                    <option key={e.employee_id} value={e.employee_id}>
                      {e.full_name} ({e.role} {e.grade}) — {e.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'kz' ? 'Дамыған құзыреттілік' : 'Связанная компетенция'}
                </label>
                <select
                  value={kudosSkillId}
                  onChange={(e) => setKudosSkillId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="SK_001">System Design & Архитектура</option>
                  <option value="SK_002">PostgreSQL & Оптимизация баз данных</option>
                  <option value="SK_003">Python / Backend-разработка</option>
                  <option value="SK_004">Docker & Контейнеризация</option>
                  <option value="SK_005">Kubernetes & Облачные платформы</option>
                  <option value="SK_009">Кросс-функциональное взаимодействие</option>
                  <option value="SK_010">Наставничество и менторинг</option>
                  <option value="SK_011">Ораторское мастерство (Public Speaking)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'kz' ? 'Алғыс мәтіні' : 'Текст благодарности'}
                </label>
                <textarea
                  value={kudosMessage}
                  onChange={(e) => setKudosMessage(e.target.value)}
                  rows={3}
                  placeholder={
                    lang === 'kz'
                      ? 'Мысалы: Релиз кезінде архитекутралық көмегіңіз үшін үлкен рақмет!'
                      : 'Например: Спасибо за подробный код-ревью и помощь с оптимизацией индексов базы данных!'
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKudosModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t.simulator.cancel}
                </button>
                <button
                  type="submit"
                  disabled={sendingKudos}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {sendingKudos ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{t.gamification.sendKudosButton}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
