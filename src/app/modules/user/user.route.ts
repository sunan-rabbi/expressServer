import express from 'express';
import { UserController } from './user.controller';
import { UserValidation } from './user.validations';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

router.post(
  '/',
  validateRequest(UserValidation.createdAdminSchema),
  UserController.createAdmin
);

router.get('/', UserController.getAllAdmins);

router.get('/:id', UserController.getAdminById);

export const userRoutes = router;
