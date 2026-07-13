import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// Protege o gerenciador de tokens (/tokens): exige a chave de admin no header "x-admin-key".
// A chave fica em ADMIN_API_KEY no .env.
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const key = request.headers["x-admin-key"] as string;
        const esperado = this.configService.get<string>("ADMIN_API_KEY");

        if (!esperado) {
            throw new UnauthorizedException("ADMIN_API_KEY não configurada no servidor.");
        }
        if (key !== esperado) {
            throw new UnauthorizedException("Chave de admin inválida.");
        }
        return true;
    }
}
