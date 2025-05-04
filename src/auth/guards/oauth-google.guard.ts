import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportGuard } from '@nestjs/passport';

@Injectable()
export class OAuthGoogleGuard extends PassportGuard('oauth-google') {
  constructor() {
    super({
      property: 'oauthProfile',
    });
  }
}
