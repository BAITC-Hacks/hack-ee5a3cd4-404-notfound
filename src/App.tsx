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
import {
  Employee,
  Trajectory,
  ActivityRecord,
  Recommendation,
  HROverview,
} from './types/index.ts';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface SimpleEmployeeInfo {
  employee_id: string;
  full_name: string;
  role: string;
  grade: string;
  department: string;
  career_goal: { target_role: string; target_grade: string } | null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'employee' | 'hr' | 'import'>('employee');
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

  // Fetch all employees list
  const fetchEmployeesList = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployeesList(data);
      }
    } catch (err) {
      console.error('Error fetching employees list:', err);
    }
  }, []);

  // Fetch HR Overview
  const fetchHROverview = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/overview');
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
        fetch(`/api/employees/${empId}`),
        fetch(`/api/employees/${empId}/recommendations?limit=3`),
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

  // Initial load
  useEffect(() => {
    fetchEmployeesList();
    fetchHROverview();
    fetchEmployeeDetails(selectedEmployeeId);
  }, []);

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
      const res = await fetch(
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
        await fetch(`/api/employees/${selectedEmployeeId}`)
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
    await fetchHROverview();
    if (importedId) {
      setSelectedEmployeeId(importedId);
      await fetchEmployeeDetails(importedId);
      setActiveTab('employee');
    }
  };

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

        {/* TAB 2: HR Analytics */}
        {activeTab === 'hr' && (
          <div>
            {hrOverview ? (
              <HRDashboard
                overview={hrOverview}
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

        {/* TAB 3: Jury Import Panel */}
        {activeTab === 'import' && (
          <ImportModal onImportSuccess={handleImportSuccess} />
        )}
      </main>

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
