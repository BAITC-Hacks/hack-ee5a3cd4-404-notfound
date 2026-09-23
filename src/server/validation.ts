import {
  ActivityRecord,
  ActivityStatus,
  Employee,
  Grade,
  LearningEvent,
  SkillsData,
} from '../types/index.ts';

const GRADES: Grade[] = ['Junior', 'Middle', 'Senior', 'Lead'];
const ACTIVITY_TYPES = new Set(['compliance', 'onboarding', 'course', 'workshop', 'mentoring', 'certification', 'meetup']);
const ACTIVITY_STATUSES = new Set<ActivityStatus>(['completed', 'in_progress', 'dropped', 'no_show', 'declined', 'overdue']);
const ASSIGNED_BY = new Set(['self', 'manager', 'hr']);
const WORK_FORMATS = new Set(['remote', 'hybrid', 'office']);
const EVENT_FORMATS = new Set(['online', 'offline', 'hybrid']);

export class ValidationError extends Error {}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown, field: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`${field} must be an object`);
  }
  return value as UnknownRecord;
}

function asString(value: unknown, field: string, maxLength = 5000): string {
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${field} is required`);
  if (trimmed.length > maxLength) throw new ValidationError(`${field} is too long`);
  return trimmed;
}

function asOptionalString(value: unknown, field: string, maxLength = 5000): string | undefined {
  if (value === undefined) return undefined;
  return asString(value, field, maxLength);
}

function asNumber(value: unknown, field: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a finite number`);
  }
  if (value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new ValidationError(`${field} must be between ${min} and ${max}`);
  }
  return value;
}

function asDate(value: unknown, field: string): string {
  const date = asString(value, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) {
    throw new ValidationError(`${field} must use YYYY-MM-DD format`);
  }
  return date;
}

function asGrade(value: unknown, field: string): Grade {
  if (!GRADES.includes(value as Grade)) throw new ValidationError(`${field} must be a supported grade`);
  return value as Grade;
}

function asStringArray(value: unknown, field: string, maxItems = 100): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new ValidationError(`${field} must be an array`);
  return value.map((item, index) => asString(item, `${field}[${index}]`, 200));
}

function asSkillLevels(value: unknown, field: string): Record<string, number> {
  const record = asRecord(value, field);
  const entries = Object.entries(record);
  if (entries.length > 100) throw new ValidationError(`${field} contains too many values`);
  return Object.fromEntries(
    entries.map(([skillId, level]) => [asString(skillId, `${field} key`, 80), asNumber(level, `${field}.${skillId}`, 0, 5, true)])
  );
}

function asPrerequisites(value: unknown, field: string): Record<string, number> {
  if (value === undefined) return {};
  return asSkillLevels(value, field);
}

function asSkillGains(value: unknown, field: string): LearningEvent['develops_skills'] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) {
    throw new ValidationError(`${field} must contain at least one skill gain`);
  }

  const seen = new Set<string>();
  return value.map((item, index) => {
    const record = asRecord(item, `${field}[${index}]`);
    const skillId = asString(record.skill_id, `${field}[${index}].skill_id`, 80);
    if (seen.has(skillId)) throw new ValidationError(`${field} cannot repeat a skill`);
    seen.add(skillId);
    return {
      skill_id: skillId,
      gain: asNumber(record.gain, `${field}[${index}].gain`, 1, 5, true),
      max_level: asNumber(record.max_level, `${field}[${index}].max_level`, 1, 5, true),
    };
  });
}

export function validateCareerGoal(value: unknown): { targetRole: string; targetGrade: Grade } {
  const record = asRecord(value, 'request body');
  return {
    targetRole: asString(record.target_role, 'target_role', 120),
    targetGrade: asGrade(record.target_grade, 'target_grade'),
  };
}

export function validateKudos(value: unknown): { toEmployeeId: string; skillId: string; message: string } {
  const record = asRecord(value, 'request body');
  return {
    toEmployeeId: asString(record.to_employee_id, 'to_employee_id', 80),
    skillId: asString(record.skill_id, 'skill_id', 80),
    message: asString(record.message, 'message', 500),
  };
}

