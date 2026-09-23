import fs from 'fs';
import path from 'path';
import {
  ActivityRecord,
  ActivityStatus,
  Employee,
  Grade,
  HROverview,
  LearningEvent,
  Recommendation,
  RoleProfile,
  Skill,
  SkillProgressionPoint,
  SkillsData,
  Trajectory,
  EmployeeGamification,
  RewardItem,
  AttritionRiskItem,
} from '../types/index.ts';

const GRADE_ORDER: Grade[] = ['Junior', 'Middle', 'Senior', 'Lead'];

export class DataStore {
  public skillsData!: SkillsData;
  public employees: Map<string, Employee> = new Map();
  public events: Map<string, LearningEvent> = new Map();
  public history: ActivityRecord[] = [];
  public gamification: Map<string, EmployeeGamification> = new Map();

  public rewardsCatalog: RewardItem[] = [
    {
      id: 'REW_01',
      title: 'Билет на Kolesa Conf / Digital Almaty',
      description: 'Корпоративная оплата участия в ключевой IT-конференции Казахстана.',
      category: 'event',
      cost: 200,
      icon: '🎫',
      available: true,
    },
    {
      id: 'REW_02',
      title: 'Фирменный Tech Hoodie Halyk Bank',
      description: 'Лимитированный оверсайз худи Halyk Engineering из органического хлопка.',
      category: 'merch',
      cost: 150,
      icon: '👕',
      available: true,
    },
    {
      id: 'REW_03',
      title: '1-on-1 сессия с Главным Архитектором',
      description: 'Персональная 60-минутная архитектурная сессия и разбор системного дизайна вашего сервиса.',
      category: 'education',
      cost: 120,
      icon: '🧠',
      available: true,
    },
    {
      id: 'REW_04',
      title: 'Годовая подписка O\'Reilly Learning',
      description: 'Неограниченный доступ к лучшим книгам, видеокурсам и песочницам по разработке.',
      category: 'education',
      cost: 100,
      icon: '📚',
      available: true,
    },
    {
      id: 'REW_05',
      title: 'Дополнительный Day-off за успехи в обучении',
      description: 'Согласованный с тимлидом дополнительный день отдыха за закрытие квартального вызова.',
      category: 'perk',
      cost: 250,
      icon: '🏖️',
      available: true,
    },
  ];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    try {
      const skillsPath = path.resolve(process.cwd(), 'data/skills.json');
      const eventsPath = path.resolve(process.cwd(), 'data/events.json');
      const employeesPath = path.resolve(process.cwd(), 'data/employees.json');
      const historyPath = path.resolve(process.cwd(), 'data/activity_history.csv');

      if (fs.existsSync(skillsPath)) {
        this.skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'));
      } else {
        throw new Error('data/skills.json not found');
      }

      if (fs.existsSync(eventsPath)) {
        const eventsJson = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
        (eventsJson.events || []).forEach((ev: LearningEvent) => {
          this.events.set(ev.event_id, ev);
        });
      }

      if (fs.existsSync(employeesPath)) {
        const employeesJson = JSON.parse(fs.readFileSync(employeesPath, 'utf-8'));
        (employeesJson.employees || []).forEach((emp: Employee) => {
          this.employees.set(emp.employee_id, emp);
        });
      }

      if (fs.existsSync(historyPath)) {
        const csvContent = fs.readFileSync(historyPath, 'utf-8');
        const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
        // Header: record_id,employee_id,event_id,date,due_date,status,completion_pct,score,feedback_rating,assigned_by
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 10) {
            this.history.push({
              record_id: parts[0].trim(),
              employee_id: parts[1].trim(),
              event_id: parts[2].trim(),
              date: parts[3].trim(),
              due_date: parts[4].trim(),
              status: parts[5].trim() as ActivityStatus,
              completion_pct: Number(parts[6].trim()),
              score: Number(parts[7].trim()),
              feedback_rating: Number(parts[8].trim()),
              assigned_by: parts[9].trim() as any,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load initial dataset from /data:', err);
    }
  }

  public getNextGrade(currentGrade: Grade): Grade {
    const idx = GRADE_ORDER.indexOf(currentGrade);
    if (idx === -1 || idx >= GRADE_ORDER.length - 1) {
      return 'Lead';
    }
    return GRADE_ORDER[idx + 1];
  }

  public getRoleProfile(role: string, grade: Grade): RoleProfile | undefined {
    let profile = this.skillsData.role_profiles.find(
      (p) => p.role.toLowerCase() === role.toLowerCase() && p.grade === grade
    );
    if (!profile) {
      // Fallback matching role
      profile = this.skillsData.role_profiles.find(
        (p) => p.role.toLowerCase() === role.toLowerCase()
      );
    }
    return profile;
  }

  public getSkillById(skillId: string): Skill | undefined {
    return this.skillsData.skills.find((s) => s.skill_id === skillId);
  }

  public calculateTrajectory(
    employee: Employee,
    customTargetRole?: string,
    customTargetGrade?: Grade
  ): Trajectory {
    let targetRole = customTargetRole || employee.role;
    let targetGrade: Grade = customTargetGrade || this.getNextGrade(employee.grade);
    let isGoalCustom = Boolean(customTargetRole || customTargetGrade);

    if (!customTargetRole && !customTargetGrade && employee.career_goal?.target_role && employee.career_goal?.target_grade) {
      targetRole = employee.career_goal.target_role;
      targetGrade = employee.career_goal.target_grade;
      isGoalCustom = true;
    }

    const roleProfile = this.getRoleProfile(targetRole, targetGrade);
    const requiredSkills = roleProfile ? roleProfile.required_skills : {};
    const criticalSkills = roleProfile ? roleProfile.critical_skills : [];

    const gaps: Trajectory['gaps'] = [];
    let requiredTotalPoints = 0;
    let earnedPointsTowardsRequired = 0;

    for (const [skillId, requiredLevel] of Object.entries(requiredSkills)) {
      const currentLevel = employee.skills[skillId] || 0;
      const skillDef = this.getSkillById(skillId);
      const gap = Math.max(0, requiredLevel - currentLevel);
      const isCritical = criticalSkills.includes(skillId);

      requiredTotalPoints += requiredLevel;
      earnedPointsTowardsRequired += Math.min(requiredLevel, currentLevel);

      const progressionData = this.getSkillProgression(
        employee,
        skillId,
        currentLevel,
        requiredLevel
      );

      gaps.push({
        skill_id: skillId,
        name: skillDef ? skillDef.name : skillId,
        category: skillDef ? skillDef.category : 'Общие',
        type: skillDef ? skillDef.type : 'hard',
        current_level: currentLevel,
        required_level: requiredLevel,
        gap,
        is_critical: isCritical,
        progression: progressionData.progression,
        velocity_label: progressionData.velocity_label,
        velocity_trend: progressionData.velocity_trend,
        learning_velocity: progressionData.learning_velocity,
        velocity_badge: progressionData.velocity_badge,
      });
    }

    // Sort gaps: critical first, then largest gap
    gaps.sort((a, b) => {
      if (a.is_critical && !b.is_critical) return -1;
      if (!a.is_critical && b.is_critical) return 1;
      return b.gap - a.gap;
    });

    const overallReadinessPct =
      requiredTotalPoints > 0
        ? Math.round((earnedPointsTowardsRequired / requiredTotalPoints) * 100)
        : 100;

    const totalGapsCount = gaps.filter((g) => g.gap > 0).length;
    const criticalGapsCount = gaps.filter((g) => g.gap > 0 && g.is_critical).length;

    return {
      current_role: employee.role,
      current_grade: employee.grade,
      target_role: targetRole,
      target_grade: targetGrade,
      is_goal_custom: isGoalCustom,
      required_skills: requiredSkills,
      critical_skills: criticalSkills,
      gaps,
      total_gaps_count: totalGapsCount,
      critical_gaps_count: criticalGapsCount,
      overall_readiness_pct: overallReadinessPct,
    };
  }

  /**
   * Calculates historical proficiency progression curve and learning velocity
   * for a specific skill over the employee's last 5 completed activities.
   */
  public getSkillProgression(
    employee: Employee,
    skillId: string,
    currentLevel: number,
    requiredLevel: number
  ): {
    progression: SkillProgressionPoint[];
    velocity_label: string;
    velocity_trend: 'up' | 'stable' | 'slow';
    learning_velocity: number;
    velocity_badge: string;
  } {
    // 1. Get completed activities of this employee that modify this specific skill_id
    const skillModifyingEvents = this.history
      .filter((h) => {
        if (h.employee_id !== employee.employee_id || h.status !== 'completed') return false;
        const ev = this.events.get(h.event_id);
        const develops = ev?.develops_skills || [];
        return develops.some((d) => d.skill_id === skillId && d.gain > 0);
      })
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // Extract activity gains for this skill
    const activityGains = skillModifyingEvents.map((h) => {
      const ev = this.events.get(h.event_id);
      const dev = ev?.develops_skills.find((d) => d.skill_id === skillId);
      return {
        date: h.date,
        event_id: h.event_id,
        event_title: ev?.title || h.event_id,
        gain: dev ? dev.gain : 0,
      };
    });

    const totalWindowGain = activityGains.reduce((sum, a) => sum + a.gain, 0);
    const startBaseline = Math.max(0, currentLevel - totalWindowGain);

    // Build exactly 5 progression points for the skill progression curve
    const lastEvents = activityGains.slice(-5);
    const progression: SkillProgressionPoint[] = [];
    const missingCount = 5 - lastEvents.length;

    // Pad beginning with baseline points if fewer than 5 events modified this skill
    for (let i = 0; i < missingCount; i++) {
      const actNum = i + 1;
      progression.push({
        activity_index: actNum,
        activity_label: `Точка ${actNum}`,
        period: `Точка ${actNum}`,
        date: employee.hire_date || '2025-01-01',
        level: startBaseline,
        event_title: 'Базовый срез (до активности)',
        gain: 0,
      });
    }

    // Step through each of the activities modifying this skill
    let rollingLevel = startBaseline;
    for (let i = 0; i < lastEvents.length; i++) {
      const act = lastEvents[i];
      rollingLevel = Math.min(5, rollingLevel + act.gain);
      if (i === lastEvents.length - 1) {
        rollingLevel = currentLevel;
      }
      const actNum = missingCount + i + 1;
      progression.push({
        activity_index: actNum,
        activity_label: `Точка ${actNum}`,
        period: `Точка ${actNum}`,
        date: act.date,
        level: rollingLevel,
        event_title: act.event_title,
        gain: act.gain,
      });
    }

    // Calculate learning velocity label and trend
    const netGrowth = currentLevel - startBaseline;
    const denom = Math.min(5, Math.max(1, lastEvents.length || 5));
    const slope = netGrowth > 0 ? Number((netGrowth / denom).toFixed(1)) : 0;
    const velocity_badge = slope > 0 ? `+${slope.toFixed(1)}/act` : `0.0/act`;

    let velocity_label = '0 ур. (плато)';
    let velocity_trend: 'up' | 'stable' | 'slow' = 'stable';

    if (netGrowth >= 2) {
      velocity_label = `+${netGrowth} ур. (высокий темп 🚀)`;
      velocity_trend = 'up';
    } else if (netGrowth === 1) {
      velocity_label = `+1 ур. (уверенный рост ↑)`;
      velocity_trend = 'up';
    } else {
      if (currentLevel >= requiredLevel) {
        velocity_label = 'Норма грейда (стабильно ✓)';
        velocity_trend = 'stable';
      } else {
        velocity_label = '0 ур. (плато — нужен фокус)';
        velocity_trend = 'slow';
      }
    }

    return {
      progression,
      velocity_label,
      velocity_trend,
      learning_velocity: slope,
      velocity_badge,
    };
  }

  public getEmployeeHistory(employeeId: string): ActivityRecord[] {
    const records = this.history
      .filter((h) => h.employee_id === employeeId)
      .map((h) => {
        const ev = this.events.get(h.event_id);
        return {
          ...h,
          event_title: ev?.title || h.event_id,
          event_type: ev?.type,
          event_format: ev?.format,
        };
      });
    // Sort latest first
    records.sort((a, b) => (b.date > a.date ? 1 : -1));
    return records;
  }

  /**
   * Recommendation Algorithm
   * 1. Target (role, grade) -> required_skills & critical_skills
   * 2. Skill gaps: gap = max(0, required - current)
   * 3. Non-mandatory events only. Skip completed events except repeatable EV_036.
   * 4. Multi-factor scoring:
   *    - Skill coverage score: weighted x3 for critical skills!
   *    - History penalty/boost:
   *      - Past completed of same type: +6 each
   *      - Past declined/no_show/dropped of same type: -14 each!
   *      - Specific decline of this event: -25!
   * 5. Detailed explanation synthesizing the 3 factors.
   */
  public getRecommendations(
    employeeId: string,
    limit = 3,
    customTargetRole?: string,
    customTargetGrade?: Grade
  ): Recommendation[] {
    const employee = this.employees.get(employeeId);
    if (!employee) return [];

    const trajectory = this.calculateTrajectory(employee, customTargetRole, customTargetGrade);
    const empHistory = this.history.filter((h) => h.employee_id === employeeId);

    // Completed events set (excluding EV_036 which is repeatable)
    const completedEventIds = new Set(
      empHistory
        .filter((h) => h.status === 'completed' && h.event_id !== 'EV_036')
        .map((h) => h.event_id)
    );

    // Event type statistics in employee history
    const typeStats: Record<string, { completed: number; negative: number }> = {};
    empHistory.forEach((h) => {
      const ev = this.events.get(h.event_id);
      const evType = ev?.type || 'other';
      if (!typeStats[evType]) {
        typeStats[evType] = { completed: 0, negative: 0 };
      }
      if (h.status === 'completed') {
        typeStats[evType].completed += 1;
      } else if (['declined', 'no_show', 'dropped', 'overdue'].includes(h.status)) {
        typeStats[evType].negative += 1;
      }
    });

    const candidates: Recommendation[] = [];

    for (const event of this.events.values()) {
      // 1. Skip mandatory compliance/onboarding
      if (event.mandatory) continue;

      // 2. Skip already completed (unless repeatable EV_036)
      if (completedEventIds.has(event.event_id)) continue;

      // 3. Check prerequisites
      let prereqsMet = true;
      for (const [pSkillId, minLvl] of Object.entries(event.prerequisites || {})) {
        if ((employee.skills[pSkillId] || 0) < minLvl) {
          prereqsMet = false;
          break;
        }
      }
      if (!prereqsMet) continue;

      // 4. Check target roles / grades compatibility
      if (event.target_roles && event.target_roles.length > 0) {
        const matchesTarget = event.target_roles.includes(trajectory.target_role);
        const matchesCurrent = event.target_roles.includes(employee.role);
        if (!matchesTarget && !matchesCurrent) {
          // Event explicitly targeted at a completely different role
          continue;
        }
      }

      // 5. Compute skill coverage score & critical factor
      let skillScore = 0;
      let usefulGapReduction = 0;
      const criticalCovered: string[] = [];
      const skillsCoveredDetails: Recommendation['develops_skills'] = [];

      for (const dev of event.develops_skills) {
        const skillDef = this.getSkillById(dev.skill_id);
        const skillName = skillDef?.name || dev.skill_id;
        const currentLvl = employee.skills[dev.skill_id] || 0;
        const reqLvl = trajectory.required_skills[dev.skill_id] || 0;
        const gap = Math.max(0, reqLvl - currentLvl);
        const isCritical = trajectory.critical_skills.includes(dev.skill_id);
        const effectiveGain = Math.min(dev.gain, Math.max(0, dev.max_level - currentLvl));

        skillsCoveredDetails.push({
          skill_id: dev.skill_id,
          skill_name: skillName,
          gain: dev.gain,
          max_level: dev.max_level,
        });

        if (effectiveGain <= 0) continue;

        if (gap > 0) {
          const usefulGain = Math.min(effectiveGain, gap);
          usefulGapReduction += usefulGain;
          if (isCritical) {
            criticalCovered.push(skillName);
            // Critical weight = 3x!
            skillScore += usefulGain * 30 * 3.0;
          } else {
            skillScore += usefulGain * 30 * 1.0;
          }

          // Extra gain above gap
          if (effectiveGain > usefulGain) {
            skillScore += (effectiveGain - usefulGain) * 5;
          }
        } else {
          // Develops skill where employee already meets required level (or not required)
          skillScore += effectiveGain * 3;
        }
      }

      // If event develops 0 effective skills, skip
      if (skillScore <= 0) continue;

      // 6. Compute behavioral history factor
      const stats = typeStats[event.type] || { completed: 0, negative: 0 };
      const completedCount = stats.completed;
      const negativeCount = stats.negative;

      // Positive boost for completed similar activities (up to +18)
      const positiveBoost = Math.min(18, completedCount * 6);

      // Heavy penalty for declined / dropped / no_show of same type (-14 each)
      const negativePenalty = negativeCount * 14;

      // Check if employee specifically declined this exact event in history
      const specificDeclined = empHistory.some(
        (h) => h.event_id === event.event_id && ['declined', 'no_show', 'dropped'].includes(h.status)
      );
      const specificPenalty = specificDeclined ? 25 : 0;

      const historyScore = positiveBoost - negativePenalty - specificPenalty;
      const totalScore = Math.round(skillScore + historyScore);

      // Filter out candidates with totalScore <= 0 or strong negative history overwhelming skill gain
      if (totalScore <= 0) continue;

      // 7. Compose 3-factor explainable justification
      // Factor 1: Target role & grade requirements
      const targetRoleFactor =
        `Целевой грейд ${trajectory.target_grade} для роли ${trajectory.target_role} ` +
        (criticalCovered.length > 0
          ? `требует обязательного подтверждения критических компетенций: ${criticalCovered.join(', ')}.`
          : `включает повышение квалификации по профильным компетенциям направления.`);

      // Factor 2: Specific skill gap & criticality
      const gapCriticalityFactor =
        criticalCovered.length > 0
          ? `У сотрудника зафиксирован разрыв по критическому навыку (весовой коэффициент x3). ` +
            `Активность дает гарантированный прирост (+${usefulGapReduction} ур.) и сокращает дефицит грейда.`
          : `Активность развивает навыки программы с приростом (+${usefulGapReduction} ур.), закрывая текущий разрыв грейда.`;

      // Factor 3: Employee history & engagement pattern
      let historyBehaviorFactor = '';
      if (specificDeclined) {
        historyBehaviorFactor = `Ранее по этой активности фиксировался отказ/неявка, но высокая критичность компетенции перевешивает прошлые ограничения.`;
      } else if (negativeCount > 0 && completedCount > 0) {
        historyBehaviorFactor =
          `Сотрудник завершил ${completedCount} похожих активностей типа «${event.type}», ` +
          `при ${negativeCount} отклонениях/неявках. Формат подтвержден как рабочий.`;
      } else if (negativeCount > 0) {
        historyBehaviorFactor =
          `Внимание: по типу «${event.type}» зафиксировано ${negativeCount} отказов/неявок. ` +
          `Рекомендация скорректирована с учетом поведенческого штрафа.`;
      } else if (completedCount > 0) {
        historyBehaviorFactor =
          `Высокая подтвержденная вовлеченность: успешно завершено ${completedCount} активностей типа «${event.type}» ` +
          `без единого отказа или срыва сроков.`;
      } else {
        historyBehaviorFactor = `Нейтральная история: активности формата «${event.type}» ранее не назначались, формат безопасен для старта.`;
      }

      // Comprehensive explanation synthesis
      const explanation =
        `${targetRoleFactor} ${gapCriticalityFactor} ${historyBehaviorFactor}`;

      candidates.push({
        event_id: event.event_id,
        title: event.title,
        description: event.description,
        type: event.type,
        format: event.format,
        duration_hours: event.duration_hours,
        develops_skills: skillsCoveredDetails,
        score: totalScore,
        factors: {
          target_role_factor: targetRoleFactor,
          gap_criticality_factor: gapCriticalityFactor,
          history_behavior_factor: historyBehaviorFactor,
        },
        explanation,
        metrics: {
          critical_skills_covered: criticalCovered,
          gap_reduction: usefulGapReduction,
          skill_score: Math.round(skillScore),
          history_score: Math.round(historyScore),
          same_type_completed: completedCount,
          same_type_declined: negativeCount,
          prerequisites_met: prereqsMet,
        },
      });
    }

    // Sort by final score descending
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit);
  }

  public completeActivity(
    employeeId: string,
    eventId: string
  ): {
    employee: Employee;
    trajectory: Trajectory;
    recommendations: Recommendation[];
    updated_skills: Record<string, { prev: number; current: number; gain: number }>;
  } {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error(`Employee ${employeeId} not found`);

    const event = this.events.get(eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    const updatedSkills: Record<string, { prev: number; current: number; gain: number }> = {};

    for (const dev of event.develops_skills) {
      const prev = employee.skills[dev.skill_id] || 0;
      const targetLevel = Math.min(dev.max_level, Math.min(5, prev + dev.gain));
      const actualGain = targetLevel - prev;

      employee.skills[dev.skill_id] = targetLevel;
      updatedSkills[dev.skill_id] = {
        prev,
        current: targetLevel,
        gain: actualGain,
      };
    }

    // Add record to history
    const newRecordId = `HIST_EXEC_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    this.history.unshift({
      record_id: newRecordId,
      employee_id: employeeId,
      event_id: eventId,
      date: todayStr,
      due_date: todayStr,
      status: 'completed',
      completion_pct: 100,
      score: 95,
      feedback_rating: 5,
      assigned_by: 'self',
    });

    // Reward voluntary learning coins and update challenges progress
    const gamification = this.getEmployeeGamification(employeeId);
    gamification.coins += 50;
    const learnChallenge = gamification.challenges.find((c) => c.id === 'CH_02');
    if (learnChallenge && !learnChallenge.completed) {
      learnChallenge.current = Math.min(learnChallenge.target, learnChallenge.current + 1);
      if (learnChallenge.current >= learnChallenge.target) {
        learnChallenge.completed = true;
        gamification.coins += learnChallenge.reward_coins;
      }
    }

    const trajectory = this.calculateTrajectory(employee);
    const recommendations = this.getRecommendations(employeeId, 3);

    return {
      employee,
      trajectory,
      recommendations,
      updated_skills: updatedSkills,
    };
  }

  public updateCareerGoal(
    employeeId: string,
    targetRole: string,
    targetGrade: Grade
  ): {
    employee: Employee;
    trajectory: Trajectory;
    recommendations: Recommendation[];
  } {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error(`Сотрудник ${employeeId} не найден`);

    employee.career_goal = {
      target_role: targetRole,
      target_grade: targetGrade,
    };

    const trajectory = this.calculateTrajectory(employee);
    const recommendations = this.getRecommendations(employeeId, 3);

    return {
      employee,
      trajectory,
      recommendations,
    };
  }

  public simulateGoal(
    employeeId: string,
    targetRole: string,
    targetGrade: Grade
  ): {
    trajectory: Trajectory;
    recommendations: Recommendation[];
  } {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error(`Сотрудник ${employeeId} не найден`);

    const trajectory = this.calculateTrajectory(employee, targetRole, targetGrade);
    const recommendations = this.getRecommendations(employeeId, 3, targetRole, targetGrade);

    return {
      trajectory,
      recommendations,
    };
  }

  public getAvailableRolesAndGrades(): { role: string; grades: Grade[] }[] {
    const map = new Map<string, Grade[]>();
    for (const p of this.skillsData.role_profiles) {
      if (!map.has(p.role)) {
        map.set(p.role, []);
      }
      const list = map.get(p.role)!;
      if (!list.includes(p.grade)) {
        list.push(p.grade);
      }
    }
    return Array.from(map.entries()).map(([role, grades]) => ({
      role,
      grades,
    }));
  }

  public getHROverview(): HROverview {
    const totalEmployees = this.employees.size;
    const departmentDistribution: Record<string, number> = {};
    const gradeDistribution: Record<string, number> = {};

    let totalReadinessSum = 0;
    const skillGapAggregation: Record<
      string,
      {
        total_gap: number;
        affected_count: number;
        critical_count: number;
      }
    > = {};

    const employeesWithoutRecommendations: HROverview['employees_without_recommendations'] = [];

    for (const employee of this.employees.values()) {
      departmentDistribution[employee.department] =
        (departmentDistribution[employee.department] || 0) + 1;
      gradeDistribution[employee.grade] = (gradeDistribution[employee.grade] || 0) + 1;

      const trajectory = this.calculateTrajectory(employee);
      totalReadinessSum += trajectory.overall_readiness_pct;

      // Track gaps
      for (const gap of trajectory.gaps) {
        if (gap.gap > 0) {
          if (!skillGapAggregation[gap.skill_id]) {
            skillGapAggregation[gap.skill_id] = {
              total_gap: 0,
              affected_count: 0,
              critical_count: 0,
            };
          }
          skillGapAggregation[gap.skill_id].total_gap += gap.gap;
          skillGapAggregation[gap.skill_id].affected_count += 1;
          if (gap.is_critical) {
            skillGapAggregation[gap.skill_id].critical_count += 1;
          }
        }
      }

      // Check recommendations
      const recs = this.getRecommendations(employee.employee_id, 1);
      if (recs.length === 0) {
        let reason = 'Нет доступных активностей';
        if (trajectory.total_gaps_count === 0) {
          reason =
            employee.grade === 'Lead'
              ? 'Достигнут максимальный грейд Lead, все компетенции подтверждены'
              : 'Все требования целевого грейда закрыты на 100%, готов к промоушену';
        } else {
          reason = 'Требуется открытие дополнительных программ обучения с учетом пререквизитов';
        }

        employeesWithoutRecommendations.push({
          employee_id: employee.employee_id,
          full_name: employee.full_name,
          role: employee.role,
          grade: employee.grade,
          target_role: trajectory.target_role,
          target_grade: trajectory.target_grade,
          reason,
        });
      }
    }

    const topLaggingSkills = Object.entries(skillGapAggregation)
      .map(([skillId, agg]) => {
        const skillDef = this.getSkillById(skillId);
        return {
          skill_id: skillId,
          name: skillDef?.name || skillId,
          category: skillDef?.category || 'Общие',
          type: skillDef?.type || 'hard',
          total_gap_sum: agg.total_gap,
          affected_employees_count: agg.affected_count,
          critical_gap_count: agg.critical_count,
        };
      })
      .sort((a, b) => b.total_gap_sum - a.total_gap_sum);

    // Activity analytics
    const statusCounts: Record<ActivityStatus, number> = {
      completed: 0,
      in_progress: 0,
      dropped: 0,
      no_show: 0,
      declined: 0,
      overdue: 0,
    };

    const typeStats: Record<
      string,
      { total: number; completed: number; declined_or_dropped: number }
    > = {};

    const eventParticipants: Record<string, { total: number; completed: number }> = {};

    for (const h of this.history) {
      if (statusCounts[h.status] !== undefined) {
        statusCounts[h.status] += 1;
      }
      const ev = this.events.get(h.event_id);
      const evType = ev?.type || 'other';

      if (!typeStats[evType]) {
        typeStats[evType] = { total: 0, completed: 0, declined_or_dropped: 0 };
      }
      typeStats[evType].total += 1;
      if (h.status === 'completed') {
        typeStats[evType].completed += 1;
      } else if (['declined', 'dropped', 'no_show', 'overdue'].includes(h.status)) {
        typeStats[evType].declined_or_dropped += 1;
      }

      if (!eventParticipants[h.event_id]) {
        eventParticipants[h.event_id] = { total: 0, completed: 0 };
      }
      eventParticipants[h.event_id].total += 1;
      if (h.status === 'completed') {
        eventParticipants[h.event_id].completed += 1;
      }
    }

    const activityByType: HROverview['activity_analytics']['by_type'] = {};
    for (const [t, data] of Object.entries(typeStats)) {
      activityByType[t] = {
        total: data.total,
        completed: data.completed,
        declined_or_dropped: data.declined_or_dropped,
        completion_rate_pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      };
    }

    const topEvents = Object.entries(eventParticipants)
      .map(([evId, data]) => {
        const ev = this.events.get(evId);
        return {
          event_id: evId,
          title: ev?.title || evId,
          type: ev?.type || ('course' as any),
          participants_count: data.total,
          completed_count: data.completed,
          completion_rate_pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.participants_count - a.participants_count)
      .slice(0, 10);

    const attritionRisks = this.calculateAttritionRisks();
    const highRiskCount = attritionRisks.filter((r) => r.risk_level === 'High').length;

    return {
      total_employees: totalEmployees,
      department_distribution: departmentDistribution,
      grade_distribution: gradeDistribution,
      avg_readiness_pct:
        totalEmployees > 0 ? Math.round(totalReadinessSum / totalEmployees) : 0,
      attrition_risks: attritionRisks,
      high_risk_count: highRiskCount,
      top_lagging_skills: topLaggingSkills,
      employees_without_recommendations: employeesWithoutRecommendations,
      activity_analytics: {
        total_records: this.history.length,
        by_status: statusCounts,
        by_type: activityByType,
        top_events: topEvents,
      },
    };
  }

  public calculateAttritionRisks(): AttritionRiskItem[] {
    const list: AttritionRiskItem[] = [];

    for (const emp of this.employees.values()) {
      const trajectory = this.calculateTrajectory(emp);
      const empHistory = this.history.filter((h) => h.employee_id === emp.employee_id);
      const declineCount = empHistory.filter((h) =>
        ['declined', 'dropped', 'no_show', 'overdue'].includes(h.status)
      ).length;

      let riskScore = 15;
      const reasons: string[] = [];

      // Stagnation factor
      const stagnationMonths = Math.max(0, emp.tenure_months - 18);
      if (emp.tenure_months > 24 && trajectory.overall_readiness_pct < 65) {
        riskScore += 25;
        reasons.push(`Стаж более 24 месяцев при готовности к повышению ниже 65% (${trajectory.overall_readiness_pct}%)`);
      }
      if (emp.tenure_months > 36 && emp.grade !== 'Lead') {
        riskScore += 20;
        reasons.push(`Длительное нахождение на грейде ${emp.grade} (${emp.tenure_months} мес.)`);
      }

      // Behavioral disengagement factor
      if (declineCount >= 2) {
        riskScore += Math.min(30, declineCount * 12);
        reasons.push(`Повышенная частота отказов/неявок на обучающие форматы (${declineCount} срывов)`);
      }

      // Critical skills deadlock
      if (trajectory.critical_gaps_count >= 2) {
        riskScore += 18;
        reasons.push(`Блокирующий дефицит по ${trajectory.critical_gaps_count} критическим компетенциям грейда`);
      }

      if (reasons.length === 0) {
        reasons.push('Стабильная динамика освоения навыков и участие в программах банка');
      }

      riskScore = Math.min(95, Math.max(8, riskScore));

      let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
      let recommendedAction = 'Плановое развитие в рамках текущего квартального ИПР.';

      if (riskScore >= 60) {
        riskLevel = 'High';
        recommendedAction = 'Срочно назначить 1-on-1 с Team Lead, пересмотреть карьерный трек и назначить ментора из Senior/Lead.';
      } else if (riskScore >= 35) {
        riskLevel = 'Medium';
        recommendedAction = 'Предложить практический воркшоп с высоким рейтингом вовлеченности и утвердить индивидуальный план роста.';
      }

      list.push({
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        department: emp.department,
        role: emp.role,
        grade: emp.grade,
        tenure_months: emp.tenure_months,
        readiness_pct: trajectory.overall_readiness_pct,
        risk_level: riskLevel,
        risk_score: riskScore,
        primary_reasons: reasons,
        recommended_action: recommendedAction,
        stagnation_months: stagnationMonths,
        decline_count: declineCount,
      });
    }

    return list.sort((a, b) => b.risk_score - a.risk_score);
  }

  public getEmployeeGamification(employeeId: string): EmployeeGamification {
    let data = this.gamification.get(employeeId);
    if (!data) {
      const emp = this.employees.get(employeeId);
      const tenure = emp?.tenure_months || 12;
      const initialCoins = Math.min(300, 100 + tenure * 3);

      data = {
        employee_id: employeeId,
        coins: initialCoins,
        badges: [
          {
            id: 'BADGE_01',
            title: 'Halyk Explorer',
            description: 'Успешный старт и синхронизация карьерной траектории',
            icon: '🧭',
            unlocked_at: '2026-01-15',
          },
          {
            id: 'BADGE_02',
            title: 'Continuous Learner',
            description: 'Более 3 подтвержденных развивающих программ',
            icon: '⚡',
            unlocked_at: '2026-02-20',
          },
        ],
        challenges: [
          {
            id: 'CH_01',
            title: 'Архитектурный прорыв',
            description: 'Повысить уровень владения ключевой критической компетенцией грейда',
            target: 1,
            current: 0,
            reward_coins: 75,
            completed: false,
          },
          {
            id: 'CH_02',
            title: 'Тяга к знаниям (Q3)',
            description: 'Пройти 2 развивающих воркшопа или курса из каталога Halyk Academy',
            target: 2,
            current: 0,
            reward_coins: 50,
            completed: false,
          },
          {
            id: 'CH_03',
            title: 'Командный наставник',
            description: 'Отправить 1 подтверждение признания (Kudos) коллеге за вклад в проект',
            target: 1,
            current: 0,
            reward_coins: 30,
            completed: false,
          },
        ],
        kudos_received: [
          {
            from_employee_id: 'EMP_002',
            from_name: 'Елена Смирнова (Senior Lead)',
            skill_id: 'SK_001',
            skill_name: 'System Design & Архитектура',
            message: 'Отличный разбор схемы отказоустойчивости сервиса на прошлой неделе!',
            date: '2026-03-01',
          },
        ],
        redeemed_rewards: [],
      };
      this.gamification.set(employeeId, data);
    }
    return data;
  }

  public sendKudos(
    fromEmpId: string,
    toEmpId: string,
    skillId: string,
    message: string
  ): { success: boolean; message: string } {
    const fromEmp = this.employees.get(fromEmpId);
    const toEmp = this.employees.get(toEmpId);
    if (!fromEmp || !toEmp) throw new Error('Сотрудник не найден');

    const skillDef = this.getSkillById(skillId);
    const skillName = skillDef?.name || skillId;

    const toGami = this.getEmployeeGamification(toEmpId);
    toGami.kudos_received.unshift({
      from_employee_id: fromEmpId,
      from_name: `${fromEmp.full_name} (${fromEmp.role} ${fromEmp.grade})`,
      skill_id: skillId,
      skill_name: skillName,
      message,
      date: new Date().toISOString().split('T')[0],
    });
    // Award recipient +15 coins
    toGami.coins += 15;

    // Advance sender's challenge & award +5 coins
    const fromGami = this.getEmployeeGamification(fromEmpId);
    fromGami.coins += 5;
    const kudosChallenge = fromGami.challenges.find((c) => c.id === 'CH_03');
    if (kudosChallenge && !kudosChallenge.completed) {
      kudosChallenge.current = Math.min(kudosChallenge.target, kudosChallenge.current + 1);
      if (kudosChallenge.current >= kudosChallenge.target) {
        kudosChallenge.completed = true;
        fromGami.coins += kudosChallenge.reward_coins;
      }
    }

    return {
      success: true,
      message: `Благодарность за компетенцию "${skillName}" успешно отправлена коллеге ${toEmp.full_name}!`,
    };
  }

  public redeemReward(
    employeeId: string,
    rewardId: string
  ): { success: boolean; message: string; remaining_coins: number } {
    const reward = this.rewardsCatalog.find((r) => r.id === rewardId);
    if (!reward) throw new Error('Вознаграждение не найдено в каталоге');
    const gami = this.getEmployeeGamification(employeeId);
    if (gami.coins < reward.cost) {
      throw new Error(`Недостаточно Halyk Coins (баланс: ${gami.coins}, требуется: ${reward.cost})`);
    }

    gami.coins -= reward.cost;
    gami.redeemed_rewards.unshift({
      reward_id: reward.id,
      title: reward.title,
      cost: reward.cost,
      date: new Date().toISOString().split('T')[0],
    });

    return {
      success: true,
      message: `Вы успешно получили: "${reward.title}". Заявка передана координатору Halyk Benefits.`,
      remaining_coins: gami.coins,
    };
  }

  public addCustomEvent(event: LearningEvent): LearningEvent {
    if (!event.event_id || !event.title) {
      throw new Error('Обязательные поля: event_id и title');
    }
    this.events.set(event.event_id, event);
    return event;
  }

  public importDataset(payload: {
    employees?: Employee[];
    history?: ActivityRecord[];
    events?: LearningEvent[];
    skills?: SkillsData;
  }): {
    success: boolean;
    counts: { employees: number; history: number; events: number; skills: number };
    imported: { employees: number; history: number; events: number };
  } {
    let importedEmployees = 0;
    let importedHistory = 0;
    let importedEvents = 0;

    if (payload.skills) {
      if (payload.skills.skills) {
        // Merge or replace skills
        const existingSkillIds = new Set(this.skillsData.skills.map((s) => s.skill_id));
        payload.skills.skills.forEach((s) => {
          if (!existingSkillIds.has(s.skill_id)) {
            this.skillsData.skills.push(s);
          }
        });
      }
      if (payload.skills.role_profiles) {
        payload.skills.role_profiles.forEach((rp) => {
          const idx = this.skillsData.role_profiles.findIndex(
            (p) => p.role.toLowerCase() === rp.role.toLowerCase() && p.grade === rp.grade
          );
          if (idx >= 0) {
            this.skillsData.role_profiles[idx] = rp;
          } else {
            this.skillsData.role_profiles.push(rp);
          }
        });
      }
    }

    if (Array.isArray(payload.events)) {
      payload.events.forEach((ev) => {
        this.events.set(ev.event_id, ev);
        importedEvents++;
      });
    }

    if (Array.isArray(payload.employees)) {
      payload.employees.forEach((emp) => {
        this.employees.set(emp.employee_id, emp);
        importedEmployees++;
      });
    }

    if (Array.isArray(payload.history)) {
      payload.history.forEach((h) => {
        // Replace existing record_id or push new
        const existingIdx = this.history.findIndex((item) => item.record_id === h.record_id);
        if (existingIdx >= 0) {
          this.history[existingIdx] = h;
        } else {
          this.history.unshift(h);
        }
        importedHistory++;
      });
    }

    return {
      success: true,
      counts: {
        employees: this.employees.size,
        history: this.history.length,
        events: this.events.size,
        skills: this.skillsData.skills.length,
      },
      imported: {
        employees: importedEmployees,
        history: importedHistory,
        events: importedEvents,
      },
    };
  }
}

export const dataStore = new DataStore();
