import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  authenticate,
  canAccessEmployee,
  clearLoginFailures,
  clearSessionCookie,
  getSession,
  isAdmin,
  loginAllowed,
  recordLoginFailure,
  requireAuthentication,
  requireCsrf,
  startSession,
  verifyAuthConfiguration,
} from './src/server/auth.ts';
import { dataStore } from './src/server/dataStore.ts';
import {
  normalizeImportPayload,
  validateCareerGoal,
  validateImportPayload,
  validateKudos,
  validateLearningEvent,
  validateRewardRedemption,
  validationMessage,
} from './src/server/validation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sendInternalError(res: Response, context: string, error: unknown): void {
  console.error(`${context}:`, error);
  res.status(500).json({ error: 'Internal server error' });
}

function requireEmployeeAccess(req: Request, res: Response, employeeId: string): boolean {
  if (canAccessEmployee(req, employeeId)) return true;
  res.status(403).json({ error: 'You do not have access to this employee' });
  return false;
}

function requireAdminAccess(req: Request, res: Response): boolean {
  if (isAdmin(req)) return true;
  res.status(403).json({ error: 'Administrator access is required' });
  return false;
}

function readRecommendationLimit(value: unknown): number {
  if (value === undefined) return 3;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error('limit must be an integer between 1 and 10');
  }
  const limit = Number(value);
  if (limit < 1 || limit > 10) throw new Error('limit must be an integer between 1 and 10');
  return limit;
}