export function validateRewardRedemption(value: unknown): { rewardId: string } {
  const record = asRecord(value, 'request body');
  return { rewardId: asString(record.reward_id, 'reward_id', 80) };
}

export function validateLearningEvent(value: unknown): LearningEvent {
  const record = asRecord(value, 'event');
  const type = asString(record.type, 'event.type', 40);
  const format = asString(record.format, 'event.format', 40);
  if (!ACTIVITY_TYPES.has(type)) throw new ValidationError('event.type is not supported');
  if (!EVENT_FORMATS.has(format)) throw new ValidationError('event.format is not supported');

  const grades = asStringArray(record.target_grades, 'event.target_grades', 10).map((grade, index) =>
    asGrade(grade, `event.target_grades[${index}]`)
  );

  return {
    event_id: asString(record.event_id, 'event.event_id', 80),
    title: asString(record.title, 'event.title', 200),
    description: asString(record.description, 'event.description', 5000),
    type: type as LearningEvent['type'],
    format: format as LearningEvent['format'],
    duration_hours: asNumber(record.duration_hours, 'event.duration_hours', 0.25, 1000),
    mandatory: typeof record.mandatory === 'boolean' ? record.mandatory : false,
    target_roles: asStringArray(record.target_roles, 'event.target_roles', 100),
    target_grades: grades,
    develops_skills: asSkillGains(record.develops_skills, 'event.develops_skills'),
    prerequisites: asPrerequisites(record.prerequisites, 'event.prerequisites'),
    upcoming_sessions: asStringArray(record.upcoming_sessions, 'event.upcoming_sessions', 100).map((date, index) =>
      asDate(date, `event.upcoming_sessions[${index}]`)
    ),
  };
}

function validateEmployee(value: unknown): Employee {
  const record = asRecord(value, 'employee');
  const careerGoal = record.career_goal === null || record.career_goal === undefined
    ? null
    : validateCareerGoal(record.career_goal);
  const workFormat = asString(record.work_format, 'employee.work_format', 20);
  const language = asString(record.preferred_language, 'employee.preferred_language', 5);

  if (!WORK_FORMATS.has(workFormat)) throw new ValidationError('employee.work_format is not supported');
  if (language !== 'ru' && language !== 'kz') throw new ValidationError('employee.preferred_language is not supported');

  return {
    employee_id: asString(record.employee_id, 'employee.employee_id', 80),
    full_name: asString(record.full_name, 'employee.full_name', 200),
    department: asString(record.department, 'employee.department', 200),
    role: asString(record.role, 'employee.role', 120),
    grade: asGrade(record.grade, 'employee.grade'),
    manager_id: asString(record.manager_id, 'employee.manager_id', 80),
    hire_date: asDate(record.hire_date, 'employee.hire_date'),
    tenure_months: asNumber(record.tenure_months, 'employee.tenure_months', 0, 1000, true),
    work_format: workFormat as Employee['work_format'],
    preferred_language: language as Employee['preferred_language'],
    career_goal: careerGoal
      ? { target_role: careerGoal.targetRole, target_grade: careerGoal.targetGrade }
      : null,
    skills: asSkillLevels(record.skills, 'employee.skills'),
    last_review_date: asDate(record.last_review_date, 'employee.last_review_date'),
  };
}

function validateHistoryRecord(value: unknown): ActivityRecord {
  const record = asRecord(value, 'history record');
  const status = asString(record.status, 'history.status', 30) as ActivityStatus;
  const assignedBy = asString(record.assigned_by, 'history.assigned_by', 20);
  if (!ACTIVITY_STATUSES.has(status)) throw new ValidationError('history.status is not supported');
  if (!ASSIGNED_BY.has(assignedBy)) throw new ValidationError('history.assigned_by is not supported');

  return {
    record_id: asString(record.record_id, 'history.record_id', 100),
    employee_id: asString(record.employee_id, 'history.employee_id', 80),
    event_id: asString(record.event_id, 'history.event_id', 80),
    date: asDate(record.date, 'history.date'),
    due_date: asDate(record.due_date, 'history.due_date'),
    status,
    completion_pct: asNumber(record.completion_pct, 'history.completion_pct', 0, 100),
    score: asNumber(record.score, 'history.score', 0, 100),
    feedback_rating: asNumber(record.feedback_rating, 'history.feedback_rating', 0, 5),
    assigned_by: assignedBy as ActivityRecord['assigned_by'],
  };
}

