import express, { Request, Response, NextFunction } from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import {
  initDatabaseEngine,
  getCurrentSnapshot,
  persistSnapshotToMySql,
  resetDatabaseToSeed,
  getDbConnectionStatus,
  logJson,
} from './db/mysqlPool';
import {
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
  signAuthToken,
  verifyAuthToken,
} from './auth';
import {
  authenticateStaffFromSnapshot,
  createSaltedPasswordHash,
  validateNewPassword,
  verifyPasswordAgainstHash,
  type AuthUser,
} from '../src/lib/auth';
import { DatabaseSnapshot, RoleCode, TingNotification } from '../src/types/database';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));

interface AuthedRequest extends Request {
  requestId?: string;
  authUser?: AuthUser | null;
}

// Structured Correlation ID & Bearer Token Parser Middleware
app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  res.setHeader('x-request-id', requestId);
  req.requestId = requestId;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifyAuthToken(token);
    if (verified) {
      // Kiểm tra tài khoản chưa bị khóa trong snapshot mới nhất
      const acc = getCurrentSnapshot().tbl_tai_khoan.find(
        (tk) => tk.ma_tai_khoan === verified.ma_tai_khoan,
      );
      req.authUser = acc && !acc.trang_thai_khoa ? verified : null;
    } else {
      req.authUser = null;
    }
  } else {
    req.authUser = null;
  }
  next();
});

// ============================================================================
// CHỐT CHẶN BẢO MẬT XÁC THỰC & RBAC TẠI BACKEND API (FR-17, FR-19, FR-26)
// ============================================================================
function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    logJson('WARN', 'Unauthenticated request blocked (401)', {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    });
    res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED_401',
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      },
    });
    return;
  }
  next();
}

function requireRole(allowedRoles: RoleCode[], customErrorMsg?: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED_401',
          message: 'Yêu cầu đăng nhập bằng tài khoản nội bộ để truy cập tài nguyên này.',
        },
      });
      return;
    }

    const userRole = req.authUser.role;
    if (!allowedRoles.includes(userRole)) {
      logJson('WARN', 'RBAC Security Guard blocked unauthorized API call', {
        requestId: req.requestId,
        attemptedRole: userRole,
        username: req.authUser.ten_dang_nhap,
        path: req.path,
        method: req.method,
        allowedRoles,
      });
      res.status(403).json({
        error: {
          code: 'RBAC_FORBIDDEN_403',
          message:
            customErrorMsg ||
            `[CHẶN BẢO MẬT 403] Vai trò '${userRole}' bị từ chối truy cập vào tài nguyên này!`,
        },
      });
      return;
    }
    next();
  };
}

/** Lọc dữ liệu nhạy cảm trên snapshot trước khi trả về client theo đúng vai trò đã xác thực. */
function sanitizeSnapshotForRole(snapshot: DatabaseSnapshot, role: RoleCode | null): DatabaseSnapshot {
  const maskedAccounts = snapshot.tbl_tai_khoan.map((tk) => ({
    ...tk,
    mat_khau_hash: '••••••••',
  }));

  if (role === 'Owner') {
    return {
      ...snapshot,
      tbl_tai_khoan: maskedAccounts,
    };
  }

  if (!role || role === 'GuestQR') {
    // Khách vãng lai / Mobile QR chưa đăng nhập chỉ nhận dữ liệu cần thiết (bàn, menu, order, KDS)
    return {
      ...snapshot,
      tbl_tai_khoan: [],
      tbl_bang_luong: [],
      tbl_so_quy_dong_tien: [],
      tbl_nha_cung_cap: [],
      tbl_phieu_nhap_hang: [],
      tbl_chi_tiet_phieu_nhap: [],
      tbl_nguyen_lieu: snapshot.tbl_nguyen_lieu.map((nl) => ({
        ...nl,
        don_gia_nhap_bq: 0,
      })),
    };
  }

  // Nhân viên nội bộ phi-Chủ (Manager, Waitstaff, Kitchen, Cashier, HR) — FR-19 ẩn toàn bộ tài chính & giá vốn
  return {
    ...snapshot,
    tbl_tai_khoan: role === 'Manager' ? maskedAccounts : [],
    tbl_so_quy_dong_tien: [],
    tbl_nha_cung_cap: [],
    tbl_phieu_nhap_hang: [],
    tbl_chi_tiet_phieu_nhap: [],
    tbl_nguyen_lieu: snapshot.tbl_nguyen_lieu.map((nl) => ({
      ...nl,
      don_gia_nhap_bq: 0,
    })),
  };
}

