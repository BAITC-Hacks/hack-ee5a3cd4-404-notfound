import { dataStore } from '../server/dataStore.ts';

console.log('--- Testing Benchmark EMP_001 ---');
const emp001 = dataStore.employees.get('EMP_001');
if (!emp001) {
  console.error('EMP_001 not found!');
  process.exit(1);
}

const traj001 = dataStore.calculateTrajectory(emp001);
console.log('EMP_001 Trajectory:', {
  role: traj001.current_role,
  grade: traj001.current_grade,
  target_role: traj001.target_role,
  target_grade: traj001.target_grade,
  readiness_pct: traj001.overall_readiness_pct,
  critical_skills: traj001.critical_skills,
});

console.log('EMP_001 Top Gaps:');
traj001.gaps.slice(0, 5).forEach((g) => {
  console.log(`  - ${g.name} (${g.skill_id}): current ${g.current_level}, req ${g.required_level}, gap: ${g.gap}, critical: ${g.is_critical}`);
});

const recs001 = dataStore.getRecommendations('EMP_001', 3);
console.log('\nEMP_001 Top Recommendations:');
recs001.forEach((r, idx) => {
  console.log(`\n#${idx + 1}: [${r.event_id}] ${r.title}`);
  console.log(`  Score: ${r.score}, Type: ${r.type}, Format: ${r.format}`);
  console.log(`  Develops: ${r.develops_skills.map((d) => `${d.skill_name} (+${d.gain})`).join(', ')}`);
  console.log(`  Explanation: ${r.explanation}`);
  console.log(`  Factors:`);
  console.log(`    (1) Target Role: ${r.factors.target_role_factor}`);
  console.log(`    (2) Critical Gap: ${r.factors.gap_criticality_factor}`);
  console.log(`    (3) History Behavior: ${r.factors.history_behavior_factor}`);
});

// Check requirement: System Design MUST rank above Public Speaking (EV_006)
const topEvent = recs001[0];
const ev006InRecs = recs001.find((r) => r.event_id === 'EV_006');
if (topEvent && (topEvent.event_id === 'EV_003' || topEvent.event_id === 'EV_005' || topEvent.event_id === 'EV_007')) {
  console.log('\n✅ PASS: System Design / Highload Engineering ranked #1, NOT Public Speaking!');
} else {
  console.error('\n❌ FAIL: Top event was:', topEvent?.event_id);
}

if (!ev006InRecs || (topEvent && topEvent.event_id !== 'EV_006')) {
  console.log('✅ PASS: Public Speaking did not win over critical System Design despite being lowest skill in absolute terms!');
}

console.log('\n--- Testing Complete Activity on EMP_001 ---');
const prevSkill001 = emp001.skills['SK_001'];
const updateResult = dataStore.completeActivity('EMP_001', 'EV_003');
const newSkill001 = updateResult.employee.skills['SK_001'];
console.log(`Skill SK_001 before: ${prevSkill001}, after: ${newSkill001}`);
console.log(`Updated skills response:`, updateResult.updated_skills);
console.log(`New readiness: ${updateResult.trajectory.overall_readiness_pct}%`);

console.log('\n--- Testing HR Overview ---');
const hr = dataStore.getHROverview();
console.log('HR Overview Summary:', {
  total_employees: hr.total_employees,
  avg_readiness_pct: hr.avg_readiness_pct,
  top_lagging_skills_count: hr.top_lagging_skills.length,
  employees_without_recs: hr.employees_without_recommendations.length,
  total_history_records: hr.activity_analytics.total_records,
});
console.log('Top 3 Lagging Skills across company:');
hr.top_lagging_skills.slice(0, 3).forEach((s) => {
  console.log(`  - ${s.name}: sum gap ${s.total_gap_sum}, affected employees: ${s.affected_employees_count}, critical: ${s.critical_gap_count}`);
});
