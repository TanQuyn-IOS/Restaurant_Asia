import { Area, CashFlowRecord, GoodsReceipt, LeaveRequest, MenuItem, Order, ServiceRequest, Staff, Table, UserAccount } from './types';

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'acc-admin',
    username: 'admin',
    password: '123',
    fullName: 'Nguyễn Quản Trị (Admin Tổng)',
    role: 'admin',
    phone: '0901 234 567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    id: 'acc-cashier',
    username: 'thungan',
    password: '123',
    fullName: 'Nguyễn Thị Thu Ngân',
    role: 'cashier',
    phone: '0912 888 999',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'acc-kitchen',
    username: 'bep',
    password: '123',
    fullName: 'Trần Văn Bếp (Bếp Trưởng)',
    role: 'kitchen',
    phone: '0938 111 222',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'acc-waiter',
    username: 'phucvu',
    password: '123',
    fullName: 'Lê Văn Phục Vụ',
    role: 'waiter',
    phone: '0977 333 444',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'acc-customer',
    username: 'khachhang',
    password: '123',
    fullName: 'Thực Khách Bàn 02',
    role: 'customer',
    phone: '0988 999 000',
    assignedTableId: 't-102',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'acc-hr',
    username: 'nhansu',
    password: '123',
    fullName: 'Hoàng Thị Nhân Sự (HR)',
    role: 'hr_manager',
    phone: '0944 555 666',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 14400000).toISOString()
  }
];

export const INITIAL_AREAS: Area[] = [
  { id: 'area-1', name: 'Tầng 1 - Sảnh Chính', description: 'Khu vực máy lạnh trung tâm, ấm cúng' },
  { id: 'area-2', name: 'Tầng 2 - Sân Vườn & Ban Công', description: 'Không gian mở, thoáng mát ngắm phố' },
  { id: 'area-3', name: 'Phòng VIP 1 & 2', description: 'Phòng riêng sang trọng dành cho gia đình & tiệc' },
];

