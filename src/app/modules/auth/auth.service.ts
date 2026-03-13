import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';

import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { type Request } from 'express';
import { getDeviceInfo } from '../../../helpers/getDeviceInfo';
import { createPrismaToken } from '../../../helpers/createPrismaToken';
import { bcryptUtils } from '../../../helpers/bcrypt';
import type { IChangePassword, ILoginUser } from './auth.interface';
import { prisma } from '../../../lib/prisma';
import { UserStatus } from '../../../generated/prisma/enums';
import type { JWTPayload } from '../../../interface';

const loginUser = async (req: Request) => {
  const payload: ILoginUser = req.body;

  const { device, ip } = getDeviceInfo(req);

  const { phone, password } = payload;

  const user = await prisma.user.findUnique({
    where: {
      phone,
      status: UserStatus.ACTIVE,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  const isPasswordMatch =
    user.password &&
    (await bcryptUtils.comparePasswords(password, user.password));

  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
  }

  const JwtPayload = {
    userId: user.id,
    role: user.role,
    phone: user.phone,
    email: user.email,
  };

  const token = await jwtHelpers.generateTokenPair(JwtPayload);

  const activeTokens = await prisma.activeToken.findMany({
    where: {
      userId: user.id,
      ipAddress: ip,
    },
  });

  activeTokens.forEach(async (t) => {
    await prisma.tokenBlacklist.create({
      data: {
        tokenId: t.tokenId,
        expiresAt: t.expiresAt,
        userId: t.userId,
        ipAddress: t.ipAddress,
        issuedAt: t.createdAt,
        tokenType: t.tokenType,
        reason: 'Replaced by new login',
      },
    });
    await prisma.activeToken.delete({ where: { id: t.id } });
  });

  createPrismaToken({ id: user.id, tokenId: token.tokenId, ip, device });

  return {
    message: 'Login Successful',
    access: token.accessToken,
    refresh: token.refreshToken,
  };
};

const changePassword = async (req: Request) => {
  const user = req.user as JWTPayload;
  const payload: IChangePassword = req.body;

  const isUserExists = await prisma.user.findUniqueOrThrow({
    where: {
      id: user.userId,
      status: 'ACTIVE',
    },
  });

  const isPasswordMatch =
    isUserExists.password &&
    (await bcryptUtils.comparePasswords(
      payload.oldPassword,
      isUserExists.password
    ));

  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
  }

  const hashPassword = await bcryptUtils.hashedPassword(payload.newPassword);

  const result = await prisma.user.update({
    where: {
      id: user.userId,
    },
    data: {
      password: hashPassword,
    },
  });

  return result;
};

const getMe = async (user: JWTPayload) => {
  const { role, userId } = user;

  const result = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      admins: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    id: result.id,
    name: result.admins[0]?.name || null,
    phone: result.phone,
    email: result.email,
    role: result.role,
  };
};

const logout = async (req: Request) => {
  const user = req.user as JWTPayload;

  const activeTokens = await prisma.activeToken.findMany({
    where: {
      userId: user.userId,
    },
  });

  activeTokens.forEach(async (t) => {
    await prisma.tokenBlacklist.create({
      data: {
        tokenId: t.tokenId,
        expiresAt: t.expiresAt,
        userId: t.userId,
        ipAddress: t.ipAddress,
        issuedAt: t.createdAt,
        tokenType: t.tokenType,
        reason: 'Replaced by logout',
      },
    });
    await prisma.activeToken.delete({ where: { id: t.id } });
  });
};

export const AuthService = {
  loginUser,
  changePassword,
  getMe,
  logout,
};
