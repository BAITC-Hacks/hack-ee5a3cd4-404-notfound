import fs from 'fs';
import path from 'path';

// Kazakh and Russian names for Halyk Bank realistic dataset
const firstNames = [
  'Алексей', 'Айгерим', 'Данияр', 'Алихан', 'Динара', 'Асет', 'Мадина', 'Ерлан', 'Асель', 'Нурсултан',
  'Жанна', 'Кайрат', 'Ботагоз', 'Тимур', 'Гульнара', 'Руслан', 'Сабина', 'Бауржан', 'Камила', 'Максим',
  'Азамат', 'Алина', 'Арман', 'Зарина', 'Мурат', 'Диана', 'Олжас', 'Томирис', 'Чингиз', 'Айдана',
  'Дамир', 'Гульмира', 'Серик', 'Жулдыз', 'Виктор', 'Елена', 'Ильяс', 'Карлыгаш', 'Рустам', 'Анель'
];

const lastNames = [
  'Иванов', 'Сергазина', 'Касымбеков', 'Нурланов', 'Алиева', 'Смагулов', 'Омарова', 'Байжанов', 'Искакова', 'Ахметов',
  'Сулейменов', 'Жумабаев', 'Мамытов', 'Абдрахманов', 'Сапарова', 'Мусина', 'Кенесов', 'Бекетов', 'Жолдасов', 'Ким',
  'Пак', 'Цой', 'Кузнецов', 'Смирнова', 'Попов', 'Васильев', 'Федоров', 'Морозов', 'Новиков', 'Кожахметов',
  'Тулегенов', 'Сарсенов', 'Байтурсынов', 'Мухамеджанов', 'Утегенова', 'Досмагамбетов', 'Рахимов', 'Садыков', 'Темирханов', 'Шарипов'
];

const departments = [
  'Департамент цифрового банкинга (Halyk Digital)',
  'Департамент карточных систем и процессинга',
  'Департамент кредитных конвейеров и рисков',
  'Департамент платежных шлюзов и эквайринга',
  'Департамент платформенных сервисов и Core Banking',
  'Департамент Big Data и корпоративной аналитики'
];

const roles = [
  'Backend Developer',
  'Frontend Developer',
  'DevOps Engineer',
  'Data Engineer',
  'QA Automation Engineer',
  'System Analyst',
  'Product Manager'
];

const grades = ['Junior', 'Middle', 'Senior', 'Lead'];

// Load skills to know IDs
const skillsData = JSON.parse(fs.readFileSync(path.resolve('./data/skills.json'), 'utf-8'));
const skillIds = skillsData.skills.map((s: any) => s.skill_id);

const employees: any[] = [];
const historyRecords: any[] = [];

// 1. Specific Benchmark EMP_001 (Must-have test case from prompt)
employees.push({
  employee_id: 'EMP_001',
  full_name: 'Алексей Иванов',
  department: 'Департамент цифрового банкинга (Halyk Digital)',
  role: 'Backend Developer',
  grade: 'Middle',
  manager_id: 'EMP_042',
  hire_date: '2023-04-12',
  tenure_months: 41,
  work_format: 'hybrid',
  preferred_language: 'ru',
  career_goal: {
    target_role: 'Backend Developer',
    target_grade: 'Senior'
  },
  skills: {
    SK_001: 2, // Required: 4 (Critical! Gap = 2)
    SK_002: 4, // Required: 4 (Gap = 0)
    SK_003: 3, // Required: 3 (Gap = 0)
    SK_004: 3, // Required: 4 (Critical! Gap = 1)
    SK_005: 3, // Required: 3 (Gap = 0)
    SK_006: 0, // Required: 2 (Non-critical! Gap = 2) - lowest skill!
    SK_007: 2, // Required: 3 (Gap = 1)
    SK_008: 2,
    SK_009: 1,
    SK_010: 3,
    SK_011: 1,
    SK_012: 2,
    SK_013: 1,
    SK_014: 1
  },
  last_review_date: '2026-08-15'
});

