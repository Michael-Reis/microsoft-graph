import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// Protege o gerenciador de tokens (/tokens): exige a chave de admin em "Authorization: Bearer <chave>".
// A chave fica em ADMIN_API_KEY no .env.
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const authHeader = (request.headers["authorization"] as string) || "";
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        const key = match ? match[1].trim() : undefined;

        const esperado = this.configService.get<string>("ADMIN_API_KEY");

        if (!esperado) {
            throw new UnauthorizedException("ADMIN_API_KEY não configurada no servidor.");
        }
        if (!key || key !== esperado) {
            throw new UnauthorizedException("Chave de admin inválida.");
        }
        return true;
    }
}