export const INITIAL_TABLES: Table[] = [
  // Area 1 - Tầng 1 (2 hàng x 3 cột cân xứng hoàn hảo)
  { id: 't-101', name: 'Bàn 01', areaId: 'area-1', capacity: 4, shape: 'square', status: 'occupied', customerType: 'regular', currentOrderId: 'ord-101', occupiedSince: new Date(Date.now() - 45 * 60000).toISOString(), x: 15, y: 20 },
  { id: 't-102', name: 'Bàn 02', areaId: 'area-1', capacity: 4, shape: 'square', status: 'occupied', customerType: 'walk_in', currentOrderId: 'ord-102', occupiedSince: new Date(Date.now() - 25 * 60000).toISOString(), x: 45, y: 20 },
  { id: 't-103', name: 'Bàn 03', areaId: 'area-1', capacity: 4, shape: 'square', status: 'available', customerType: 'walk_in', x: 75, y: 20 },
  { id: 't-104', name: 'Bàn 04', areaId: 'area-1', capacity: 4, shape: 'round', status: 'reserved', customerType: 'vip', reservation: { customerName: 'Anh Minh', phone: '0912 345 678', guestCount: 4, reservationTime: '19:30', customerType: 'vip', notes: 'Bàn kỷ niệm ngày cưới, chuẩn bị nến' }, x: 15, y: 60 },
  { id: 't-105', name: 'Bàn 05', areaId: 'area-1', capacity: 4, shape: 'square', status: 'cleaning', customerType: 'walk_in', x: 45, y: 60 },
  { id: 't-106', name: 'Bàn 06', areaId: 'area-1', capacity: 4, shape: 'round', status: 'available', customerType: 'regular', x: 75, y: 60 },

  // Area 2 - Tầng 2 (2 hàng x 3 cột cân xứng)
  { id: 't-201', name: 'Bàn 201', areaId: 'area-2', capacity: 4, shape: 'round', status: 'available', customerType: 'walk_in', x: 15, y: 20 },
  { id: 't-202', name: 'Bàn 202', areaId: 'area-2', capacity: 4, shape: 'square', status: 'occupied', customerType: 'group', currentOrderId: 'ord-202', occupiedSince: new Date(Date.now() - 15 * 60000).toISOString(), x: 45, y: 20 },
  { id: 't-203', name: 'Bàn 203', areaId: 'area-2', capacity: 4, shape: 'round', status: 'available', customerType: 'walk_in', x: 75, y: 20 },
  { id: 't-204', name: 'Bàn 204', areaId: 'area-2', capacity: 4, shape: 'square', status: 'available', customerType: 'regular', x: 15, y: 60 },
  { id: 't-205', name: 'Bàn 205', areaId: 'area-2', capacity: 4, shape: 'square', status: 'available', customerType: 'walk_in', x: 45, y: 60 },
  { id: 't-206', name: 'Bàn 206', areaId: 'area-2', capacity: 4, shape: 'round', status: 'available', customerType: 'walk_in', x: 75, y: 60 },

  // Area 3 - VIP (2 phòng VIP đối xứng hoàn hảo)
  { id: 't-vip-1', name: 'VIP Hoàng Gia', areaId: 'area-3', capacity: 8, shape: 'square', status: 'occupied', customerType: 'vip', currentOrderId: 'ord-vip1', occupiedSince: new Date(Date.now() - 60 * 60000).toISOString(), x: 25, y: 40 },
  { id: 't-vip-2', name: 'VIP Sen Vàng', areaId: 'area-3', capacity: 8, shape: 'square', status: 'available', customerType: 'vip', x: 65, y: 40 },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Khai vị
  {
    id: 'm-1',
    name: 'Gỏi Cuốn Tôm Thịt (4 Cuốn)',
    category: 'Khai vị',
    price: 65000,
    cost: 25000,
    unit: 'phần',
    description: 'Tôm tươi, thịt ba chỉ luộc cuộn cùng bún tươi, rau sống và chấm kèm sốt tương đen đậu phộng béo bùi.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 8,
    isPopular: true,
    tags: ['Tươi ngon', 'Món nhẹ']
  },
  {
    id: 'm-2',
    name: 'Chả Giò Hải Sản Hoàng Kim',
    category: 'Khai vị',
    price: 85000,
    cost: 32000,
    unit: 'dĩa',
    description: 'Vỏ rế giòn rụm, nhân tôm sú băm, mực tươi, khoai môn thơm béo chấm xốt mayonnaise tương ớt.',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 12,
    isPopular: true,
    tags: ['Giòn rụm', 'Best seller']
  },
  {
    id: 'm-3',
    name: 'Nộm Ngó Sen Tôm Thịt',
    category: 'Khai vị',
    price: 95000,
    cost: 38000,
    unit: 'dĩa',
    description: 'Ngó sen giòn ngọt quyện tôm thịt, cà rốt, rau răm, đậu phộng rang giòn và nước mắm chua ngọt chuẩn vị.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 10,
    tags: ['Chua ngọt', 'Thanh mát']
  },

  // Món chính
  {
    id: 'm-4',
    name: 'Phở Bò Thăn Đặc Biệt',
    category: 'Món chính',
    price: 89000,
    cost: 35000,
    unit: 'tô',
    description: 'Nước dùng hầm từ xương ống bò 18 tiếng, thịt thăn bò mềm ngọt, nạm giòn, bò viên kèm quẩy giòn.',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 10,
    isPopular: true,
    tags: ['Đặc sản', 'Nóng hổi']
  },
  {
    id: 'm-5',
    name: 'Bún Chả Hà Nội Nướng Than Hoa',
    category: 'Món chính',
    price: 79000,
    cost: 29000,
    unit: 'phần',
    description: 'Chả miếng ba chỉ và chả viên nướng xém vàng than hoa thơm phức, nước chấm đu đủ cà rốt chua ngọt.',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 12,
    isPopular: true,
    tags: ['Hà Nội', 'Đậm đà']
  },
  {
    id: 'm-6',
    name: 'Cơm Tấm Sườn Bì Chả Trứng Ốp La',
    category: 'Món chính',
    price: 75000,
    cost: 28000,
    unit: 'dĩa',
    description: 'Cơm tấm dẻo thơm, sườn cốt lết ướp mật ong nướng mềm mọng, chả trứng hấp béo bùi, mỡ hành tép mỡ giòn.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 10,
    isPopular: true,
    tags: ['Sài Gòn', 'No nê']
  },
  {
    id: 'm-7',
    name: 'Bò Lúc Lắc Khoai Tây Chiên',
    category: 'Món chính',
    price: 165000,
    cost: 75000,
    unit: 'dĩa',
    description: 'Thịt bò Úc cắt hạt lựu mềm ngọt xào lửa lớn cùng ớt chuông, hành tây, kèm khoai tây chiên giòn tan.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 15,
    isPopular: true,
    tags: ['Bò Úc', 'Cao cấp']
  },
  {
    id: 'm-8',
    name: 'Gà Hấp Lá Chanh Nửa Con',
    category: 'Món chính',
    price: 145000,
    cost: 65000,
    unit: 'dĩa',
    description: 'Gà ta thả vườn da vàng giòn sần sật, thịt săn ngọt ngào thơm nồng hương lá chanh tươi, chấm muối tiêu chanh.',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 18,
    tags: ['Gà ta', 'Thơm ngon']
  },

  // Món Lẩu & Hải sản
  {
    id: 'm-9',
    name: 'Lẩu Thái Hải Sản Tom Yum',
    category: 'Món lẩu',
    price: 320000,
    cost: 140000,
    unit: 'nồi',
    description: 'Nước lẩu chua cay đậm đà thơm mùi sả ớt, kèm tôm sú tươi, mực lá, nghêu, cá hồi, nấm kim châm và rau muống.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 20,
    spicyLevel: 2,
    isPopular: true,
    tags: ['Chua cay', 'Ăn nhóm 3-4 người']
  },
  {
    id: 'm-10',
    name: 'Tôm Sú Nướng Muối Ớt (300g)',
    category: 'Hải sản',
    price: 185000,
    cost: 85000,
    unit: 'dĩa',
    description: 'Tôm sú tươi sống nướng muối ớt cay nồng trên than hồng, thịt chắc ngọt đậm đà.',
    image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 15,
    spicyLevel: 2,
    tags: ['Hải sản tươi']
  },
  {
    id: 'm-11',
    name: 'Mực Trứng Hấp Gừng Hành',
    category: 'Hải sản',
    price: 175000,
    cost: 80000,
    unit: 'dĩa',
    description: 'Mực trứng tươi béo ngậy đầy ắp trứng, hấp cùng gừng non và hành hoa ngọt thanh.',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 15,
    tags: ['Ngọt thịt']
  },

  // Món chay
  {
    id: 'm-12',
    name: 'Nấm Đùi Gà Kho Tiêu Chay',
    category: 'Món chay',
    price: 70000,
    cost: 25000,
    unit: 'tộ',
    description: 'Nấm đùi gà dai giòn kho trong tộ đất với sốt xì dầu ớt tiêu đen cay nồng thơm phức.',
    image: 'https://images.unsplash.com/photo-1546069901-d72d242948c3?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 12,
    tags: ['Ăn chay', 'Healthy']
  },
  {
    id: 'm-13',
    name: 'Đậu Hũ Lướt Ván Tẩm Hành',
    category: 'Món chay',
    price: 50000,
    cost: 15000,
    unit: 'dĩa',
    description: 'Đậu hũ non chiên phồng mềm tan bên trong, rưới mỡ hành thơm ngát.',
    image: 'https://images.unsplash.com/photo-1546069901-5ec6a79120b0?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 8,
    tags: ['Ăn chay']
  },

  // Tráng miệng & Đồ uống
  {
    id: 'm-14',
    name: 'Chè Hạt Sen Long Nhãn Táo Đỏ',
    category: 'Tráng miệng',
    price: 42000,
    cost: 14000,
    unit: 'ly',
    description: 'Hạt sen bùi bở nấu đường phèn thanh mát cùng long nhãn Hưng Yên ngọt dịu và táo đỏ bổ dưỡng.',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
    tags: ['Thanh nhiệt', 'Ít ngọt']
  },
  {
    id: 'm-15',
    name: 'Trà Đào Cam Sả Tươi',
    category: 'Đồ uống',
    price: 45000,
    cost: 12000,
    unit: 'ly',
    description: 'Trà đen ủ lạnh ngát hương sả tươi, cam vàng mọng nước và miếng đào giòn ngọt.',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 4,
    isPopular: true,
    tags: ['Giải nhiệt', 'Best seller']
  },
  {
    id: 'm-16',
    name: 'Cà Phê Muối Kem Béo Cố Đô',
    category: 'Đồ uống',
    price: 39000,
    cost: 10000,
    unit: 'ly',
    description: 'Cà phê Robusta nguyên chất pha phin, lớp kem mặn béo ngậy ngọt ngào gây thương nhớ.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 4,
    isPopular: true,
    tags: ['Đậm đà', 'Hot trend']
  },
  {
    id: 'm-17',
    name: 'Nước Ép Dưa Hấu Bạc Hà',
    category: 'Đồ uống',
    price: 42000,
    cost: 15000,
    unit: 'ly',
    description: 'Dưa hấu ép tươi nguyên chất 100% không đường, the mát với lá bạc hà tươi.',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
    tags: ['100% Fresh']
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'st-1',
    name: 'Nguyễn Văn Hùng',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    role: 'Quản lý',
    phone: '0903 123 456',
    email: 'hung.nguyen@nhahangpro.vn',
    shift: 'Ca Hành Chính (08:00 - 17:30)',
    shiftName: 'Ca Hành Chính',
    shiftHours: '08:00 - 17:30',
    salaryRate: 18000000,
    salaryType: 'monthly',
    status: 'active',
    joinDate: '2023-01-15',
    ordersHandled: 2450
  },
  {
    id: 'st-2',
    name: 'Trần Thị Mai',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    role: 'Thu ngân',
    phone: '0988 765 432',
    email: 'mai.tran@nhahangpro.vn',
    shift: 'Ca Sáng (06:00 - 14:00)',
    shiftName: 'Ca Sáng',
    shiftHours: '06:00 - 14:00',
    salaryRate: 9500000,
    salaryType: 'monthly',
    status: 'active',
    joinDate: '2023-04-10',
    ordersHandled: 1890
  },
  {
    id: 'st-3',
    name: 'Lê Hoàng Long',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
    role: 'Bếp trưởng',
    phone: '0918 888 999',
    email: 'long.le@nhahangpro.vn',
    shift: 'Toàn thời gian (09:00 - 21:30)',
    shiftName: 'Toàn thời gian',
    shiftHours: '09:00 - 21:30',
    salaryRate: 25000000,
    salaryType: 'monthly',
    status: 'active',
    joinDate: '2022-11-01',
    ordersHandled: 4200
  },
  {
    id: 'st-4',
    name: 'Phạm Quỳnh Anh',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    role: 'Phục vụ',
    phone: '0977 112 233',
    email: 'quynhanh.p@nhahangpro.vn',
    shift: 'Ca Chiều (14:00 - 22:00)',
    shiftName: 'Ca Chiều',
    shiftHours: '14:00 - 22:00',
    salaryRate: 35000,
    salaryType: 'hourly',
    status: 'active',
    joinDate: '2024-02-20',
    ordersHandled: 640
  },
  {
    id: 'st-5',
    name: 'Đặng Tuấn Kiệt',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    role: 'Pha chế',
    phone: '0933 445 566',
    email: 'kiet.dang@nhahangpro.vn',
    shift: 'Ca Sáng (06:00 - 14:00)',
    shiftName: 'Ca Sáng',
    shiftHours: '06:00 - 14:00',
    salaryRate: 8500000,
    salaryType: 'monthly',
    status: 'active',
    joinDate: '2023-08-01',
    ordersHandled: 1120
  },
  {
    id: 'st-6',
    name: 'Vũ Thị Hương',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    role: 'Phục vụ',
    phone: '0944 556 677',
    email: 'huong.vu@nhahangpro.vn',
    shift: 'Ca Tối (17:00 - 23:00)',
    shiftName: 'Ca Tối',
    shiftHours: '17:00 - 23:00',
    salaryRate: 35000,
    salaryType: 'hourly',
    status: 'active',
    joinDate: '2024-01-05',
    ordersHandled: 580
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    code: '#HD-2041',
    tableId: 't-101',
    tableName: 'Bàn 01',
    areaName: 'Tầng 1 - Sảnh Chính',
    staffName: 'Phạm Quỳnh Anh',
    customerCount: 2,
    customerName: 'Khách Lẻ',
    items: [
      { id: 'oi-1', menuItemId: 'm-1', name: 'Gỏi Cuốn Tôm Thịt (4 Cuốn)', unit: 'phần', price: 65000, quantity: 1, status: 'served', orderedAt: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: 'oi-2', menuItemId: 'm-4', name: 'Phở Bò Thăn Đặc Biệt', unit: 'tô', price: 89000, quantity: 2, note: '1 tô không hành, nhiều ớt', status: 'served', orderedAt: new Date(Date.now() - 35 * 60000).toISOString() },
      { id: 'oi-3', menuItemId: 'm-15', name: 'Trà Đào Cam Sả Tươi', unit: 'ly', price: 45000, quantity: 2, status: 'served', orderedAt: new Date(Date.now() - 30 * 60000).toISOString() }
    ],
    subtotal: 333000,
    discountPercent: 5,
    taxPercent: 8,
    finalTotal: 341658,
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString()
  },
  {
    id: 'ord-102',
    code: '#HD-2042',
    tableId: 't-102',
    tableName: 'Bàn 02',
    areaName: 'Tầng 1 - Sảnh Chính',
    staffName: 'Vũ Thị Hương',
    customerCount: 4,
    customerName: 'Chị Lan',
    items: [
      { id: 'oi-4', menuItemId: 'm-2', name: 'Chả Giò Hải Sản Hoàng Kim', unit: 'dĩa', price: 85000, quantity: 2, status: 'served', orderedAt: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'oi-5', menuItemId: 'm-9', name: 'Lẩu Thái Hải Sản Tom Yum', unit: 'nồi', price: 320000, quantity: 1, note: 'Ăn cay vừa', status: 'cooking', orderedAt: new Date(Date.now() - 18 * 60000).toISOString() },
      { id: 'oi-6', menuItemId: 'm-10', name: 'Tôm Sú Nướng Muối Ớt (300g)', unit: 'dĩa', price: 185000, quantity: 1, status: 'cooking', orderedAt: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: 'oi-7', menuItemId: 'm-16', name: 'Cà Phê Muối Kem Béo Cố Đô', unit: 'ly', price: 39000, quantity: 4, status: 'ready', orderedAt: new Date(Date.now() - 10 * 60000).toISOString() }
    ],
    subtotal: 831000,
    discountPercent: 0,
    taxPercent: 8,
    finalTotal: 897480,
    status: 'active',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString()
  },
  {
    id: 'ord-202',
    code: '#HD-2043',
    tableId: 't-202',
    tableName: 'Bàn 202',
    areaName: 'Tầng 2 - Sân Vườn & Ban Công',
    staffName: 'Phạm Quỳnh Anh',
    customerCount: 2,
    customerName: 'Anh Huy',
    items: [
      { id: 'oi-8', menuItemId: 'm-7', name: 'Bò Lúc Lắc Khoai Tây Chiên', unit: 'dĩa', price: 165000, quantity: 1, status: 'cooking', orderedAt: new Date(Date.now() - 12 * 60000).toISOString() },
      { id: 'oi-9', menuItemId: 'm-6', name: 'Cơm Tấm Sườn Bì Chả Trứng Ốp La', unit: 'dĩa', price: 75000, quantity: 1, status: 'cooking', orderedAt: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: 'oi-10', menuItemId: 'm-17', name: 'Nước Ép Dưa Hấu Bạc Hà', unit: 'ly', price: 42000, quantity: 2, status: 'pending', orderedAt: new Date(Date.now() - 5 * 60000).toISOString() }
    ],
    subtotal: 324000,
    discountPercent: 0,
    taxPercent: 8,
    finalTotal: 349920,
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 'ord-vip1',
    code: '#HD-2044',
    tableId: 't-vip-1',
    tableName: 'Phòng VIP Hoàng Gia',
    areaName: 'Phòng VIP 1 & 2',
    staffName: 'Nguyễn Văn Hùng',
    customerCount: 10,
    customerName: 'Tập thể Cty TechCorp',
    items: [
      { id: 'oi-11', menuItemId: 'm-2', name: 'Chả Giò Hải Sản Hoàng Kim', unit: 'dĩa', price: 85000, quantity: 3, status: 'served', orderedAt: new Date(Date.now() - 55 * 60000).toISOString() },
      { id: 'oi-12', menuItemId: 'm-3', name: 'Nộm Ngó Sen Tôm Thịt', unit: 'dĩa', price: 95000, quantity: 2, status: 'served', orderedAt: new Date(Date.now() - 55 * 60000).toISOString() },
      { id: 'oi-13', menuItemId: 'm-7', name: 'Bò Lúc Lắc Khoai Tây Chiên', unit: 'dĩa', price: 165000, quantity: 3, status: 'served', orderedAt: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: 'oi-14', menuItemId: 'm-8', name: 'Gà Hấp Lá Chanh Nửa Con', unit: 'dĩa', price: 145000, quantity: 2, status: 'served', orderedAt: new Date(Date.now() - 35 * 60000).toISOString() },
      { id: 'oi-15', menuItemId: 'm-9', name: 'Lẩu Thái Hải Sản Tom Yum', unit: 'nồi', price: 320000, quantity: 2, status: 'cooking', orderedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 'oi-16', menuItemId: 'm-15', name: 'Trà Đào Cam Sả Tươi', unit: 'ly', price: 45000, quantity: 10, status: 'served', orderedAt: new Date(Date.now() - 50 * 60000).toISOString() }
    ],
    subtotal: 2320000,
    discountPercent: 10,
    taxPercent: 8,
    finalTotal: 2255040,
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString()
  }
];

