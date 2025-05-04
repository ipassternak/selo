import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportGuard } from '@nestjs/passport';

@Injectable()
export class OAuthGithubGuard extends PassportGuard('oauth-github') {
  constructor() {
    super({
      property: 'oauthProfile',
    });
  }
}
