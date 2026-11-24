import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  DatabaseSnapshot,
  RoleCode,
  CustomerGroupType,
  OrderItemStatus,
  PaymentMethodType,
  GuestRequestType,
  LeaveThreeState,
  TingNotification,
  MonAn,
  Ban,
  KhuVuc,
} from '../types/database';
import { INITIAL_DATABASE_SNAPSHOT } from '../data/seedData';
import { playKitchenTingSound } from '../utils/soundNotifier';
import {
  authenticateStaffFromSnapshot,
  createSaltedPasswordHash,
  validateNewPassword,
  verifyPasswordAgainstHash,
  type AuthSession,
  type AuthUser,
} from '../lib/auth';
import {
  applyDetachMergedTable,
  applyTransferOrMergeTable,
  type DetachTableOutcome,
} from '../features/floor/tableSplit';
import { attachTableOriginTag } from '../features/floor/tableOriginTag';

// ============================================================================
// HÀM NGHIỆP VỤ THUẦN KHIẾT (PURE BUSINESS RULES FUNCTIONS — DÙNG CHO UNIT TEST >= 80%)
// ============================================================================

/**
 * RÀNG BUỘC SỐNG CÒN FR-15 & UC-05:
 * Chỉ các món có trạng thái IN ('HoanThanh', 'DaPhucVu') mới được nạp vào tổng tiền hóa đơn!
 */
export function calculateCompletedOrderBill(
  snapshot: DatabaseSnapshot,
  maOrder: string,
): {
  completedItemsCount: number;
  pendingItemsCount: number;
  tongTienMonHoanThanh: number;
  tienCocTru: number;
  tyLeGiamVip: number;
  tienGiamGia: number;
  tienThueVat: number;
  tongTienPhaiTra: number;
} {
  const order = snapshot.tbl_don_goi_mon.find((o) => o.ma_order === maOrder);
  const allItems = snapshot.tbl_chi_tiet_don_goi.filter((i) => i.ma_order === maOrder && i.trang_thai_mon !== 'DaHuy');

  const completedItems = allItems.filter(
    (i) => i.trang_thai_mon === 'HoanThanh' || i.trang_thai_mon === 'DaPhucVu',
  );
  const pendingItems = allItems.filter(
    (i) => i.trang_thai_mon === 'ChoCheBien' || i.trang_thai_mon === 'DangCheBien',
  );

  const tongTienMonHoanThanh = completedItems.reduce(
    (sum, item) => sum + Number(item.don_gia_thoi_diem) * Number(item.so_luong),
    0,
  );

  let tienCocTru = 0;
  if (order?.ma_phieu_dat) {
    const phieuDat = snapshot.tbl_phieu_dat_ban.find((p) => p.ma_phieu_dat === order.ma_phieu_dat);
    if (phieuDat) {
      tienCocTru = Number(phieuDat.tien_dat_coc || 0);
    }
  }

  let tyLeGiamVip = 0;
  if (order?.ma_khach_hang) {
    const kh = snapshot.tbl_khach_hang.find((k) => k.ma_khach_hang === order.ma_khach_hang);
    if (kh) {
      if (kh.hang_the === 'Diamond') tyLeGiamVip = 0.15;
      else if (kh.hang_the === 'Gold') tyLeGiamVip = 0.1;
      else if (kh.hang_the === 'Silver') tyLeGiamVip = 0.05;
    }
  }

  const tienGiamGia = Math.round(tongTienMonHoanThanh * tyLeGiamVip);
  const sauGiam = Math.max(0, tongTienMonHoanThanh - tienGiamGia);
  const tienThueVat = Math.round(sauGiam * 0.08); // Thuế GTGT F&B 8%
  const tongTienPhaiTra = Math.max(0, sauGiam + tienThueVat - tienCocTru);

  return {
    completedItemsCount: completedItems.length,
    pendingItemsCount: pendingItems.length,
    tongTienMonHoanThanh,
    tienCocTru,
    tyLeGiamVip,
    tienGiamGia,
    tienThueVat,
    tongTienPhaiTra,
  };
}

/**
 * FR-11 & UC-03: Kiểm tra quyền hủy món (Chỉ cho phép hủy nếu Bếp chưa bấm 'DangCheBien')
 */
export function canCancelOrderItem(status: OrderItemStatus): { allowed: boolean; reason?: string } {
  if (status === 'ChoCheBien') {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'Món ăn đã được Bếp tiếp nhận chế biến hoặc đã hoàn thành, tuyệt đối không thể hủy!',
  };
}

/**
 * FR-02 & UC-09: Kiểm tra điều kiện bấm nút DELETE giải phóng bàn
 */
export function canReleaseTableWithDeleteButton(
  snapshot: DatabaseSnapshot,
  maBan: string,
): { allowed: boolean; reason?: string } {
  const ban = snapshot.tbl_ban.find((b) => b.ma_ban === maBan);
  if (!ban) return { allowed: false, reason: 'Không tìm thấy mã bàn!' };
  if (ban.trang_thai_ban === 'Trong') {
    return { allowed: false, reason: 'Bàn đang ở trạng thái Bàn trống!' };
  }

  const activeOrder = snapshot.tbl_don_goi_mon.find(
    (o) => o.ma_ban === maBan && o.trang_thai_order !== 'DaGiaiPhong',
  );

  if (activeOrder) {
    const hoaDon = snapshot.tbl_hoa_don.find((h) => h.ma_order === activeOrder.ma_order);
    if (!hoaDon || hoaDon.trang_thai_tt !== 'DaThanhToan') {
      return {
        allowed: false,
        reason: 'Bàn chưa thanh toán hóa đơn hoàn tất, không thể bấm DELETE giải phóng bàn!',
      };
    }
  }

  return { allowed: true };
}

/**
 * FR-17 &FR-19: Kiểm tra quyền RBAC cho các thao tác nhạy cảm
 */
export function verifyRbacPermission(
  role: RoleCode,
  action: 'VIEW_CASHFLOW' | 'MODIFY_INVOICE_ITEMS' | 'IMPORT_INVENTORY',
): { allowed: boolean; statusCode: 200 | 403; message?: string } {
  if (action === 'VIEW_CASHFLOW' || action === 'IMPORT_INVENTORY') {
    if (role !== 'Owner') {
      return {
        allowed: false,
        statusCode: 403,
        message: `[CHẶN BẢO MẬT 403 - FR-19] Vai trò '${role}' bị ẨN HOÀN TOÀN Doanh thu, Sổ quỹ dòng tiền, Lãi/Lỗ và Giá vốn nhập kho!`,
      };
    }
  }

  if (action === 'MODIFY_INVOICE_ITEMS') {
    if (role === 'Cashier') {
      return {
        allowed: false,
        statusCode: 403,
        message: '[CHẶN CHỐNG THẤT THOÁT 403 - FR-17] Giao diện Thu ngân bị khóa cứng ở chế độ Chỉ đọc (Read-only), cấm thêm/sửa/xóa món!',
      };
    }
  }

  return { allowed: true, statusCode: 200 };
}

/**
 * FR-21 & UC-11: Tự động phân loại trạng thái nghỉ phép (ĐÃ NGHỈ - ĐANG NGHỈ - SẮP NGHỈ) theo ngày tham chiếu
 */
export function classifyLeaveThreeState(ngayNghi: string, referenceDate = '2026-11-24'): LeaveThreeState {
  if (ngayNghi < referenceDate) return 'DaNghi';
  if (ngayNghi === referenceDate) return 'DangNghi';
  return 'SapNghi';
}

// ============================================================================
// ZUSTAND STORE & SOCKET.IO / BROADCAST-CHANNEL REALTIME ENGINE
// ============================================================================

const STORAGE_KEY = 'ac_rms_27_tables_snapshot_v1';
const AUTH_STORAGE_KEY = 'ac_rms_auth_session_v2';
let socketClient: Socket | null = null;
let broadcastChannel: BroadcastChannel | null = null;

function loadInitialAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.user?.ma_tai_khoan && parsed?.user?.role && parsed?.user?.ten_dang_nhap) {
      return { user: parsed.user, token: parsed.token ?? null };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function saveAuthSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore storage quota
  }
}

function getStoredAuthToken(): string | null {
  return loadInitialAuthSession()?.token ?? null;
}