// EMP_001 history: 3 declined/dropped/no-show for public speaking (EV_006 / meetup), but 2 completed technical workshops!
historyRecords.push(
  {
    record_id: 'HIST_0001',
    employee_id: 'EMP_001',
    event_id: 'EV_006', // Meetup Public Speaking
    date: '2026-02-15',
    due_date: '2026-02-15',
    status: 'declined',
    completion_pct: 0,
    score: 0,
    feedback_rating: 0,
    assigned_by: 'manager'
  },
  {
    record_id: 'HIST_0002',
    employee_id: 'EMP_001',
    event_id: 'EV_006', // Meetup Public Speaking second attempt
    date: '2026-04-10',
    due_date: '2026-04-10',
    status: 'no_show',
    completion_pct: 0,
    score: 0,
    feedback_rating: 0,
    assigned_by: 'self'
  },
  {
    record_id: 'HIST_0003',
    employee_id: 'EMP_001',
    event_id: 'EV_006', // Meetup Public Speaking third attempt
    date: '2026-06-20',
    due_date: '2026-06-20',
    status: 'dropped',
    completion_pct: 15,
    score: 0,
    feedback_rating: 1,
    assigned_by: 'hr'
  },
  {
    record_id: 'HIST_0004',
    employee_id: 'EMP_001',
    event_id: 'EV_004', // Highload Microservices Course
    date: '2026-03-01',
    due_date: '2026-03-25',
    status: 'completed',
    completion_pct: 100,
    score: 96,
    feedback_rating: 5,
    assigned_by: 'self'
  },
  {
    record_id: 'HIST_0005',
    employee_id: 'EMP_001',
    event_id: 'EV_007', // PostgreSQL Highload Workshop
    date: '2026-05-10',
    due_date: '2026-05-12',
    status: 'completed',
    completion_pct: 100,
    score: 92,
    feedback_rating: 5,
    assigned_by: 'self'
  }
);

// 2. Benchmark EMP_002: Айгерим Сергазина (Frontend Mid -> Senior)
employees.push({
  employee_id: 'EMP_002',
  full_name: 'Айгерим Сергазина',
  department: 'Департамент платежных шлюзов и эквайринга',
  role: 'Frontend Developer',
  grade: 'Middle',
  manager_id: 'EMP_015',
  hire_date: '2024-01-10',
  tenure_months: 32,
  work_format: 'remote',
  preferred_language: 'kz',
  career_goal: {
    target_role: 'Frontend Developer',
    target_grade: 'Senior'
  },
  skills: {
    SK_011: 2, // Required: 4 (Critical! Gap = 2)
    SK_001: 1, // Required: 3 (Critical! Gap = 2)
    SK_005: 2, // Required: 3 (Gap = 1)
    SK_006: 2, // Required: 2 (Gap = 0)
    SK_007: 1, // Required: 3 (Gap = 2)
    SK_009: 0, // Not required! (Gap = 0, but lowest absolute skill)
    SK_010: 2, // Required: 3 (Gap = 1)
    SK_012: 2  // Required: 3 (Gap = 1)
  },
  last_review_date: '2026-07-20'
});

historyRecords.push(
  {
    record_id: 'HIST_0006',
    employee_id: 'EMP_002',
    event_id: 'EV_016', // Cross-functional
    date: '2026-02-10',
    due_date: '2026-02-11',
    status: 'completed',
    completion_pct: 100,
    score: 90,
    feedback_rating: 5,
    assigned_by: 'manager'
  },
  {
    record_id: 'HIST_0007',
    employee_id: 'EMP_002',
    event_id: 'EV_001', // Compliance
    date: '2026-01-15',
    due_date: '2026-01-20',
    status: 'completed',
    completion_pct: 100,
    score: 100,
    feedback_rating: 4,
    assigned_by: 'hr'
  }
);

