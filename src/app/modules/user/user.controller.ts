import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

import { UserServices } from './user.service';
import catchAsync from '../../../lib/catchAsync';
import sendResponse from '../../../lib/sendResponse';
import pick from '../../../lib/pick';
import { adminFilterableFields } from './user.constant';
import { paginationFields } from '../../../const/pagination';

const createAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.createAdmin(req);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin created successfully!',
      data: result,
    });
  }
);

const getAllAdmins = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query, adminFilterableFields);
    const paginationOptions = pick(req.query, paginationFields);

    const result = await UserServices.getAllAdmins(filters, paginationOptions);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admins fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  }
);

const getAdminById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAdminById(req.params.id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin fetched successfully!',
      data: result,
    });
  }
);

export const UserController = {
  createAdmin,
  getAllAdmins,
  getAdminById,
};
