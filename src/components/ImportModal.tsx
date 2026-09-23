import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Sparkles, ArrowRight, Download } from 'lucide-react';
import { apiFetch } from '../lib/api.ts';

interface ImportModalProps {
  onImportSuccess: (importedId?: string) => Promise<void>;
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.replace(/^\uFEFF/, '').trim();
  // Remove markdown code fences if pasted with ```json ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  // Replace smart quotes
  cleaned = cleaned.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  return cleaned;
}

function parseCsvHistory(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const records: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length >= headers.length) {
      const obj: any = {};
      headers.forEach((h, idx) => {
        const val = cols[idx];
        if (h === 'completion_pct' || h === 'score' || h === 'feedback_rating') {
          obj[h] = Number(val) || 0;
        } else {
          obj[h] = val;
        }
      });
      records.push(obj);
    }
  }
  return records;
}

export function parseAndNormalizePayload(raw: string): any {
  const cleaned = cleanJsonString(raw);

  // Check if user uploaded an HTML page (e.g. AI Studio iframe cookie check)
  if (
    cleaned.startsWith('<!doctype') ||
    cleaned.startsWith('<html') ||
    cleaned.includes('<head>') ||
    cleaned.includes('Cookie check')
  ) {
    throw new Error(
      'DETECTED_HTML_PAGE'
    );
  }

  // Check if CSV format
  if (cleaned.startsWith('record_id,') || cleaned.startsWith('"record_id"')) {
    const history = parseCsvHistory(cleaned);
    if (history.length > 0) {
      return { history };
    }
  }

  // First try standard JSON.parse
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (_firstErr) {
    // Try relaxed JSON: remove single-line & multi-line comments and trailing commas
    const relaxed = cleaned
      .replace(/\/\/[^\n\r]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/,\s*([}\]])/g, '$1');

    parsed = JSON.parse(relaxed);
  }

  // Normalize shape: Array of employees/history/events
  if (Array.isArray(parsed)) {
    if (parsed.length > 0) {
      if (parsed[0].employee_id && (parsed[0].role || parsed[0].skills)) {
        return { employees: parsed };
      }
      if (parsed[0].record_id && parsed[0].event_id) {
        return { history: parsed };
      }
      if (parsed[0].event_id && parsed[0].title) {
        return { events: parsed };
      }
    }
    return { employees: parsed };
  }

  // Single employee or single record object
  if (parsed && typeof parsed === 'object') {
    if (parsed.employee_id && (parsed.role || parsed.skills)) {
      return { employees: [parsed] };
    }
    if (parsed.record_id && parsed.event_id) {
      return { history: [parsed] };
    }
  }

  return parsed;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onImportSuccess }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    importedId?: string;
  } | null>(null);

  const sampleJuryPayload = {
    employees: [
      {
        employee_id: 'EMP_JURY_99',
        full_name: 'Батырхан Ахметов (Проверочный Жюри)',
        department: 'Департамент цифрового банкинга (Halyk Digital)',
        role: 'Backend Developer',
        grade: 'Middle',
        manager_id: 'EMP_001',
        hire_date: '2024-03-01',
        tenure_months: 30,
        work_format: 'hybrid',
        preferred_language: 'ru',
        career_goal: {
          target_role: 'Backend Developer',
          target_grade: 'Senior',
        },
        skills: {
          SK_001: 2, // Required: 4 (Critical! Gap = 2)
          SK_002: 4,
          SK_003: 3,
          SK_004: 3, // Required: 4 (Critical! Gap = 1)
          SK_005: 3,
          SK_006: 0, // Required: 2 (Non-critical! Gap = 2, Lowest absolute skill!)
          SK_007: 2,
          SK_010: 3,
        },
        last_review_date: '2026-09-01',
      },
    ],
    history: [
      {
        record_id: 'HIST_JURY_01',
        employee_id: 'EMP_JURY_99',
        event_id: 'EV_006',
        date: '2026-05-10',
        due_date: '2026-05-10',
        status: 'declined',
        completion_pct: 0,
        score: 0,
        feedback_rating: 0,
        assigned_by: 'manager',
      },
      {
        record_id: 'HIST_JURY_02',
        employee_id: 'EMP_JURY_99',
        event_id: 'EV_006',
        date: '2026-06-15',
        due_date: '2026-06-15',
        status: 'no_show',
        completion_pct: 0,
        score: 0,
        feedback_rating: 0,
        assigned_by: 'self',
      },
      {
        record_id: 'HIST_JURY_03',
        employee_id: 'EMP_JURY_99',
        event_id: 'EV_006',
        date: '2026-07-20',
        due_date: '2026-07-20',
        status: 'dropped',
        completion_pct: 20,
        score: 0,
        feedback_rating: 1,
        assigned_by: 'hr',
      },
      {
        record_id: 'HIST_JURY_04',
        employee_id: 'EMP_JURY_99',
        event_id: 'EV_004',
        date: '2026-04-10',
        due_date: '2026-04-20',
        status: 'completed',
        completion_pct: 100,
        score: 94,
        feedback_rating: 5,
        assigned_by: 'self',
      },
    ],
  };

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(sampleJuryPayload, null, 2));
    setStatusMessage({
      type: 'success',
      text: 'Тестовый кейс EMP_JURY_99 вставлен в редактор. Нажмите «Импортировать в систему» для применения.',
    });
  };

  const handleDownloadSampleFile = () => {
    const jsonStr = JSON.stringify(sampleJuryPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test_jury_emp_99.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'success',
      text: 'Файл test_jury_emp_99.json сгенерирован и сохранён на вашем устройстве.',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const normalized = parseAndNormalizePayload(text);
        setJsonInput(JSON.stringify(normalized, null, 2));
        setStatusMessage({
          type: 'success',
          text: `Файл «${file.name}» успешно распознан. Нажмите «Импортировать в систему» для применения.`,
        });
      } catch (err: any) {
        if (err.message === 'DETECTED_HTML_PAGE') {
          setStatusMessage({
            type: 'error',
            text: 'Загруженный файл является HTML-страницей, а не набором данных. Импорт не выполнен.',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: `Ошибка в структуре файла «${file.name}»: ${err.message || 'некорректный синтаксис'}. Проверьте наличие закрывающих скобок и кавычек.`,
          });
        }
      }
    };
    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Не удалось прочитать файл с устройства.',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Пожалуйста, вставьте JSON или загрузите файл' });
      return;
    }

    let parsedPayload: any;
    try {
      parsedPayload = parseAndNormalizePayload(jsonInput);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Ошибка валидации JSON: ${err.message}`,
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await apiFetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Ошибка при импорте');
      }

      const data = await res.json();
      const firstImportedEmpId =
        Array.isArray(parsedPayload.employees) && parsedPayload.employees.length > 0
          ? parsedPayload.employees[0].employee_id
          : undefined;

      setStatusMessage({
        type: 'success',
        text: `Успешно импортировано: ${data.imported.employees} сотрудников, ${data.imported.history} записей истории. Всего в базе: ${data.counts.employees} сотрудников.`,
        importedId: firstImportedEmpId,
      });

      await onImportSuccess(firstImportedEmpId);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs max-w-4xl mx-auto space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">
          Загрузка проверочных датасетов и профилей (Панель жюри)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Догрузка профилей сотрудников, истории активности и программ без перезапуска сервера через эндпоинт{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">
            POST /api/import
          </code>
        </p>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-semibold text-slate-900">
            Быстрая проверка для жюри:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadSampleFile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-xs font-semibold rounded-md text-emerald-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать тестовый файл (.json)</span>
          </button>

          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-xs font-medium rounded-md text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Вставить тестовый кейс (EMP_JURY_99)
          </button>
        </div>
      </div>

      {/* File Upload Zone */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          1. Загрузка файла JSON
        </label>
        <div className="border-2 border-dashed border-slate-200 hover:border-emerald-600 rounded-lg p-6 text-center transition-colors cursor-pointer relative bg-slate-50/50">
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <span className="text-xs font-semibold text-slate-700 block">
            Нажмите для выбора файла или перетащите .json сюда
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Поддерживаются схемы dataset (employees, history, events, skills)
          </span>
        </div>
      </div>

      {/* JSON Code Editor / Paste Box */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Или вставьте JSON напрямую:
          </label>
          <span className="text-xs text-slate-400">Схема датасета HackAlem AI</span>
        </div>
        <textarea
          rows={12}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={`{\n  "employees": [\n    {\n      "employee_id": "EMP_NEW_101",\n      "full_name": "Тестовый Сотрудник",\n      ...\n    }\n  ],\n  "history": [...]\n}`}
          className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-lg p-3.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
        />
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-semibold block">{statusMessage.text}</span>
            {statusMessage.importedId && (
              <button
                onClick={() => onImportSuccess(statusMessage.importedId)}
                className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
              >
                <span>Перейти к профилю {statusMessage.importedId}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleImport}
          disabled={loading || !jsonInput.trim()}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>{loading ? 'Мердж данных в памяти...' : 'Импортировать в систему'}</span>
        </button>
      </div>
    </div>
  );
};