export const INITIAL_COMPLETED_ORDERS: Order[] = [
  {
    id: 'ord-hist-1',
    code: '#HD-2038',
    tableId: 't-103',
    tableName: 'Bàn 03',
    areaName: 'Tầng 1 - Sảnh Chính',
    staffName: 'Trần Thị Mai',
    customerCount: 3,
    customerName: 'Anh Hoàng',
    items: [
      { id: 'h-1', menuItemId: 'm-4', name: 'Phở Bò Thăn Đặc Biệt', unit: 'tô', price: 89000, quantity: 3, status: 'served', orderedAt: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: 'h-2', menuItemId: 'm-16', name: 'Cà Phê Muối Kem Béo Cố Đô', unit: 'ly', price: 39000, quantity: 3, status: 'served', orderedAt: new Date(Date.now() - 3 * 3600000).toISOString() }
    ],
    subtotal: 384000,
    discountPercent: 0,
    taxPercent: 8,
    finalTotal: 414720,
    status: 'completed',
    paymentMethod: 'transfer',
    createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 2.8 * 3600000).toISOString()
  },
  {
    id: 'ord-hist-2',
    code: '#HD-2039',
    tableId: 't-201',
    tableName: 'Bàn 201',
    areaName: 'Tầng 2 - Sân Vườn & Ban Công',
    staffName: 'Trần Thị Mai',
    customerCount: 2,
    customerName: 'Chị Phương',
    items: [
      { id: 'h-3', menuItemId: 'm-5', name: 'Bún Chả Hà Nội Nướng Than Hoa', unit: 'phần', price: 79000, quantity: 2, status: 'served', orderedAt: new Date(Date.now() - 2.5 * 3600000).toISOString() },
      { id: 'h-4', menuItemId: 'm-1', name: 'Gỏi Cuốn Tôm Thịt (4 Cuốn)', unit: 'phần', price: 65000, quantity: 1, status: 'served', orderedAt: new Date(Date.now() - 2.5 * 3600000).toISOString() },
      { id: 'h-5', menuItemId: 'm-15', name: 'Trà Đào Cam Sả Tươi', unit: 'ly', price: 45000, quantity: 2, status: 'served', orderedAt: new Date(Date.now() - 2.5 * 3600000).toISOString() }
    ],
    subtotal: 313000,
    discountPercent: 5,
    taxPercent: 8,
    finalTotal: 321138,
    status: 'completed',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 2.7 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 1.9 * 3600000).toISOString()
  },
  {
    id: 'ord-hist-3',
    code: '#HD-2040',
    tableId: 't-105',
    tableName: 'Bàn 05',
    areaName: 'Tầng 1 - Sảnh Chính',
    staffName: 'Trần Thị Mai',
    customerCount: 4,
    customerName: 'Gia đình Bác Thành',
    items: [
      { id: 'h-6', menuItemId: 'm-8', name: 'Gà Hấp Lá Chanh Nửa Con', unit: 'dĩa', price: 145000, quantity: 1, status: 'served', orderedAt: new Date(Date.now() - 1.8 * 3600000).toISOString() },
      { id: 'h-7', menuItemId: 'm-10', name: 'Tôm Sú Nướng Muối Ớt (300g)', unit: 'dĩa', price: 185000, quantity: 1, status: 'served', orderedAt: new Date(Date.now() - 1.8 * 3600000).toISOString() },
      { id: 'h-8', menuItemId: 'm-6', name: 'Cơm Tấm Sườn Bì Chả Trứng Ốp La', unit: 'dĩa', price: 75000, quantity: 4, status: 'served', orderedAt: new Date(Date.now() - 1.8 * 3600000).toISOString() },
      { id: 'h-9', menuItemId: 'm-14', name: 'Chè Hạt Sen Long Nhãn Táo Đỏ', unit: 'ly', price: 42000, quantity: 4, status: 'served', orderedAt: new Date(Date.now() - 1.5 * 3600000).toISOString() }
    ],
    subtotal: 798000,
    discountPercent: 0,
    taxPercent: 8,
    finalTotal: 861840,
    status: 'completed',
    paymentMethod: 'qr',
    createdAt: new Date(Date.now() - 1.9 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 0.8 * 3600000).toISOString()
  }
];

