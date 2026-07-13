
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        try {
            await this.$connect();
        } catch (error) {
            // Nao derruba a aplicacao no boot caso o MySQL ainda nao esteja configurado/acessivel.
            // O banco e necessario apenas para o fluxo de OneDrive/valuation, nao para o Teams.
            console.warn('[PrismaService] Falha ao conectar no banco no boot:', error?.message);
        }
    }
}