// 1. Health Check Endpoint (dùng cho Render Health Check)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: getDbConnectionStatus(),
  });
});

// 2. Xác thực Đăng nhập Nhân viên nội bộ (FR-26)
app.post('/api/v1/auth/login', (req: AuthedRequest, res: Response) => {
  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  const clientKey = `${req.ip || 'local'}:${String(username || '').trim().toLowerCase()}`;
  const rate = checkLoginRateLimit(clientKey);
  if (!rate.allowed) {
    logJson('WARN', 'Login rate limit exceeded', { requestId: req.requestId, clientKey });
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED_429',
        message: `Thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${rate.retryAfterSec} giây.`,
      },
    });
    return;
  }

  const result = authenticateStaffFromSnapshot(
    getCurrentSnapshot(),
    String(username ?? ''),
    String(password ?? ''),
  );

  if (!result.ok) {
    recordLoginFailure(clientKey);
    logJson('WARN', 'Staff login rejected', {
      requestId: req.requestId,
      username: String(username ?? '').trim().toLowerCase(),
      code: result.code,
    });
    const status = result.code === 'ACCOUNT_LOCKED' ? 403 : result.code === 'EMPTY_FIELDS' ? 400 : 401;
    res.status(status).json({
      error: { code: result.code, message: result.message },
    });
    return;
  }

  clearLoginFailures(clientKey);
  const token = signAuthToken(result.user);
  logJson('INFO', 'Staff login succeeded', {
    requestId: req.requestId,
    username: result.user.ten_dang_nhap,
    role: result.user.role,
  });

  res.json({
    data: {
      token,
      user: result.user,
    },
  });
});

// 2b. Kiểm tra phiên đăng nhập hiện tại
app.get('/api/v1/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  res.json({ data: { user: req.authUser } });
});

// 2c. Đổi mật khẩu tài khoản đang đăng nhập (FR-26)
app.post('/api/v1/auth/change-password', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = (req.body ?? {}) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const errMsg = validateNewPassword(
    String(currentPassword ?? ''),
    String(newPassword ?? ''),
    String(confirmPassword ?? ''),
  );
  if (errMsg) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errMsg } });
    return;
  }

  const next = structuredClone(getCurrentSnapshot());
  const acc = next.tbl_tai_khoan.find((tk) => tk.ma_tai_khoan === req.authUser?.ma_tai_khoan);
  if (!acc) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản.' } });
    return;
  }

  if (!verifyPasswordAgainstHash(String(currentPassword), acc.mat_khau_hash)) {
    res.status(401).json({
      error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Mật khẩu hiện tại không đúng.' },
    });
    return;
  }

  acc.mat_khau_hash = createSaltedPasswordHash(String(newPassword));
  await persistSnapshotToMySql(next);

  logJson('INFO', 'Staff changed password', {
    requestId: req.requestId,
    username: acc.ten_dang_nhap,
  });
  res.json({ status: 'password_updated' });
});

// 2d. Chủ nhà hàng khóa / mở khóa tài khoản nhân viên (FR-26)
app.post(
  '/api/v1/accounts/:maTaiKhoan/toggle-lock',
  requireRole(['Owner'], 'Chỉ Chủ nhà hàng được phép khóa hoặc mở khóa tài khoản nhân viên.'),
  async (req: AuthedRequest, res: Response) => {
    const { maTaiKhoan } = req.params;
    if (maTaiKhoan === req.authUser?.ma_tai_khoan) {
      res.status(400).json({
        error: { code: 'SELF_LOCK_FORBIDDEN', message: 'Không thể tự khóa tài khoản Chủ nhà hàng đang đăng nhập.' },
      });
      return;
    }

    const next = structuredClone(getCurrentSnapshot());
    const acc = next.tbl_tai_khoan.find((tk) => tk.ma_tai_khoan === maTaiKhoan);
    if (!acc) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy mã tài khoản.' } });
      return;
    }

    acc.trang_thai_khoa = !acc.trang_thai_khoa;
    await persistSnapshotToMySql(next);

    logJson('INFO', 'Owner toggled staff account lock status', {
      requestId: req.requestId,
      targetAccount: acc.ten_dang_nhap,
      locked: acc.trang_thai_khoa,
    });
    res.json({
      data: { ma_tai_khoan: acc.ma_tai_khoan, trang_thai_khoa: acc.trang_thai_khoa },
    });
  },
);

