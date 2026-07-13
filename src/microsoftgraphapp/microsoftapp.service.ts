import { Injectable } from "@nestjs/common";
import * as msal from "@azure/msal-node";
import { ConfigService } from "@nestjs/config";
import { FakeHttpService } from "src/http/http.fake.service";

@Injectable()
export class MicrosoftAppService {

    private msalClient: msal.ConfidentialClientApplication;
    public accessToken: string;
    private tokenExpiry: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly fakeHttp: FakeHttpService

    ) {
        this.msalClient = new msal.ConfidentialClientApplication({
            auth: {
                clientId: this.configService.get<string>('CLIENT_ID'),
                authority: this.configService.get<string>('AUTHORITY'),
                clientSecret: this.configService.get<string>('CLIENT_SECRET')
            }
        });
    }

    async onModuleInit() {
        try {
            await this.initializeAccessToken();
        } catch (error) {
            // Nao derruba a aplicacao no boot caso o fluxo app-only (client credentials)
            // ainda nao esteja configurado. O token e obtido sob demanda quando o OneDrive
            // e usado (OneDriveService chama initializeAccessToken antes de cada requisicao).
            console.warn('[MicrosoftAppService] Token app-only nao obtido no boot:', error?.message);
        }
    }

    async initializeAccessToken() {
        if (!this.accessToken || Date.now() > this.tokenExpiry - 2000) {
            this.accessToken = await this.getAccessToken();
        }
    }

    async getAccessToken() {
        const tokenResponse = await this.msalClient.acquireTokenByClientCredential({
            scopes: ["https://graph.microsoft.com/.default"]
        });

        this.tokenExpiry = tokenResponse.expiresOn.getTime();
        return tokenResponse.accessToken;
    }
}
