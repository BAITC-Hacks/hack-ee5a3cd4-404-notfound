import React, { useState, useMemo } from 'react';
import { Search, UserCheck, ChevronDown, Filter } from 'lucide-react';
import { Employee } from '../types/index.ts';

interface SimpleEmployeeInfo {
  employee_id: string;
  full_name: string;
  role: string;
  grade: string;
  department: string;
  career_goal: { target_role: string; target_grade: string } | null;
}

interface EmployeeSelectorProps {
  employees: SimpleEmployeeInfo[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => set.add(e.department));
    return Array.from(set);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        departmentFilter === 'all' || e.department === departmentFilter;

      const matchesGrade =
        gradeFilter === 'all' || e.grade === gradeFilter;

      return matchesSearch && matchesDept && matchesGrade;
    });
  }, [employees, searchQuery, departmentFilter, gradeFilter]);

  const currentEmp = employees.find((e) => e.employee_id === selectedEmployeeId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      {/* Tier 1: Active Employee Identity + Employee Switcher Dropdown */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Active Employee Quick View */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-sm shrink-0 shadow-2xs">
            {currentEmp ? currentEmp.full_name.slice(0, 2).toUpperCase() : 'EMP'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {currentEmp ? currentEmp.full_name : 'Выберите сотрудника'}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {selectedEmployeeId}
              </span>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-medium text-emerald-800 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-200/60">
                {currentEmp?.role} ({currentEmp?.grade})
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 truncate max-w-sm" title={currentEmp?.department}>
                {currentEmp?.department}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Employee Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap hidden sm:inline-block">
            Сотрудник:
          </label>
          <div className="relative flex-1 lg:w-80">
            <select
              value={selectedEmployeeId}
              onChange={(e) => onSelectEmployee(e.target.value)}
              className="w-full appearance-none bg-emerald-50/40 border border-emerald-400 hover:border-emerald-600 text-xs font-semibold text-slate-900 rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs transition-colors cursor-pointer"
            >
              {filteredEmployees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.role}, {emp.grade})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-emerald-800 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tier 2: Search & Filter Toolbar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search box */}
          <div className="relative min-w-[180px] flex-1 sm:flex-initial sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, роли или ID..."
              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter */}
          <div className="relative max-w-[220px]">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 truncate"
              title="Фильтр по департаменту"
            >
              <option value="all">Все департаменты</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grade Filter */}
          <div className="relative">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
              title="Фильтр по грейду"
            >
              <option value="all">Все грейды</option>
              <option value="Junior">Junior</option>
              <option value="Middle">Middle</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(searchQuery || departmentFilter !== 'all' || gradeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('all');
                setGradeFilter('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Counter */}
        <span className="text-xs text-slate-400 font-medium shrink-0">
          Сотрудников: <strong className="text-slate-700">{filteredEmployees.length}</strong> из {employees.length}
        </span>
      </div>
    </div>
  );
};
