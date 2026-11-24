import crypto from 'node:crypto';
import type { AuthUser } from '../src/lib/auth';
import type { RoleCode } from '../src/types/database';

// ============================================================================
// SERVER-SIDE SIGNED JWT (HMAC-SHA256) & LOGIN RATE LIMITER (09-security-hardening)
// ============================================================================

const DEV_EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 tiếng (1 ca làm việc đầy đủ)

function getSigningSecret(): string {
  return process.env.JWT_SECRET || DEV_EPHEMERAL_SECRET;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}

export interface SignedTokenPayload {
  sub: string;
  username: string;
  ma_nhan_vien: string;
  ho_ten: string;
  role: RoleCode;
  ma_vai_tro: string;
  iat: number;
  exp: number;
}

export function signAuthToken(user: AuthUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload: SignedTokenPayload = {
    sub: user.ma_tai_khoan,
    username: user.ten_dang_nhap,
    ma_nhan_vien: user.ma_nhan_vien,
    ho_ten: user.ho_ten,
    role: user.role,
    ma_vai_tro: user.ma_vai_tro,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(`${header}.${body}`)
    .digest();
  return `${header}.${body}.${base64UrlEncode(sig)}`;
}

export function verifyAuthToken(token: string | undefined | null): AuthUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;

  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', getSigningSecret()).update(`${header}.${body}`).digest(),
  );
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(body)) as SignedTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!parsed.exp || parsed.exp < now) return null;
    if (!parsed.sub || !parsed.role || !parsed.username) return null;

    return {
      ma_tai_khoan: parsed.sub,
      ten_dang_nhap: parsed.username,
      ma_nhan_vien: parsed.ma_nhan_vien,
      ho_ten: parsed.ho_ten,
      role: parsed.role,
      ma_vai_tro: parsed.ma_vai_tro,
    };
  } catch {
    return null;
  }
}

// ── Rate limiter bộ nhớ cho /api/v1/auth/login (tối đa 10 lần sai / 5 phút) ──

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    if (entry) failedAttempts.delete(key);
    return { allowed: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    failedAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearLoginFailures(key: string): void {
  failedAttempts.delete(key);
}