function authHeaders(token?: string | null): Record<string, string> {
  const activeToken = token ?? getStoredAuthToken();
  return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
}

function loadInitialSnapshot(): DatabaseSnapshot {
  if (typeof window === 'undefined') return structuredClone(INITIAL_DATABASE_SNAPSHOT);
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DatabaseSnapshot;
      if (parsed?.tbl_ban && parsed?.tbl_mon_an && parsed?.tbl_so_quy_dong_tien) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return structuredClone(INITIAL_DATABASE_SNAPSHOT);
}

export type ActiveModuleTab =
  | 'MOD-01-TABLES'
  | 'MOD-02-CUSTOMERS'
  | 'MOD-03-MENU'
  | 'MOD-04-WAITSTAFF'
  | 'MOD-05-KDS'
  | 'MOD-06-CASHIER'
  | 'MOD-07-HR'
  | 'MOD-08-OWNER'
  | 'MOD-09-QR'
  | 'MOD-10-RBAC';

interface RestaurantStoreState {
  snapshot: DatabaseSnapshot;
  authUser: AuthUser | null;
  authToken: string | null;
  currentRole: RoleCode;
  activeTab: ActiveModuleTab;
  selectedTableId: string;
  qrLockedTableId: string | null;
  tingNotifications: TingNotification[];
  lastBannerAlert: { type: 'success' | 'warning' | 'error'; text: string } | null;
  backendConnected: boolean;
  backendEngineLabel: string;

  // Auth & RBAC Actions (FR-26)
  loginStaff: (
    username: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>;
  logoutStaff: () => void;
  changeOwnPassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  toggleAccountLock: (maTaiKhoan: string) => Promise<void>;
  linkMemberToTableOrder: (maBan: string, maKhachHang: string) => boolean;

  // Actions
  initRealtimeSync: () => Promise<void>;
  setRole: (role: RoleCode) => void;
  setActiveTab: (tab: ActiveModuleTab) => void;
  setSelectedTableId: (maBan: string) => void;
  enterIsolatedQrMode: (maBan: string) => void;
  exitIsolatedQrMode: () => void;
  clearAlert: () => void;
  dismissTingNotification: (id: string) => void;
  resetAllDataToSeed: () => Promise<void>;

  // MOD-01: Quản lý Bàn & Sơ đồ nhà hàng
  addArea: (area: Omit<KhuVuc, 'trang_thai'>) => void;
  addTable: (table: Omit<Ban, 'ma_qr_code' | 'ma_ban_chinh' | 'trang_thai_ban'>) => void;
  createReservation: (payload: {
    ho_ten: string;
    so_dien_thoai: string;
    loai_khach: CustomerGroupType;
    ma_ban: string;
    thoi_gian_den: string;
    so_nguoi: number;
    tien_dat_coc: number;
    ghi_chu_tiec: string;
    ten_cong_ty?: string;
    ma_so_thue?: string;
    dia_chi_cong_ty?: string;
  }) => void;
  openTableSession: (payload: {
    ma_ban: string;
    loai_khach: CustomerGroupType;
    ma_khach_hang?: string | null;
    ma_phieu_dat?: string | null;
    ghep_ban_phu_ids?: string[];
  }) => void;
  transferOrMergeTable: (maBanNguon: string, maBanDich: string, mode: 'transfer' | 'merge') => void;
  detachMergedTable: (childTableId: string) => DetachTableOutcome;
  deleteReleaseTableSession: (maBan: string) => void;

  // MOD-03: Quản lý Thực đơn Châu Á
  toggleDishAvailability: (maMonAn: string, nextState: MonAn['trang_thai_mon']) => void;
  addDishToMenu: (dish: Omit<MonAn, 'ma_mon_an'>) => void;

  // MOD-04 & MOD-09: Gọi món, Hủy món, Nhận món & Chốt Bill
  submitOrderItems: (payload: {
    ma_ban: string;
    nguon_goi: 'Waitstaff' | 'MobileQR';
    items: {
      ma_mon_an: string;
      so_luong: number;
      muc_do_cay_yc: 0 | 1 | 2 | 3;
      ghi_chu_mon: string;
    }[];
  }) => void;
  cancelOrderItemBeforeCooking: (maChiTietOrder: string) => void;
  markDishServedAtTable: (maChiTietOrder: string) => void;
  lockBillAndSendToCashier: (maBan: string) => void;

  // MOD-05: Bếp KDS Realtime
  advanceKdsDishStatus: (maChiTietOrder: string, nextStatus: 'DangCheBien' | 'HoanThanh') => void;

  // MOD-06: Thu ngân Read-Only & Thanh toán
  attemptIllegalCashierModification: () => void;
  processReadOnlyInvoicePayment: (payload: {
    ma_hoa_don: string;
    phuong_thuc: PaymentMethodType;
    so_tien_nhan: number;
    xuat_vat: boolean;
    ma_so_thue_vat?: string;
    ten_cong_ty_vat?: string;
  }) => void;

  // MOD-07: Nhân sự Ca kíp & Nghỉ phép 3 trạng thái
  assignStaffShift: (payload: {
    ma_nhan_vien: string;
    ma_ca: string;
    ngay_lam_viec: string;
    ma_khu_vuc_truc: string;
  }) => void;
  submitLeaveRequest: (payload: {
    ma_nhan_vien: string;
    ngay_nghi: string;
    ma_ca_nghi: string;
    ly_do: string;
    ma_nv_thay_ca: string;
  }) => void;
  approveOrRejectLeave: (maDonNghi: string, decision: 'DaDuyet' | 'TuChoi') => void;
  toggleShiftCheckInOut: (maPhanCong: string) => void;

  // MOD-08: Sổ quỹ Dòng tiền & Nhập kho Nguyên liệu (Độc quyền Chủ)
  createWarehouseImportOrder: (payload: {
    ma_nha_cung_cap: string;
    ma_nguyen_lieu: string;
    so_luong_nhap: number;
    don_gia_nhap: number;
    han_su_dung_lo: string;
    tien_da_thanh_toan: number;
    hinh_thuc_quy: 'TienMat' | 'TaiKhoanNganHang';
  }) => void;

  // MOD-09: Yêu cầu hỗ trợ từ Mobile QR
  sendGuestQrSupportRequest: (maBan: string, loaiYeuCau: GuestRequestType, ghiChu?: string) => void;
  resolveGuestQrRequest: (maYeuCau: string) => void;
}

function broadcastAndPersist(
  nextSnapshot: DatabaseSnapshot,
  actionType: string,
  tingAlert?: TingNotification,
) {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshot));
    } catch {
      // ignore storage quota
    }
  }
  if (broadcastChannel) {
    broadcastChannel.postMessage({ snapshot: nextSnapshot, actionType, tingAlert });
  }
  if (socketClient && socketClient.connected) {
    socketClient.emit('acrms:push_update', { snapshot: nextSnapshot, actionType, tingAlert });
  } else if (typeof window !== 'undefined') {
    fetch('/api/v1/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ snapshot: nextSnapshot, actionType, tingAlert }),
    }).catch(() => { });
  }
}

const INITIAL_AUTH = loadInitialAuthSession();

