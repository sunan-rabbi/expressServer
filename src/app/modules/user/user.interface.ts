import type { UserRole } from '../../../generated/prisma/enums';

export type IAdmin = {
  password: string;
  admin: {
    email: string;
    name: string;
    phone: string;
  };
};

export type IOwner = {
  password: string;
  owner: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
    businessName?: string;
    businessType?: string;
    taxId?: string;
  };
};

export interface IAdminSearch {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isDeleted: boolean;
  profilePicture: string | null;
  createdAt: Date;
  updatedAt: Date;
}
