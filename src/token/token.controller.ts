import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { TokenService } from "./token.service";
import { AdminGuard } from "./admin.guard";

// Gerenciador de tokens. Todas as rotas exigem a chave de admin (header x-admin-key).
@Controller("tokens")
@UseGuards(AdminGuard)
export class TokenController {
    constructor(private readonly tokenService: TokenService) { }

    // Cria um novo token. Body: { "nome": "Sistema X" }
    @Post()
    async criar(@Body() body: { nome?: string }) {
        return this.tokenService.criarToken(body?.nome ?? "sem-nome");
    }

    // Lista todos os tokens
    @Get()
    async listar() {
        return this.tokenService.listarTokens();
    }

    // Revoga (desativa) um token pelo id
    @Delete(":id")
    async revogar(@Param("id") id: string) {
        return this.tokenService.revogarToken(Number(id));
    }
}
