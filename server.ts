import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataStore } from './src/server/dataStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));

  // API Routes
  // 1. GET /api/employees - selector list
  app.get('/api/employees', (req, res) => {
    try {
      const list = Array.from(dataStore.employees.values()).map((emp) => ({
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        role: emp.role,
        grade: emp.grade,
        department: emp.department,
        career_goal: emp.career_goal,
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. GET /api/employees/:id - profile + trajectory + history
  app.get('/api/employees/:id', (req, res) => {
    try {
      const { id } = req.params;
      const employee = dataStore.employees.get(id);
      if (!employee) {
        return res.status(404).json({ error: `Сотрудник ${id} не найден` });
      }

      const trajectory = dataStore.calculateTrajectory(employee);
      const history = dataStore.getEmployeeHistory(id);

      res.json({
        employee,
        trajectory,
        history,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. GET /api/employees/:id/recommendations - top-N recommendations with 3-factor explanation
  app.get('/api/employees/:id/recommendations', (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
      const employee = dataStore.employees.get(id);
      if (!employee) {
        return res.status(404).json({ error: `Сотрудник ${id} не найден` });
      }

      const trajectory = dataStore.calculateTrajectory(employee);
      const recommendations = dataStore.getRecommendations(id, limit);

      res.json({
        employee_id: id,
        target_role: trajectory.target_role,
        target_grade: trajectory.target_grade,
        recommendations,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. POST /api/employees/:id/activities/:eventId/complete - updates skills & history
  app.post('/api/employees/:id/activities/:eventId/complete', (req, res) => {
    try {
      const { id, eventId } = req.params;
      const result = dataStore.completeActivity(id, eventId);
      res.json({
        success: true,
        message: `Активность ${eventId} успешно отмечена выполненной`,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. GET /api/hr/overview - company-wide metrics & gaps
  app.get('/api/hr/overview', (req, res) => {
    try {
      const overview = dataStore.getHROverview();
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. POST /api/import - JSON import & merge without restart
  app.post('/api/import', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
      }
      const result = dataStore.importDataset(payload);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. GET /api/skills - full skills matrix & role profiles
  app.get('/api/skills', (req, res) => {
    res.json(dataStore.skillsData);
  });

  // 8. GET /api/events - events catalogue
  app.get('/api/events', (req, res) => {
    res.json(Array.from(dataStore.events.values()));
  });

  // 9. GET /api/roles - list of available roles and grades
  app.get('/api/roles', (req, res) => {
    try {
      res.json(dataStore.getAvailableRolesAndGrades());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. POST /api/employees/:id/career-goal - set active career goal
  app.post('/api/employees/:id/career-goal', (req, res) => {
    try {
      const { id } = req.params;
      const { target_role, target_grade } = req.body;
      if (!target_role || !target_grade) {
        return res.status(400).json({ error: 'Параметры target_role и target_grade обязательны' });
      }
      const result = dataStore.updateCareerGoal(id, target_role, target_grade);
      res.json({
        success: true,
        message: `Цель сотрудника успешно обновлена: ${target_role} (${target_grade})`,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 11. POST /api/employees/:id/simulate-goal - simulate what-if career transition
  app.post('/api/employees/:id/simulate-goal', (req, res) => {
    try {
      const { id } = req.params;
      const { target_role, target_grade } = req.body;
      if (!target_role || !target_grade) {
        return res.status(400).json({ error: 'Параметры target_role и target_grade обязательны' });
      }
      const result = dataStore.simulateGoal(id, target_role, target_grade);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 12. GET /api/employees/:id/gamification
  app.get('/api/employees/:id/gamification', (req, res) => {
    try {
      const { id } = req.params;
      const data = dataStore.getEmployeeGamification(id);
      res.json({
        ...data,
        catalog: dataStore.rewardsCatalog,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. POST /api/employees/:id/kudos - send appreciation to colleague
  app.post('/api/employees/:id/kudos', (req, res) => {
    try {
      const { id } = req.params;
      const { to_employee_id, skill_id, message } = req.body;
      if (!to_employee_id || !skill_id || !message) {
        return res.status(400).json({ error: 'Поля to_employee_id, skill_id и message обязательны' });
      }
      const result = dataStore.sendKudos(id, to_employee_id, skill_id, message);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 14. POST /api/employees/:id/rewards/redeem - redeem Halyk Store item
  app.post('/api/employees/:id/rewards/redeem', (req, res) => {
    try {
      const { id } = req.params;
      const { reward_id } = req.body;
      if (!reward_id) {
        return res.status(400).json({ error: 'Параметр reward_id обязателен' });
      }
      const result = dataStore.redeemReward(id, reward_id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 15. GET /api/rewards - list available benefits
  app.get('/api/rewards', (req, res) => {
    try {
      res.json(dataStore.rewardsCatalog);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 16. GET /api/hr/attrition-risks - employee retention flight risks
  app.get('/api/hr/attrition-risks', (req, res) => {
    try {
      res.json(dataStore.calculateAttritionRisks());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 17. POST /api/events - HR Event Builder
  app.post('/api/events', (req, res) => {
    try {
      const eventData = req.body;
      if (!eventData || !eventData.title || !eventData.develops_skills) {
        return res.status(400).json({ error: 'Необходимо указать название и развиваемые навыки' });
      }
      const eventId = eventData.event_id || `EV_HR_${Date.now()}`;
      const created = dataStore.addCustomEvent({
        ...eventData,
        event_id: eventId,
      });
      res.json({
        success: true,
        message: `Мероприятие "${created.title}" успешно создано в Halyk Academy!`,
        event: created,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Frontend Serving / Vite Middleware
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