export const INITIAL_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1',
    tableId: 't-101',
    tableName: 'Bàn 01',
    type: 'refill_water',
    title: 'Xin thêm nước đá & trà đá',
    note: '2 ly trà đá ít đá',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: 'req-2',
    tableId: 't-102',
    tableName: 'Bàn 02',
    type: 'request_bill',
    title: 'Yêu cầu thanh toán hóa đơn',
    note: 'Thanh toán chuyển khoản VietQR',
    status: 'attending',
    staffName: 'Trần Thị Mai',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString()
  }
];

export const INITIAL_SHIFTS = [
  {
    id: 'shift-1',
    staffId: 'st-2',
    staffName: 'Trần Thị Mai',
    role: 'Thu ngân' as const,
    dayOfWeek: 1,
    date: '2025-05-19',
    shiftName: 'Ca Sáng',
    timeRange: '06:00 - 14:00',
    attended: true
  },
  {
    id: 'shift-2',
    staffId: 'st-4',
    staffName: 'Phạm Quỳnh Anh',
    role: 'Phục vụ' as const,
    dayOfWeek: 1,
    date: '2025-05-19',
    shiftName: 'Ca Chiều',
    timeRange: '14:00 - 22:00',
    attended: true
  },
  {
    id: 'shift-3',
    staffId: 'st-5',
    staffName: 'Đặng Tuấn Kiệt',
    role: 'Pha chế' as const,
    dayOfWeek: 1,
    date: '2025-05-19',
    shiftName: 'Ca Sáng',
    timeRange: '06:00 - 14:00',
    attended: true
  }
];

