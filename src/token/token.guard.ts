import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService } from "./token.service";

// Protege rotas de envio: exige um token valido e ativo.
// O token vem no header "Authorization: Bearer <token>" (ou no corpo, campo "token", como fallback).
@Injectable()
export class TokenGuard implements CanActivate {
    constructor(private readonly tokenService: TokenService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const authHeader = (request.headers["authorization"] as string) || "";
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        const token: string = (match ? match[1].trim() : undefined) || request.body?.token;

        if (!token) {
            throw new UnauthorizedException("Token não informado (envie em 'Authorization: Bearer <token>').");
        }

        const registro = await this.tokenService.validarToken(token);
        if (!registro) {
            throw new UnauthorizedException("Token inválido ou inativo.");
        }

        // Anexa o token validado na request para uso no controller/auditoria
        request.apiToken = registro;
        return true;
    }
}