async function startServer() {
  verifyAuthConfiguration();
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const host = isProd ? '0.0.0.0' : '127.0.0.1';

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/auth/login', (req, res) => {
    const attemptKey = req.ip || req.socket.remoteAddress || 'unknown';
    if (!loginAllowed(attemptKey)) {
      return res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' });
    }

    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const session = authenticate(username, password);
    if (!session || (session.role === 'employee' && !dataStore.employees.has(session.employeeId!))) {
      recordLoginFailure(attemptKey);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    clearLoginFailures(attemptKey);
    startSession(res, session);
    return res.json({
      username: session.username,
      role: session.role,
      employeeId: session.employeeId,
      csrfToken: session.csrfToken,
    });
  });

  app.use('/api', requireAuthentication);
  app.use('/api', requireCsrf);

  app.get('/api/auth/session', (req, res) => {
    const session = getSession(req);
    res.json({
      username: session.username,
      role: session.role,
      employeeId: session.employeeId,
      csrfToken: session.csrfToken,
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
  });

  app.get('/api/employees', (req, res) => {
    try {
      const session = getSession(req);
      const employees = session.role === 'admin'
        ? Array.from(dataStore.employees.values())
        : [dataStore.employees.get(session.employeeId!)].filter(Boolean);
      res.json(employees.map((employee) => ({
        employee_id: employee!.employee_id,
        full_name: employee!.full_name,
        role: employee!.role,
        grade: employee!.grade,
        department: employee!.department,
        career_goal: employee!.career_goal,
      })));
    } catch (error) {
      sendInternalError(res, 'Failed to list employees', error);
    }
  });

  app.get('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const employee = dataStore.employees.get(id);
      if (!employee) return res.status(404).json({ error: 'Employee not found' });
      res.json({
        employee,
        trajectory: dataStore.calculateTrajectory(employee),
        history: dataStore.getEmployeeHistory(id),
      });
    } catch (error) {
      sendInternalError(res, 'Failed to get employee', error);
    }
  });

  app.get('/api/employees/:id/recommendations', (req, res) => {
    const { id } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const employee = dataStore.employees.get(id);
      if (!employee) return res.status(404).json({ error: 'Employee not found' });
      const trajectory = dataStore.calculateTrajectory(employee);
      res.json({
        employee_id: id,
        target_role: trajectory.target_role,
        target_grade: trajectory.target_grade,
        recommendations: dataStore.getRecommendations(id, readRecommendationLimit(req.query.limit)),
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  app.post('/api/employees/:id/activities/:eventId/complete', (req, res) => {
    const { id, eventId } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const result = dataStore.completeActivity(id, eventId);
      res.json({ success: true, message: `Activity ${eventId} was completed`, ...result });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to complete activity' });
    }
  });

  app.get('/api/hr/overview', (req, res) => {
    if (!requireAdminAccess(req, res)) return;
    try {
      res.json(dataStore.getHROverview());
    } catch (error) {
      sendInternalError(res, 'Failed to get HR overview', error);
    }
  });

  app.get('/api/hr/attrition-risks', (req, res) => {
    if (!requireAdminAccess(req, res)) return;
    try {
      res.json(dataStore.calculateAttritionRisks());
    } catch (error) {
      sendInternalError(res, 'Failed to get attrition risks', error);
    }
  });

  app.post('/api/import', (req, res) => {
    if (!requireAdminAccess(req, res)) return;
    try {
      const payload = validateImportPayload(normalizeImportPayload(req.body));
      res.json(dataStore.importDataset(payload));
    } catch (error) {
      res.status(400).json({ error: validationMessage(error) });
    }
  });

  app.get('/api/skills', (_req, res) => res.json(dataStore.skillsData));
  app.get('/api/events', (_req, res) => res.json(Array.from(dataStore.events.values())));

  app.get('/api/roles', (_req, res) => {
    try {
      res.json(dataStore.getAvailableRolesAndGrades());
    } catch (error) {
      sendInternalError(res, 'Failed to list roles', error);
    }
  });

  app.post('/api/employees/:id/career-goal', (req, res) => {
    const { id } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const { targetRole, targetGrade } = validateCareerGoal(req.body);
      if (!dataStore.hasRoleProfile(targetRole, targetGrade)) {
        return res.status(400).json({ error: 'Unknown target role or grade' });
      }
      const result = dataStore.updateCareerGoal(id, targetRole, targetGrade);
      res.json({ success: true, message: 'Career goal updated', ...result });
    } catch (error) {
      res.status(400).json({ error: validationMessage(error) });
    }
  });

  app.post('/api/employees/:id/simulate-goal', (req, res) => {
    const { id } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const { targetRole, targetGrade } = validateCareerGoal(req.body);
      if (!dataStore.hasRoleProfile(targetRole, targetGrade)) {
        return res.status(400).json({ error: 'Unknown target role or grade' });
      }
      res.json(dataStore.simulateGoal(id, targetRole, targetGrade));
    } catch (error) {
      res.status(400).json({ error: validationMessage(error) });
    }
  });

  app.get('/api/employees/:id/gamification', (req, res) => {
    const { id } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const data = dataStore.getEmployeeGamification(id);
      res.json({ ...data, catalog: dataStore.rewardsCatalog });
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Employee not found' });
    }
  });

  app.post('/api/employees/:id/kudos', (req, res) => {
    const { id } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const { toEmployeeId, skillId, message } = validateKudos(req.body);
      res.json(dataStore.sendKudos(id, toEmployeeId, skillId, message));
    } catch (error) {
      res.status(400).json({ error: validationMessage(error) });
    }
  });

  app.post('/api/employees/:id/rewards/redeem', (req, res) => {
    const { id } = req.params;
    if (!requireEmployeeAccess(req, res, id)) return;
    try {
      const { rewardId } = validateRewardRedemption(req.body);
      res.json(dataStore.redeemReward(id, rewardId));
    } catch (error) {
      res.status(400).json({ error: validationMessage(error) });
    }
  });

  app.get('/api/rewards', (_req, res) => res.json(dataStore.rewardsCatalog));

  app.post('/api/events', (req, res) => {
    if (!requireAdminAccess(req, res)) return;
    try {
      const rawEvent = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
      const event = validateLearningEvent({
        ...rawEvent,
        event_id: typeof rawEvent.event_id === 'string' ? rawEvent.event_id : `EV_HR_${Date.now()}`,
      });
      const created = dataStore.addCustomEvent(event);
      res.status(201).json({ success: true, message: `Event "${created.title}" was created`, event: created });
    } catch (error) {
      res.status(400).json({ error: validationMessage(error) });
    }
  });

  app.use((error: Error & { type?: string }, _req: Request, res: Response, next: express.NextFunction) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' });
    return next(error);
  });

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.resolve(distPath, 'index.html')));
  }

  app.listen(PORT, host, () => {
    console.log(`Server started on http://${host}:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
