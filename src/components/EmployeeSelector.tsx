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

      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, departmentFilter]);

  const currentEmp = employees.find((e) => e.employee_id === selectedEmployeeId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Active Employee Quick View */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm shrink-0">
            {currentEmp ? currentEmp.full_name.slice(0, 2).toUpperCase() : 'EMP'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                {currentEmp ? currentEmp.full_name : 'Выберите сотрудника'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {selectedEmployeeId}
              </span>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
              <span>{currentEmp?.role} ({currentEmp?.grade})</span>
              <span className="text-slate-300">·</span>
              <span className="truncate max-w-[280px] text-slate-500">{currentEmp?.department}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
            >
              <option value="all">Все департаменты</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени или ID..."
              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 placeholder:text-slate-400"
            />
          </div>

          {/* Employee Selector Dropdown */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedEmployeeId}
              onChange={(e) => onSelectEmployee(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-300 text-xs font-medium text-slate-900 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 shadow-xs"
            >
              {filteredEmployees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.role}, {emp.grade})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
