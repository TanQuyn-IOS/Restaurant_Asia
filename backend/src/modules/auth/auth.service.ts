import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import {
  generateAccessToken,
  generateRefreshTokenPair,
  hashToken,
} from '../../utils/token';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors';
import { logAudit } from '../../middlewares/audit.middleware';

// Bộ nhớ cache tạm thời cho Cửa sổ Ân Hạn (Grace Period 30 giây)
const gracePeriodCache = new Map<string, { newAccessToken: string; newRefreshToken: string; expiresAt: number }>();

export class AuthService {
  async login(username: string, passwordPlain: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      await logAudit({
        action: 'LOGIN_FAILED_USERNAME_NOT_FOUND',
        entityName: 'User',
        entityId: username,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản trị viên');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      await logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED_WRONG_PASSWORD',
        entityName: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    // Cập nhật lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Sinh Access Token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role.name,
      tokenVersion: user.tokenVersion,
    });

    // Sinh Refresh Token có gia đình (family)
    const { rawToken, tokenHash } = generateRefreshTokenPair();
    const family = crypto.randomUUID();

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      },
    });

    await logAudit({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityName: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: rawToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role.name,
        roleTitle: user.role.title,
        mustChangePassword: user.mustChangePassword,
        isActivated: user.isActivated,
      },
    };
  }

  async refreshToken(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);

    // 1. Kiểm tra trong Grace Period Cache (30s)
    const cached = gracePeriodCache.get(tokenHash);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        accessToken: cached.newAccessToken,
        refreshToken: cached.newRefreshToken,
      };
    }

    // 2. Tìm trong Database
    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!existingToken) {
      throw new UnauthorizedError('Refresh Token không tồn tại hoặc không hợp lệ');
    }

    // 3. Nếu token đã bị thu hồi (Replay Attack ngoài 30s) -> Kích hoạt Family Revocation
    if (existingToken.isRevoked) {
      await prisma.refreshToken.updateMany({
        where: { family: existingToken.family },
        data: { isRevoked: true },
      });
      // Tăng tokenVersion để hủy luôn Access Token hiện hữu
      await prisma.user.update({
        where: { id: existingToken.userId },
        data: { tokenVersion: { increment: 1 } },
      });

      await logAudit({
        userId: existingToken.userId,
        action: 'TOKEN_REUSE_DETECTED_FAMILY_REVOKED',
        entityName: 'RefreshToken',
        entityId: existingToken.id,
      });

      throw new UnauthorizedError('Phát hiện token bị tái sử dụng trái phép! Toàn bộ phiên làm việc đã bị hủy');
    }

    // 4. Nếu token đã hết hạn
    if (existingToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh Token đã hết hạn, vui lòng đăng nhập lại');
    }

    const user = existingToken.user;
    if (!user.isActive) {
      throw new ForbiddenError('Tài khoản đã bị khóa');
    }

    // 5. Thu hồi token cũ và sinh token mới (Refresh Token Rotation)
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { isRevoked: true },
    });

    const newAccess = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role.name,
      tokenVersion: user.tokenVersion,
    });

    const { rawToken: newRawRefresh, tokenHash: newRefreshHash } = generateRefreshTokenPair();

    await prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshHash,
        userId: user.id,
        family: existingToken.family, // Kế thừa family
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 6. Lưu token cũ vào Grace Period Cache 30 giây
    gracePeriodCache.set(tokenHash, {
      newAccessToken: newAccess,
      newRefreshToken: newRawRefresh,
      expiresAt: Date.now() + 30 * 1000,
    });

    return {
      accessToken: newAccess,
      refreshToken: newRawRefresh,
    };
  }

  async activateAccount(token: string, newPasswordPlain: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = hashToken(token);

    // Atomic Check-and-Set: Chỉ cập nhật khi used_at IS NULL và còn hạn
    const now = new Date();
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < now) {
      throw new BadRequestError('Mã kích hoạt không hợp lệ, đã được sử dụng hoặc đã hết hạn');
    }

    const hashedPassword = await bcrypt.hash(newPasswordPlain, 12);

    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: now },
      }),
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: hashedPassword,
          isActivated: true,
          mustChangePassword: false,
          tokenVersion: { increment: 1 },
        },
      }),
    ]);

    await logAudit({
      userId: resetRecord.userId,
      action: 'ACCOUNT_ACTIVATED',
      entityName: 'User',
      entityId: resetRecord.userId,
      ipAddress,
      userAgent,
    });

    return { message: 'Kích hoạt tài khoản và đặt mật khẩu mới thành công' };
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Mật khẩu cũ không chính xác');
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
        tokenVersion: { increment: 1 }, // Hủy các access token cũ
      },
    });

    await logAudit({
      userId,
      action: 'PASSWORD_CHANGED',
      entityName: 'User',
      entityId: userId,
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }
    return { message: 'Đăng xuất thành công' };
  }
}
