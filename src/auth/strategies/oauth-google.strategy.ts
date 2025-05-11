import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { AppConfigDto } from '@config/app.dto';
import { AppException } from '@lib/utils/exception';

@Injectable()
export class OAuthGoogleStrategy extends PassportStrategy(
  Strategy,
  'oauth-google',
) {
  private checkEnabled(): void {
    if (!this.configService.get('auth.oauth.google.enabled', { infer: true }))
      throw new AppException(
        'OAuth Google is disabled',
        HttpStatus.FORBIDDEN,
        null,
      );
  }

  constructor(
    private readonly configService: ConfigService<AppConfigDto, true>,
  ) {
    super({
      clientID: configService.get('auth.oauth.google.clientId', {
        infer: true,
      }),
      clientSecret: configService.get('auth.oauth.google.clientSecret', {
        infer: true,
      }),
      callbackURL: configService.get('auth.oauth.google.redirectUri', {
        infer: true,
      }),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    this.checkEnabled();
    done(null, profile);
  }

  redirect(url: string, status?: number): void {
    this.checkEnabled();
    super.redirect(url, status);
  }

  authenticate(req: Request, options?: never): void {
    this.checkEnabled();
    super.authenticate(req, options);
  }
}
