export type Grade = 'Junior' | 'Middle' | 'Senior' | 'Lead';
export type SkillType = 'hard' | 'soft';
export type WorkFormat = 'remote' | 'hybrid' | 'office';
export type ActivityType =
  | 'compliance'
  | 'onboarding'
  | 'course'
  | 'workshop'
  | 'mentoring'
  | 'certification'
  | 'meetup';

export type ActivityStatus =
  | 'completed'
  | 'in_progress'
  | 'dropped'
  | 'no_show'
  | 'declined'
  | 'overdue';

export type AssignedBy = 'self' | 'manager' | 'hr';

export interface Skill {
  skill_id: string;
  name: string;
  type: SkillType;
  category: string;
  description: string;
}

export interface RoleProfile {
  role: string;
  grade: Grade;
  required_skills: Record<string, number>;
  critical_skills: string[];
}

export interface SkillsData {
  proficiency_scale: Record<string, string>;
  skills: Skill[];
  role_profiles: RoleProfile[];
}

export interface CareerGoal {
  target_role: string;
  target_grade: Grade;
}

export interface Employee {
  employee_id: string;
  full_name: string;
  department: string;
  role: string;
  grade: Grade;
  manager_id: string;
  hire_date: string;
  tenure_months: number;
  work_format: WorkFormat;
  preferred_language: 'ru' | 'kz';
  career_goal: CareerGoal | null;
  skills: Record<string, number>;
  last_review_date: string;
}

export interface SkillGain {
  skill_id: string;
  gain: number;
  max_level: number;
}

export interface LearningEvent {
  event_id: string;
  title: string;
  description: string;
  type: ActivityType;
  format: 'online' | 'offline' | 'hybrid';
  duration_hours: number;
  mandatory: boolean;
  target_roles: string[];
  target_grades: Grade[];
  develops_skills: SkillGain[];
  prerequisites: Record<string, number>;
  upcoming_sessions: string[];
}

export interface ActivityRecord {
  record_id: string;
  employee_id: string;
  event_id: string;
  date: string;
  due_date: string;
  status: ActivityStatus;
  completion_pct: number;
  score: number;
  feedback_rating: number;
  assigned_by: AssignedBy;
  // Augmented when returned in API:
  event_title?: string;
  event_type?: ActivityType;
  event_format?: string;
}

export interface SkillProgressionPoint {
  date: string;
  period: string;
  level: number;
  event_title?: string;
  gain?: number;
  activity_index?: number;
  activity_label?: string;
}

export interface SkillGap {
  skill_id: string;
  name: string;
  category: string;
  type: SkillType;
  current_level: number;
  required_level: number;
  gap: number;
  is_critical: boolean;
  progression?: SkillProgressionPoint[];
  velocity_label?: string;
  velocity_trend?: 'up' | 'stable' | 'slow';
  learning_velocity?: number; // Slope: average gain per activity (e.g. 0.5, 1.0, 0.0)
  velocity_badge?: string; // e.g. "+0.5/act"
}

export interface Trajectory {
  current_role: string;
  current_grade: Grade;
  target_role: string;
  target_grade: Grade;
  is_goal_custom: boolean;
  required_skills: Record<string, number>;
  critical_skills: string[];
  gaps: SkillGap[];
  total_gaps_count: number;
  critical_gaps_count: number;
  overall_readiness_pct: number;
}

export interface RecommendationFactors {
  target_role_factor: string;
  gap_criticality_factor: string;
  history_behavior_factor: string;
}

export interface RecommendationMetrics {
  critical_skills_covered: string[];
  gap_reduction: number;
  skill_score: number;
  history_score: number;
  same_type_completed: number;
  same_type_declined: number;
  prerequisites_met: boolean;
}

export interface Recommendation {
  event_id: string;
  title: string;
  description: string;
  type: ActivityType;
  format: string;
  duration_hours: number;
  develops_skills: Array<{
    skill_id: string;
    skill_name: string;
    gain: number;
    max_level: number;
  }>;
  score: number;
  factors: RecommendationFactors;
  explanation: string;
  metrics: RecommendationMetrics;
}

export interface HROverview {
  total_employees: number;
  department_distribution: Record<string, number>;
  grade_distribution: Record<string, number>;
  avg_readiness_pct: number;
  top_lagging_skills: Array<{
    skill_id: string;
    name: string;
    category: string;
    type: SkillType;
    total_gap_sum: number;
    affected_employees_count: number;
    critical_gap_count: number;
  }>;
  employees_without_recommendations: Array<{
    employee_id: string;
    full_name: string;
    role: string;
    grade: Grade;
    target_role: string;
    target_grade: Grade;
    reason: string;
  }>;
  activity_analytics: {
    total_records: number;
    by_status: Record<ActivityStatus, number>;
    by_type: Record<
      string,
      {
        total: number;
        completed: number;
        declined_or_dropped: number;
        completion_rate_pct: number;
      }
    >;
    top_events: Array<{
      event_id: string;
      title: string;
      type: ActivityType;
      participants_count: number;
      completed_count: number;
      completion_rate_pct: number;
    }>;
  };
}
