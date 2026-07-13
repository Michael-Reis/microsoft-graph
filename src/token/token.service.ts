import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TokenService {
    constructor(private readonly prisma: PrismaService) { }

    // Cria um novo token de acesso (string aleatoria de 64 hex chars)
    async criarToken(nome: string) {
        const token = randomBytes(32).toString("hex");
        return this.prisma.apiToken.create({
            data: { token, nome },
        });
    }

    // Lista todos os tokens cadastrados
    async listarTokens() {
        return this.prisma.apiToken.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    // Revoga (desativa) um token, sem apaga-lo, para preservar a auditoria
    async revogarToken(id: number) {
        const existe = await this.prisma.apiToken.findUnique({ where: { id } });
        if (!existe) {
            throw new NotFoundException("Token não encontrado");
        }
        return this.prisma.apiToken.update({
            where: { id },
            data: { ativo: false },
        });
    }

    // Valida um token: retorna o registro se existir e estiver ativo, senao null
    async validarToken(token: string) {
        if (!token) return null;
        return this.prisma.apiToken.findFirst({
            where: { token, ativo: true },
        });
    }
}