// 3. Benchmark EMP_003: Данияр Касымбеков (Data Engineer Junior -> Middle)
employees.push({
  employee_id: 'EMP_003',
  full_name: 'Данияр Касымбеков',
  department: 'Департамент Big Data и корпоративной аналитики',
  role: 'Data Engineer',
  grade: 'Junior',
  manager_id: 'EMP_008',
  hire_date: '2025-06-01',
  tenure_months: 15,
  work_format: 'hybrid',
  preferred_language: 'ru',
  career_goal: {
    target_role: 'Data Engineer',
    target_grade: 'Middle'
  },
  skills: {
    SK_013: 1, // Required: 3 (Critical! Gap = 2)
    SK_004: 2, // Required: 3 (Critical! Gap = 1)
    SK_002: 2, // Required: 3 (Gap = 1)
    SK_003: 1, // Required: 2 (Gap = 1)
    SK_007: 0, // Mentorship: 0 (Lowest, but not required for Junior/Middle!)
    SK_010: 1  // Required: 2 (Gap = 1)
  },
  last_review_date: '2026-08-01'
});

historyRecords.push(
  {
    record_id: 'HIST_0008',
    employee_id: 'EMP_003',
    event_id: 'EV_007', // Postgres workshop
    date: '2026-04-12',
    due_date: '2026-04-14',
    status: 'completed',
    completion_pct: 100,
    score: 88,
    feedback_rating: 5,
    assigned_by: 'self'
  }
);

