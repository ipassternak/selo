import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { AppConfigDto } from '@config/app.dto';

@Injectable()
export class OAuthGoogleStrategy extends PassportStrategy(
  Strategy,
  'oauth-google',
) {
  constructor(configService: ConfigService<AppConfigDto, true>) {
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
    done(null, profile);
  }
}
