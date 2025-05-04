import * as crypto from 'node:crypto';

import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Session, User } from '@prisma/client';
import { Profile as OAuthGithubProfile } from 'passport-github2';
import { Profile as OAuthGoogleProfile } from 'passport-google-oauth20';

import { AppConfigDto } from '@config/app.dto';
import { AuthAccessPayload, AuthRefreshPayload } from '@lib/types/auth';
import { RoleId } from '@lib/types/user';
import { AppException, createAppException } from '@lib/utils/exception';
import { PrismaService } from '@src/database/prisma.service';
import { UserResponseDto } from '@src/user/dto/user.dto';
import { UserService } from '@src/user/user.service';

import {
  LoginDataDto,
  RegisterDataDto,
  TokenResponseDto,
} from './dto/auth.dto';
import { generatePassword, hashPassword, validatePassword } from './utils/hash';

export const CredentialsAlreadyTakenException = createAppException(
  'Credentials already taken',
  HttpStatus.CONFLICT,
  'AUTH_ERR_CREDENTIALS_TAKEN',
);

export const ActiveSessionsLimitException = createAppException(
  'Active sessions limit exceeded',
  HttpStatus.UNAUTHORIZED,
  'AUTH_ERR_SESSIONS_LIMIT',
);

export const InvalidCredentialsException = createAppException(
  'Invalid credentials',
  HttpStatus.UNAUTHORIZED,
  'AUTH_ERR_INVALID_CREDENTIALS',
);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService<AppConfigDto, true>,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  private async issueTokens(session: Session): Promise<TokenResponseDto> {
    const accessPayload: AuthAccessPayload = {
      use: 'access',
      gid: session.gid,
      sub: session.sub,
    };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.configService.get('auth.jwt.accessTtlSec', {
        infer: true,
      }),
    });
    const refreshPayload: AuthRefreshPayload = {
      use: 'refresh',
      sid: session.sid,
      gid: session.gid,
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: this.configService.get('auth.jwt.refreshTtlSec', {
        infer: true,
      }),
    });
    return { accessToken, refreshToken };
  }

  private async initSession(user: User): Promise<TokenResponseDto> {
    const isUnlimited = await this.checkSessionLimit(user);
    if (!isUnlimited) throw new ActiveSessionsLimitException();
    const sid = crypto.randomUUID();
    const gid = crypto.randomUUID();
    const sub = user.id;
    const session = await this.prismaService.session.create({
      data: {
        sid,
        gid,
        sub,
      },
    });
    return await this.issueTokens(session);
  }

  private async rotateSession(session: Session): Promise<TokenResponseDto> {
    const gid = crypto.randomUUID();
    await this.prismaService.session.update({
      where: {
        sid: session.sid,
      },
      data: {
        gid,
      },
    });
    const rotated = { ...session, gid };
    return await this.issueTokens(rotated);
  }

  private async revokeSession(session: Session): Promise<void> {
    await this.prismaService.session.delete({
      where: {
        sid: session.sid,
      },
    });
  }

  async cleanupSessions(): Promise<void> {
    const refreshTtl = this.configService.get('auth.jwt.refreshTtlSec', {
      infer: true,
    });
    const expirationDate = new Date(Date.now() - refreshTtl * 1000);
    await this.prismaService.session.deleteMany({
      where: {
        updatedAt: {
          lt: expirationDate,
        },
      },
    });
  }

  async verifyRefresh(payload: AuthRefreshPayload): Promise<boolean> {
    if (payload.use !== 'refresh') return false;
    const session = await this.prismaService.session.findUnique({
      where: {
        sid: payload.sid,
      },
    });
    if (!session) return false;
    const ttl = (Date.now() - session.updatedAt.getTime()) / 1000;
    const refreshTtl = this.configService.get('auth.jwt.refreshTtlSec', {
      infer: true,
    });
    return ttl < refreshTtl;
  }

  async verifyAccess(payload: AuthAccessPayload): Promise<boolean> {
    if (payload.use !== 'access') return false;
    const session = await this.prismaService.session.findFirst({
      where: {
        gid: payload.gid,
      },
    });
    if (!session) return false;
    const ttl = (Date.now() - session.updatedAt.getTime()) / 1000;
    return (
      ttl < this.configService.get('auth.jwt.accessTtlSec', { infer: true })
    );
  }

  private async checkSessionLimit(user: User): Promise<boolean> {
    const limit = this.configService.get('auth.activeSessionsLimit', {
      infer: true,
    });
    if (limit === 0) return true;
    const activeSessionsCount = await this.prismaService.session.count({
      where: {
        sub: user.id,
      },
    });
    return activeSessionsCount < limit;
  }

  async refresh(payload: AuthRefreshPayload): Promise<TokenResponseDto> {
    const session = await this.prismaService.session.findUniqueOrThrow({
      where: {
        sid: payload.sid,
      },
    });
    const isFraud = session.gid !== payload.gid;
    if (isFraud) {
      await this.revokeSession(session);
      throw new UnauthorizedException('Refresh denied. Fraud attempt detected');
    }
    return await this.rotateSession(session);
  }

  async me(payload: AuthAccessPayload): Promise<UserResponseDto> {
    return await this.userService.get(payload.sub);
  }

  async logout(payload: AuthAccessPayload): Promise<void> {
    const session = await this.prismaService.session.findFirstOrThrow({
      where: {
        gid: payload.gid,
      },
    });
    await this.revokeSession(session);
  }

  async register(data: RegisterDataDto): Promise<TokenResponseDto> {
    const { email, username, password } = data;
    const existingUser = await this.userService.checkUnique({
      email,
      username,
    });
    if (existingUser) throw new CredentialsAlreadyTakenException();
    const hashedPassword = await hashPassword(password);
    const user = await this.prismaService.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roles: {
          create: [
            {
              role: {
                connect: {
                  id: RoleId.User,
                },
              },
            },
          ],
        },
      },
    });
    return await this.initSession(user);
  }

  async login(data: LoginDataDto): Promise<TokenResponseDto> {
    const { login, password } = data;
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
    });
    if (!user || !(await validatePassword(password, user.password)))
      throw new InvalidCredentialsException();
    return await this.initSession(user);
  }

  private async loginOauth({
    email,
    username,
  }: {
    email: string;
    username: string;
  }): Promise<TokenResponseDto> {
    const password = await generatePassword();
    const user = await this.prismaService.user
      .upsert({
        where: {
          email,
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          email,
          username,
          password,
        },
      })
      .catch((error: unknown): never => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002')
            throw new CredentialsAlreadyTakenException();
        }
        this.logger.fatal({
          service: `${AuthService.name}.login`,
          error,
          context: { email, username },
        });
        throw new InternalServerErrorException();
      });
    return await this.initSession(user);
  }

  private async redirectLogin({
    email,
    username,
  }: {
    email: string;
    username: string;
  }): Promise<URL> {
    try {
      const tokens = await this.loginOauth({ email, username });
      const url = new URL(
        this.configService.get('auth.oauth.successRedirectUri', {
          infer: true,
        }),
      );
      url.searchParams.set('accessToken', tokens.accessToken);
      url.searchParams.set('refreshToken', tokens.refreshToken);
      return url;
    } catch (error) {
      const url = new URL(
        this.configService.get('auth.oauth.errorRedirectUri', {
          infer: true,
        }),
      );
      const errorCode = error instanceof AppException ? error.errorCode : null;
      url.searchParams.set('errorCode', `${errorCode}`);
      return url;
    }
  }

  async oauthGoogle(profile: OAuthGoogleProfile): Promise<URL> {
    const { emails = [] } = profile;
    const email = emails.find((e) => e.verified) ?? emails[0];
    return await this.redirectLogin({
      email: email.value,
      username: profile.displayName,
    });
  }

  async oauthGithub(profile: OAuthGithubProfile): Promise<URL> {
    const { emails = [] } = profile;
    const email = emails[0];
    return await this.redirectLogin({
      email: email.value,
      username: profile.displayName,
    });
  }
}