// Generate remaining 197 employees (total 200)
let histIdCounter = 9;
for (let i = 4; i <= 200; i++) {
  const empId = `EMP_${String(i).padStart(3, '0')}`;
  const fName = firstNames[(i * 3 + 7) % firstNames.length];
  const lName = lastNames[(i * 5 + 13) % lastNames.length] + (['Айгерим', 'Динара', 'Мадина', 'Асель', 'Жанна', 'Ботагоз', 'Гульнара', 'Сабина', 'Камила', 'Алина', 'Зарина', 'Диана', 'Томирис', 'Айдана', 'Гульмира', 'Жулдыз', 'Елена', 'Карлыгаш', 'Анель'].includes(fName) ? 'а' : '');
  const role = roles[i % roles.length];
  const gradeIdx = (i % 4); // Junior, Middle, Senior, Lead
  const grade = grades[gradeIdx];
  const dept = departments[i % departments.length];

  // Career goal: next grade or same if Lead, or occasional cross-role
  let targetRole = role;
  let targetGrade = grade;
  if (grade === 'Junior') targetGrade = 'Middle';
  else if (grade === 'Middle') targetGrade = 'Senior';
  else if (grade === 'Senior') targetGrade = 'Lead';
  else targetGrade = 'Lead';

  // 10% want cross-role move (e.g. Backend to DevOps or System Analyst to Product Manager)
  if (i % 10 === 0) {
    if (role === 'Backend Developer') targetRole = 'DevOps Engineer';
    else if (role === 'System Analyst') targetRole = 'Product Manager';
    else if (role === 'QA Automation Engineer') targetRole = 'Backend Developer';
  }

  // Base skills according to grade
  const empSkills: Record<string, number> = {};
  const baseLvl = gradeIdx + 1; // 1 for Junior, 2 for Middle, 3 for Senior, 4 for Lead
  skillIds.forEach((sid: string, idx: number) => {
    // Generate realistic variance between (baseLvl - 1) and (baseLvl + 1), clamped 0..5
    const variance = ((i * 7 + idx * 11) % 3) - 1;
    let lvl = Math.max(0, Math.min(5, baseLvl + variance));
    // Soft skills sometimes lower
    if (sid === 'SK_006' || sid === 'SK_007') {
      if (grade === 'Junior') lvl = Math.min(1, lvl);
    }
    empSkills[sid] = lvl;
  });

  const hireYear = 2021 + (i % 5);
  const hireMonth = String(1 + (i % 12)).padStart(2, '0');
  const hireDay = String(1 + (i % 28)).padStart(2, '0');
  const hireDate = `${hireYear}-${hireMonth}-${hireDay}`;
  const tenureMonths = Math.max(3, Math.min(60, (2026 - hireYear) * 12 + (9 - parseInt(hireMonth))));

  employees.push({
    employee_id: empId,
    full_name: `${fName} ${lName}`,
    department: dept,
    role,
    grade,
    manager_id: `EMP_${String(Math.max(1, (i % 15) + 1)).padStart(3, '0')}`,
    hire_date: hireDate,
    tenure_months: tenureMonths,
    work_format: i % 3 === 0 ? 'remote' : i % 3 === 1 ? 'hybrid' : 'office',
    preferred_language: i % 4 === 0 ? 'kz' : 'ru',
    career_goal: (i === 199 || i === 200) ? null : {
      target_role: targetRole,
      target_grade: targetGrade
    },
    skills: empSkills,
    last_review_date: '2026-07-15'
  });

  // Generate 2-4 history records per employee
  const eventIds = ['EV_001', 'EV_002', 'EV_003', 'EV_004', 'EV_006', 'EV_007', 'EV_008', 'EV_010', 'EV_011', 'EV_012', 'EV_013', 'EV_014', 'EV_016', 'EV_036'];
  const numEvents = 2 + (i % 3);
  for (let e = 0; e < numEvents; e++) {
    const evId = eventIds[(i + e * 4) % eventIds.length];
    const statusRand = (i * 13 + e * 19) % 100;
    let status = 'completed';
    let completionPct = 100;
    let score = 75 + (statusRand % 25);
    let rating = 4 + (statusRand % 2);

    if (statusRand < 60) {
      status = 'completed';
      completionPct = 100;
    } else if (statusRand < 75) {
      status = 'in_progress';
      completionPct = 30 + (statusRand % 40);
      score = 0;
      rating = 0;
    } else if (statusRand < 85) {
      status = 'declined';
      completionPct = 0;
      score = 0;
      rating = 0;
    } else if (statusRand < 92) {
      status = 'dropped';
      completionPct = 10 + (statusRand % 20);
      score = 0;
      rating = 1;
    } else if (statusRand < 97) {
      status = 'no_show';
      completionPct = 0;
      score = 0;
      rating = 0;
    } else {
      status = 'overdue';
      completionPct = 50;
      score = 0;
      rating = 0;
    }

    historyRecords.push({
      record_id: `HIST_${String(histIdCounter++).padStart(4, '0')}`,
      employee_id: empId,
      event_id: evId,
      date: `2026-0${1 + (e % 8)}-10`,
      due_date: `2026-0${1 + (e % 8)}-25`,
      status,
      completion_pct: completionPct,
      score,
      feedback_rating: rating,
      assigned_by: e % 3 === 0 ? 'manager' : e % 3 === 1 ? 'self' : 'hr'
    });
  }
}

// Write employees.json
fs.writeFileSync(
  path.resolve('./data/employees.json'),
  JSON.stringify({ employees }, null, 2),
  'utf-8'
);
console.log(`Generated ${employees.length} employees in /data/employees.json`);

// Write activity_history.csv
const csvHeader = 'record_id,employee_id,event_id,date,due_date,status,completion_pct,score,feedback_rating,assigned_by\n';
const csvRows = historyRecords.map(r =>
  `${r.record_id},${r.employee_id},${r.event_id},${r.date},${r.due_date},${r.status},${r.completion_pct},${r.score},${r.feedback_rating},${r.assigned_by}`
).join('\n');

fs.writeFileSync(path.resolve('./data/activity_history.csv'), csvHeader + csvRows, 'utf-8');
console.log(`Generated ${historyRecords.length} history records in /data/activity_history.csv`);
