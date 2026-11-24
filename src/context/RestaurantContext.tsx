import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import {
  AppRole,
  Area,
  CashFlowRecord,
  CustomerType,
  GoodsReceipt,
  LeaveRequest,
  LeaveStatus,
  MenuItem,
  Order,
  OrderItem,
  OrderItemStatus,
  PaymentMethod,
  ReservationInfo,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestType,
  Staff,
  Table,
  TableStatus,
  UserAccount
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AREAS,
  INITIAL_CASH_FLOW,
  INITIAL_COMPLETED_ORDERS,
  INITIAL_GOODS_RECEIPTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_SERVICE_REQUESTS,
  INITIAL_STAFF,
  INITIAL_TABLES
} from '../mockData';
import { CUSTOMER_TYPE_CONFIG } from '../constants/customerTypes';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface RestaurantContextType {
  // Authentication & Account Management
  accounts: UserAccount[];
  currentUser: UserAccount | null;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (username: string, password: string) => { success: boolean; message: string; user?: UserAccount };
  logout: () => void;
  quickLoginAsGuestCustomer: (tableId?: string, customerName?: string) => void;
  switchAccount: (account: UserAccount) => void;
  createAccount: (newAcc: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin'>) => { success: boolean; message: string };
  updateAccount: (id: string, updates: Partial<UserAccount>) => { success: boolean; message: string };
  deleteAccount: (id: string) => { success: boolean; message: string };
  toggleAccountStatus: (id: string) => void;
  resetAccountPassword: (id: string, newPass: string) => void;

  // Role Access Control
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;

  // Customer Table Selection for Diner Self-service
  customerTableId: string;
  setCustomerTableId: (id: string) => void;

  // Service Requests (Gọi phục vụ / Hỗ trợ bàn)
  serviceRequests: ServiceRequest[];
  addServiceRequest: (request: { tableId: string; type: ServiceRequestType; title: string; note?: string }) => void;
  updateServiceRequestStatus: (id: string, status: ServiceRequestStatus, staffName?: string) => void;
  deleteServiceRequest: (id: string) => void;

  // Customer Ordering API
  customerSubmitOrder: (
    tableId: string,
    items: { menuItem: MenuItem; quantity: number; note?: string }[],
    customerName?: string,
    customerPhone?: string,
    customerCount?: number,
    tableNotes?: string
  ) => Order;

  // Areas & Tables
  areas: Area[];
  tables: Table[];
  selectedAreaId: string;
  setSelectedAreaId: (id: string) => void;
  addTable: (table: Omit<Table, 'id'>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  updateTablePosition: (id: string, x: number, y: number) => void;
  alignTablesSymmetrically: (areaId: string) => void;
  updateTableStatus: (id: string, status: TableStatus) => void;
  updateTableCustomerType: (tableId: string, customerType: CustomerType) => void;
  clearTableSession: (tableId: string) => void; // Khách ăn xong bấm delete để giải phóng bàn có chỗ đặt mới
  reserveTable: (id: string, reservation: ReservationInfo) => void;
  cancelReservation: (id: string) => void;
  transferTable: (fromTableId: string, toTableId: string) => void;
  addArea: (name: string, description?: string) => void;
  deleteArea: (id: string) => void;

  // Menu Items
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;

  // Staff & Leave Management
  staffList: Staff[];
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  leaveRequests: LeaveRequest[];
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'createdAt'>) => void;
  updateLeaveRequestStatus: (id: string, status: LeaveStatus) => void;
  deleteLeaveRequest: (id: string) => void;

  // Owner Financials: Goods Receipts & Cash Flow (Chủ: Quản lý dòng tiền, doanh thu, hàng nhập)
  goodsReceipts: GoodsReceipt[];
  addGoodsReceipt: (receipt: Omit<GoodsReceipt, 'id' | 'receiptCode' | 'receivedDate'>) => GoodsReceipt;
  updateGoodsReceiptStatus: (id: string, status: 'paid' | 'pending') => void;
  deleteGoodsReceipt: (id: string) => void;
  cashFlowRecords: CashFlowRecord[];
  addCashFlowRecord: (record: Omit<CashFlowRecord, 'id' | 'date'>) => void;
  deleteCashFlowRecord: (id: string) => void;

  // Orders
  activeOrders: Order[];
  completedOrders: Order[];
  createOrGetOrderForTable: (tableId: string, customerCount?: number, customerName?: string, customerType?: CustomerType) => Order;
  addItemToOrder: (orderId: string, menuItem: MenuItem, quantity: number, note?: string) => void;
  updateOrderItemQuantity: (orderId: string, orderItemId: string, quantity: number) => void;
  removeOrderItem: (orderId: string, orderItemId: string) => void;
  updateOrderItemStatus: (orderId: string, orderItemId: string, status: OrderItemStatus) => void;
  updateOrderDetails: (orderId: string, updates: Partial<Order>) => void;
  checkoutOrder: (orderId: string, paymentMethod: PaymentMethod, discountPercent?: number, taxPercent?: number) => Order | null;
  cancelOrder: (orderId: string) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Utilities
  resetToSampleData: () => void;
  activeOrderCount: number;
  todayRevenue: number;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Accounts Management
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('rest_accounts');
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        // Guarantee all loaded accounts have password '123' as requested
        return parsed.map((acc) => ({ ...acc, password: '123' }));
      } catch (e) {
        console.error('Failed to parse accounts from storage', e);
      }
    }
    return INITIAL_ACCOUNTS.map((acc) => ({ ...acc, password: '123' }));
  });

  // Modal control for Login & Account switching
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Current Logged In User (defaults to null = Guest Customer on initial visit)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('rest_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse current user session', e);
      }
    }
    // Default to Guest Customer when opening the website
    return null;
  });

  // Load from localStorage or initialize with sample data
  const [areas, setAreas] = useState<Area[]>(() => {
    const saved = localStorage.getItem('rest_areas');
    return saved ? JSON.parse(saved) : INITIAL_AREAS;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('rest_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [selectedAreaId, setSelectedAreaId] = useState<string>(() => {
    return areas[0]?.id || 'area-1';
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('rest_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [staffList, setStaffList] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('rest_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [activeOrders, setActiveOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('rest_active_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [completedOrders, setCompletedOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('rest_completed_orders');
    return saved ? JSON.parse(saved) : INITIAL_COMPLETED_ORDERS;
  });

  // Leave Requests State (3 statuses: active [đang], upcoming [sắp], completed [đã])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('rest_leave_requests');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  // Goods Receipts State (Hàng nhập kho cho Chủ)
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => {
    const saved = localStorage.getItem('rest_goods_receipts');
    return saved ? JSON.parse(saved) : INITIAL_GOODS_RECEIPTS;
  });

  // Cash Flow State (Dòng tiền cho Chủ)
  const [cashFlowRecords, setCashFlowRecords] = useState<CashFlowRecord[]>(() => {
    const saved = localStorage.getItem('rest_cash_flow');
    return saved ? JSON.parse(saved) : INITIAL_CASH_FLOW;
  });

  // Role Access Control - Defaults to 'customer' if not logged in
  const [currentRole, setCurrentRoleState] = useState<AppRole>(() => {
    if (currentUser) return currentUser.role;
    const saved = localStorage.getItem('rest_current_role');
    return (saved as AppRole) || 'customer';
  });

  // Synchronize role whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setCurrentRoleState(currentUser.role);
      localStorage.setItem('rest_current_role', currentUser.role);
      localStorage.setItem('rest_current_user', JSON.stringify(currentUser));
      if (currentUser.assignedTableId) {
        setCustomerTableIdState(currentUser.assignedTableId);
      }
    } else {
      localStorage.removeItem('rest_current_user');
      localStorage.setItem('rest_current_role', 'customer');
      setCurrentRoleState('customer');
    }
  }, [currentUser]);

  const setCurrentRole = (role: AppRole) => {
    setCurrentRoleState(role);
    localStorage.setItem('rest_current_role', role);
    const roleLabels: Record<AppRole, string> = {
      admin: 'Chủ nhà hàng / Admin (Toàn quyền)',
      customer: 'Khách hàng / Thực khách gọi món tại bàn',
      hr_manager: 'Quản lý Nhân sự',
      kitchen: 'Quản lý Bếp & Bar (KDS)',
      cashier: 'Thu ngân',
      waiter: 'Nhân viên phục vụ'
    };
    showToast(`Đã chuyển vai trò: ${roleLabels[role]}`, 'info');
  };

  // Customer selected table (for self-service table ordering & support)
  const [customerTableId, setCustomerTableIdState] = useState<string>(() => {
    const saved = localStorage.getItem('rest_customer_table');
    return saved || 't-102';
  });

  const setCustomerTableId = (id: string) => {
    setCustomerTableIdState(id);
    localStorage.setItem('rest_customer_table', id);
  };

  // Service Requests (Gọi phục vụ / Hỗ trợ bàn)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    const saved = localStorage.getItem('rest_service_requests');
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_REQUESTS;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('rest_areas', JSON.stringify(areas));
  }, [areas]);

  useEffect(() => {
    localStorage.setItem('rest_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('rest_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('rest_staff', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('rest_active_orders', JSON.stringify(activeOrders));
  }, [activeOrders]);

  useEffect(() => {
    localStorage.setItem('rest_completed_orders', JSON.stringify(completedOrders));
  }, [completedOrders]);

  useEffect(() => {
    localStorage.setItem('rest_service_requests', JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  useEffect(() => {
    localStorage.setItem('rest_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('rest_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('rest_goods_receipts', JSON.stringify(goodsReceipts));
  }, [goodsReceipts]);

  useEffect(() => {
    localStorage.setItem('rest_cash_flow', JSON.stringify(cashFlowRecords));
  }, [cashFlowRecords]);

  // === TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU VỚI BACKEND THREE-TIER VÀ REAL-TIME SOCKET.IO ===
  useEffect(() => {
    let isMounted = true;

    const syncWithBackend = async () => {
      try {
        const [areasRes, tablesRes, menuRes] = await Promise.all([
          api.tables.getAreas().catch(() => null),
          api.tables.getAll().catch(() => null),
          api.menu.getItems().catch(() => null),
        ]);

        if (!isMounted) return;

        if (areasRes && areasRes.success && areasRes.data && areasRes.data.length > 0) {
          setAreas(
            areasRes.data.map((a: any) => ({
              id: a.id,
              name: a.name,
              description: a.description || undefined,
            }))
          );
        }

        if (tablesRes && tablesRes.success && tablesRes.data && tablesRes.data.length > 0) {
          setTables(
            tablesRes.data.map((t: any) => ({
              id: t.id,
              name: t.name,
              areaId: t.areaId,
              capacity: t.capacity,
              shape: (t.shape || 'square').toLowerCase(),
              status: (t.status || 'available').toLowerCase(),
              x: t.posX || 0,
              y: t.posY || 0,
              width: t.width || 90,
              height: t.height || 90,
              customerType: t.customerType ? (t.customerType.toLowerCase() as any) : undefined,
              currentOrderId: t.orders?.[0]?.id,
              occupiedSince: t.occupiedSince || undefined,
            }))
          );
        }

        if (menuRes && menuRes.success && menuRes.data && menuRes.data.length > 0) {
          setMenuItems(
            menuRes.data.map((m: any) => ({
              id: m.id,
              name: m.name,
              category: m.category?.name || 'Món chính',
              price: Number(m.price),
              cost: Number(m.costPrice || 0),
              unit: m.unit || 'phần',
              description: m.description || '',
              image: m.image || '',
              isAvailable: m.isAvailable ?? true,
              preparationTimeMinutes: m.prepTimeMinutes || 15,
              spicyLevel: (m.spicyLevel || 0) as any,
              isPopular: m.isPopular ?? false,
              tags: m.tags ? m.tags.split(',') : [],
            }))
          );
        }

        // Kết nối Socket.IO
        const socket = socketService.connect();
        socketService.joinRoom('kitchen');
        socketService.joinRoom('cashier');
        socketService.joinRoom('waiter');

        socket.on('table.updated', (event: any) => {
          if (event && event.id) {
            setTables((prev) =>
              prev.map((t) =>
                t.id === event.id
                  ? {
                      ...t,
                      status: (event.status || t.status).toLowerCase(),
                      occupiedSince: event.occupiedSince || t.occupiedSince,
                    }
                  : t
              )
            );
          }
        });

        socket.on('table.transferred', () => {
          api.tables.getAll().then((res) => {
            if (res.success && res.data) {
              setTables(
                res.data.map((t: any) => ({
                  id: t.id,
                  name: t.name,
                  areaId: t.areaId,
                  capacity: t.capacity,
                  shape: (t.shape || 'square').toLowerCase(),
                  status: (t.status || 'available').toLowerCase(),
                  x: t.posX || 0,
                  y: t.posY || 0,
                  width: t.width || 90,
                  height: t.height || 90,
                  customerType: t.customerType ? (t.customerType.toLowerCase() as any) : undefined,
                  currentOrderId: t.orders?.[0]?.id,
                  occupiedSince: t.occupiedSince || undefined,
                }))
              );
            }
          });
        });

        socket.on('order.created', () => {
          api.tables.getAll().then((res) => {
            if (res.success && res.data) {
              setTables(
                res.data.map((t: any) => ({
                  id: t.id,
                  name: t.name,
                  areaId: t.areaId,
                  capacity: t.capacity,
                  shape: (t.shape || 'square').toLowerCase(),
                  status: (t.status || 'available').toLowerCase(),
                  x: t.posX || 0,
                  y: t.posY || 0,
                  width: t.width || 90,
                  height: t.height || 90,
                  customerType: t.customerType ? (t.customerType.toLowerCase() as any) : undefined,
                  currentOrderId: t.orders?.[0]?.id,
                  occupiedSince: t.occupiedSince || undefined,
                }))
              );
            }
          });
        });
      } catch (err) {
        console.warn('Backend chưa sẵn sàng hoặc ngoại tuyến, hệ thống đang dùng bộ đệm cục bộ:', err);
      }
    };

    syncWithBackend();

    return () => {
      isMounted = false;
      socketService.disconnect();
    };
  }, []);

  // Auth & Account Handlers
  const login = (username: string, password: string): { success: boolean; message: string; user?: UserAccount } => {
    const trimmedUser = username.trim().toLowerCase();

    // Kết nối xác thực Backend Three-Tier
    const attemptBackendLogin = async () => {
      let backendPassword = password;
      if (password === '123') {
        if (trimmedUser === 'admin') backendPassword = 'Admin@123';
        else backendPassword = 'Staff@123';
      }

      try {
        const res = await api.auth.login({ username: trimmedUser, password: backendPassword });
        if (res.success && res.data) {
          api.setTokens(res.data.accessToken, res.data.refreshToken);
          socketService.connect(res.data.accessToken);
          console.log('✅ Đã xác thực thành công với Backend API!');
        }
      } catch (e) {
        console.warn('Backend API login skipped or fallback:', e);
      }
    };

    attemptBackendLogin();
    const found = accounts.find((a) => a.username.toLowerCase() === trimmedUser);

    if (!found) {
      return { success: false, message: 'Tên đăng nhập không tồn tại!' };
    }

    if (!found.isActive) {
      return { success: false, message: 'Tài khoản này hiện đang bị khóa. Vui lòng liên hệ Admin!' };
    }

    if (found.password !== password) {
      return { success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại!' };
    }

    const updatedUser: UserAccount = {
      ...found,
      lastLogin: new Date().toISOString()
    };

    // Update lastLogin in accounts list
    setAccounts((prev) => prev.map((a) => (a.id === found.id ? updatedUser : a)));
    setCurrentUser(updatedUser);
    setCurrentRoleState(updatedUser.role);
    setIsLoginModalOpen(false);

    if (updatedUser.assignedTableId) {
      setCustomerTableIdState(updatedUser.assignedTableId);
    }

    showToast(`Đăng nhập thành công! Xin chào ${updatedUser.fullName}`, 'success');
    return { success: true, message: 'Đăng nhập thành công!', user: updatedUser };
  };

  const logout = () => {
    const prevName = currentUser?.fullName || 'Người dùng';
    setCurrentUser(null);
    setCurrentRoleState('customer');
    localStorage.removeItem('rest_current_user');
    localStorage.setItem('rest_current_role', 'customer');
    // Open login modal so staff can easily log in to another account
    setIsLoginModalOpen(true);
    showToast(`Đã đăng xuất tài khoản (${prevName}). Mời đăng nhập tài khoản khác hoặc gọi món với vai trò khách.`, 'info');
  };

  const quickLoginAsGuestCustomer = (tableId: string = 't-102', customerName: string = 'Thực Khách') => {
    const targetTable = tables.find((t) => t.id === tableId);
    setCurrentUser(null);
    setCurrentRoleState('customer');
    setCustomerTableIdState(tableId);
    setIsLoginModalOpen(false);
    showToast(`Đang ở chế độ Thực Khách bàn ${targetTable?.name || tableId}. Quý khách có thể chọn món tự do!`, 'info');
  };

  const switchAccount = (acc: UserAccount) => {
    setCurrentUser(acc);
    setCurrentRoleState(acc.role);
    if (acc.assignedTableId) {
      setCustomerTableIdState(acc.assignedTableId);
    }
    showToast(`Đã chuyển sang tài khoản ${acc.fullName} (${acc.role})`, 'info');
  };

  const createAccount = (
    newAcc: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin'>
  ): { success: boolean; message: string } => {
    const trimmedUser = newAcc.username.trim().toLowerCase();
    if (!trimmedUser) {
      return { success: false, message: 'Tên đăng nhập không được để trống!' };
    }

    if (accounts.some((a) => a.username.toLowerCase() === trimmedUser)) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại! Vui lòng chọn tên khác.' };
    }

    const created: UserAccount = {
      ...newAcc,
      id: `acc-${Date.now()}`,
      username: trimmedUser,
      createdAt: new Date().toISOString()
    };

    setAccounts((prev) => [...prev, created]);
    showToast(`Đã tạo mới tài khoản "${created.username}" thành công!`, 'success');
    return { success: true, message: 'Tạo tài khoản thành công!' };
  };

  const updateAccount = (id: string, updates: Partial<UserAccount>): { success: boolean; message: string } => {
    if (updates.username) {
      const trimmedUser = updates.username.trim().toLowerCase();
      if (accounts.some((a) => a.id !== id && a.username.toLowerCase() === trimmedUser)) {
        return { success: false, message: 'Tên đăng nhập này đã được sử dụng bởi tài khoản khác!' };
      }
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== id) return acc;
        const updated = { ...acc, ...updates };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );

    showToast('Đã cập nhật thông tin tài khoản thành công!', 'success');
    return { success: true, message: 'Cập nhật tài khoản thành công!' };
  };

  const deleteAccount = (id: string): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return { success: false, message: 'Không tìm thấy tài khoản!' };

    if (currentUser?.id === id) {
      return { success: false, message: 'Bạn không thể xóa tài khoản hiện tại đang đăng nhập!' };
    }

    if (target.username === 'admin') {
      return { success: false, message: 'Không thể xóa tài khoản Admin gốc của hệ thống!' };
    }

    setAccounts((prev) => prev.filter((a) => a.id !== id));
    showToast(`Đã xóa tài khoản "${target.username}"!`, 'info');
    return { success: true, message: 'Đã xóa tài khoản thành công!' };
  };

  const toggleAccountStatus = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    if (target.username === 'admin') {
      showToast('Không thể khóa tài khoản Admin gốc!', 'error');
      return;
    }

    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
    showToast(`Đã ${target.isActive ? 'khóa' : 'mở khóa'} tài khoản "${target.username}"!`, 'info');
  };

  const resetAccountPassword = (id: string, newPass: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, password: newPass } : a))
    );
    showToast('Đã đặt lại mật khẩu mới cho tài khoản thành công!', 'success');
  };

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Service Request Handlers
  const addServiceRequest = (req: { tableId: string; type: ServiceRequestType; title: string; note?: string }) => {
    const targetTable = tables.find((t) => t.id === req.tableId);
    const newRequest: ServiceRequest = {
      id: `req-${Date.now().toString().slice(-6)}`,
      tableId: req.tableId,
      tableName: targetTable?.name || `Bàn ${req.tableId}`,
      type: req.type,
      title: req.title,
      note: req.note,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setServiceRequests((prev) => [newRequest, ...prev]);
    showToast(`Đã gửi yêu cầu "${req.title}" tới nhân viên phục vụ!`, 'success');
  };

  const updateServiceRequestStatus = (id: string, status: ServiceRequestStatus, staffName?: string) => {
    setServiceRequests((prev) =>
      prev.map((req) => {
        if (req.id !== id) return req;
        return {
          ...req,
          status,
          staffName: staffName || req.staffName,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : req.resolvedAt
        };
      })
    );
    if (status === 'resolved') {
      showToast('Đã hoàn thành yêu cầu hỗ trợ của khách!', 'info');
    } else if (status === 'attending') {
      showToast('Nhân viên đang đến hỗ trợ khách!', 'info');
    }
  };

  const deleteServiceRequest = (id: string) => {
    setServiceRequests((prev) => prev.filter((r) => r.id !== id));
  };

  // Customer Self-Service Submit Order
  const customerSubmitOrder = (
    tableId: string,
    items: { menuItem: MenuItem; quantity: number; note?: string }[],
    customerName?: string,
    customerPhone?: string,
    customerCount?: number,
    tableNotes?: string
  ): Order => {
    const targetTable = tables.find((t) => t.id === tableId);
    const existingOrder = activeOrders.find((o) => o.tableId === tableId && o.status === 'active');
    
    // Automatically register/remember table for customer
    setCustomerTableIdState(tableId);
    localStorage.setItem('rest_customer_table', tableId);
    
    const newItems: OrderItem[] = items.map((item) => ({
      id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      menuItemId: item.menuItem.id,
      name: item.menuItem.name,
      unit: item.menuItem.unit,
      price: item.menuItem.price,
      quantity: item.quantity,
      note: item.note,
      status: 'pending',
      orderedAt: new Date().toISOString()
    }));

    let updatedOrder: Order;

    if (existingOrder) {
      const mergedItems = [...existingOrder.items];
      newItems.forEach((newItem) => {
        const matchIndex = mergedItems.findIndex(
          (i) => i.menuItemId === newItem.menuItemId && i.note === newItem.note && i.status === 'pending'
        );
        if (matchIndex > -1) {
          mergedItems[matchIndex].quantity += newItem.quantity;
        } else {
          mergedItems.push(newItem);
        }
      });

      const { subtotal, finalTotal } = calculateOrderTotals(
        mergedItems,
        existingOrder.discountPercent,
        existingOrder.taxPercent
      );

      updatedOrder = {
        ...existingOrder,
        items: mergedItems,
        subtotal,
        finalTotal,
        customerName: customerName || existingOrder.customerName,
        customerPhone: customerPhone || existingOrder.customerPhone,
        customerCount: customerCount || existingOrder.customerCount,
        notes: tableNotes || existingOrder.notes
      };

      setActiveOrders((prev) => prev.map((o) => (o.id === existingOrder.id ? updatedOrder : o)));
    } else {
      const area = areas.find((a) => a.id === targetTable?.areaId);
      const code = `#HD-${Math.floor(1000 + Math.random() * 9000)}`;
      const { subtotal, finalTotal } = calculateOrderTotals(newItems, 0, 8);

      updatedOrder = {
        id: `ord-${Date.now()}`,
        code,
        tableId,
        tableName: targetTable?.name || 'Bàn Khách',
        areaName: area?.name || 'Khu vực chính',
        customerName: customerName || 'Khách Gọi Món Trực Tuyến',
        customerPhone: customerPhone || '',
        customerCount: customerCount || targetTable?.capacity || 2,
        items: newItems,
        subtotal,
        discountPercent: 0,
        taxPercent: 8,
        finalTotal,
        status: 'active',
        notes: tableNotes,
        createdAt: new Date().toISOString()
      };

      setActiveOrders((prev) => [updatedOrder, ...prev]);

      // Set table to occupied
      setTables((prev) =>
        prev.map((tbl) =>
          tbl.id === tableId
            ? {
                ...tbl,
                status: 'occupied',
                currentOrderId: updatedOrder.id,
                occupiedSince: new Date().toISOString()
              }
            : tbl
        )
      );
    }

    showToast(`Đăng ký bàn ${targetTable?.name || tableId} & gửi ${items.length} món thành công tới Bếp & Bar!`, 'success');
    return updatedOrder;
  };

  // Reset to default sample data
  const resetToSampleData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCurrentUser(INITIAL_ACCOUNTS[0]);
    setAreas(INITIAL_AREAS);
    setTables(INITIAL_TABLES);
    setSelectedAreaId(INITIAL_AREAS[0].id);
    setMenuItems(INITIAL_MENU_ITEMS);
    setStaffList(INITIAL_STAFF);
    setActiveOrders(INITIAL_ORDERS);
    setCompletedOrders(INITIAL_COMPLETED_ORDERS);
    setServiceRequests(INITIAL_SERVICE_REQUESTS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setGoodsReceipts(INITIAL_GOODS_RECEIPTS);
    setCashFlowRecords(INITIAL_CASH_FLOW);
    setCurrentRoleState('admin');
    showToast('Đã khôi phục dữ liệu mẫu nhà hàng thành công!', 'info');
  };

  // Helper function to auto-calculate symmetrical coordinates for tables in an area
  const calculateSymmetricalTablePositions = (targetTables: Table[]): { id: string; x: number; y: number }[] => {
    const count = targetTables.length;
    if (count === 0) return [];

    let cols = 3;
    if (count <= 2) cols = count;
    else if (count <= 4) cols = 2;
    else if (count <= 6) cols = 3;
    else if (count <= 8) cols = 4;
    else cols = Math.ceil(Math.sqrt(count * 1.25));

    const rows = Math.ceil(count / cols);

    return targetTables.map((tbl, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const itemsInThisRow = Math.min(cols, count - row * cols);

      // Symmetrical X alignment
      let posX = 50;
      if (itemsInThisRow === 1) {
        posX = 50;
      } else if (itemsInThisRow === 2) {
        posX = col === 0 ? 30 : 70;
      } else if (itemsInThisRow === 3) {
        posX = col === 0 ? 20 : col === 1 ? 50 : 80;
      } else if (itemsInThisRow === 4) {
        posX = [15, 38, 62, 85][col];
      } else {
        const step = 70 / (itemsInThisRow - 1);
        posX = Math.round(15 + col * step);
      }

      // Symmetrical Y alignment
      let posY = 50;
      if (rows === 1) {
        posY = 50;
      } else if (rows === 2) {
        posY = row === 0 ? 30 : 70;
      } else if (rows === 3) {
        posY = row === 0 ? 22 : row === 1 ? 50 : 78;
      } else {
        const step = 60 / (rows - 1);
        posY = Math.round(20 + row * step);
      }

      return { id: tbl.id, x: posX, y: posY };
    });
  };

  // Table operations with Auto-Symmetrical Alignment
  const addTable = (tableData: Omit<Table, 'id'>) => {
    const newId = `t-${Date.now().toString().slice(-4)}`;
    const newTable: Table = {
      ...tableData,
      id: newId,
    };
    
    setTables((prev) => {
      const otherTables = prev.filter((t) => t.areaId !== newTable.areaId);
      const areaTables = [...prev.filter((t) => t.areaId === newTable.areaId), newTable];
      const symmetricalCoords = calculateSymmetricalTablePositions(areaTables);
      
      const updatedAreaTables = areaTables.map((tbl) => {
        const match = symmetricalCoords.find((c) => c.id === tbl.id);
        return match ? { ...tbl, x: match.x, y: match.y } : tbl;
      });

      return [...otherTables, ...updatedAreaTables];
    });

    showToast(`Đã thêm ${newTable.name} & tự động căn chỉnh đối xứng sơ đồ!`, 'success');
  };

  const updateTable = (id: string, updates: Partial<Table>) => {
    setTables((prev) =>
      prev.map((tbl) => (tbl.id === id ? { ...tbl, ...updates } : tbl))
    );
    showToast('Đã cập nhật thông tin bàn!');
  };

  const deleteTable = (id: string, force = true) => {
    const target = tables.find((t) => t.id === id);
    if (!target) return;

    // If table has an active pending order, cancel or clean it up
    setActiveOrders((prev) =>
      prev.map((o) =>
        o.tableId === id && o.status === 'active'
          ? { ...o, status: 'cancelled' as const }
          : o
      )
    );

    setTables((prev) => {
      const remaining = prev.filter((tbl) => tbl.id !== id);
      const otherTables = remaining.filter((t) => t.areaId !== target.areaId);
      const areaTables = remaining.filter((t) => t.areaId === target.areaId);
      const symmetricalCoords = calculateSymmetricalTablePositions(areaTables);

      const updatedAreaTables = areaTables.map((tbl) => {
        const match = symmetricalCoords.find((c) => c.id === tbl.id);
        return match ? { ...tbl, x: match.x, y: match.y } : tbl;
      });

      return [...otherTables, ...updatedAreaTables];
    });

    showToast(`Đã xóa ${target?.name || 'bàn'} & tự động căn chỉnh sơ đồ đối xứng!`, 'info');
  };

  const updateTablePosition = (id: string, x: number, y: number) => {
    // Keep inside bounds 10% - 90%
    const clampedX = Math.max(10, Math.min(90, x));
    const clampedY = Math.max(12, Math.min(88, y));
    setTables((prev) =>
      prev.map((tbl) => (tbl.id === id ? { ...tbl, x: clampedX, y: clampedY } : tbl))
    );
  };

  const alignTablesSymmetrically = (areaId: string) => {
    const targetTables = tables.filter((t) => t.areaId === areaId);
    if (targetTables.length === 0) return;

    const updatedPositions = calculateSymmetricalTablePositions(targetTables);

    setTables((prev) =>
      prev.map((tbl) => {
        const match = updatedPositions.find((p) => p.id === tbl.id);
        return match ? { ...tbl, x: match.x, y: match.y } : tbl;
      })
    );
    showToast('Đã căn chỉnh sơ đồ bàn đối xứng hoàn hảo!', 'success');
  };

  const updateTableStatus = (id: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === id) {
          return {
            ...tbl,
            status,
            occupiedSince: status === 'occupied' ? (tbl.occupiedSince || new Date().toISOString()) : undefined,
            currentOrderId: status === 'available' ? undefined : tbl.currentOrderId
          };
        }
        return tbl;
      })
    );
  };

  const updateTableCustomerType = (tableId: string, customerType: CustomerType) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, customerType } : t))
    );
    // Also update active order if exists
    setActiveOrders((prev) =>
      prev.map((o) => {
        if (o.tableId === tableId && o.status === 'active') {
          const defaultDiscount = CUSTOMER_TYPE_CONFIG[customerType]?.defaultDiscount || 0;
          const discountPercent = o.discountPercent === 0 ? defaultDiscount : o.discountPercent;
          const { subtotal, finalTotal } = calculateOrderTotals(o.items, discountPercent, o.taxPercent);
          return { ...o, customerType, discountPercent, subtotal, finalTotal };
        }
        return o;
      })
    );
    const meta = CUSTOMER_TYPE_CONFIG[customerType];
    showToast(`Đã gán phân loại: ${meta.label} (${meta.icon})!`);
  };

  // Khách ăn xong bấm delete để giải phóng bàn có chỗ đặt mới
  const clearTableSession = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    // Archive or clean up active order
    const activeOrder = activeOrders.find((o) => o.tableId === tableId && o.status === 'active');
    if (activeOrder) {
      if (activeOrder.items.length > 0) {
        setCompletedOrders((prev) => [
          { ...activeOrder, status: 'completed', completedAt: new Date().toISOString() },
          ...prev
        ]);
      }
      setActiveOrders((prev) => prev.filter((o) => o.id !== activeOrder.id));
    }

    setTables((prev) =>
      prev.map((tbl) =>
        tbl.id === tableId
          ? {
              ...tbl,
              status: 'available',
              currentOrderId: undefined,
              customerType: undefined,
              occupiedSince: undefined,
              reservation: undefined
            }
          : tbl
      )
    );

    showToast(`Bàn "${table.name}" đã được dọn sạch và sẵn sàng đón khách mới!`, 'success');
  };

  const reserveTable = (id: string, reservation: ReservationInfo) => {
    setTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === id) {
          return {
            ...tbl,
            status: 'reserved',
            reservation
          };
        }
        return tbl;
      })
    );
    showToast(`Đã đặt bàn cho khách ${reservation.customerName} lúc ${reservation.reservationTime}`);
  };

  const cancelReservation = (id: string) => {
    setTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === id) {
          return {
            ...tbl,
            status: 'available',
            reservation: undefined
          };
        }
        return tbl;
      })
    );
    showToast('Đã hủy đặt bàn');
  };

  const transferTable = (fromTableId: string, toTableId: string) => {
    const fromTable = tables.find((t) => t.id === fromTableId);
    const toTable = tables.find((t) => t.id === toTableId);

    if (!fromTable || !toTable) return;
    if (toTable.status === 'occupied') {
      showToast('Bàn đích hiện đang có khách, vui lòng chọn bàn khác!', 'warning');
      return;
    }

    const order = activeOrders.find((o) => o.tableId === fromTableId);

    // Update order reference
    if (order) {
      setActiveOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, tableId: toTableId, tableName: toTable.name, areaName: areas.find((a) => a.id === toTable.areaId)?.name || '' }
            : o
        )
      );
    }

    // Update tables state
    setTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === fromTableId) {
          return {
            ...tbl,
            status: 'cleaning',
            currentOrderId: undefined,
            occupiedSince: undefined
          };
        }
        if (tbl.id === toTableId) {
          return {
            ...tbl,
            status: 'occupied',
            currentOrderId: order?.id,
            occupiedSince: fromTable.occupiedSince || new Date().toISOString()
          };
        }
        return tbl;
      })
    );

    showToast(`Đã chuyển từ ${fromTable.name} sang ${toTable.name} thành công!`);
  };

  const addArea = (name: string, description?: string) => {
    const id = `area-${Date.now().toString().slice(-4)}`;
    setAreas((prev) => [...prev, { id, name, description }]);
    setSelectedAreaId(id);
    showToast(`Đã tạo khu vực "${name}"!`);
  };

  const deleteArea = (id: string) => {
    const hasTables = tables.some((t) => t.areaId === id);
    if (hasTables) {
      showToast('Không thể xóa khu vực đang chứa bàn! Hãy xóa hoặc chuyển bàn sang khu khác.', 'warning');
      return;
    }
    setAreas((prev) => prev.filter((a) => a.id !== id));
    if (selectedAreaId === id) {
      setSelectedAreaId(areas[0]?.id || '');
    }
    showToast('Đã xóa khu vực!');
  };

  // Menu items operations
  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newId = `m-${Date.now().toString().slice(-4)}`;
    const newItem: MenuItem = {
      ...itemData,
      id: newId
    };
    setMenuItems((prev) => [newItem, ...prev]);
    showToast(`Đã thêm món "${newItem.name}" vào thực đơn!`);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    showToast('Đã cập nhật món ăn!');
  };

  const deleteMenuItem = (id: string) => {
    const target = menuItems.find((m) => m.id === id);
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`Đã xóa món "${target?.name || ''}"!`, 'info');
  };

  const toggleItemAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.isAvailable;
          showToast(`Món "${item.name}" đã được chuyển sang: ${next ? 'Còn hàng' : 'Hết hàng'}`, 'info');
          return { ...item, isAvailable: next };
        }
        return item;
      })
    );
  };

  // Staff operations
  const addStaff = (staffData: Omit<Staff, 'id'>) => {
    const newId = `st-${Date.now().toString().slice(-4)}`;
    const newStaff: Staff = {
      ...staffData,
      id: newId,
      ordersHandled: 0
    };
    setStaffList((prev) => [...prev, newStaff]);
    showToast(`Đã thêm nhân viên "${newStaff.name}"!`);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    setStaffList((prev) =>
      prev.map((st) => (st.id === id ? { ...st, ...updates } : st))
    );
    showToast('Đã cập nhật hồ sơ nhân viên!');
  };

  const deleteStaff = (id: string) => {
    const target = staffList.find((s) => s.id === id);
    setStaffList((prev) => prev.filter((st) => st.id !== id));
    showToast(`Đã xóa nhân viên "${target?.name || ''}"!`, 'info');
  };

  // Leave Management Handlers (3 trạng thái: active [đang], upcoming [sắp], completed [đã])
  const addLeaveRequest = (reqData: Omit<LeaveRequest, 'id' | 'createdAt'>) => {
    const newId = `leave-${Date.now()}`;
    const newReq: LeaveRequest = {
      ...reqData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    showToast(`Đã ghi nhận đơn nghỉ phép của nhân viên ${newReq.staffName}!`, 'success');
  };

  const updateLeaveRequestStatus = (id: string, status: LeaveStatus) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    const statusLabels: Record<LeaveStatus, string> = {
      active: 'Đang nghỉ',
      upcoming: 'Sắp nghỉ',
      completed: 'Đã nghỉ xong'
    };
    showToast(`Đã cập nhật trạng thái nghỉ phép: ${statusLabels[status]}`);
  };

  const deleteLeaveRequest = (id: string) => {
    setLeaveRequests((prev) => prev.filter((l) => l.id !== id));
    showToast('Đã xóa đơn nghỉ phép', 'info');
  };

  // Owner Financials: Goods Receipts Handlers (Quản lý hàng nhập)
  const addGoodsReceipt = (receiptData: Omit<GoodsReceipt, 'id' | 'receiptCode' | 'receivedDate'>): GoodsReceipt => {
    const id = `gr-${Date.now()}`;
    const receiptCode = `PNK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReceipt: GoodsReceipt = {
      ...receiptData,
      id,
      receiptCode,
      receivedDate: new Date().toISOString()
    };
    setGoodsReceipts((prev) => [newReceipt, ...prev]);

    // Automatically record outflow in cash flow if paid
    if (newReceipt.paymentStatus === 'paid') {
      const cfId = `cf-${Date.now()}`;
      const cfRecord: CashFlowRecord = {
        id: cfId,
        type: 'outflow',
        category: 'goods_purchase',
        title: `Nhập hàng ${newReceipt.receiptCode} (${newReceipt.supplierName})`,
        amount: newReceipt.totalAmount,
        method: newReceipt.paymentMethod || 'transfer',
        date: new Date().toISOString(),
        referenceCode: newReceipt.receiptCode,
        notes: newReceipt.notes,
        createdBy: newReceipt.createdBy || 'Chủ Quán / Admin'
      };
      setCashFlowRecords((prev) => [cfRecord, ...prev]);
    }

    showToast(`Đã tạo phiếu nhập hàng ${receiptCode} (${newReceipt.totalAmount.toLocaleString('vi-VN')} ₫)!`, 'success');
    return newReceipt;
  };

  const updateGoodsReceiptStatus = (id: string, status: 'paid' | 'pending') => {
    setGoodsReceipts((prev) =>
      prev.map((gr) => {
        if (gr.id === id) {
          if (status === 'paid' && gr.paymentStatus !== 'paid') {
            const cfId = `cf-${Date.now()}`;
            const cfRecord: CashFlowRecord = {
              id: cfId,
              type: 'outflow',
              category: 'goods_purchase',
              title: `Thanh toán phiếu nhập ${gr.receiptCode} (${gr.supplierName})`,
              amount: gr.totalAmount,
              method: gr.paymentMethod || 'transfer',
              date: new Date().toISOString(),
              referenceCode: gr.receiptCode,
              notes: 'Thanh toán công nợ hàng nhập',
              createdBy: 'Chủ Quán / Admin'
            };
            setCashFlowRecords((p) => [cfRecord, ...p]);
          }
          return { ...gr, paymentStatus: status };
        }
        return gr;
      })
    );
    showToast('Đã cập nhật trạng thái thanh toán hàng nhập!');
  };

  const deleteGoodsReceipt = (id: string) => {
    setGoodsReceipts((prev) => prev.filter((gr) => gr.id !== id));
    showToast('Đã xóa phiếu nhập hàng!', 'info');
  };

  // Owner Financials: Cash Flow Handlers (Quản lý dòng tiền)
  const addCashFlowRecord = (record: Omit<CashFlowRecord, 'id' | 'date'>) => {
    const newRecord: CashFlowRecord = {
      ...record,
      id: `cf-${Date.now()}`,
      date: new Date().toISOString()
    };
    setCashFlowRecords((prev) => [newRecord, ...prev]);
    showToast(`Đã ghi sổ dòng tiền: ${newRecord.type === 'inflow' ? '+' : '-'}${newRecord.amount.toLocaleString('vi-VN')} ₫`, 'success');
  };

  const deleteCashFlowRecord = (id: string) => {
    setCashFlowRecords((prev) => prev.filter((c) => c.id !== id));
    showToast('Đã xóa bút toán dòng tiền!', 'info');
  };

  // Order Calculations
  const calculateOrderTotals = (items: OrderItem[], discountPercent: number = 0, taxPercent: number = 8) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const taxAmount = Math.round(((subtotal - discountAmount) * taxPercent) / 100);
    const finalTotal = subtotal - discountAmount + taxAmount;
    return { subtotal, finalTotal };
  };

  // Order operations
  const createOrGetOrderForTable = (
    tableId: string,
    customerCount: number = 2,
    customerName: string = 'Khách Lẻ',
    customerType?: CustomerType
  ): Order => {
    const existingOrder = activeOrders.find((o) => o.tableId === tableId && o.status === 'active');
    if (existingOrder) {
      if (customerType && existingOrder.customerType !== customerType) {
        const defaultDiscount = CUSTOMER_TYPE_CONFIG[customerType]?.defaultDiscount || 0;
        const discountPercent = existingOrder.discountPercent === 0 ? defaultDiscount : existingOrder.discountPercent;
        const { subtotal, finalTotal } = calculateOrderTotals(existingOrder.items, discountPercent, existingOrder.taxPercent);
        const updated = { ...existingOrder, customerType, discountPercent, subtotal, finalTotal };
        setActiveOrders((prev) => prev.map((o) => (o.id === existingOrder.id ? updated : o)));
        return updated;
      }
      return existingOrder;
    }

    const table = tables.find((t) => t.id === tableId);
    const area = areas.find((a) => a.id === table?.areaId);
    const orderId = `ord-${Date.now().toString().slice(-5)}`;
    const orderCode = `#HD-${Math.floor(1000 + Math.random() * 9000)}`;

    const effectiveType = customerType || table?.customerType || table?.reservation?.customerType || 'walk_in';
    const defaultDiscount = CUSTOMER_TYPE_CONFIG[effectiveType]?.defaultDiscount || 0;

    const newOrder: Order = {
      id: orderId,
      code: orderCode,
      tableId,
      tableName: table?.name || 'Bàn',
      areaName: area?.name || '',
      customerType: effectiveType,
      staffName: staffList.find((s) => s.role === 'Phục vụ')?.name || 'Phục vụ',
      customerCount: customerCount || table?.capacity || 2,
      customerName: table?.reservation?.customerName || customerName,
      customerPhone: table?.reservation?.phone,
      items: [],
      subtotal: 0,
      discountPercent: defaultDiscount,
      taxPercent: 8,
      finalTotal: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    setActiveOrders((prev) => [...prev, newOrder]);

    // Update table status to occupied and sync customerType
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'occupied',
              customerType: effectiveType,
              currentOrderId: orderId,
              occupiedSince: new Date().toISOString(),
              reservation: undefined
            }
          : t
      )
    );

    return newOrder;
  };

  const addItemToOrder = (orderId: string, menuItem: MenuItem, quantity: number = 1, note?: string) => {
    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const existingItemIndex = order.items.findIndex(
          (i) => i.menuItemId === menuItem.id && i.note === note && i.status === 'pending'
        );

        let updatedItems: OrderItem[];
        if (existingItemIndex > -1) {
          updatedItems = [...order.items];
          updatedItems[existingItemIndex].quantity += quantity;
        } else {
          const newItem: OrderItem = {
            id: `oi-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 100)}`,
            menuItemId: menuItem.id,
            name: menuItem.name,
            unit: menuItem.unit,
            price: menuItem.price,
            quantity,
            note,
            status: 'pending',
            orderedAt: new Date().toISOString()
          };
          updatedItems = [...order.items, newItem];
        }

        const { subtotal, finalTotal } = calculateOrderTotals(
          updatedItems,
          order.discountPercent,
          order.taxPercent
        );

        return {
          ...order,
          items: updatedItems,
          subtotal,
          finalTotal
        };
      })
    );

    showToast(`Đã thêm ${quantity}x ${menuItem.name} vào đơn!`);
  };

  const updateOrderItemQuantity = (orderId: string, orderItemId: string, quantity: number) => {
    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        let updatedItems: OrderItem[];
        if (quantity <= 0) {
          updatedItems = order.items.filter((i) => i.id !== orderItemId);
        } else {
          updatedItems = order.items.map((i) => (i.id === orderItemId ? { ...i, quantity } : i));
        }

        const { subtotal, finalTotal } = calculateOrderTotals(
          updatedItems,
          order.discountPercent,
          order.taxPercent
        );

        return {
          ...order,
          items: updatedItems,
          subtotal,
          finalTotal
        };
      })
    );
  };

  const removeOrderItem = (orderId: string, orderItemId: string) => {
    updateOrderItemQuantity(orderId, orderItemId, 0);
  };

  const updateOrderItemStatus = (orderId: string, orderItemId: string, status: OrderItemStatus) => {
    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          items: order.items.map((item) =>
            item.id === orderItemId ? { ...item, status } : item
          )
        };
      })
    );
  };

  const updateOrderDetails = (orderId: string, updates: Partial<Order>) => {
    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const merged = { ...order, ...updates };
        const { subtotal, finalTotal } = calculateOrderTotals(
          merged.items,
          merged.discountPercent,
          merged.taxPercent
        );
        return { ...merged, subtotal, finalTotal };
      })
    );
  };

  const checkoutOrder = (
    orderId: string,
    paymentMethod: PaymentMethod = 'cash',
    discountPercent: number = 0,
    taxPercent: number = 8
  ): Order | null => {
    const order = activeOrders.find((o) => o.id === orderId);
    if (!order) return null;

    const { subtotal, finalTotal } = calculateOrderTotals(order.items, discountPercent, taxPercent);

    const completedOrder: Order = {
      ...order,
      discountPercent,
      taxPercent,
      subtotal,
      finalTotal,
      status: 'completed',
      paymentMethod,
      completedAt: new Date().toISOString()
    };

    // Remove from active orders and append to completed
    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    setCompletedOrders((prev) => [completedOrder, ...prev]);

    // Automatically record an inflow in cash flow for Owner
    const cfId = `cf-${Date.now()}`;
    const cfRecord: CashFlowRecord = {
      id: cfId,
      type: 'inflow',
      category: 'revenue_order',
      title: `Thu tiền bàn ${completedOrder.tableName} (${completedOrder.code})`,
      amount: finalTotal,
      method: paymentMethod,
      date: new Date().toISOString(),
      referenceCode: completedOrder.code,
      notes: `Khách: ${completedOrder.customerName || 'Khách Lẻ'} (${completedOrder.customerCount} người) - ${completedOrder.customerType || 'walk_in'}`,
      createdBy: currentUser?.fullName || 'Thu ngân'
    };
    setCashFlowRecords((prev) => [cfRecord, ...prev]);

    // Free up table and mark as cleaning
    setTables((prev) =>
      prev.map((tbl) =>
        tbl.id === order.tableId
          ? {
              ...tbl,
              status: 'cleaning',
              currentOrderId: undefined,
              occupiedSince: undefined
            }
          : tbl
      )
    );

    showToast(`Thanh toán thành công đơn ${completedOrder.code} (${finalTotal.toLocaleString('vi-VN')} ₫)!`);
    return completedOrder;
  };

  const cancelOrder = (orderId: string) => {
    const order = activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));

    if (order.tableId) {
      setTables((prev) =>
        prev.map((tbl) =>
          tbl.id === order.tableId
            ? {
                ...tbl,
                status: 'available',
                currentOrderId: undefined,
                occupiedSince: undefined
              }
            : tbl
        )
      );
    }

    showToast(`Đã hủy đơn ${order.code}!`, 'info');
  };

  const activeOrderCount = activeOrders.length;
  const todayRevenue = completedOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);

  return (
    <RestaurantContext.Provider
      value={{
        accounts,
        currentUser,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        setIsLoginModalOpen,
        login,
        logout,
        quickLoginAsGuestCustomer,
        switchAccount,
        createAccount,
        updateAccount,
        deleteAccount,
        toggleAccountStatus,
        resetAccountPassword,
        currentRole,
        setCurrentRole,
        customerTableId,
        setCustomerTableId,
        serviceRequests,
        addServiceRequest,
        updateServiceRequestStatus,
        deleteServiceRequest,
        customerSubmitOrder,
        areas,
        tables,
        selectedAreaId,
        setSelectedAreaId,
        addTable,
        updateTable,
        deleteTable,
        updateTablePosition,
        alignTablesSymmetrically,
        updateTableStatus,
        updateTableCustomerType,
        clearTableSession,
        reserveTable,
        cancelReservation,
        transferTable,
        addArea,
        deleteArea,
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        staffList,
        addStaff,
        updateStaff,
        deleteStaff,
        leaveRequests,
        addLeaveRequest,
        updateLeaveRequestStatus,
        deleteLeaveRequest,
        goodsReceipts,
        addGoodsReceipt,
        updateGoodsReceiptStatus,
        deleteGoodsReceipt,
        cashFlowRecords,
        addCashFlowRecord,
        deleteCashFlowRecord,
        activeOrders,
        completedOrders,
        createOrGetOrderForTable,
        addItemToOrder,
        updateOrderItemQuantity,
        removeOrderItem,
        updateOrderItemStatus,
        updateOrderDetails,
        checkoutOrder,
        cancelOrder,
        toasts,
        showToast,
        removeToast,
        resetToSampleData,
        activeOrderCount,
        todayRevenue
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