// 3 Trạng thái nghỉ phép: 'active' (đang nghỉ), 'upcoming' (sắp nghỉ), 'completed' (đã nghỉ)
export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    staffId: 'st-6',
    staffName: 'Vũ Thị Hương',
    role: 'Phục vụ',
    startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'active', // Đang nghỉ
    reason: 'Về quê giải quyết việc gia đình',
    leaveType: 'Việc gia đình',
    approvedBy: 'Nguyễn Văn Hùng (Quản lý)',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'leave-2',
    staffId: 'st-4',
    staffName: 'Phạm Quỳnh Anh',
    role: 'Phục vụ',
    startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    status: 'upcoming', // Sắp nghỉ
    reason: 'Đăng ký nghỉ phép năm đi du lịch cùng gia đình',
    leaveType: 'Phép năm',
    approvedBy: 'Nguyễn Văn Hùng (Quản lý)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'leave-3',
    staffId: 'st-5',
    staffName: 'Đặng Tuấn Kiệt',
    role: 'Pha chế',
    startDate: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
    status: 'completed', // Đã nghỉ
    reason: 'Sốt xuất huyết điều trị tại nhà',
    leaveType: 'Nghỉ ốm',
    approvedBy: 'Nguyễn Văn Hùng (Quản lý)',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: 'leave-4',
    staffId: 'st-2',
    staffName: 'Trần Thị Mai',
    role: 'Thu ngân',
    startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
    status: 'upcoming', // Sắp nghỉ
    reason: 'Đi khám sức khỏe định kỳ',
    leaveType: 'Phép năm',
    approvedBy: 'Nguyễn Văn Hùng (Quản lý)',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Quản lý Hàng Nhập (Goods Receipts) cho Chủ nhà hàng
