import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '../../../generated/prisma/enums';

const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.loginUser
);

router.post(
  '/test',
  auth(UserRole.SUPER_ADMIN),
  AuthController.getTokenForTest
);

router.post(
  '/change-password',
  validateRequest(AuthValidation.changePasswordZodSchema),
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthController.changePassword
);

router.get(
  '/me',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthController.getMe
);

router.post(
  '/logout',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthController.logoutUser
);

export const AuthRoutes = router;
