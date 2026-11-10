export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export type TableShape = 'round' | 'square' | 'rectangle';

// 4 Customer Types requested
export type CustomerType = 'walk_in' | 'regular' | 'vip' | 'group';

export interface ReservationInfo {
  customerName: string;
  phone: string;
  guestCount: number;
  reservationTime: string; // e.g. "19:00"
  customerType?: CustomerType;
  notes?: string;
}

export interface Table {
  id: string;
  name: string;
  areaId: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
  x: number; // percentage or px in floor canvas
  y: number;
  width?: number;
  height?: number;
  customerType?: CustomerType;
  currentOrderId?: string;
  reservation?: ReservationInfo;
  occupiedSince?: string; // ISO string
}

export interface Area {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export type MenuCategory = 
  | 'Khai vị'
  | 'Món chính'
  | 'Món lẩu'
  | 'Hải sản'
  | 'Món chay'
  | 'Tráng miệng'
  | 'Đồ uống'
  | 'Combo';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number; // in VND
  cost: number; // in VND for profit calculation
  unit: string; // dĩa, tô, phần, lon, ly, nồi...
  description: string;
  image: string;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  spicyLevel?: 0 | 1 | 2 | 3;
  tags?: string[];
  isPopular?: boolean;
}

export type StaffRole = 
  | 'Quản lý'
  | 'Thu ngân'
  | 'Phục vụ'
  | 'Bếp trưởng'
  | 'Đầu bếp'
  | 'Pha chế';

export interface Staff {
  id: string;
  name: string;
  avatar: string;
  role: StaffRole;
  phone: string;
  email: string;
  shift: string; // e.g. 'Ca Sáng (06:00 - 14:00)'
  shiftName?: string; // 'Ca Sáng' | 'Ca Chiều' | 'Ca Đêm' | 'Toàn thời gian'
  shiftHours?: string; // '06:00 - 14:00' | '14:00 - 22:00' | '22:00 - 06:00'
  salaryRate: number; // VND per month or per hour
  salaryType: 'monthly' | 'hourly';
  status: 'active' | 'on_break' | 'off';
  joinDate: string;
  ordersHandled?: number;
}

// Leave requests categorized into 3 states: 'đang' (active), 'sắp' (upcoming), 'đã' (completed)
export type LeaveStatus = 'active' | 'upcoming' | 'completed';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: LeaveStatus; // 'active' (đang nghỉ), 'upcoming' (sắp nghỉ), 'completed' (đã nghỉ)
  reason: string;
  leaveType: 'Phép năm' | 'Nghỉ ốm' | 'Việc gia đình' | 'Nghỉ bù';
  approvedBy?: string;
  createdAt: string;
}

export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  note?: string;
  status: OrderItemStatus;
  orderedAt: string;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'qr';

export interface Order {
  id: string;
  code: string; // e.g. #HD-1024
  tableId: string;
  tableName: string;
  areaName: string;
  customerType?: CustomerType; // 'walk_in' | 'regular' | 'vip' | 'group'
  staffId?: string;
  staffName?: string;
  customerName?: string;
  customerPhone?: string;
  customerCount: number;
  items: OrderItem[];
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  finalTotal: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface ShiftSchedule {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  dayOfWeek: number; // 0=CN, 1=T2, ... 6=T7
  date: string;
  shiftName: string;
  timeRange: string;
  attended: boolean;
}

// Goods Receipts for Owner (Quản lý hàng nhập)
export interface GoodsReceiptItem {
  id: string;
  ingredientName: string;
  category: 'Thịt & Hải sản' | 'Rau củ quả' | 'Bia & Nước giải khát' | 'Gia vị & Khô' | 'Vật tư tiêu hao';
  quantity: number;
  unit: string; // kg, két, chai, bao, hộp
  unitPrice: number;
  totalPrice: number;
}

export interface GoodsReceipt {
  id: string;
  receiptCode: string; // e.g. PNK-2026-001
  supplierName: string;
  supplierPhone?: string;
  receivedDate: string; // ISO date
  items: GoodsReceiptItem[];
  totalAmount: number;
  paymentStatus: 'paid' | 'pending';
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy: string;
}

// Cash Flow for Owner (Quản lý dòng tiền)
export type CashFlowType = 'inflow' | 'outflow';
export type CashFlowCategory = 
  | 'revenue_order' 
  | 'goods_purchase' 
  | 'staff_salary' 
  | 'utilities' 
  | 'marketing' 
  | 'other';

export interface CashFlowRecord {
  id: string;
  type: CashFlowType; // 'inflow' (tiền thu vào) | 'outflow' (tiền chi ra)
  category: CashFlowCategory;
  title: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  referenceCode?: string; // Order code or Goods Receipt code
  notes?: string;
  createdBy: string;
}

export type AppRole = 'admin' | 'customer' | 'cashier' | 'kitchen' | 'waiter' | 'hr_manager';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: AppRole;
  phone?: string;
  avatar?: string;
  assignedTableId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface RoleInfo {
  id: AppRole;
  name: string;
  title: string;
  description: string;
  badgeColor: string;
  icon: string;
  allowedTabs: string[];
}

export type ServiceRequestType = 
  | 'request_bill' 
  | 'call_waiter' 
  | 'refill_water' 
  | 'extra_cutlery' 
  | 'clean_table' 
  | 'other';

export type ServiceRequestStatus = 'pending' | 'attending' | 'resolved';

export interface ServiceRequest {
  id: string;
  tableId: string;
  tableName: string;
  type: ServiceRequestType;
  title: string;
  note?: string;
  status: ServiceRequestStatus;
  createdAt: string;
  resolvedAt?: string;
  staffName?: string;
}
