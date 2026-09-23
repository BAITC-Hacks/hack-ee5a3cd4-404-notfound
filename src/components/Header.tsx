import React from 'react';
import { Compass, Users, Upload, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'employee' | 'hr' | 'import';
  setActiveTab: (tab: 'employee' | 'hr' | 'import') => void;
  totalEmployees: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalEmployees,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 tracking-tight text-lg">
                  Halyk Career Quest
                </span>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  AI Competency Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Многофакторная карьерная траектория и аналитика компетенций
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('employee')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'employee'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>Траектория сотрудника</span>
            </button>

            <button
              onClick={() => setActiveTab('hr')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'hr'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>HR-Аналитика</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'import'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Импорт (Жюри)</span>
            </button>
          </div>

          {/* Dataset Status */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>In-Memory Store</span>
            </div>
            <span className="text-slate-300">|</span>
            <span>{totalEmployees} сотрудников в базе</span>
          </div>
        </div>
      </div>
    </header>
  );
};
