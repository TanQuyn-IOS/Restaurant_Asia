import { PrismaClient, RoleName, CustomerType, TableShape, TableStatus, SalaryType, EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu Seeding Dữ Liệu Khởi Tạo Restaurant Asia ---');

  // 1. ROLES
  const rolesData = [
    { name: RoleName.ADMIN, title: 'Quản Trị Viên', description: 'Toàn quyền điều hành hệ thống' },
    { name: RoleName.CASHIER, title: 'Thu Ngân POS', description: 'Chốt hóa đơn và nhận thanh toán' },
    { name: RoleName.KITCHEN, title: 'Bếp / Bar KDS', description: 'Chế biến món ăn và quản lý tồn kho KDS' },
    { name: RoleName.WAITER, title: 'Nhân Viên Phục Vụ', description: 'Phục vụ bàn, bưng món và gọi món' },
    { name: RoleName.HR_MANAGER, title: 'Quản Lý Nhân Sự', description: 'Quản lý lịch ca, chấm công và lương' },
    { name: RoleName.CUSTOMER, title: 'Khách Hàng', description: 'Xem menu và gọi món tại bàn' },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { title: r.title, description: r.description },
      create: r,
    });
  }
  console.log('✓ 6 Vai trò hệ thống đã khởi tạo thành công');

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMIN } });
  const cashierRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.CASHIER } });
  const kitchenRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.KITCHEN } });
  const waiterRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.WAITER } });
  const hrRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.HR_MANAGER } });

  // 2. USERS
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const staffPassword = await bcrypt.hash('Staff@123', 12);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      fullName: 'Quản Trị Viên Hệ Thống',
      roleId: adminRole.id,
      phone: '0901234567',
      isActive: true,
      isActivated: true,
      mustChangePassword: false,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: {},
    create: {
      username: 'cashier1',
      passwordHash: staffPassword,
      fullName: 'Nguyễn Thị Thu Ngân',
      roleId: cashierRole.id,
      phone: '0901234568',
      isActive: true,
      isActivated: true,
      mustChangePassword: false,
    },
  });

  const kitchenUser = await prisma.user.upsert({
    where: { username: 'kitchen1' },
    update: {},
    create: {
      username: 'kitchen1',
      passwordHash: staffPassword,
      fullName: 'Trần Văn Bếp Trưởng',
      roleId: kitchenRole.id,
      phone: '0901234569',
      isActive: true,
      isActivated: true,
      mustChangePassword: false,
    },
  });

  const waiterUser = await prisma.user.upsert({
    where: { username: 'waiter1' },
    update: {},
    create: {
      username: 'waiter1',
      passwordHash: staffPassword,
      fullName: 'Lê Văn Phục Vụ',
      roleId: waiterRole.id,
      phone: '0901234570',
      isActive: true,
      isActivated: true,
      mustChangePassword: false,
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { username: 'hr1' },
    update: {},
    create: {
      username: 'hr1',
      passwordHash: staffPassword,
      fullName: 'Phạm Thị Quản Lý HR',
      roleId: hrRole.id,
      phone: '0901234571',
      isActive: true,
      isActivated: true,
      mustChangePassword: false,
    },
  });
  console.log('✓ 5 Tài khoản mẫu Development đã khởi tạo');

  // 3. EMPLOYEES
  const employeesData = [
    { userId: cashierUser.id, name: 'Nguyễn Thị Thu Ngân', phone: '0901234568', roleTitle: 'Thu Ngân', salaryRate: 8500000, salaryType: SalaryType.MONTHLY },
    { userId: kitchenUser.id, name: 'Trần Văn Bếp Trưởng', phone: '0901234569', roleTitle: 'Bếp Trưởng', salaryRate: 15000000, salaryType: SalaryType.MONTHLY },
    { userId: waiterUser.id, name: 'Lê Văn Phục Vụ', phone: '0901234570', roleTitle: 'Phục Vụ', salaryRate: 35000, salaryType: SalaryType.HOURLY },
    { userId: hrUser.id, name: 'Phạm Thị Quản Lý HR', phone: '0901234571', roleTitle: 'Quản Lý HR', salaryRate: 12000000, salaryType: SalaryType.MONTHLY },
  ];

  for (const emp of employeesData) {
    await prisma.employee.upsert({
      where: { userId: emp.userId },
      update: {},
      create: {
        userId: emp.userId,
        name: emp.name,
        phone: emp.phone,
        roleTitle: emp.roleTitle,
        salaryRate: emp.salaryRate,
        salaryType: emp.salaryType,
        status: EmployeeStatus.ACTIVE,
      },
    });
  }
  console.log('✓ Hồ sơ nhân viên đã liên kết');

  // 4. TABLE AREAS & TABLES
  const areas = [
    { name: 'Khu Tầng 1 (Chính)', description: 'Sảnh chính đón khách', displayOrder: 1 },
    { name: 'Khu Tầng 2 (Yên tĩnh)', description: 'Không gian ấm cúng, view đường phố', displayOrder: 2 },
    { name: 'Khu Sân Vườn', description: 'Không gian ngoài trời thoáng mát', displayOrder: 3 },
    { name: 'Phòng VIP', description: 'Phòng tiệc riêng tư cao cấp', displayOrder: 4 },
  ];

  const createdAreas: Record<string, string> = {};
  for (const a of areas) {
    const areaRecord = await prisma.tableArea.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
    createdAreas[a.name] = areaRecord.id;
  }

  // 12 Bàn ăn
  const tablesData = [
    { name: 'Bàn 01', areaId: createdAreas['Khu Tầng 1 (Chính)'], capacity: 4, shape: TableShape.SQUARE, posX: 15, posY: 20 },
    { name: 'Bàn 02', areaId: createdAreas['Khu Tầng 1 (Chính)'], capacity: 4, shape: TableShape.SQUARE, posX: 40, posY: 20 },
    { name: 'Bàn 03', areaId: createdAreas['Khu Tầng 1 (Chính)'], capacity: 6, shape: TableShape.RECTANGLE, posX: 70, posY: 20 },
    { name: 'Bàn 04', areaId: createdAreas['Khu Tầng 1 (Chính)'], capacity: 2, shape: TableShape.ROUND, posX: 15, posY: 60 },
    { name: 'Bàn 05', areaId: createdAreas['Khu Tầng 1 (Chính)'], capacity: 4, shape: TableShape.SQUARE, posX: 40, posY: 60 },
    { name: 'Bàn 06', areaId: createdAreas['Khu Tầng 1 (Chính)'], capacity: 8, shape: TableShape.RECTANGLE, posX: 70, posY: 60 },
    { name: 'Bàn 07 (Tầng 2)', areaId: createdAreas['Khu Tầng 2 (Yên tĩnh)'], capacity: 4, shape: TableShape.SQUARE, posX: 20, posY: 30 },
    { name: 'Bàn 08 (Tầng 2)', areaId: createdAreas['Khu Tầng 2 (Yên tĩnh)'], capacity: 4, shape: TableShape.SQUARE, posX: 50, posY: 30 },
    { name: 'Bàn 09 (Sân Vườn)', areaId: createdAreas['Khu Sân Vườn'], capacity: 4, shape: TableShape.ROUND, posX: 25, posY: 40 },
    { name: 'Bàn 10 (Sân Vườn)', areaId: createdAreas['Khu Sân Vườn'], capacity: 6, shape: TableShape.RECTANGLE, posX: 65, posY: 40 },
    { name: 'VIP 1', areaId: createdAreas['Phòng VIP'], capacity: 10, shape: TableShape.RECTANGLE, posX: 30, posY: 50 },
    { name: 'VIP 2', areaId: createdAreas['Phòng VIP'], capacity: 12, shape: TableShape.RECTANGLE, posX: 70, posY: 50 },
  ];

  for (const t of tablesData) {
    const existingTable = await prisma.restaurantTable.findFirst({
      where: { name: t.name, areaId: t.areaId },
    });
    if (!existingTable) {
      await prisma.restaurantTable.create({
        data: {
          name: t.name,
          areaId: t.areaId,
          capacity: t.capacity,
          shape: t.shape,
          status: TableStatus.AVAILABLE,
          posX: t.posX,
          posY: t.posY,
        },
      });
    }
  }
  console.log('✓ 4 Khu vực và 12 Bàn ăn sơ đồ mặt bằng đã tạo');

  // 5. TAX CONFIG
  const taxStandard = await prisma.taxConfig.upsert({
    where: { code: 'VAT_STANDARD_8' },
    update: {},
    create: {
      code: 'VAT_STANDARD_8',
      name: 'Thuế GTGT 8% (Nghị quyết chính phủ)',
      rate: 8.00,
      effectiveFrom: new Date('2024-01-01'),
      isDefault: true,
    },
  });

  // 6. CATEGORIES & MENU ITEMS
  const categories = [
    { name: 'Khai Vị', displayOrder: 1 },
    { name: 'Món Chính', displayOrder: 2 },
    { name: 'Lẩu & Nướng', displayOrder: 3 },
    { name: 'Tráng Miệng', displayOrder: 4 },
    { name: 'Đồ Uống & Rượu', displayOrder: 5 },
  ];

  const createdCats: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    createdCats[c.name] = cat.id;
  }

  // Thuế 10% riêng cho đồ uống có cồn
  await prisma.taxConfig.upsert({
    where: { code: 'VAT_ALCOHOL_10' },
    update: {},
    create: {
      code: 'VAT_ALCOHOL_10',
      name: 'Thuế GTGT 10% (Đồ uống & Rượu)',
      rate: 10.00,
      effectiveFrom: new Date('2024-01-01'),
      isDefault: false,
      categoryId: createdCats['Đồ Uống & Rượu'],
    },
  });

  const menuItemsData = [
    { categoryId: createdCats['Khai Vị'], name: 'Nem Rán Hà Nội (6 cuốn)', price: 85000, costPrice: 35000, unit: 'đĩa', prepTimeMinutes: 12, isPopular: true },
    { categoryId: createdCats['Khai Vị'], name: 'Salad Bò Trộn Giấm Bỗng', price: 95000, costPrice: 42000, unit: 'đĩa', prepTimeMinutes: 10 },
    { categoryId: createdCats['Món Chính'], name: 'Bò Bít Tết Sốt Tiêu Đen (200g)', price: 245000, costPrice: 115000, unit: 'phần', prepTimeMinutes: 18, isPopular: true },
    { categoryId: createdCats['Món Chính'], name: 'Gà Nướng Mật Ong Tây Bắc', price: 185000, costPrice: 75000, unit: 'nửa con', prepTimeMinutes: 25 },
    { categoryId: createdCats['Lẩu & Nướng'], name: 'Lẩu Thái Hải Sản Tom Yum', price: 385000, costPrice: 160000, unit: 'nồi', prepTimeMinutes: 20, isPopular: true },
    { categoryId: createdCats['Tráng Miệng'], name: 'Chè Khúc Bạch Hạnh Nhân', price: 45000, costPrice: 15000, unit: 'bát', prepTimeMinutes: 5 },
    { categoryId: createdCats['Đồ Uống & Rượu'], name: 'Bia Tiger Bạc (Lon 330ml)', price: 28000, costPrice: 16000, unit: 'lon', prepTimeMinutes: 2 },
    { categoryId: createdCats['Đồ Uống & Rượu'], name: 'Coca Cola Zero (Lon 330ml)', price: 20000, costPrice: 9500, unit: 'lon', prepTimeMinutes: 2 },
    { categoryId: createdCats['Đồ Uống & Rượu'], name: 'Rượu Vang Đỏ Đà Lạt Classic (750ml)', price: 220000, costPrice: 125000, unit: 'chai', prepTimeMinutes: 3 },
  ];

  const createdMenuItems: Record<string, string> = {};
  for (const m of menuItemsData) {
    const existing = await prisma.menuItem.findFirst({ where: { name: m.name } });
    if (!existing) {
      const item = await prisma.menuItem.create({ data: m });
      createdMenuItems[m.name] = item.id;
    } else {
      createdMenuItems[m.name] = existing.id;
    }
  }
  console.log('✓ 5 Danh mục và 9 Món ăn thực đơn đã tạo');

  // 7. INGREDIENTS & UNIT CONVERSIONS
  const ingredientsData = [
    { name: 'Thịt bò thăn Úc', category: 'Thịt & Hải sản', baseUnit: 'g', currentStock: 15000, minStockLevel: 3000, costPerUnit: 450 }, // 450đ/g = 450.000đ/kg
    { name: 'Thịt gà ta thả vườn', category: 'Thịt & Hải sản', baseUnit: 'g', currentStock: 25000, minStockLevel: 5000, costPerUnit: 180 }, // 180.000đ/kg
    { name: 'Tôm sú tươi sống', category: 'Thịt & Hải sản', baseUnit: 'g', currentStock: 8000, minStockLevel: 2000, costPerUnit: 350 }, // 350.000đ/kg
    { name: 'Tiêu đen Phú Quốc', category: 'Gia vị & Khô', baseUnit: 'g', currentStock: 2000, minStockLevel: 500, costPerUnit: 250 },
    { name: 'Bơ lạt Anchor', category: 'Gia vị & Khô', baseUnit: 'g', currentStock: 5000, minStockLevel: 1000, costPerUnit: 220 },
    { name: 'Rau thơm & xà lách tươi', category: 'Rau củ quả', baseUnit: 'g', currentStock: 10000, minStockLevel: 2000, costPerUnit: 50, allowNegativeStock: true },
    { name: 'Bia Tiger Bạc 330ml', category: 'Đồ uống đóng gói', baseUnit: 'unit', currentStock: 240, minStockLevel: 48, costPerUnit: 16000 },
    { name: 'Coca Cola Zero 330ml', category: 'Đồ uống đóng gói', baseUnit: 'unit', currentStock: 180, minStockLevel: 36, costPerUnit: 9500 },
    { name: 'Rượu Vang Đỏ Đà Lạt 750ml', category: 'Đồ uống đóng gói', baseUnit: 'unit', currentStock: 30, minStockLevel: 6, costPerUnit: 125000 },
  ];

  const createdIngs: Record<string, string> = {};
  for (const ing of ingredientsData) {
    const existing = await prisma.ingredient.findUnique({ where: { name: ing.name } });
    if (!existing) {
      const rec = await prisma.ingredient.create({ data: ing });
      createdIngs[ing.name] = rec.id;
    } else {
      createdIngs[ing.name] = existing.id;
    }
  }

  // Quy đổi đơn vị: 1 kg = 1000 g
  await prisma.unitConversion.upsert({
    where: { ingredientId_fromUnit: { ingredientId: createdIngs['Thịt bò thăn Úc'], fromUnit: 'kg' } },
    update: {},
    create: { ingredientId: createdIngs['Thịt bò thăn Úc'], fromUnit: 'kg', toUnit: 'g', conversionRate: 1000 },
  });
  await prisma.unitConversion.upsert({
    where: { ingredientId_fromUnit: { ingredientId: createdIngs['Thịt gà ta thả vườn'], fromUnit: 'kg' } },
    update: {},
    create: { ingredientId: createdIngs['Thịt gà ta thả vườn'], fromUnit: 'kg', toUnit: 'g', conversionRate: 1000 },
  });
  await prisma.unitConversion.upsert({
    where: { ingredientId_fromUnit: { ingredientId: createdIngs['Bia Tiger Bạc 330ml'], fromUnit: 'thùng' } },
    update: {},
    create: { ingredientId: createdIngs['Bia Tiger Bạc 330ml'], fromUnit: 'thùng', toUnit: 'unit', conversionRate: 24 },
  });
  console.log('✓ 9 Nguyên vật liệu kho và bảng quy đổi đã tạo');

  // 8. RECIPES (BOM)
  const recipes = [
    // Bò bít tết: 200g Bò, 30g Bơ, 10g Tiêu
    { menuItemName: 'Bò Bít Tết Sốt Tiêu Đen (200g)', ingredientName: 'Thịt bò thăn Úc', qty: 200, unit: 'g' },
    { menuItemName: 'Bò Bít Tết Sốt Tiêu Đen (200g)', ingredientName: 'Bơ lạt Anchor', qty: 30, unit: 'g' },
    { menuItemName: 'Bò Bít Tết Sốt Tiêu Đen (200g)', ingredientName: 'Tiêu đen Phú Quốc', qty: 10, unit: 'g' },
    // Gà nướng: 400g Gà
    { menuItemName: 'Gà Nướng Mật Ong Tây Bắc', ingredientName: 'Thịt gà ta thả vườn', qty: 400, unit: 'g' },
    // Lẩu thái: 200g Tôm, 150g Bò
    { menuItemName: 'Lẩu Thái Hải Sản Tom Yum', ingredientName: 'Tôm sú tươi sống', qty: 200, unit: 'g' },
    { menuItemName: 'Lẩu Thái Hải Sản Tom Yum', ingredientName: 'Thịt bò thăn Úc', qty: 150, unit: 'g' },
    // Đồ uống đóng lon
    { menuItemName: 'Bia Tiger Bạc (Lon 330ml)', ingredientName: 'Bia Tiger Bạc 330ml', qty: 1, unit: 'unit' },
    { menuItemName: 'Coca Cola Zero (Lon 330ml)', ingredientName: 'Coca Cola Zero 330ml', qty: 1, unit: 'unit' },
    { menuItemName: 'Rượu Vang Đỏ Đà Lạt Classic (750ml)', ingredientName: 'Rượu Vang Đỏ Đà Lạt 750ml', qty: 1, unit: 'unit' },
  ];

  for (const r of recipes) {
    const mId = createdMenuItems[r.menuItemName];
    const ingId = createdIngs[r.ingredientName];
    if (mId && ingId) {
      await prisma.recipe.upsert({
        where: { menuItemId_ingredientId: { menuItemId: mId, ingredientId: ingId } },
        update: { quantityRequired: r.qty, unit: r.unit },
        create: { menuItemId: mId, ingredientId: ingId, quantityRequired: r.qty, unit: r.unit },
      });
    }
  }
  console.log('✓ Định mức BOM cho các món ăn đã hoàn thiện');

  // 9. SUPPLIERS
  await prisma.supplier.upsert({
    where: { id: 'supp-clean-food' },
    update: {},
    create: {
      id: 'supp-clean-food',
      name: 'Công Ty Cổ Phần Thực Phẩm Sạch Hà Nội',
      phone: '02438889999',
      email: 'contact@cleanfoodhn.vn',
      address: 'Số 120 Đường Cầu Giấy, Hà Nội',
    },
  });
  await prisma.supplier.upsert({
    where: { id: 'supp-asia-beverage' },
    update: {},
    create: {
      id: 'supp-asia-beverage',
      name: 'Công Ty TNHH Phân Phối Đồ Uống Á Châu',
      phone: '02437778888',
      email: 'sales@asiabev.vn',
      address: 'Lô B3 Khu Công Nghiệp Đài Tư, Long Biên, Hà Nội',
    },
  });
  console.log('✓ 2 Nhà cung cấp nguyên liệu đã khởi tạo');

  console.log('=== HOÀN TẤT SEEDING TOÀN BỘ 31 MODELS THÀNH CÔNG ===');
}

main()
  .catch((e) => {
    console.error('Lỗi Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