// 3. Lấy Snapshot 27 bảng (Tự động lọc theo quyền RBAC của Bearer Token)
app.get('/api/v1/state', (req: AuthedRequest, res: Response) => {
  const role = req.authUser?.role ?? null;
  const snapshot = getCurrentSnapshot();
  const safeSnapshot = sanitizeSnapshotForRole(snapshot, role);

  res.json({
    data: safeSnapshot,
    meta: {
      role: role ?? 'GuestQR',
      authenticated: Boolean(req.authUser),
      financialHiddenByRbac: role !== 'Owner',
      dbStatus: getDbConnectionStatus(),
    },
  });
});

// 4. API Độc quyền Chủ nhà hàng: Xem Sổ quỹ Dòng tiền & Lãi/Lỗ (Chặn 401/403 - FR-19, FR-23)
app.get(
  '/api/v1/owner/cashflow',
  requireRole(
    ['Owner'],
    '[CHẶN BẢO MẬT 403 - FR-19] Quản lý sảnh và nhân viên bị ẨN HOÀN TOÀN Doanh thu, Dòng tiền, Lãi/Lỗ và Nhập kho! Chỉ Chủ nhà hàng (Owner) được phép truy cập.',
  ),
  (_req: Request, res: Response) => {
    const snapshot = getCurrentSnapshot();
    res.json({
      data: {
        soQuy: snapshot.tbl_so_quy_dong_tien,
        phieuNhap: snapshot.tbl_phieu_nhap_hang,
        hoaDon: snapshot.tbl_hoa_don,
      },
    });
  },
);

// 5. API Kiểm tra chốt chặn Thu ngân Read-only (Chặn 403 nếu Thu ngân gọi API sửa món - FR-17)
app.post(
  '/api/v1/orders/:maOrder/modify-items',
  requireRole(
    ['Waitstaff', 'Manager', 'Owner', 'GuestQR'],
    '[CHẶN CHỐNG THẤT THOÁT 403 - FR-17] Quầy Thu ngân ở chế độ CHỈ ĐỌC (Read-Only)! Tuyệt đối không cho phép Thu ngân tự ý thêm, sửa hoặc xóa món trên hóa đơn.',
  ),
  (_req: Request, res: Response) => {
    res.json({ status: 'allowed' });
  },
);