export const INITIAL_GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'gr-001',
    receiptCode: 'PNK-2026-001',
    supplierName: 'Công Ty Hải Sản Tươi Sống Đại Dương Xanh',
    supplierPhone: '0908 123 789',
    receivedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    totalAmount: 12500000,
    paymentStatus: 'paid',
    paymentMethod: 'transfer',
    notes: 'Tôm sú tươi sống, Mực trứng loại 1, Cua Cà Mau',
    createdBy: 'Chủ Quán / Admin',
    items: [
      { id: 'gri-1', ingredientName: 'Tôm Sú Sống (Size 20)', category: 'Thịt & Hải sản', quantity: 25, unit: 'kg', unitPrice: 280000, totalPrice: 7000000 },
      { id: 'gri-2', ingredientName: 'Mực Trứng Phú Quốc', category: 'Thịt & Hải sản', quantity: 20, unit: 'kg', unitPrice: 200000, totalPrice: 4000000 },
      { id: 'gri-3', ingredientName: 'Hàu Sữa Pháp', category: 'Thịt & Hải sản', quantity: 30, unit: 'kg', unitPrice: 50000, totalPrice: 1500000 },
    ]
  },
  {
    id: 'gr-002',
    receiptCode: 'PNK-2026-002',
    supplierName: 'Nông Trại Rau Củ Sạch Đà Lạt GreenFarm',
    supplierPhone: '0919 456 123',
    receivedDate: new Date(Date.now() - 86400000).toISOString(),
    totalAmount: 4350000,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    notes: 'Rau xà lách thủy canh, Cà chua bi, Nấm đùi gà tươi, Hành hoa',
    createdBy: 'Chủ Quán / Admin',
    items: [
      { id: 'gri-4', ingredientName: 'Rau Xà Lách & Thảo Mộc', category: 'Rau củ quả', quantity: 40, unit: 'kg', unitPrice: 35000, totalPrice: 1400000 },
      { id: 'gri-5', ingredientName: 'Nấm Đùi Gà & Kim Châm', category: 'Rau củ quả', quantity: 30, unit: 'kg', unitPrice: 65000, totalPrice: 1950000 },
      { id: 'gri-6', ingredientName: 'Gia vị thảo mộc & Nước mắm cốt', category: 'Gia vị & Khô', quantity: 10, unit: 'chai', unitPrice: 100000, totalPrice: 1000000 },
    ]
  },
  {
    id: 'gr-003',
    receiptCode: 'PNK-2026-003',
    supplierName: 'Đại Lý Bia & Nước Giải Khát Tân Hiệp',
    supplierPhone: '0938 789 456',
    receivedDate: new Date().toISOString(),
    totalAmount: 8200000,
    paymentStatus: 'pending',
    paymentMethod: 'transfer',
    notes: 'Bia Heineken, Tiger Bạc, Nước ngọt lon, Nước suối chai',
    createdBy: 'Chủ Quán / Admin',
    items: [
      { id: 'gri-7', ingredientName: 'Bia Heineken Silver (Thùng 24)', category: 'Bia & Nước giải khát', quantity: 15, unit: 'thùng', unitPrice: 390000, totalPrice: 5850000 },
      { id: 'gri-8', ingredientName: 'Bia Tiger Crystal (Thùng 24)', category: 'Bia & Nước giải khát', quantity: 10, unit: 'thùng', unitPrice: 375000, totalPrice: 3750000 },
    ]
  }
];

