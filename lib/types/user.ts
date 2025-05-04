import { Role, User, UserRole } from '@prisma/client';

export enum RoleId {
  Admin = 1,
  User = 2,
}

export type UserWithRoles = User & {
  roles: (UserRole & {
    role: Role;
  })[];
};