// 6. Đồng bộ Snapshot 27 bảng xuống MySQL & Broadcast qua Socket.io tới mọi thiết bị
app.post('/api/v1/sync', async (req: AuthedRequest, res: Response) => {
  try {
    const { snapshot, actionType, tingAlert } = req.body as {
      snapshot: DatabaseSnapshot;
      actionType?: string;
      tingAlert?: TingNotification;
    };

    if (!snapshot || !snapshot.tbl_ban) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid 27-table database snapshot payload' },
      });
      return;
    }

    // Bảo vệ các bảng nhạy cảm trên server không bị ghi đè rỗng bởi client phi-Chủ / QR
    const serverCurrent = getCurrentSnapshot();
    const role = req.authUser?.role ?? null;
    const merged: DatabaseSnapshot = {
      ...snapshot,
      tbl_tai_khoan: serverCurrent.tbl_tai_khoan,
      ...(role !== 'Owner'
        ? {
            tbl_so_quy_dong_tien:
              snapshot.tbl_so_quy_dong_tien.length >= serverCurrent.tbl_so_quy_dong_tien.length
                ? snapshot.tbl_so_quy_dong_tien
                : serverCurrent.tbl_so_quy_dong_tien,
            tbl_nha_cung_cap:
              snapshot.tbl_nha_cung_cap.length > 0
                ? snapshot.tbl_nha_cung_cap
                : serverCurrent.tbl_nha_cung_cap,
            tbl_phieu_nhap_hang:
              snapshot.tbl_phieu_nhap_hang.length > 0
                ? snapshot.tbl_phieu_nhap_hang
                : serverCurrent.tbl_phieu_nhap_hang,
            tbl_chi_tiet_phieu_nhap:
              snapshot.tbl_chi_tiet_phieu_nhap.length > 0
                ? snapshot.tbl_chi_tiet_phieu_nhap
                : serverCurrent.tbl_chi_tiet_phieu_nhap,
            tbl_bang_luong:
              snapshot.tbl_bang_luong.length > 0
                ? snapshot.tbl_bang_luong
                : serverCurrent.tbl_bang_luong,
          }
        : {}),
    };

    await persistSnapshotToMySql(merged);

    // Phát sự kiện Realtime qua Socket.io (ẩn mật khẩu băm)
    io.emit('acrms:state_updated', {
      snapshot: {
        ...merged,
        tbl_tai_khoan: merged.tbl_tai_khoan.map((tk) => ({ ...tk, mat_khau_hash: '••••••••' })),
      },
      actionType: actionType || 'SYNC_STATE',
      tingAlert: tingAlert || null,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'synced',
      db: getDbConnectionStatus(),
    });
  } catch (err) {
    logJson('ERROR', 'Failed to sync state on /api/v1/sync', {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Could not persist snapshot' },
    });
  }
});

// 7. Khôi phục dữ liệu mẫu gốc 27 bảng (Độc quyền Chủ nhà hàng)
app.post(
  '/api/v1/reset',
  requireRole(['Owner'], 'Chỉ Chủ nhà hàng được phép khôi phục dữ liệu mẫu hệ thống.'),
  async (_req: Request, res: Response) => {
    const fresh = await resetDatabaseToSeed();
    const safeFresh = sanitizeSnapshotForRole(fresh, 'Owner');
    io.emit('acrms:state_updated', {
      snapshot: safeFresh,
      actionType: 'RESET_SEED_DATA',
      timestamp: new Date().toISOString(),
    });
    res.json({ status: 'reset_complete', data: safeFresh });
  },
);

// ============================================================================
// SOCKET.IO REALTIME HUB (Phục vụ ↔ Bếp KDS ↔ Thu ngân ↔ Mobile QR)
// ============================================================================
io.on('connection', (socket) => {
  socket.on('acrms:push_update', async (payload: {
    snapshot: DatabaseSnapshot;
    actionType?: string;
    tingAlert?: TingNotification;
  }) => {
    if (payload?.snapshot?.tbl_ban) {
      const serverCurrent = getCurrentSnapshot();
      const safeMerge: DatabaseSnapshot = {
        ...payload.snapshot,
        tbl_tai_khoan: serverCurrent.tbl_tai_khoan,
      };
      await persistSnapshotToMySql(safeMerge);
      socket.broadcast.emit('acrms:state_updated', {
        ...payload,
        snapshot: {
          ...safeMerge,
          tbl_tai_khoan: safeMerge.tbl_tai_khoan.map((tk) => ({ ...tk, mat_khau_hash: '••••••••' })),
        },
        timestamp: new Date().toISOString(),
      });
    }
  });
});

// ============================================================================
// PHỤC VỤ GIAO DIỆN REACT BUILD TĨNH TRÊN RENDER (UNIFIED WEB SERVICE)
// ============================================================================
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found' } });
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT || 4000);

initDatabaseEngine().then((dbInfo) => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    logJson('WARN', 'JWT_SECRET is not set in production; using ephemeral per-process secret');
  }
  server.listen(PORT, () => {
    logJson('INFO', `AC-RMS Full-Stack Server (Express + Socket.io + MySQL 3NF) running on port ${PORT}`, {
      port: PORT,
      databaseMode: dbInfo.mode,
      tables: dbInfo.tables,
    });
  });
});
