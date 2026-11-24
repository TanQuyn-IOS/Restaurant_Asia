import type {
  CardTier,
  CustomerGroupType,
  DatabaseSnapshot,
  KhachDoan,
  KhachHang,
  RoleCode,
} from '@/types/database';

// ============================================================================
// AC-RMS — NGHIỆP VỤ XÁC THỰC ĐĂNG NHẬP NHÂN VIÊN (FR-26) & TRA CỨU KHÁCH (FR-05/06)
// ============================================================================

export interface AuthUser {
  ma_tai_khoan: string;
  ten_dang_nhap: string;
  ma_nhan_vien: string;
  ho_ten: string;
  role: RoleCode;
  ma_vai_tro: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string | null;
}

export type AuthErrorCode =
  | 'EMPTY_FIELDS'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ROLE_NOT_FOUND';

export type StaffAuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; code: AuthErrorCode; message: string };

/** Mật khẩu mặc định chỉ áp dụng cho các bản ghi seed chưa đổi mật khẩu ($2b$12$acrms*). */
export const DEFAULT_DEMO_PASSWORD = '123456';

const SEED_HASH_PREFIX = '$2b$12$acrms';
const SHA256_HASH_PREFIX = 'sha256$';

// ── SHA-256 chuẩn FIPS 180-4 (đồng bộ, hoạt động cả trên HTTP LAN lẫn Node/Vitest) ──

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const bitLen = bytes.length * 8;
  const paddedLen = (((bytes.length + 9 + 63) >> 6) << 6);
  const buf = new Uint8Array(paddedLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + s1 + ch + K[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function createSaltedPasswordHash(password: string, explicitSalt?: string): string {
  const salt =
    explicitSalt ??
    (typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`);
  return `${SHA256_HASH_PREFIX}${salt}$${sha256Hex(`${salt}:${password}`)}`;
}

export function verifyPasswordAgainstHash(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  if (storedHash.startsWith(SHA256_HASH_PREFIX)) {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || !parts[1] || !parts[2]) return false;
    const computed = sha256Hex(`${parts[1]}:${password}`);
    return constantTimeEqual(computed, parts[2]);
  }
  if (storedHash.startsWith(SEED_HASH_PREFIX)) {
    return constantTimeEqual(password, DEFAULT_DEMO_PASSWORD);
  }
  return false;
}

/** Xác thực tài khoản nội bộ trên snapshot 27 bảng (kiểm tra khóa tài khoản & ánh xạ RBAC). */
export function authenticateStaffFromSnapshot(
  snapshot: DatabaseSnapshot,
  rawUsername: string,
  password: string,
): StaffAuthResult {
  const username = rawUsername.trim().toLowerCase();
  if (!username || !password) {
    return {
      ok: false,
      code: 'EMPTY_FIELDS',
      message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.',
    };
  }

  const account = snapshot.tbl_tai_khoan.find(
    (tk) => tk.ten_dang_nhap.trim().toLowerCase() === username,
  );
  if (!account) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
    };
  }

  if (account.trang_thai_khoa) {
    return {
      ok: false,
      code: 'ACCOUNT_LOCKED',
      message: 'Tài khoản này đang bị khóa bảo mật. Vui lòng liên hệ Chủ nhà hàng để mở lại.',
    };
  }

  if (!verifyPasswordAgainstHash(password, account.mat_khau_hash)) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
    };
  }

  const roleRow = snapshot.tbl_vai_tro.find((r) => r.ma_vai_tro === account.ma_vai_tro);
  if (!roleRow) {
    return {
      ok: false,
      code: 'ROLE_NOT_FOUND',
      message: 'Tài khoản chưa được gắn vai trò RBAC hợp lệ.',
    };
  }

  const staff = snapshot.tbl_nhan_vien.find((nv) => nv.ma_nhan_vien === account.ma_nhan_vien);
  return {
    ok: true,
    user: {
      ma_tai_khoan: account.ma_tai_khoan,
      ten_dang_nhap: account.ten_dang_nhap,
      ma_nhan_vien: account.ma_nhan_vien,
      ho_ten: staff?.ho_ten ?? account.ten_dang_nhap,
      role: roleRow.ten_vai_tro,
      ma_vai_tro: account.ma_vai_tro,
    },
  };
}

export function validateNewPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (!currentPassword) return 'Vui lòng nhập mật khẩu hiện tại.';
  if (newPassword.length < 6) return 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
  if (newPassword.length > 64) return 'Mật khẩu mới không vượt quá 64 ký tự.';
  if (newPassword === currentPassword) return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  if (newPassword !== confirmPassword) return 'Xác nhận mật khẩu mới chưa khớp.';
  return null;
}

// ── Tra cứu thành viên không cần mật khẩu cho Cổng Khách hàng Mobile QR (FR-04, FR-05, FR-06) ──

export interface GuestMemberProfile {
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string;
  loai_khach: CustomerGroupType;
  hang_the: CardTier;
  diem_tich_luy: number;
  discountPercent: number;
  companyName: string | null;
}

export function getTierDiscountPercent(tier: CardTier): number {
  if (tier === 'Diamond') return 15;
  if (tier === 'Gold') return 10;
  if (tier === 'Silver') return 5;
  return 0;
}

export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function lookupGuestMemberByPhone(
  snapshot: DatabaseSnapshot,
  rawPhone: string,
): { ok: true; member: GuestMemberProfile } | { ok: false; message: string } {
  const digits = normalizePhoneDigits(rawPhone);
  if (digits.length < 9 || digits.length > 11) {
    return {
      ok: false,
      message: 'Số điện thoại cần gồm 9 đến 11 chữ số (ví dụ: 0905123456).',
    };
  }

  const kh: KhachHang | undefined = snapshot.tbl_khach_hang.find(
    (k) => k.so_dien_thoai && normalizePhoneDigits(k.so_dien_thoai) === digits,
  );
  if (!kh || kh.loai_khach === 'VangLai') {
    return {
      ok: false,
      message:
        'Chưa tìm thấy hồ sơ thành viên với SĐT này. Bạn vẫn có thể gọi món bình thường hoặc nhờ phục vụ đăng ký thẻ tại bàn.',
    };
  }

  const doan: KhachDoan | undefined = snapshot.tbl_khach_doan.find(
    (d) => d.ma_khach_hang === kh.ma_khach_hang,
  );

  return {
    ok: true,
    member: {
      ma_khach_hang: kh.ma_khach_hang,
      ho_ten: kh.ho_ten,
      so_dien_thoai: kh.so_dien_thoai ?? digits,
      loai_khach: kh.loai_khach,
      hang_the: kh.hang_the,
      diem_tich_luy: kh.diem_tich_luy,
      discountPercent: getTierDiscountPercent(kh.hang_the),
      companyName: doan?.ten_cong_ty ?? null,
    },
  };
}