export const useRestaurantStore = create<RestaurantStoreState>((set, get) => ({
  snapshot: loadInitialSnapshot(),
  authUser: INITIAL_AUTH?.user ?? null,
  authToken: INITIAL_AUTH?.token ?? null,
  currentRole: INITIAL_AUTH?.user.role ?? 'Waitstaff',
  activeTab: 'MOD-01-TABLES',
  selectedTableId: 'B-101',
  qrLockedTableId: null,
  tingNotifications: [
    {
      id: 'TING-INIT-1',
      ma_ban: 'VIP-01',
      ten_ban: 'Phòng VIP 01 (Hoàng Kim)',
      ten_mon_an: 'Thuyền Sashimi Cá Hồi & Cá Ngừ Đại Dương',
      thoi_gian: '17:44:00',
      da_doc: false,
    },
  ],
  lastBannerAlert: null,
  backendConnected: false,
  backendEngineLabel: 'Hybrid MySQL 3NF (27 Tables)',

  initRealtimeSync: async () => {
    if (typeof window === 'undefined') return;

    // 1. Cross-Tab BroadcastChannel
    if ('BroadcastChannel' in window && !broadcastChannel) {
      broadcastChannel = new BroadcastChannel('ac_rms_realtime_bus');
      broadcastChannel.onmessage = (event) => {
        const { snapshot, tingAlert } = event.data || {};
        if (snapshot?.tbl_ban) {
          if (tingAlert) {
            playKitchenTingSound();
            set((state) => ({
              snapshot,
              tingNotifications: [tingAlert, ...state.tingNotifications],
              lastBannerAlert: {
                type: 'success',
                text: `🔔 TING! Bếp vừa hoàn thành món "${tingAlert.ten_mon_an}" cho ${tingAlert.ten_ban}!`,
              },
            }));
          } else {
            set({ snapshot });
          }
        }
      };
    }

    // 2. Fetch state from Node.js Express + MySQL Backend
    try {
      const token = get().authToken;
      const res = await fetch('/api/v1/state', {
        headers: authHeaders(token),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.tbl_ban) {
          set({
            snapshot: json.data,
            backendConnected: true,
            backendEngineLabel: json.meta?.dbStatus?.engine || 'MySQL 8.0 Server',
          });
        }
      }
    } catch {
      // Backend server not running separately; local store works seamlessly
    }

    // 3. Socket.io Realtime Connection
    if (!socketClient) {
      socketClient = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
      });

      socketClient.on('connect', () => {
        set({ backendConnected: true });
      });

      socketClient.on('acrms:state_updated', (payload: {
        snapshot: DatabaseSnapshot;
        tingAlert?: TingNotification;
      }) => {
        if (payload?.snapshot?.tbl_ban) {
          if (payload.tingAlert) {
            playKitchenTingSound();
            set((state) => ({
              snapshot: payload.snapshot,
              tingNotifications: [payload.tingAlert!, ...state.tingNotifications],
              lastBannerAlert: {
                type: 'success',
                text: `🔔 TING! Bếp vừa hoàn thành món "${payload.tingAlert!.ten_mon_an}" cho ${payload.tingAlert!.ten_ban}!`,
              },
            }));
          } else {
            set({ snapshot: payload.snapshot });
          }
        }
      });
    }
  },

  setRole: (role) => {
    const currentTab = get().activeTab;
    let nextTab: ActiveModuleTab = currentTab;

    // FR-19: Nếu chuyển sang Quản lý sảnh (Manager) mà đang ở trang Dòng tiền Chủ (MOD-08), lập tức chuyển về Sơ đồ bàn
    if (role === 'Manager' && currentTab === 'MOD-08-OWNER') {
      nextTab = 'MOD-01-TABLES';
    } else if (role === 'Waitstaff') {
      nextTab = 'MOD-01-TABLES';
    } else if (role === 'Kitchen') {
      nextTab = 'MOD-05-KDS';
    } else if (role === 'Cashier') {
      nextTab = 'MOD-06-CASHIER';
    } else if (role === 'HR') {
      nextTab = 'MOD-07-HR';
    } else if (role === 'GuestQR') {
      nextTab = 'MOD-09-QR';
    }

    set({
      currentRole: role,
      activeTab: nextTab,
      qrLockedTableId: role === 'GuestQR' ? get().selectedTableId : null,
      lastBannerAlert: {
        type: 'success',
        text: `Đã chuyển phiên làm việc sang vai trò: ${role}`,
      },
    });
  },

  setActiveTab: (tab) => {
    const role = get().currentRole;
    if (tab === 'MOD-08-OWNER' && role !== 'Owner') {
      set({
        lastBannerAlert: {
          type: 'error',
          text: `[CHẶN BẢO MẬT 403 - FR-19] Tài khoản '${role}' bị ẨN HOÀN TOÀN Doanh thu, Sổ quỹ dòng tiền, Lãi/Lỗ và Giá vốn nhập kho! Chỉ Chủ nhà hàng (Owner) được phép truy cập.`,
        },
      });
      return;
    }
    set({ activeTab: tab });
  },

  setSelectedTableId: (maBan) => {
    if (get().qrLockedTableId && get().qrLockedTableId !== maBan) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: '[KHÓA CỨNG BÀN QR - FR-25] Giao diện khách hàng quét mã QR đã khóa cố định theo bàn, không được phép tự đổi sang bàn khác!',
        },
      });
      return;
    }
    set({ selectedTableId: maBan });
  },

  enterIsolatedQrMode: (maBan) => {
    set({
      currentRole: 'GuestQR',
      activeTab: 'MOD-09-QR',
      selectedTableId: maBan,
      qrLockedTableId: maBan,
      lastBannerAlert: {
        type: 'success',
        text: `Đã mở Cổng Khách Hàng Mobile QR độc lập tại ${maBan} (Khóa đổi bàn & Ẩn hoàn toàn nút đăng nhập nhân viên).`,
      },
    });
  },

  exitIsolatedQrMode: () => {
    set({
      currentRole: 'Waitstaff',
      activeTab: 'MOD-01-TABLES',
      qrLockedTableId: null,
    });
  },

  clearAlert: () => set({ lastBannerAlert: null }),

  dismissTingNotification: (id) =>
    set((state) => ({
      tingNotifications: state.tingNotifications.map((n) =>
        n.id === id ? { ...n, da_doc: true } : n,
      ),
    })),

  // ── MOD-10: Xác thực Đăng nhập nhân viên, Đổi mật khẩu & Khóa tài khoản (FR-26) ──
  loginStaff: async (username, password) => {
    // 1. Thử xác thực qua Backend Express (trả về JWT ký số HMAC-SHA256)
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = (await res.json()) as {
          data?: { token: string; user: AuthUser };
          error?: { message?: string };
        };
        if (res.ok && json.data?.user) {
          const { token, user } = json.data;
          saveAuthSession({ user, token });
          set({
            authUser: user,
            authToken: token,
            currentRole: user.role,
            backendConnected: true,
            lastBannerAlert: {
              type: 'success',
              text: `Xin chào ${user.ho_ten} — đã đăng nhập thành công!`,
            },
          });
          // Tải lại snapshot đúng phạm vi quyền RBAC của tài khoản vừa đăng nhập
          await get().initRealtimeSync();
          return { ok: true, user };
        }
        if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 429) {
          return { ok: false, error: json.error?.message || 'Đăng nhập không thành công.' };
        }
      }
    } catch {
      // Backend không chạy riêng — chuyển sang xác thực cục bộ trên snapshot 27 bảng
    }

    // 2. Fallback cục bộ (khi chạy riêng `npm run dev:client` không kèm server)
    const localResult = authenticateStaffFromSnapshot(get().snapshot, username, password);
    if (!localResult.ok) {
      return { ok: false, error: localResult.message };
    }

    saveAuthSession({ user: localResult.user, token: null });
    set({
      authUser: localResult.user,
      authToken: null,
      currentRole: localResult.user.role,
      lastBannerAlert: {
        type: 'success',
        text: `Xin chào ${localResult.user.ho_ten} — đã đăng nhập thành công!`,
      },
    });
    return { ok: true, user: localResult.user };
  },

  logoutStaff: () => {
    saveAuthSession(null);
    set({
      authUser: null,
      authToken: null,
      currentRole: 'Waitstaff',
      lastBannerAlert: {
        type: 'success',
        text: 'Đã đăng xuất khỏi phiên làm việc an toàn.',
      },
    });
  },

  changeOwnPassword: async (currentPassword, newPassword, confirmPassword) => {
    const authUser = get().authUser;
    if (!authUser) {
      return { ok: false, error: 'Bạn chưa đăng nhập.' };
    }

    const validationErr = validateNewPassword(currentPassword, newPassword, confirmPassword);
    if (validationErr) return { ok: false, error: validationErr };

    const token = get().authToken;
    if (token) {
      try {
        const res = await fetch('/api/v1/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = (await res.json()) as { status?: string; error?: { message?: string } };
          if (!res.ok) {
            return { ok: false, error: json.error?.message || 'Không thể đổi mật khẩu.' };
          }
          set({
            lastBannerAlert: {
              type: 'success',
              text: 'Đã cập nhật mật khẩu mới thành công!',
            },
          });
          return { ok: true };
        }
      } catch {
        // fallback local
      }
    }

    const next = structuredClone(get().snapshot);
    const acc = next.tbl_tai_khoan.find((tk) => tk.ma_tai_khoan === authUser.ma_tai_khoan);
    if (!acc) return { ok: false, error: 'Không tìm thấy tài khoản trong cơ sở dữ liệu.' };
    if (!verifyPasswordAgainstHash(currentPassword, acc.mat_khau_hash)) {
      return { ok: false, error: 'Mật khẩu hiện tại không đúng.' };
    }

    acc.mat_khau_hash = createSaltedPasswordHash(newPassword);
    broadcastAndPersist(next, 'CHANGE_PASSWORD');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: 'Đã cập nhật mật khẩu mới thành công!',
      },
    });
    return { ok: true };
  },

  toggleAccountLock: async (maTaiKhoan) => {
    const { currentRole, authUser, authToken } = get();
    if (currentRole !== 'Owner') {
      set({
        lastBannerAlert: {
          type: 'error',
          text: '[CHẶN BẢO MẬT 403] Chỉ Chủ nhà hàng được phép khóa hoặc mở khóa tài khoản nhân viên.',
        },
      });
      return;
    }
    if (authUser?.ma_tai_khoan === maTaiKhoan) {
      set({
        lastBannerAlert: {
          type: 'warning',
          text: 'Không thể tự khóa tài khoản Chủ nhà hàng đang đăng nhập.',
        },
      });
      return;
    }

    if (authToken) {
      try {
        await fetch(`/api/v1/accounts/${encodeURIComponent(maTaiKhoan)}/toggle-lock`, {
          method: 'POST',
          headers: authHeaders(authToken),
        });
      } catch {
        // fallback local
      }
    }

    const next = structuredClone(get().snapshot);
    const acc = next.tbl_tai_khoan.find((tk) => tk.ma_tai_khoan === maTaiKhoan);
    if (!acc) return;
    acc.trang_thai_khoa = !acc.trang_thai_khoa;
    broadcastAndPersist(next, 'TOGGLE_ACCOUNT_LOCK');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: acc.trang_thai_khoa ? 'warning' : 'success',
        text: acc.trang_thai_khoa
          ? `Đã KHÓA tài khoản "${acc.ten_dang_nhap}" — tài khoản không thể đăng nhập.`
          : `Đã MỞ KHÓA tài khoản "${acc.ten_dang_nhap}".`,
      },
    });
  },

  linkMemberToTableOrder: (maBan, maKhachHang) => {
    const next = structuredClone(get().snapshot);
    const ban = next.tbl_ban.find((b) => b.ma_ban === maBan);
    const effectiveTableId = ban?.ma_ban_chinh || maBan;
    const order = next.tbl_don_goi_mon.find(
      (o) => o.ma_ban === effectiveTableId && o.trang_thai_order === 'DangPhucVu',
    );
    const kh = next.tbl_khach_hang.find((k) => k.ma_khach_hang === maKhachHang);
    if (!order || !kh) return false;

    order.ma_khach_hang = kh.ma_khach_hang;
    order.loai_khach_phien = kh.loai_khach;
    if (kh.loai_khach === 'VIP') {
      order.vip_flag = true;
    }
    broadcastAndPersist(next, 'LINK_QR_MEMBER');
    set({ snapshot: next });
    return true;
  },

  resetAllDataToSeed: async () => {
    const fresh = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    broadcastAndPersist(fresh, 'RESET_SEED');
    try {
      await fetch('/api/v1/reset', {
        method: 'POST',
        headers: authHeaders(get().authToken),
      });
    } catch {
      // ignore if offline
    }
    set({
      snapshot: fresh,
      lastBannerAlert: {
        type: 'success',
        text: 'Đã khôi phục toàn bộ 27 bảng CSDL 3NF về dữ liệu mẫu ban đầu!',
      },
    });
  },

  // ── MOD-01: Thêm khu vực & bàn ──
  addArea: (area) => {
    const next = structuredClone(get().snapshot);
    next.tbl_khu_vuc.push({ ...area, trang_thai: 'HoatDong' });
    broadcastAndPersist(next, 'ADD_AREA');
    set({
      snapshot: next,
      lastBannerAlert: { type: 'success', text: `Đã thêm khu vực sảnh mới: ${area.ten_khu_vuc}` },
    });
  },

  addTable: (table) => {
    const next = structuredClone(get().snapshot);
    const qr = `QR-ACRMS-${table.ma_ban.replace(/[^A-Z0-9]/gi, '')}`;
    next.tbl_ban.push({
      ...table,
      ma_qr_code: qr,
      ma_ban_chinh: null,
      trang_thai_ban: 'Trong',
    });
    broadcastAndPersist(next, 'ADD_TABLE');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã tạo ${table.ten_ban} kèm mã QR cố định: ${qr}`,
      },
    });
  },

  // ── UC-01: Đặt bàn trước & Ghi nhận tiền cọc vào Sổ quỹ Chủ ──
  createReservation: (payload) => {
    const next = structuredClone(get().snapshot);
    const ban = next.tbl_ban.find((b) => b.ma_ban === payload.ma_ban);
    if (!ban || ban.trang_thai_ban !== 'Trong') {
      set({
        lastBannerAlert: {
          type: 'error',
          text: 'Bàn được chọn không ở trạng thái Bàn trống, vui lòng chọn bàn khác!',
        },
      });
      return;
    }

    const maKh = `KH-${Date.now().toString().slice(-5)}`;
    next.tbl_khach_hang.push({
      ma_khach_hang: maKh,
      ho_ten: payload.ho_ten,
      so_dien_thoai: payload.so_dien_thoai,
      email: null,
      loai_khach: payload.loai_khach,
      hang_the: payload.loai_khach === 'VIP' ? 'Gold' : 'Standard',
      diem_tich_luy: 0,
      ngay_tao: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    if (payload.loai_khach === 'Doan') {
      next.tbl_khach_doan.push({
        ma_khach_hang: maKh,
        ten_cong_ty: payload.ten_cong_ty || payload.ho_ten,
        nguoi_dai_dien: payload.ho_ten,
        ma_so_thue: payload.ma_so_thue || '0401999888',
        dia_chi_cong_ty: payload.dia_chi_cong_ty || 'TP. Đà Nẵng',
        email_nhan_hoa_don: 'ketoan@company.vn',
        ghi_chu_hop_dong: payload.ghi_chu_tiec,
      });
    }

    const maPhieu = `PDB-${Date.now().toString().slice(-4)}`;
    next.tbl_phieu_dat_ban.unshift({
      ma_phieu_dat: maPhieu,
      ma_khach_hang: maKh,
      ma_ban: payload.ma_ban,
      thoi_gian_dat: new Date().toISOString().slice(0, 19).replace('T', ' '),
      thoi_gian_den: payload.thoi_gian_den,
      so_nguoi: payload.so_nguoi,
      tien_dat_coc: payload.tien_dat_coc,
      ghi_chu_tiec: payload.ghi_chu_tiec,
      trang_thai_dat: 'DaNhan',
    });

    ban.trang_thai_ban = 'DaDat';

    // Nếu có tiền đặt cọc trước → Tự động ghi bút toán ThuTienCoc vào Sổ quỹ Chủ (tbl_so_quy_dong_tien)
    if (payload.tien_dat_coc > 0) {
      const lastBalance =
        next.tbl_so_quy_dong_tien[next.tbl_so_quy_dong_tien.length - 1]?.so_du_quy_sau_gd ?? 125000000;
      next.tbl_so_quy_dong_tien.push({
        ma_giao_dich_quy: `SQ-COC-${Date.now().toString().slice(-4)}`,
        ngay_ghi_so: new Date().toISOString().slice(0, 19).replace('T', ' '),
        loai_thu_chi: 'ThuTienCoc',
        so_tien: payload.tien_dat_coc,
        hinh_thuc_quy: 'TaiKhoanNganHang',
        ma_chung_tu_goc: maPhieu,
        so_du_quy_sau_gd: Number(lastBalance) + Number(payload.tien_dat_coc),
        dien_giai: `Thu tiền đặt cọc giữ chỗ ${ban.ten_ban} của khách ${payload.ho_ten}`,
      });
    }

    broadcastAndPersist(next, 'CREATE_RESERVATION');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã đặt trước ${ban.ten_ban} (Màu vàng)${payload.tien_dat_coc > 0 ? ` và đồng bộ tiền cọc ${payload.tien_dat_coc.toLocaleString()}đ vào Sổ quỹ Chủ` : ''}!`,
      },
    });
  },

  // ── UC-02: Mở bàn đón khách (Chọn đúng 1 trong 4 nhóm khách & Ghép bàn đoàn) ──
  openTableSession: (payload) => {
    const next = structuredClone(get().snapshot);
    const ban = next.tbl_ban.find((b) => b.ma_ban === payload.ma_ban);
    if (!ban) return;

    if (ban.trang_thai_ban === 'DangPhucVu' || ban.trang_thai_ban === 'ChoThanhToan') {
      set({
        lastBannerAlert: {
          type: 'error',
          text: `${ban.ten_ban} đang có phiên phục vụ mở, không thể mở trùng phiên!`,
        },
      });
      return;
    }

    const maOrder = `ORD-${payload.ma_ban.replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString().slice(-3)}`;
    const isVip = payload.loai_khach === 'VIP' || ban.loai_ban === 'VIP';

    next.tbl_don_goi_mon.push({
      ma_order: maOrder,
      ma_ban: payload.ma_ban,
      ma_phieu_dat: payload.ma_phieu_dat || null,
      ma_khach_hang: payload.ma_khach_hang || null,
      ma_nhan_vien_phuc_vu: 'NV-PV01',
      loai_khach_phien: payload.loai_khach,
      vip_flag: isVip,
      thoi_gian_mo_ban: new Date().toISOString().slice(0, 19).replace('T', ' '),
      trang_thai_order: 'DangPhucVu',
    });

    ban.trang_thai_ban = 'DangPhucVu';

    if (payload.ma_phieu_dat) {
      const phieu = next.tbl_phieu_dat_ban.find((p) => p.ma_phieu_dat === payload.ma_phieu_dat);
      if (phieu) phieu.trang_thai_dat = 'DaDen';
    }

    // Ghép các bàn phụ cho khách đoàn gom chung 1 hóa đơn tổng
    if (payload.ghep_ban_phu_ids && payload.ghep_ban_phu_ids.length > 0) {
      payload.ghep_ban_phu_ids.forEach((subId) => {
        const subTable = next.tbl_ban.find((b) => b.ma_ban === subId);
        if (subTable && subTable.ma_ban !== payload.ma_ban) {
          subTable.ma_ban_chinh = payload.ma_ban;
          subTable.trang_thai_ban = 'DangPhucVu';
        }
      });
    }

    broadcastAndPersist(next, 'OPEN_TABLE');
    set({
      snapshot: next,
      selectedTableId: payload.ma_ban,
      lastBannerAlert: {
        type: 'success',
        text: `Đã mở phiên phục vụ ${maOrder} tại ${ban.ten_ban} (Nhóm khách: ${payload.loai_khach}${isVip ? ' • Gắn cờ ưu tiên VIP Flag' : ''})!`,
      },
    });
  },

  transferOrMergeTable: (maBanNguon, maBanDich, mode) => {
    const result = applyTransferOrMergeTable(get().snapshot, maBanNguon, maBanDich, mode);
    if (!result.ok) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: result.reason,
        },
      });
      return;
    }

    broadcastAndPersist(result.snapshot, 'TRANSFER_OR_MERGE');
    set({
      snapshot: result.snapshot,
      selectedTableId: result.selectedTableId,
      lastBannerAlert: {
        type: 'success',
        text: result.message,
      },
    });
  },

  detachMergedTable: (childTableId) => {
    const result = applyDetachMergedTable(get().snapshot, childTableId);
    if (!result.ok) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: result.reason,
        },
      });
      return result;
    }

    broadcastAndPersist(result.snapshot, 'DETACH_MERGED_TABLE');
    set({
      snapshot: result.snapshot,
      selectedTableId:
        result.kind === 'restored_with_items' ? result.detachedTableId : result.masterTableId,
      lastBannerAlert: {
        type: 'success',
        text: result.message,
      },
    });
    return result;
  },

  // ── UC-09: Nút DELETE giải phóng bàn sau khi khách thanh toán và dọn sạch ──
  deleteReleaseTableSession: (maBan) => {
    const current = get().snapshot;
    const check = canReleaseTableWithDeleteButton(current, maBan);
    if (!check.allowed) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: `[CHẶN NÚT DELETE - FR-02] ${check.reason}`,
        },
      });
      return;
    }

    const next = structuredClone(current);
    const ban = next.tbl_ban.find((b) => b.ma_ban === maBan);
    if (!ban) return;

    const activeOrder = next.tbl_don_goi_mon.find(
      (o) => o.ma_ban === maBan && o.trang_thai_order !== 'DaGiaiPhong',
    );
    if (activeOrder) {
      activeOrder.trang_thai_order = 'DaGiaiPhong';
    }

    // Giải phóng cả các bàn phụ ghép cùng bàn chính này
    next.tbl_ban.forEach((b) => {
      if (b.ma_ban === maBan || b.ma_ban_chinh === maBan) {
        b.trang_thai_ban = 'Trong';
        b.ma_ban_chinh = null;
      }
    });

    broadcastAndPersist(next, 'DELETE_RELEASE_TABLE');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã dọn sạch và bấm DELETE giải phóng ${ban.ten_ban} về trạng thái Bàn trống (Xanh lá) sẵn sàng đón khách mới!`,
      },
    });
  },

  // ── UC-06: Cập nhật Còn món / Hết món Realtime ──
  toggleDishAvailability: (maMonAn, nextState) => {
    const next = structuredClone(get().snapshot);
    const dish = next.tbl_mon_an.find((m) => m.ma_mon_an === maMonAn);
    if (!dish) return;
    dish.trang_thai_mon = nextState;
    broadcastAndPersist(next, 'TOGGLE_DISH_STATUS');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: nextState === 'ConMon' ? 'success' : 'warning',
        text: `Đồng bộ Realtime: Món "${dish.ten_mon_an}" đã chuyển sang trạng thái [${nextState}] trên cả App Phục vụ và Cổng Mobile QR!`,
      },
    });
  },

  addDishToMenu: (dish) => {
    const next = structuredClone(get().snapshot);
    const maMon = `MON-${Date.now().toString().slice(-4)}`;
    next.tbl_mon_an.push({
      ...dish,
      ma_mon_an: maMon,
    });
    broadcastAndPersist(next, 'ADD_DISH');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã thêm món mới "${dish.ten_mon_an}" vào thực đơn Châu Á!`,
      },
    });
  },

  // ── UC-03 & UC-04: Gửi Order gọi món từ Phục vụ hoặc Mobile QR xuống Bếp KDS ──
  submitOrderItems: (payload) => {
    const next = structuredClone(get().snapshot);
    const ban = next.tbl_ban.find((b) => b.ma_ban === payload.ma_ban);
    if (!ban) return;

    const targetTableId = ban.ma_ban_chinh || ban.ma_ban;
    let activeOrder = next.tbl_don_goi_mon.find(
      (o) => o.ma_ban === targetTableId && o.trang_thai_order === 'DangPhucVu',
    );

    if (!activeOrder) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: 'Bàn chưa mở phiên phục vụ hoặc đã chốt Bill chờ thanh toán, không thể gửi thêm món!',
        },
      });
      return;
    }

    const existingItems = next.tbl_chi_tiet_don_goi.filter((i) => i.ma_order === activeOrder!.ma_order);
    const nextLanGoi =
      existingItems.length === 0 ? 1 : Math.max(...existingItems.map((i) => i.lan_goi)) + 1;

    for (const item of payload.items) {
      const mon = next.tbl_mon_an.find((m) => m.ma_mon_an === item.ma_mon_an);
      if (!mon || mon.trang_thai_mon !== 'ConMon') {
        set({
          lastBannerAlert: {
            type: 'error',
            text: `Món "${mon?.ten_mon_an || item.ma_mon_an}" vừa hết nguyên liệu, vui lòng chọn món khác!`,
          },
        });
        return;
      }

      const maChiTiet = `CT-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2, 5)}`;
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const noteWithOrigin = ban.ma_ban_chinh
        ? attachTableOriginTag(item.ghi_chu_mon, ban.ma_ban)
        : item.ghi_chu_mon || null;

      next.tbl_chi_tiet_don_goi.push({
        ma_chi_tiet_order: maChiTiet,
        ma_order: activeOrder.ma_order,
        ma_mon_an: mon.ma_mon_an,
        so_luong: item.so_luong,
        don_gia_thoi_diem: mon.don_gia,
        muc_do_cay_yc: item.muc_do_cay_yc,
        ghi_chu_mon: noteWithOrigin,
        lan_goi: nextLanGoi,
        nguon_goi: payload.nguon_goi,
        thoi_gian_goi: nowStr,
        trang_thai_mon: 'ChoCheBien',
      });

      next.tbl_nhat_ky_bep.push({
        ma_log_bep: `LOG-${maChiTiet}`,
        ma_chi_tiet_order: maChiTiet,
        ma_dau_bep: 'NV-BEP01',
        thoi_gian_tiep_nhan: nowStr,
        thoi_gian_bat_dau: null,
        thoi_gian_hoan_thanh: null,
        trang_thai_che_bien: 'ChoCheBien',
      });
    }

    broadcastAndPersist(next, 'SUBMIT_ORDER_ITEMS');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã đẩy ${payload.items.length} món gọi (Lượt gọi #${nextLanGoi}) xuống màn hình Bếp KDS Realtime!`,
      },
    });
  },

  // ── FR-11: Hủy món khi Bếp chưa bấm 'Đang chế biến' ──
  cancelOrderItemBeforeCooking: (maChiTietOrder) => {
    const next = structuredClone(get().snapshot);
    const item = next.tbl_chi_tiet_don_goi.find((i) => i.ma_chi_tiet_order === maChiTietOrder);
    if (!item) return;

    const check = canCancelOrderItem(item.trang_thai_mon);
    if (!check.allowed) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: `[KHÓA HỦY MÓN - FR-11] ${check.reason}`,
        },
      });
      return;
    }

    item.trang_thai_mon = 'DaHuy';
    broadcastAndPersist(next, 'CANCEL_ORDER_ITEM');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'warning',
        text: 'Đã hủy món chưa chế biến và gỡ khỏi hàng đợi KDS Bếp!',
      },
    });
  },

  markDishServedAtTable: (maChiTietOrder) => {
    const next = structuredClone(get().snapshot);
    const item = next.tbl_chi_tiet_don_goi.find((i) => i.ma_chi_tiet_order === maChiTietOrder);
    if (!item || item.trang_thai_mon !== 'HoanThanh') return;
    item.trang_thai_mon = 'DaPhucVu';
    broadcastAndPersist(next, 'MARK_DISH_SERVED');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: 'Đã xác nhận bưng món phục vụ lên bàn thực khách!',
      },
    });
  },

  // ── UC-05: Điều phối chế biến KDS & Tự động đẩy món Hoàn thành vào Bill + Trừ kho BOM + Chuông Ting ──
  advanceKdsDishStatus: (maChiTietOrder, nextStatus) => {
    const next = structuredClone(get().snapshot);
    const item = next.tbl_chi_tiet_don_goi.find((i) => i.ma_chi_tiet_order === maChiTietOrder);
    if (!item) return;

    const mon = next.tbl_mon_an.find((m) => m.ma_mon_an === item.ma_mon_an);
    const order = next.tbl_don_goi_mon.find((o) => o.ma_order === item.ma_order);
    const ban = next.tbl_ban.find((b) => b.ma_ban === order?.ma_ban);
    const log = next.tbl_nhat_ky_bep.find((l) => l.ma_chi_tiet_order === maChiTietOrder);
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

    item.trang_thai_mon = nextStatus;

    if (nextStatus === 'DangCheBien') {
      if (log) {
        log.thoi_gian_bat_dau = nowStr;
        log.trang_thai_che_bien = 'DangCheBien';
      }
      broadcastAndPersist(next, 'KDS_START_COOKING');
      set({
        snapshot: next,
        lastBannerAlert: {
          type: 'warning',
          text: `Đầu bếp đã nhận nấu món "${mon?.ten_mon_an}" (${ban?.ten_ban}) — Đã khóa quyền hủy món của Phục vụ!`,
        },
      });
      return;
    }

    // Khi Đầu bếp bấm HOÀN THÀNH:
    if (log) {
      log.thoi_gian_hoan_thanh = nowStr;
      log.trang_thai_che_bien = 'HoanThanh';
    }

    // 1. Tự động trừ tồn kho nguyên liệu theo bảng định mức BOM (tbl_dinh_muc_mon)
    const boms = next.tbl_dinh_muc_mon.filter((b) => b.ma_mon_an === item.ma_mon_an);
    boms.forEach((bom) => {
      const nl = next.tbl_nguyen_lieu.find((n) => n.ma_nguyen_lieu === bom.ma_nguyen_lieu);
      if (nl) {
        const tieuHao =
          Number(bom.dinh_luong_tieu_hao) *
          Number(item.so_luong) *
          (1 + Number(bom.ty_le_hao_hut || 0) / 100);
        nl.so_luong_ton_kho = Math.max(0, Number((nl.so_luong_ton_kho - tieuHao).toFixed(3)));
      }
    });

    // 2. Phát chuông báo TING cho Phục vụ bàn & Tự động nạp món vào danh sách tính tiền Bill
    playKitchenTingSound();
    const tingAlert: TingNotification = {
      id: `TING-${Date.now()}`,
      ma_ban: ban?.ma_ban || 'B-101',
      ten_ban: ban?.ten_ban || 'Bàn ăn',
      ten_mon_an: `${mon?.ten_mon_an || 'Món ăn'} (x${item.so_luong})`,
      thoi_gian: nowStr.slice(11),
      da_doc: false,
    };

    broadcastAndPersist(next, 'KDS_COMPLETE_DISH', tingAlert);
    set((state) => ({
      snapshot: next,
      tingNotifications: [tingAlert, ...state.tingNotifications],
      lastBannerAlert: {
        type: 'success',
        text: `🔔 TING! Bếp đã bấm HOÀN THÀNH món "${mon?.ten_mon_an}" (${ban?.ten_ban}) → Đã tự động trừ kho BOM và NẠP VÀO BILL TÍNH TIỀN!`,
      },
    }));
  },

  // ── UC-07: Kiểm tra Bill cùng khách tại bàn & Bấm Chốt Bill gửi Thu ngân ──
  lockBillAndSendToCashier: (maBan) => {
    const next = structuredClone(get().snapshot);
    const ban = next.tbl_ban.find((b) => b.ma_ban === maBan);
    if (!ban) return;
    const targetTableId = ban.ma_ban_chinh || ban.ma_ban;

    const order = next.tbl_don_goi_mon.find(
      (o) => o.ma_ban === targetTableId && o.trang_thai_order === 'DangPhucVu',
    );
    if (!order) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: 'Không tìm thấy phiên phục vụ đang mở để chốt Bill!',
        },
      });
      return;
    }

    const billCalc = calculateCompletedOrderBill(next, order.ma_order);
    if (billCalc.completedItemsCount === 0) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: 'Chưa có món ăn nào được Bếp bấm Hoàn thành, không thể chốt Bill tính tiền!',
        },
      });
      return;
    }

    // Hủy các món còn đang chờ chưa nấu nếu khách chốt bill
    next.tbl_chi_tiet_don_goi.forEach((i) => {
      if (i.ma_order === order.ma_order && i.trang_thai_mon === 'ChoCheBien') {
        i.trang_thai_mon = 'DaHuy';
      }
    });

    order.trang_thai_order = 'ChoThanhToan';
    next.tbl_ban.forEach((b) => {
      if (b.ma_ban === targetTableId || b.ma_ban_chinh === targetTableId) {
        b.trang_thai_ban = 'ChoThanhToan';
      }
    });

    const khachDoan = order.ma_khach_hang
      ? next.tbl_khach_doan.find((kd) => kd.ma_khach_hang === order.ma_khach_hang)
      : undefined;

    const existingInvoice = next.tbl_hoa_don.find((h) => h.ma_order === order.ma_order);
    if (!existingInvoice) {
      next.tbl_hoa_don.unshift({
        ma_hoa_don: `HD-${Date.now().toString().slice(-6)}`,
        ma_order: order.ma_order,
        ma_khach_hang: order.ma_khach_hang,
        ma_thu_ngan: 'NV-TN01',
        ngay_lap_hoa_don: new Date().toISOString().slice(0, 19).replace('T', ' '),
        tong_tien_mon: billCalc.tongTienMonHoanThanh,
        tien_giam_gia: billCalc.tienGiamGia,
        tien_coc_tru: billCalc.tienCocTru,
        tien_thue_vat: billCalc.tienThueVat,
        tong_tien_phai_tra: billCalc.tongTienPhaiTra,
        xuat_vat: Boolean(khachDoan),
        ma_so_thue_vat: khachDoan?.ma_so_thue || null,
        ten_cong_ty_vat: khachDoan?.ten_cong_ty || null,
        trang_thai_tt: 'ChoThanhToan',
      });
    }

    broadcastAndPersist(next, 'LOCK_BILL_TO_CASHIER');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã kiểm tra cùng khách và CHỐT BILL bàn ${ban.ten_ban} (Màu cam) chuyển sang quầy Thu ngân ở chế độ CHỈ ĐỌC (Read-Only)!`,
      },
    });
  },

  // ── FR-17: Chốt chặn Thu ngân cố sửa/xóa món ──
  attemptIllegalCashierModification: () => {
    const check = verifyRbacPermission('Cashier', 'MODIFY_INVOICE_ITEMS');
    set({
      lastBannerAlert: {
        type: 'error',
        text: check.message || 'Khóa cứng quyền sửa món tại quầy Thu ngân!',
      },
    });
  },

  // ── UC-08: Thu ngân thanh toán hóa đơn Read-Only, xuất VAT & Ghi ThuHoaDon vào Sổ quỹ Chủ ──
  processReadOnlyInvoicePayment: (payload) => {
    const next = structuredClone(get().snapshot);
    const hoaDon = next.tbl_hoa_don.find((h) => h.ma_hoa_don === payload.ma_hoa_don);
    if (!hoaDon || hoaDon.trang_thai_tt === 'DaThanhToan') return;

    if (payload.so_tien_nhan < hoaDon.tong_tien_phai_tra) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: 'Số tiền khách đưa nhỏ hơn tổng tiền phải trả trên hóa đơn!',
        },
      });
      return;
    }

    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const tienThoi = Math.max(0, payload.so_tien_nhan - hoaDon.tong_tien_phai_tra);
    const maGD = `GD-${Date.now().toString().slice(-6)}`;

    hoaDon.trang_thai_tt = 'DaThanhToan';
    hoaDon.xuat_vat = payload.xuat_vat;
    if (payload.ma_so_thue_vat) hoaDon.ma_so_thue_vat = payload.ma_so_thue_vat;
    if (payload.ten_cong_ty_vat) hoaDon.ten_cong_ty_vat = payload.ten_cong_ty_vat;

    next.tbl_giao_dich_thanh_toan.unshift({
      ma_giao_dich: maGD,
      ma_hoa_don: hoaDon.ma_hoa_don,
      phuong_thuc: payload.phuong_thuc,
      so_tien_nhan: payload.so_tien_nhan,
      tien_thoi: tienThoi,
      ma_tham_chieu_nh:
        payload.phuong_thuc === 'TienMat' ? null : `VIETQR-${Date.now().toString().slice(-5)}`,
      thoi_gian_giao_dich: nowStr,
    });

    const order = next.tbl_don_goi_mon.find((o) => o.ma_order === hoaDon.ma_order);
    if (order) {
      order.trang_thai_order = 'DaThanhToan';
    }

    // Tích điểm thưởng cho khách hàng (1 điểm / 10.000đ)
    if (hoaDon.ma_khach_hang) {
      const kh = next.tbl_khach_hang.find((k) => k.ma_khach_hang === hoaDon.ma_khach_hang);
      if (kh && kh.loai_khach !== 'VangLai') {
        kh.diem_tich_luy += Math.floor(hoaDon.tong_tien_phai_tra / 10000);
      }
    }

    // Tự động ghi bút toán ThuHoaDon vào Sổ quỹ dòng tiền của Chủ nhà hàng
    const lastBalance =
      next.tbl_so_quy_dong_tien[next.tbl_so_quy_dong_tien.length - 1]?.so_du_quy_sau_gd ?? 125000000;
    next.tbl_so_quy_dong_tien.push({
      ma_giao_dich_quy: `SQ-HD-${Date.now().toString().slice(-5)}`,
      ngay_ghi_so: nowStr,
      loai_thu_chi: 'ThuHoaDon',
      so_tien: hoaDon.tong_tien_phai_tra,
      hinh_thuc_quy: payload.phuong_thuc === 'TienMat' ? 'TienMat' : 'TaiKhoanNganHang',
      ma_chung_tu_goc: maGD,
      so_du_quy_sau_gd: Number(lastBalance) + Number(hoaDon.tong_tien_phai_tra),
      dien_giai: `Thu tiền hóa đơn ${hoaDon.ma_hoa_don} (${payload.phuong_thuc})${payload.xuat_vat ? ` • Đã xuất HĐ đỏ VAT MST ${hoaDon.ma_so_thue_vat}` : ''}`,
    });

    broadcastAndPersist(next, 'PAY_INVOICE');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Thanh toán thành công ${hoaDon.ma_hoa_don}! Tiền đã ghi vào Sổ quỹ Chủ. Lưu ý: Bàn vẫn giữ trạng thái chờ Phục vụ dọn sạch và bấm nút DELETE!`,
      },
    });
  },

  // ── UC-10: Phân công ca làm việc chi tiết (Ca nào – Giờ nào – Khu vực nào) ──
  assignStaffShift: (payload) => {
    const next = structuredClone(get().snapshot);
    const conflictLeave = next.tbl_don_nghi_phep.find(
      (np) =>
        np.ma_nhan_vien === payload.ma_nhan_vien &&
        np.ngay_nghi === payload.ngay_lam_viec &&
        np.ma_ca_nghi === payload.ma_ca &&
        np.trang_thai_duyet === 'DaDuyet',
    );
    if (conflictLeave) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: 'Nhân viên này đã có đơn nghỉ phép được duyệt trong ca và ngày đã chọn!',
        },
      });
      return;
    }

    next.tbl_phan_cong_ca.unshift({
      ma_phan_cong: `PC-${Date.now().toString().slice(-5)}`,
      ma_nhan_vien: payload.ma_nhan_vien,
      ma_ca: payload.ma_ca,
      ngay_lam_viec: payload.ngay_lam_viec,
      ma_khu_vuc_truc: payload.ma_khu_vuc_truc,
      gio_check_in: null,
      gio_check_out: null,
      trang_thai_ca: 'ChuaTruc',
    });

    broadcastAndPersist(next, 'ASSIGN_SHIFT');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: 'Đã lưu lịch phân công ca làm việc (Hiển thị rõ Ca nào – Giờ nào – Khu vực nào)!',
      },
    });
  },

  // ── UC-11: Tạo & Duyệt đơn nghỉ phép theo 3 trạng thái (Đã – Đang – Sắp nghỉ) ──
  submitLeaveRequest: (payload) => {
    const next = structuredClone(get().snapshot);
    const trangThaiNghi = classifyLeaveThreeState(payload.ngay_nghi);

    next.tbl_don_nghi_phep.unshift({
      ma_don_nghi: `NP-${Date.now().toString().slice(-4)}`,
      ma_nhan_vien: payload.ma_nhan_vien,
      ngay_nghi: payload.ngay_nghi,
      ma_ca_nghi: payload.ma_ca_nghi,
      ly_do: payload.ly_do,
      ma_nv_thay_ca: payload.ma_nv_thay_ca || null,
      trang_thai_duyet: 'ChoDuyet',
      trang_thai_nghi: trangThaiNghi,
    });

    broadcastAndPersist(next, 'SUBMIT_LEAVE');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã tạo đơn xin nghỉ phép (Nhóm trạng thái: ${trangThaiNghi}) chờ Quản lý/HR phê duyệt!`,
      },
    });
  },

  approveOrRejectLeave: (maDonNghi, decision) => {
    const next = structuredClone(get().snapshot);
    const don = next.tbl_don_nghi_phep.find((d) => d.ma_don_nghi === maDonNghi);
    if (!don) return;

    don.trang_thai_duyet = decision;
    don.trang_thai_nghi = classifyLeaveThreeState(don.ngay_nghi);

    // Nếu phê duyệt và có người trực thay ca → Tự động cập nhật lịch phân ca
    if (decision === 'DaDuyet' && don.ma_nv_thay_ca) {
      const existingShift = next.tbl_phan_cong_ca.find(
        (pc) =>
          pc.ma_nhan_vien === don.ma_nhan_vien &&
          pc.ngay_lam_viec === don.ngay_nghi &&
          pc.ma_ca === don.ma_ca_nghi,
      );
      if (existingShift) {
        existingShift.ma_nhan_vien = don.ma_nv_thay_ca;
      } else {
        next.tbl_phan_cong_ca.unshift({
          ma_phan_cong: `PC-THAY-${Date.now().toString().slice(-4)}`,
          ma_nhan_vien: don.ma_nv_thay_ca,
          ma_ca: don.ma_ca_nghi,
          ngay_lam_viec: don.ngay_nghi,
          ma_khu_vuc_truc: 'KV-T1',
          gio_check_in: null,
          gio_check_out: null,
          trang_thai_ca: 'ChuaTruc',
        });
      }
    }

    broadcastAndPersist(next, 'DECIDE_LEAVE');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: decision === 'DaDuyet' ? 'success' : 'warning',
        text:
          decision === 'DaDuyet'
            ? `Đã PHÊ DUYỆT đơn nghỉ ${don.ma_don_nghi} và tự động gán nhân viên trực thay ca vào lịch trực!`
            : `Đã TỪ CHỐI đơn nghỉ phép ${don.ma_don_nghi}.`,
      },
    });
  },

  toggleShiftCheckInOut: (maPhanCong) => {
    const next = structuredClone(get().snapshot);
    const pc = next.tbl_phan_cong_ca.find((p) => p.ma_phan_cong === maPhanCong);
    if (!pc) return;
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!pc.gio_check_in) {
      pc.gio_check_in = nowStr;
      pc.trang_thai_ca = 'DangTruc';
    } else if (!pc.gio_check_out) {
      pc.gio_check_out = nowStr;
      pc.trang_thai_ca = 'HoanThanh';
    }

    broadcastAndPersist(next, 'CHECK_IN_OUT');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã ghi nhận chấm công ca trực ${pc.ma_phan_cong} lúc ${nowStr.slice(11)}!`,
      },
    });
  },

  // ── UC-12: Lập phiếu nhập kho nguyên liệu & Đồng bộ Sổ quỹ Chủ (Độc quyền Owner) ──
  createWarehouseImportOrder: (payload) => {
    const roleCheck = verifyRbacPermission(get().currentRole, 'IMPORT_INVENTORY');
    if (!roleCheck.allowed) {
      set({
        lastBannerAlert: {
          type: 'error',
          text: roleCheck.message!,
        },
      });
      return;
    }

    const next = structuredClone(get().snapshot);
    const nl = next.tbl_nguyen_lieu.find((n) => n.ma_nguyen_lieu === payload.ma_nguyen_lieu);
    const ncc = next.tbl_nha_cung_cap.find((c) => c.ma_nha_cung_cap === payload.ma_nha_cung_cap);
    if (!nl || !ncc) return;

    const tongTienHang = Math.round(payload.so_luong_nhap * payload.don_gia_nhap);
    const tienDaTT = Math.min(tongTienHang, Math.max(0, payload.tien_da_thanh_toan));
    const tienNoLai = Math.max(0, tongTienHang - tienDaTT);
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const maPN = `PN-${Date.now().toString().slice(-5)}`;

    next.tbl_phieu_nhap_hang.unshift({
      ma_phieu_nhap: maPN,
      ma_nha_cung_cap: ncc.ma_nha_cung_cap,
      ma_nguoi_nhan: 'NV-OWNER',
      ngay_nhap: nowStr,
      tong_tien_hang: tongTienHang,
      tien_da_thanh_toan: tienDaTT,
      tien_no_lai: tienNoLai,
      nguoi_giao_hang: ncc.nguoi_lien_he,
    });

    next.tbl_chi_tiet_phieu_nhap.unshift({
      ma_chi_tiet_nhap: `CTPN-${Date.now().toString().slice(-5)}`,
      ma_phieu_nhap: maPN,
      ma_nguyen_lieu: nl.ma_nguyen_lieu,
      so_luong_nhap: payload.so_luong_nhap,
      don_gia_nhap: payload.don_gia_nhap,
      thanh_tien: tongTienHang,
      han_su_dung_lo: payload.han_su_dung_lo,
    });

    // Cộng tồn kho & tính lại đơn giá bình quân gia quyền
    const oldQty = Number(nl.so_luong_ton_kho);
    const oldPrice = Number(nl.don_gia_nhap_bq);
    const newQty = Number((oldQty + payload.so_luong_nhap).toFixed(3));
    nl.don_gia_nhap_bq =
      newQty > 0
        ? Math.round((oldQty * oldPrice + payload.so_luong_nhap * payload.don_gia_nhap) / newQty)
        : payload.don_gia_nhap;
    nl.so_luong_ton_kho = newQty;
    nl.han_su_dung = payload.han_su_dung_lo;

    // Cập nhật công nợ Nhà cung cấp
    ncc.cong_no_hien_tai = Number(ncc.cong_no_hien_tai) + tienNoLai;

    // Tự động ghi bút toán ChiNhapHang vào Sổ quỹ Chủ nhà hàng
    if (tienDaTT > 0) {
      const lastBalance =
        next.tbl_so_quy_dong_tien[next.tbl_so_quy_dong_tien.length - 1]?.so_du_quy_sau_gd ?? 125000000;
      next.tbl_so_quy_dong_tien.push({
        ma_giao_dich_quy: `SQ-NHAP-${Date.now().toString().slice(-4)}`,
        ngay_ghi_so: nowStr,
        loai_thu_chi: 'ChiNhapHang',
        so_tien: tienDaTT,
        hinh_thuc_quy: payload.hinh_thuc_quy,
        ma_chung_tu_goc: maPN,
        so_du_quy_sau_gd: Number(lastBalance) - tienDaTT,
        dien_giai: `Chi nhập kho ${payload.so_luong_nhap} ${nl.don_vi_tinh} ${nl.ten_nguyen_lieu} (${ncc.ten_nha_cung_cap})`,
      });
    }

    broadcastAndPersist(next, 'CREATE_IMPORT_ORDER');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã duyệt phiếu nhập kho ${maPN}: Cộng +${payload.so_luong_nhap} ${nl.don_vi_tinh} "${nl.ten_nguyen_lieu}", ghi ChiNhapHang vào Sổ quỹ Chủ!`,
      },
    });
  },

  // ── MOD-09: Khách gửi yêu cầu hỗ trợ từ Cổng Mobile QR ──
  sendGuestQrSupportRequest: (maBan, loaiYeuCau, ghiChu) => {
    const next = structuredClone(get().snapshot);
    const ban = next.tbl_ban.find((b) => b.ma_ban === maBan);
    next.tbl_yeu_cau_khach_hang.unshift({
      ma_yeu_cau: `YC-${Date.now().toString().slice(-4)}`,
      ma_ban: maBan,
      loai_yeu_cau: loaiYeuCau,
      ghi_chu_yeu_cau: ghiChu || `Khách tại ${ban?.ten_ban || maBan} bấm nút gọi hỗ trợ qua QR`,
      thoi_gian_gui: new Date().toISOString().slice(0, 19).replace('T', ' '),
      trang_thai_xu_ly: 'ChoXuLy',
    });

    broadcastAndPersist(next, 'GUEST_QR_SUPPORT');
    set({
      snapshot: next,
      lastBannerAlert: {
        type: 'success',
        text: `Đã gửi yêu cầu [${loaiYeuCau}] từ bàn ${ban?.ten_ban || maBan} tới thiết bị Nhân viên phục vụ!`,
      },
    });
  },

  resolveGuestQrRequest: (maYeuCau) => {
    const next = structuredClone(get().snapshot);
    const yc = next.tbl_yeu_cau_khach_hang.find((y) => y.ma_yeu_cau === maYeuCau);
    if (!yc) return;
    yc.trang_thai_xu_ly = 'DaHoanTat';
    broadcastAndPersist(next, 'RESOLVE_QR_SUPPORT');
    set({ snapshot: next });
  },
}));
