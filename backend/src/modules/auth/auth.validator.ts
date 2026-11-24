import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

export const activateAccountSchema = z.object({
  token: z.string().min(1, 'Mã kích hoạt không được để trống'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu mới phải có tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Mật khẩu mới phải chứa ít nhất 1 chữ số'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu cũ không được để trống'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu mới phải có tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Mật khẩu mới phải chứa ít nhất 1 chữ số'),
});

export const requestResetTokenSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
});