// Quản lý Dòng Tiền (Cash Flow) cho Chủ nhà hàng
export const INITIAL_CASH_FLOW: CashFlowRecord[] = [
  {
    id: 'cf-1',
    type: 'inflow',
    category: 'revenue_order',
    title: 'Doanh thu bán hàng ca trưa',
    amount: 8450000,
    method: 'transfer',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    referenceCode: 'CA-TRUA-2026',
    notes: 'Thanh toán qua chuyển khoản VietQR & Thẻ',
    createdBy: 'Hệ thống POS'
  },
  {
    id: 'cf-2',
    type: 'inflow',
    category: 'revenue_order',
    title: 'Doanh thu bán hàng ca tối hôm qua',
    amount: 14200000,
    method: 'cash',
    date: new Date(Date.now() - 86400000).toISOString(),
    referenceCode: 'CA-TOI-HOMQUA',
    notes: 'Tiền mặt đã nộp về két thủ quỹ',
    createdBy: 'Trần Thị Mai (Thu ngân)'
  },
  {
    id: 'cf-3',
    type: 'outflow',
    category: 'goods_purchase',
    title: 'Thanh toán nhập hải sản tươi sống Đại Dương Xanh',
    amount: 12500000,
    method: 'transfer',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    referenceCode: 'PNK-2026-001',
    notes: 'Chuyển khoản thanh toán phiếu PNK-2026-001',
    createdBy: 'Chủ Quán / Admin'
  },
  {
    id: 'cf-4',
    type: 'outflow',
    category: 'goods_purchase',
    title: 'Chi tiền mặt nhập rau củ sạch Đà Lạt',
    amount: 4350000,
    method: 'cash',
    date: new Date(Date.now() - 86400000).toISOString(),
    referenceCode: 'PNK-2026-002',
    notes: 'Thanh toán tiền mặt cho nhà xe giao rau',
    createdBy: 'Chủ Quán / Admin'
  },
  {
    id: 'cf-5',
    type: 'outflow',
    category: 'utilities',
    title: 'Tiền điện & nước tháng trước nhà hàng',
    amount: 6800000,
    method: 'transfer',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    referenceCode: 'HOADON-DIEN-T5',
    notes: 'Điện lực EVN',
    createdBy: 'Chủ Quán / Admin'
  }
];


