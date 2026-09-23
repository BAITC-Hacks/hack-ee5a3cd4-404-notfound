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
