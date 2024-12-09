import { Controller, Get, Query, Redirect } from "@nestjs/common";
import { MicrosoftDelegatedService } from "./microsoftdelegated.service";

@Controller('auth/delegated')
export class MicrosoftDelegatedController {

    constructor(
        private readonly microsoftDelegatedService: MicrosoftDelegatedService
    ) {}

    @Get('login')
    @Redirect()
    async login() {
        const authorizationUrl = await this.microsoftDelegatedService.getAuthorizationUrl();
        return { url: authorizationUrl };  
    }

    @Get('callback')
    async callback(@Query('code') code: string) {
        try {
            await this.microsoftDelegatedService.exchangeCodeForToken(code);
            return { message: 'Autenticado com sucesso', accessToken: this.microsoftDelegatedService.getAccessToken() };
        } catch (error) {
            return { message: 'Erro ao autenticar', error: error.message };
        }
    }
}
