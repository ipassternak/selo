import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  SetMetadata,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AuthAccessPayload } from '@lib/types/auth';
import { RoleId } from '@lib/types/user';
import { AppException } from '@lib/utils/exception';
import { UserService } from '@src/user/user.service';

export interface Options {
  /**
   * The key to access the payload in the request object.
   * @default 'accessPayload'
   */
  accessPayloadKey?: string;

  /**
   * Override the default app exception.
   */
  exceptionFactory?: () => Error;

  /**
   * The roles to check against.
   */
  roleIds: RoleId[];
}

export interface RolesEnforcer {
  /**
   * Checks if the user has the required roles.
   * @param accessPayload The access payload from the request.
   * @param requiredRoles The roles to check against.
   * @returns True if the user has the required roles, false otherwise.
   */
  checkUserRoles(
    accessPayload: AuthAccessPayload,
    requiredRoles: RoleId[],
  ): Promise<boolean>;
}

const ROLES_OPTIONS_META_KEY = 'GUARD:ROLES_OPTIONS_META_KEY';

export class RolesGuard implements CanActivate {
  @Inject(Reflector)
  private readonly reflector: Reflector;

  @Inject(UserService)
  private readonly rolesEnforcer: RolesEnforcer;

  async enforce(options: Options, request: Request): Promise<boolean> {
    if (options.roleIds.length === 0) return false;

    const accessPayload = <AuthAccessPayload | undefined>(
      Reflect.get(request, options.accessPayloadKey ?? 'accessPayload')
    );

    if (!accessPayload) return false;

    const res = await this.rolesEnforcer.checkUserRoles(
      accessPayload,
      options.roleIds,
    );

    return res;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<Options | undefined>(
      ROLES_OPTIONS_META_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? { roleIds: [] };

    const request = context.switchToHttp().getRequest<Request>();

    const success = await this.enforce(options, request).catch(() => false);

    if (!success) {
      if (options.exceptionFactory) throw options.exceptionFactory();

      throw new AppException(
        'Unsufficient permissions',
        HttpStatus.FORBIDDEN,
        'AUTH_ERR_FORBIDDEN',
      );
    }

    return true;
  }
}

export const Roles = (options: Options): MethodDecorator & ClassDecorator =>
  applyDecorators(
    SetMetadata(ROLES_OPTIONS_META_KEY, options),
    UseGuards(RolesGuard),
  );
