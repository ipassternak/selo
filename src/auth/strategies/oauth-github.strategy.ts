import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Profile, Strategy } from 'passport-github2';

import { AppConfigDto } from '@config/app.dto';
import { AppException } from '@lib/utils/exception';

@Injectable()
export class OAuthGithubStrategy extends PassportStrategy(
  Strategy,
  'oauth-github',
) {
  private checkEnabled(): void {
    if (!this.configService.get('auth.oauth.github.enabled', { infer: true }))
      throw new AppException(
        'OAuth GitHub is disabled',
        HttpStatus.FORBIDDEN,
        null,
      );
  }

  constructor(
    private readonly configService: ConfigService<AppConfigDto, true>,
  ) {
    super({
      clientID: configService.get('auth.oauth.github.clientId', {
        infer: true,
      }),
      clientSecret: configService.get('auth.oauth.github.clientSecret', {
        infer: true,
      }),
      callbackURL: configService.get('auth.oauth.github.redirectUri', {
        infer: true,
      }),
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<Profile> {
    this.checkEnabled();
    return profile;
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
