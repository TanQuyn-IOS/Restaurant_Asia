import { describe, it, expect } from 'vitest';
import {
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
  signAuthToken,
  verifyAuthToken,
} from './auth';
import type { AuthUser } from '../src/lib/auth';

const sampleUser: AuthUser = {
  ma_tai_khoan: 'TK-02',
  ten_dang_nhap: 'manager.thang',
  ma_nhan_vien: 'NV-MGR01',
  ho_ten: 'Nguyễn Ngọc Thắng (Quản Lý Sảnh)',
  role: 'Manager',
  ma_vai_tro: 'ROLE-MANAGER',
};

describe('Server Signed JWT & Login Rate Limiting', () => {
  it('signs and verifies a valid HMAC-SHA256 JWT preserving RBAC role', () => {
    const token = signAuthToken(sampleUser);
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAuthToken(token);
    expect(decoded).toEqual(sampleUser);
  });

  it('rejects a tampered JWT payload attempting privilege escalation to Owner', () => {
    const token = signAuthToken(sampleUser);
    const [header, payload, sig] = token.split('.');
    const tampered = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), role: 'Owner' }),
    ).toString('base64url');

    expect(verifyAuthToken(`${header}.${tampered}.${sig}`)).toBeNull();
    expect(verifyAuthToken('not.a.jwt')).toBeNull();
    expect(verifyAuthToken(null)).toBeNull();
  });

  it('blocks brute-force login after 10 failures and resets after clear', () => {
    const key = '127.0.0.1:owner.quyn-test';
    clearLoginFailures(key);
    for (let i = 0; i < 10; i++) {
      expect(checkLoginRateLimit(key).allowed).toBe(true);
      recordLoginFailure(key);
    }
    const blocked = checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);

    clearLoginFailures(key);
    expect(checkLoginRateLimit(key).allowed).toBe(true);
  });
});
