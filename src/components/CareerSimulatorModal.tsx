import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Employee, Trajectory, Grade } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';

interface RoleOption {
  role: string;
  grades: Grade[];
}

interface CareerSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  currentTrajectory: Trajectory;
  onSaveGoal: (targetRole: string, targetGrade: Grade) => Promise<void>;
}

export const CareerSimulatorModal: React.FC<CareerSimulatorModalProps> = ({
  isOpen,
  onClose,
  employee,
  currentTrajectory,
  onSaveGoal,
}) => {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>(
    currentTrajectory.target_role || employee.role
  );
  const [selectedGrade, setSelectedGrade] = useState<Grade>(
    currentTrajectory.target_grade || 'Senior'
  );
  const [simulatedTrajectory, setSimulatedTrajectory] = useState<Trajectory | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRole(currentTrajectory.target_role || employee.role);
    setSelectedGrade(currentTrajectory.target_grade || 'Senior');
    setSimulatedTrajectory(null);
  }, [isOpen, employee.role, currentTrajectory.target_role, currentTrajectory.target_grade]);

  // Load available roles from API
  useEffect(() => {
    if (!isOpen) return;
    apiFetch('/api/roles')
      .then((res) => res.json())
      .then((data: RoleOption[]) => {
        setRoles(data);
      })
      .catch((err) => console.error('Error fetching roles:', err));
  }, [isOpen]);

  // Run simulation whenever role or grade changes
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsSimulating(true);

    apiFetch(`/api/employees/${employee.employee_id}/simulate-goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_role: selectedRole,
        target_grade: selectedGrade,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.trajectory) {
          setSimulatedTrajectory(data.trajectory);
        }
      })
      .catch((err) => console.error('Error simulating trajectory:', err))
      .finally(() => {
        if (isMounted) setIsSimulating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, employee.employee_id, selectedRole, selectedGrade]);

  if (!isOpen) return null;

  const activeGrades =
    roles.find((r) => r.role === selectedRole)?.grades || [
      'Junior',
      'Middle',
      'Senior',
      'Lead',
    ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveGoal(selectedRole, selectedGrade);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedRole(currentTrajectory.target_role);
    setSelectedGrade(currentTrajectory.target_grade);
  };

  const currentReadiness = currentTrajectory.overall_readiness_pct;
  const simReadiness = simulatedTrajectory?.overall_readiness_pct ?? currentReadiness;
  const deltaReadiness = simReadiness - currentReadiness;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                🎯
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Карьерный симулятор ("Что если...")
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Моделирование готовности, дефицита компетенций и AI-рекомендаций при смене целевой роли или грейда
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          {/* Current Path Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Текущая позиция сотрудника:
              </span>
              <span className="font-semibold text-slate-800">
                {employee.full_name} · {employee.role} ({employee.grade})
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Активная цель:
              </span>
              <span className="font-semibold text-emerald-800">
                {currentTrajectory.target_role} ({currentTrajectory.target_grade})
              </span>
            </div>
          </div>

          {/* Controls to Choose Role & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Целевая роль (Специализация)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs font-medium text-slate-900 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 shadow-2xs"
              >
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.role}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Data Engineer">Data Engineer</option>
                    <option value="System Analyst">System Analyst</option>
                    <option value="QA Automation Engineer">QA Automation Engineer</option>
                    <option value="Product Manager">Product Manager</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Целевой грейд
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {(['Junior', 'Middle', 'Senior', 'Lead'] as Grade[]).map((g) => {
                  const isAvailable = activeGrades.includes(g);
                  const isSelected = selectedGrade === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedGrade(g)}
                      className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : isAvailable
                          ? 'text-slate-700 hover:bg-white'
                          : 'text-slate-400 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Simulation Output Dashboard */}
          {isSimulating ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-slate-500">
                Пересчет требований матрицы компетенций и разрывов...
              </p>
            </div>
          ) : simulatedTrajectory ? (
            <div className="space-y-4">
              {/* Stat Comparison Tiles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Готовность к симуляции
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold text-slate-900">
                      {simulatedTrajectory.overall_readiness_pct}%
                    </span>
                    {deltaReadiness !== 0 && (
                      <span
                        className={`text-xs font-bold ${
                          deltaReadiness > 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {deltaReadiness > 0 ? `+${deltaReadiness}%` : `${deltaReadiness}%`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Критичные разрывы
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span
                      className={`text-xl font-bold ${
                        simulatedTrajectory.critical_gaps_count > 0
                          ? 'text-amber-800'
                          : 'text-emerald-700'
                      }`}
                    >
                      {simulatedTrajectory.critical_gaps_count}
                    </span>
                    <span className="text-xs text-slate-400">
                      из {simulatedTrajectory.critical_skills.length}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Всего разрывов
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold text-slate-900">
                      {simulatedTrajectory.total_gaps_count}
                    </span>
                    <span className="text-xs text-slate-400">
                      из {simulatedTrajectory.gaps.length} навыков
                    </span>
                  </div>
                </div>
              </div>

              {/* Competencies Checklist preview */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="text-xs font-bold text-slate-800 mb-2.5 flex items-center justify-between">
                  <span>Требуемые компетенции для {selectedRole} ({selectedGrade}):</span>
                  <span className="text-slate-500 font-normal text-[11px]">
                    Красным выделены разрывы
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {simulatedTrajectory.gaps.map((g) => (
                    <div
                      key={g.skill_id}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                        g.gap === 0
                          ? 'bg-white border-slate-200 text-slate-700'
                          : g.is_critical
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="font-medium">{g.name}</span>
                        {g.is_critical && (
                          <span className="ml-1 text-[10px] text-amber-700 font-bold">
                            (Крит)
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 font-mono text-[11px]">
                        <span className={g.gap > 0 ? 'text-amber-800 font-bold' : 'text-emerald-700'}>
                          {g.current_level}
                        </span>
                        <span className="text-slate-400">/{g.required_level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Сбросить к исходной
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isSimulating}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Сохранение...' : 'Утвердить как целевую должность'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
