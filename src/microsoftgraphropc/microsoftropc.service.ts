import { BadRequestException, Injectable } from "@nestjs/common";
import * as msal from "@azure/msal-node";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MicrosofGraphRpcService {

    private msalClient: msal.ConfidentialClientApplication;
    private accessToken: string;
    private tokenExpiry: number;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.msalClient = new msal.ConfidentialClientApplication({
            auth: {
                clientId: this.configService.get<string>('CLIENT_ID'),
                clientSecret: this.configService.get<string>('CLIENT_SECRET'),
                authority: this.configService.get<string>('AUTHORITY'),
            }
        });
    }


    // Função para obter o token usando o fluxo ROPC (sem interação com o usuário)
    async loginWithUsernameAndPassword() {
        const tokenRequest = {
            scopes: ['user.read'],
            username: this.configService.get<string>('MICROSOFT_GRAPH_ROPC_USER'),
            password: this.configService.get<string>('MICROSOFT_GRAPH_ROPC_PASSWORD'),
        };

        try {
            const response = await this.msalClient.acquireTokenByUsernamePassword(tokenRequest);
            this.tokenExpiry = response.expiresOn.getTime();
            this.accessToken = response.accessToken;
            return this.accessToken;
        } catch (error) {
            console.log(error);
            throw new BadRequestException('Falha na autenticação');
        }
    }

    // Inicializa o token de acesso (caso não esteja presente ou expirado)
    async initializeAccessToken() {
        if (!this.accessToken || Date.now() > this.tokenExpiry - 2000) {
            await this.loginWithUsernameAndPassword();
        }

        return this.accessToken;
    }

    // Retorna o token de acesso
    async getAccessToken() {
        return this.initializeAccessToken();
    }
}
