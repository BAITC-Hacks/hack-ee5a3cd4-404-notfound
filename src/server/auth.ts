import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type UserRole = 'admin' | 'employee';

interface ConfiguredUser {
  username: string;
  password: string;
  role: UserRole;
  employeeId?: string;
}

export interface Session {
  username: string;
  role: UserRole;
  employeeId?: string;
  csrfToken: string;
  expiresAt: number;
}

export type AuthenticatedRequest = Request & { session: Session };

const COOKIE_NAME = 'career_quest_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

let cachedConfig: { secret: string; users: ConfiguredUser[]; secureCookies: boolean } | undefined;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getConfig() {
  if (cachedConfig) return cachedConfig;

  const secureCookies = isProduction();
  const secret = process.env.AUTH_SESSION_SECRET;
  let users: ConfiguredUser[];

  if (process.env.APP_AUTH_USERS) {
    try {
      const parsed = JSON.parse(process.env.APP_AUTH_USERS) as unknown;
      if (!Array.isArray(parsed)) throw new Error('APP_AUTH_USERS must be an array');

      users = parsed.map((user) => {
        if (!user || typeof user !== 'object') throw new Error('Invalid user entry');
        const value = user as Record<string, unknown>;
        const username = typeof value.username === 'string' ? value.username.trim() : '';
        const password = typeof value.password === 'string' ? value.password : '';
        const role = value.role === 'admin' || value.role === 'employee' ? value.role : undefined;
        const employeeId = typeof value.employeeId === 'string' ? value.employeeId.trim() : undefined;

        if (!username || !password || !role || (role === 'employee' && !employeeId)) {
          throw new Error('Each user needs username, password, role, and employeeId for employee users');
        }

        return { username, password, role, employeeId };
      });
      if (users.length === 0) throw new Error('At least one user is required');
    } catch (error) {
      throw new Error(`Invalid APP_AUTH_USERS configuration: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  } else if (isProduction()) {
    throw new Error('APP_AUTH_USERS is required in production');
  } else {
    console.warn('APP_AUTH_USERS is not configured. Using local development credentials: admin / local-development-only');
    users = [{ username: 'admin', password: 'local-development-only', role: 'admin' }];
  }

  if (isProduction() && (!secret || secret.length < 32)) {
    throw new Error('AUTH_SESSION_SECRET must be at least 32 characters in production');
  }

  cachedConfig = {
    secret: secret || crypto.randomBytes(32).toString('hex'),
    users,
    secureCookies,
  };
  return cachedConfig;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', getConfig().secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function decodeSession(token: string | undefined): Session | undefined {
  if (!token) return undefined;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return undefined;

  const expectedSignature = crypto
    .createHmac('sha256', getConfig().secret)
    .update(payload)
    .digest('base64url');
  if (!safeEqual(signature, expectedSignature)) return undefined;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
    if (!session || typeof session.username !== 'string' || typeof session.csrfToken !== 'string') return undefined;
    if (session.role !== 'admin' && session.role !== 'employee') return undefined;
    if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return undefined;
    if (session.role === 'employee' && !session.employeeId) return undefined;
    return session;
  } catch {
    return undefined;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  return header
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function setSessionCookie(res: Response, token: string): void {
  const { secureCookies } = getConfig();
  const attributes = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secureCookies) attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

export function clearSessionCookie(res: Response): void {
  const attributes = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (getConfig().secureCookies) attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

export function authenticate(username: string, password: string): Session | undefined {
  const user = getConfig().users.find((candidate) => candidate.username === username);
  if (!user || !safeEqual(password, user.password)) return undefined;

  return {
    username: user.username,
    role: user.role,
    employeeId: user.employeeId,
    csrfToken: crypto.randomBytes(32).toString('base64url'),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

export function verifyAuthConfiguration(): void {
  getConfig();
}

export function startSession(res: Response, session: Session): void {
  setSessionCookie(res, encodeSession(session));
}

export function requireAuthentication(req: Request, res: Response, next: NextFunction): void {
  const session = decodeSession(readCookie(req, COOKIE_NAME));
  if (!session) {
    res.status(401).json({ error: 'Authentication is required' });
    return;
  }
  (req as AuthenticatedRequest).session = session;
  next();
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const session = (req as AuthenticatedRequest).session;
  if (!session || !safeEqual(req.get('X-CSRF-Token') || '', session.csrfToken)) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }
  next();
}

export function getSession(req: Request): Session {
  return (req as AuthenticatedRequest).session;
}

export function canAccessEmployee(req: Request, employeeId: string): boolean {
  const session = getSession(req);
  return session.role === 'admin' || session.employeeId === employeeId;
}

export function isAdmin(req: Request): boolean {
  return getSession(req).role === 'admin';
}

export function loginAllowed(key: string): boolean {
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= Date.now()) return true;
  return entry.count < MAX_LOGIN_ATTEMPTS;
}

export function recordLoginFailure(key: string): void {
  const existing = loginAttempts.get(key);
  if (!existing || existing.resetAt <= Date.now()) {
    loginAttempts.set(key, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    return;
  }
  existing.count += 1;
}

export function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}
