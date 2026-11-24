import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  activateAccountSchema,
  changePasswordSchema,
} from './auth.validator';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    statusCode: 429,
    errorCode: 'TOO_MANY_REQUESTS',
    message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();
const controller = new AuthController();

router.post('/login', loginLimiter, validateRequest({ body: loginSchema }), controller.login);
router.post('/refresh-token', validateRequest({ body: refreshTokenSchema }), controller.refreshToken);
router.post('/activate-account', validateRequest({ body: activateAccountSchema }), controller.activateAccount);
router.post('/logout', controller.logout);

// Yêu cầu xác thực JWT
router.post('/change-password', authenticateJwt, validateRequest({ body: changePasswordSchema }), controller.changePassword);
router.get('/profile', authenticateJwt, controller.getProfile);

export const authRoutes = router;
