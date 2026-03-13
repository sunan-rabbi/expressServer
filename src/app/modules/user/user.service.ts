import type { Request } from 'express';
import { prisma } from '../../../lib/prisma';
import type { IAdmin } from './user.interface';
import type { IPaginationOptions } from '../../../interface/common';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { adminSearchableFields } from './user.constant';
import type { Prisma } from '../../../generated/prisma/client';
import { bcryptUtils } from '../../../helpers/bcrypt';

const createAdmin = async (req: Request) => {
  const {
    admin: { name, phone, email },
    password,
  } = req.body as IAdmin;

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingAdmin) {
    throw new Error('Admin with this email already exists');
  }

  const hashedPassword = await bcryptUtils.hashedPassword(password);

  const admin = await prisma.user.create({
    data: {
      phone,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      admins: {
        create: {
          name,
          phone,
          email,
        },
      },
    },
  });

  return admin;
};

const getAllAdmins = async (
  filters: {
    searchTerm?: string;
    name?: string;
    email?: string;
    phone?: string;
  },
  paginationOptions: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions: Prisma.AdminWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: adminSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as const },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  const whereConditions: Prisma.AdminWhereInput = { AND: andConditions };

  const result = await prisma.admin.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.admin.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findFirst({
    where: { id, isDeleted: false },
  });

  return admin;
};

export const UserServices = {
  createAdmin,
  getAllAdmins,
  getAdminById,
};
