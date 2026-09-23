/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { BenchmarkNotice } from './components/BenchmarkNotice.tsx';
import { EmployeeSelector } from './components/EmployeeSelector.tsx';
import { ProfileCard } from './components/ProfileCard.tsx';
import { SkillGapsTable } from './components/SkillGapsTable.tsx';
import { RecommendationCard } from './components/RecommendationCard.tsx';
import { ActivityHistoryTable } from './components/ActivityHistoryTable.tsx';
import { HRDashboard } from './components/HRDashboard.tsx';
import { ImportModal } from './components/ImportModal.tsx';
import { EventsCatalog } from './components/EventsCatalog.tsx';
import { CompetencyRadarModal } from './components/CompetencyRadarModal.tsx';
import { CareerSimulatorModal } from './components/CareerSimulatorModal.tsx';
import { IndividualDevelopmentPlanModal } from './components/IndividualDevelopmentPlanModal.tsx';
import { GamificationTab } from './components/GamificationTab.tsx';
import { HREventBuilderModal } from './components/HREventBuilderModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Language, translations } from './i18n/translations.ts';
import { apiFetch, clearCsrfToken, setCsrfToken } from './lib/api.ts';
import {
  Employee,
  Trajectory,
  ActivityRecord,
  Recommendation,
  HROverview,
  Grade,
  LearningEvent,
  SimpleEmployeeInfo,
} from './types/index.ts';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const [session, setSession] = useState<{
    username: string;
    role: 'admin' | 'employee';
    employeeId?: string;
    csrfToken: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employee' | 'catalog' | 'gamification' | 'hr' | 'import'>('employee');
  const [employeesList, setEmployeesList] = useState<SimpleEmployeeInfo[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('EMP_001');

  const [employeeData, setEmployeeData] = useState<{
    employee: Employee;
    trajectory: Trajectory;
    history: ActivityRecord[];
  } | null>(null);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hrOverview, setHrOverview] = useState<HROverview | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [isPDPOpen, setIsPDPOpen] = useState<boolean>(false);
  const [isEventBuilderOpen, setIsEventBuilderOpen] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAuthenticated = (nextSession: {
    username: string;
    role: 'admin' | 'employee';
    employeeId?: string;
    csrfToken: string;
  }) => {
    setCsrfToken(nextSession.csrfToken);
    setSession(nextSession);
    if (nextSession.employeeId) setSelectedEmployeeId(nextSession.employeeId);
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearCsrfToken();
      setSession(null);
      setEmployeesList([]);
      setEmployeeData(null);
      setHrOverview(null);
    }
  };

  useEffect(() => {
    let active = true;
    apiFetch('/api/auth/session')
      .then(async (res) => {
        if (!res.ok) return;
        const nextSession = await res.json();
        if (active) handleAuthenticated(nextSession);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveGoal = async (targetRole: string, targetGrade: Grade) => {
    try {
      const res = await apiFetch(`/api/employees/${selectedEmployeeId}/career-goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_role: targetRole, target_grade: targetGrade }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения карьерной цели');
      const data = await res.json();
      setEmployeeData((prev) =>
        prev
          ? {
              ...prev,
              employee: data.employee,
              trajectory: data.trajectory,
            }
          : null
      );
      setRecommendations(data.recommendations);
      fetchEmployeesList();
      showToast(
        `Целевая траектория обновлена: ${targetRole} (${targetGrade})!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Fetch all employees list
  const fetchEmployeesList = useCallback(async () => {
    try {
      const res = await apiFetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployeesList(data);
        if (data.length > 0) {
          setSelectedEmployeeId((current) => data.some((employee: SimpleEmployeeInfo) => employee.employee_id === current)
            ? current
            : data[0].employee_id
          );
        }
      }
    } catch (err) {
      console.error('Error fetching employees list:', err);
    }
  }, []);

  // Fetch HR Overview
  const fetchHROverview = useCallback(async () => {
    try {
      const res = await apiFetch('/api/hr/overview');
      if (res.ok) {
        const data = await res.json();
        setHrOverview(data);
      }
    } catch (err) {
      console.error('Error fetching HR overview:', err);
    }
  }, []);

  // Fetch selected employee details & recommendations
  const fetchEmployeeDetails = useCallback(async (empId: string) => {
    setLoading(true);
    try {
      const [empRes, recRes] = await Promise.all([
        apiFetch(`/api/employees/${empId}`),
        apiFetch(`/api/employees/${empId}/recommendations?limit=3`),
      ]);

      if (empRes.ok && recRes.ok) {
        const empJson = await empRes.json();
        const recJson = await recRes.json();

        setEmployeeData(empJson);
        setRecommendations(recJson.recommendations || []);
      }
    } catch (err) {
      console.error('Error loading employee data:', err);
      showToast('Ошибка при загрузке данных сотрудника', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the visible data only after the authenticated session is known.
  useEffect(() => {
    if (!session) return;
    fetchEmployeesList();
    if (session.role === 'admin') fetchHROverview();
  }, [session, fetchEmployeesList, fetchHROverview]);

  useEffect(() => {
    if (!session || !selectedEmployeeId) return;
    if (session.role === 'employee' && session.employeeId !== selectedEmployeeId) return;
    fetchEmployeeDetails(selectedEmployeeId);
  }, [session, selectedEmployeeId, fetchEmployeeDetails]);

  // When selected employee changes
  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    fetchEmployeeDetails(id);
  };

  // Complete an activity
  const handleCompleteActivity = async (eventId: string) => {
    if (!employeeData) return;
    setIsCompleting(true);
    try {
      const res = await apiFetch(
        `/api/employees/${selectedEmployeeId}/activities/${eventId}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Ошибка при завершении активности');
      }

      const data = await res.json();

      // Dynamically update UI state without full reload
      const updatedHistory = await (
        await apiFetch(`/api/employees/${selectedEmployeeId}`)
      ).json();

      setEmployeeData({
        employee: data.employee,
        trajectory: data.trajectory,
        history: updatedHistory.history,
      });

      setRecommendations(data.recommendations);

      // Refresh HR stats
      fetchHROverview();

      showToast(
        `Активность успешно завершена! Компетенции обновлены (+${Object.values(
          data.updated_skills
        )
          .map((s: any) => `${s.gain} ур.`)
          .join(', ')}). Готовность: ${data.trajectory.overall_readiness_pct}%.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // Handler for import success from Jury modal
  const handleImportSuccess = async (importedId?: string) => {
    await fetchEmployeesList();
    if (session?.role === 'admin') await fetchHROverview();
    if (importedId) {
      setSelectedEmployeeId(importedId);
      await fetchEmployeeDetails(importedId);
      setActiveTab('employee');
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-100" />;
  }

  if (!session) {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in shadow-lg">
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalEmployees={employeesList.length || 200}
        lang={lang}
        setLang={setLang}
        isAdmin={session.role === 'admin'}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Employee Trajectory & AI Recommendations */}
        {activeTab === 'employee' && (
          <div className="space-y-6">
            {/* Jury benchmark explanation & quick buttons */}
            <BenchmarkNotice
              currentEmployeeId={selectedEmployeeId}
              onSelectEmployee={handleSelectEmployee}
            />

            {/* Employee Selector Bar */}
            <EmployeeSelector
              employees={employeesList}
              selectedEmployeeId={selectedEmployeeId}
              onSelectEmployee={handleSelectEmployee}
            />

            {loading || !employeeData ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-medium">
                  Расчет многофакторной траектории и AI-рекомендаций...
                </p>
              </div>
            ) : (
              <>
                {/* Employee Profile & Readiness Card */}
                <ProfileCard
                  employee={employeeData.employee}
                  trajectory={employeeData.trajectory}
                  onOpenSimulator={() => setIsSimulatorOpen(true)}
                  onOpenRadar={() => setIsRadarOpen(true)}
                  onOpenPDP={() => setIsPDPOpen(true)}
                />

                {/* AI Recommendations Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Рекомендованные шаги развития (Топ-{recommendations.length})
                        </h2>
                        <p className="text-xs text-slate-500">
                          Сформировано на основе 3 факторов: целевой грейд, критичность разрыва (x3) и история вовлеченности
                        </p>
                      </div>
                    </div>
                  </div>

                  {recommendations.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                      Все текущие разрывы компетенций закрыты либо отсутствуют доступные курсы с выполненными пререквизитами.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {recommendations.map((rec, idx) => (
                        <RecommendationCard
                          key={rec.event_id}
                          recommendation={rec}
                          rank={idx + 1}
                          onComplete={handleCompleteActivity}
                          isCompleting={isCompleting}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Competency Gaps Table & Activity History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <SkillGapsTable
                    gaps={employeeData.trajectory.gaps}
                    targetGrade={employeeData.trajectory.target_grade}
                    activity_history={employeeData.history}
                    employees={employeeData.employee}
                    history={employeeData.history}
                    employee={employeeData.employee}
                  />

                  <ActivityHistoryTable history={employeeData.history} />
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: Events Catalog */}
        {activeTab === 'catalog' && employeeData && (
          <EventsCatalog
            currentEmployee={employeeData.employee}
            onCompleteActivity={handleCompleteActivity}
            isCompleting={isCompleting}
          />
        )}

        {/* TAB 3: Gamification, Challenges, Kudos & Benefits Store */}
        {activeTab === 'gamification' && employeeData && (
          <GamificationTab
            currentEmployee={employeeData.employee}
            allEmployees={employeesList}
            lang={lang}
            onShowToast={showToast}
          />
        )}

        {/* TAB 4: HR Analytics */}
        {session.role === 'admin' && activeTab === 'hr' && (
          <div>
            {hrOverview ? (
              <HRDashboard
                overview={hrOverview}
                lang={lang}
                onOpenEventBuilder={() => setIsEventBuilderOpen(true)}
                onSelectEmployee={(empId) => {
                  setSelectedEmployeeId(empId);
                  fetchEmployeeDetails(empId);
                  setActiveTab('employee');
                }}
              />
            ) : (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500">Загрузка HR-аналитики...</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Jury Import Panel */}
        {session.role === 'admin' && activeTab === 'import' && (
          <ImportModal onImportSuccess={handleImportSuccess} />
        )}
      </main>

      {/* Modals */}
      {employeeData && (
        <>
          <CareerSimulatorModal
            isOpen={isSimulatorOpen}
            onClose={() => setIsSimulatorOpen(false)}
            employee={employeeData.employee}
            currentTrajectory={employeeData.trajectory}
            onSaveGoal={handleSaveGoal}
          />

          <CompetencyRadarModal
            isOpen={isRadarOpen}
            onClose={() => setIsRadarOpen(false)}
            employee={employeeData.employee}
            trajectory={employeeData.trajectory}
          />

          <IndividualDevelopmentPlanModal
            isOpen={isPDPOpen}
            onClose={() => setIsPDPOpen(false)}
            employee={employeeData.employee}
            trajectory={employeeData.trajectory}
            recommendations={recommendations}
            history={employeeData.history}
            onShowToast={showToast}
          />

          <HREventBuilderModal
            isOpen={isEventBuilderOpen}
            onClose={() => setIsEventBuilderOpen(false)}
            lang={lang}
            onEventCreated={(_created) => {
              fetchHROverview();
              if (selectedEmployeeId) {
                fetchEmployeeDetails(selectedEmployeeId);
              }
            }}
            onShowToast={showToast}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Halyk Career Quest © 2026 · Хакатон HackAlem AI · Детерминированный AI-слой
          </span>
          <span className="text-slate-400">
            Трек Halyk Bank · Без внешних AI API · Полная объяснимость
          </span>
        </div>
      </footer>
    </div>
  );
}
