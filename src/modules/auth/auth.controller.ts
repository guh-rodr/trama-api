import { CookieSerializeOptions } from '@fastify/cookie';
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SignInUserBodyDto } from './dto/signin-user.dto';
import { SignUpUserBodyDto } from './dto/signup-user.dto';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  private storeCookies(response: FastifyReply, accessToken: string, refreshToken: string) {
    const cookieOptions: CookieSerializeOptions = {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: this.configService.get('NODE_ENV') === 'production',
    };

    response.setCookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    response.setCookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
  }

  @Public()
  @Post('/signup')
  async signUp(@Body() body: SignUpUserBodyDto) {
    return this.authService.signUp(body);
  }

  @Public()
  @Post('/signin')
  async signIn(@Body() body: SignInUserBodyDto, @Res({ passthrough: true }) response: FastifyReply) {
    const { user, accessToken, refreshToken } = await this.authService.signIn(body);

    this.storeCookies(response, accessToken, refreshToken);

    return user;
  }

  @Public()
  @Post('/signout')
  async signOut(@Req() request: FastifyRequest, @Res({ passthrough: true }) response: FastifyReply) {
    const refreshToken = request.cookies['refreshToken'];

    await this.authService.signOut(refreshToken);

    response.clearCookie('accessToken', { path: '/' });
    response.clearCookie('refreshToken', { path: '/' });
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() request: FastifyRequest) {
    const user = request['user'];

    return user;
  }

  @Public()
  @Post('/refresh')
  async refreshTokens(@Req() request: FastifyRequest, @Res({ passthrough: true }) response: FastifyReply) {
    const oldRefreshToken = request.cookies['refreshToken'];

    const { accessToken, refreshToken } = await this.authService.refreshTokens(oldRefreshToken);

    this.storeCookies(response, accessToken, refreshToken);
  }
}