function validateSkillsData(value: unknown): SkillsData {
  const record = asRecord(value, 'skills');
  const proficiencyScale = asRecord(record.proficiency_scale, 'skills.proficiency_scale');
  const skills = record.skills;
  const roleProfiles = record.role_profiles;
  if (!Array.isArray(skills) || !Array.isArray(roleProfiles)) {
    throw new ValidationError('skills.skills and skills.role_profiles must be arrays');
  }

  return {
    proficiency_scale: Object.fromEntries(
      Object.entries(proficiencyScale).map(([key, description]) => [key, asString(description, `skills.proficiency_scale.${key}`, 500)])
    ),
    skills: skills.map((skill, index) => {
      const item = asRecord(skill, `skills.skills[${index}]`);
      const type = asString(item.type, `skills.skills[${index}].type`, 10);
      if (type !== 'hard' && type !== 'soft') throw new ValidationError('skills skill type is not supported');
      return {
        skill_id: asString(item.skill_id, `skills.skills[${index}].skill_id`, 80),
        name: asString(item.name, `skills.skills[${index}].name`, 200),
        type,
        category: asString(item.category, `skills.skills[${index}].category`, 120),
        description: asString(item.description, `skills.skills[${index}].description`, 2000),
      };
    }),
    role_profiles: roleProfiles.map((profile, index) => {
      const item = asRecord(profile, `skills.role_profiles[${index}]`);
      return {
        role: asString(item.role, `skills.role_profiles[${index}].role`, 120),
        grade: asGrade(item.grade, `skills.role_profiles[${index}].grade`),
        required_skills: asSkillLevels(item.required_skills, `skills.role_profiles[${index}].required_skills`),
        critical_skills: asStringArray(item.critical_skills, `skills.role_profiles[${index}].critical_skills`, 100),
      };
    }),
  };
}

export interface ImportPayload {
  employees?: Employee[];
  history?: ActivityRecord[];
  events?: LearningEvent[];
  skills?: SkillsData;
}

export function normalizeImportPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === 'object') {
      const record = first as UnknownRecord;
      if ('employee_id' in record && ('role' in record || 'skills' in record)) return { employees: value };
      if ('record_id' in record && 'event_id' in record) return { history: value };
      if ('event_id' in record && 'title' in record) return { events: value };
    }
    throw new ValidationError('Unable to determine the imported array type');
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as UnknownRecord;
    if ('employee_id' in record && ('role' in record || 'skills' in record)) return { employees: [record] };
    if ('record_id' in record && 'event_id' in record) return { history: [record] };
  }

  return value;
}

export function validateImportPayload(value: unknown): ImportPayload {
  const record = asRecord(value, 'import payload');
  const result: ImportPayload = {};

  if (record.employees !== undefined) {
    if (!Array.isArray(record.employees) || record.employees.length > 1000) throw new ValidationError('employees must be an array of up to 1000 entries');
    result.employees = record.employees.map(validateEmployee);
  }
  if (record.history !== undefined) {
    if (!Array.isArray(record.history) || record.history.length > 5000) throw new ValidationError('history must be an array of up to 5000 entries');
    result.history = record.history.map(validateHistoryRecord);
  }
  if (record.events !== undefined) {
    if (!Array.isArray(record.events) || record.events.length > 1000) throw new ValidationError('events must be an array of up to 1000 entries');
    result.events = record.events.map(validateLearningEvent);
  }
  if (record.skills !== undefined) result.skills = validateSkillsData(record.skills);

  if (!result.employees && !result.history && !result.events && !result.skills) {
    throw new ValidationError('Import payload must include employees, history, events, or skills');
  }
  return result;
}

export function validationMessage(error: unknown): string {
  return error instanceof ValidationError ? error.message : 'Invalid request data';
}
