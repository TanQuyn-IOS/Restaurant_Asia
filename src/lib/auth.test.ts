import { describe, it, expect } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  DEFAULT_DEMO_PASSWORD,
  authenticateStaffFromSnapshot,
  createSaltedPasswordHash,
  lookupGuestMemberByPhone,
  sha256Hex,
  validateNewPassword,
  verifyPasswordAgainstHash,
} from './auth';

describe('Staff Authentication & RBAC (FR-26)', () => {
  it('computes standard FIPS 180-4 SHA-256 digest', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('authenticates seeded staff accounts with default demo password and maps RBAC role', () => {
    const res = authenticateStaffFromSnapshot(
      INITIAL_DATABASE_SNAPSHOT,
      '  MANAGER.THANG  ',
      DEFAULT_DEMO_PASSWORD,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.role).toBe('Manager');
      expect(res.user.ten_dang_nhap).toBe('manager.thang');
      expect(res.user.ma_nhan_vien).toBe('NV-MGR01');
    }
  });

  it('rejects wrong password or unknown username with generic INVALID_CREDENTIALS', () => {
    const badPwd = authenticateStaffFromSnapshot(INITIAL_DATABASE_SNAPSHOT, 'owner.quyn', 'wrong');
    const badUser = authenticateStaffFromSnapshot(INITIAL_DATABASE_SNAPSHOT, 'nobody', '123456');
    expect(badPwd.ok).toBe(false);
    expect(badUser.ok).toBe(false);
    if (!badPwd.ok && !badUser.ok) {
      expect(badPwd.code).toBe('INVALID_CREDENTIALS');
      expect(badUser.code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('blocks login when account is locked (trang_thai_khoa = true)', () => {
    const snap = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    const cashier = snap.tbl_tai_khoan.find((t) => t.ten_dang_nhap === 'cashier.anh');
    if (cashier) cashier.trang_thai_khoa = true;

    const res = authenticateStaffFromSnapshot(snap, 'cashier.anh', DEFAULT_DEMO_PASSWORD);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('ACCOUNT_LOCKED');
    }
  });

  it('hashes and verifies updated passwords with salted SHA-256', () => {
    const hash = createSaltedPasswordHash('NewPass@2026', 'fixedsalt');
    expect(hash.startsWith('sha256$fixedsalt$')).toBe(true);
    expect(verifyPasswordAgainstHash('NewPass@2026', hash)).toBe(true);
    expect(verifyPasswordAgainstHash('123456', hash)).toBe(false);
  });

  it('validates password change rules cleanly', () => {
    expect(validateNewPassword('123456', '12345', '12345')).toContain('tối thiểu 6');
    expect(validateNewPassword('123456', '123456', '123456')).toContain('khác mật khẩu');
    expect(validateNewPassword('123456', 'newpass', 'mismatch')).toContain('chưa khớp');
    expect(validateNewPassword('123456', 'acrms2026', 'acrms2026')).toBeNull();
  });
});

describe('Guest Optional Phone Member Lookup (FR-04 / FR-05 / FR-06)', () => {
  it('recognizes VIP Diamond guest by formatted phone number without password', () => {
    const res = lookupGuestMemberByPhone(INITIAL_DATABASE_SNAPSHOT, '0988 777-666');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.member.ma_khach_hang).toBe('KH-VIP01');
      expect(res.member.loai_khach).toBe('VIP');
      expect(res.member.hang_the).toBe('Diamond');
      expect(res.member.discountPercent).toBe(15);
    }
  });

  it('recognizes corporate Group member with company name', () => {
    const res = lookupGuestMemberByPhone(INITIAL_DATABASE_SNAPSHOT, '02363888999');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.member.loai_khach).toBe('Doan');
      expect(res.member.companyName).toContain('Á CHÂU');
    }
  });

  it('returns friendly error for invalid or unregistered phone', () => {
    const short = lookupGuestMemberByPhone(INITIAL_DATABASE_SNAPSHOT, '1234');
    const missing = lookupGuestMemberByPhone(INITIAL_DATABASE_SNAPSHOT, '0999888777');
    expect(short.ok).toBe(false);
    expect(missing.ok).toBe(false);
  });
});
