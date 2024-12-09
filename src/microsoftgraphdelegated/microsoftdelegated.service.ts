import { Injectable } from "@nestjs/common";
import * as msal from "@azure/msal-node";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MicrosoftDelegatedService {
    private msalClient: msal.PublicClientApplication;
    private accessToken: string;
    private tokenExpiry: number;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.msalClient = new msal.PublicClientApplication({
            auth: {
                clientId: this.configService.get<string>('CLIENT_ID'),
                authority: this.configService.get<string>('AUTHORITY'),
            },
        });
    }

    async getAuthorizationUrl() {
        const authCodeUrlRequest = {
            scopes: ['user.read'],  // Alterando para um escopo padrão
            redirectUri: this.configService.get<string>('REDIRECT_URI'),
        };

        const response = await this.msalClient.getAuthCodeUrl(authCodeUrlRequest);
        return response;  // URL de autorização para o usuário se autenticar
    }

    async exchangeCodeForToken(code: string) {
        const tokenRequest = {
            code: code,
            scopes: ['user.read'],  // Escopos desejados para o token
            redirectUri: this.configService.get<string>('REDIRECT_URI'), // Certifique-se de que este URI seja o mesmo registrado no Azure
        };

        try {
            const response = await this.msalClient.acquireTokenByCode(tokenRequest);
            this.tokenExpiry = response.expiresOn.getTime();
            this.accessToken = response.accessToken;
            return this.accessToken;  // Retorna o token de acesso
        } catch (error) {
            console.error('Erro ao trocar código por token:', error);
            throw new Error('Falha na troca do código de autorização por token');
        }
    }

    async initializeAccessToken(code: string) {
        if (!this.accessToken || Date.now() > this.tokenExpiry - 2000) {
            await this.exchangeCodeForToken(code);
        }
    }

    getAccessToken() {
        return this.accessToken;
    }
}
