import React from 'react';
import { Compass, Users, Upload, ShieldCheck, BookOpen, Gift, Globe, LogOut } from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface HeaderProps {
  activeTab: 'employee' | 'catalog' | 'gamification' | 'hr' | 'import';
  setActiveTab: (tab: 'employee' | 'catalog' | 'gamification' | 'hr' | 'import') => void;
  totalEmployees: number;
  lang: Language;
  setLang: (lang: Language) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalEmployees,
  lang,
  setLang,
  isAdmin,
  onLogout,
}) => {
  const t = translations[lang];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand - Never shrinks, never wraps */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-xs shrink-0">
              H
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg whitespace-nowrap">
                  {t.appName}
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hidden 2xl:inline-block whitespace-nowrap">
                  AI Competency Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden xl:block whitespace-nowrap leading-none mt-0.5">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Controls - Compact, responsive, no ugly scrollbar */}
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab('employee')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'employee'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{t.tabs.trajectory}</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{lang === 'kz' ? 'Каталог' : 'Каталог курсов'}</span>
            </button>

            <button
              onClick={() => setActiveTab('gamification')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'gamification'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{t.tabs.gamification}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('hr')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === 'hr'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{lang === 'kz' ? 'HR-Талдау' : 'HR-Аналитика'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('import')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === 'import'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{t.tabs.import}</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Tools: Language Switcher & Dataset Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Bilingual Toggle (RU / KZ) */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
              <button
                onClick={() => setLang('ru')}
                className={`px-2 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                  lang === 'ru'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                РУС
              </button>
              <button
                onClick={() => setLang('kz')}
                className={`px-2 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                  lang === 'kz'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ҚАЗ
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-800">{totalEmployees}</span>
              <span className="text-slate-500">{lang === 'kz' ? 'маман' : 'чел.'}</span>
            </div>

            <button
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
