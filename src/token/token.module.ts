import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";
import { TokenGuard } from "./token.guard";
import { AdminGuard } from "./admin.guard";

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [TokenController],
    providers: [TokenService, TokenGuard, AdminGuard],
    exports: [TokenService, TokenGuard],
})
export class TokenModule { }
