import { Module } from "@nestjs/common";
import { HttpModule } from "src/http/http.module";
import { MicrosoftGraphAppModule } from "src/microsoftgraphapp/microsoftapp.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { TeamsService } from "./teams.service";
import { TeamsController } from "./teams.controller";
import { MicrosoftGraphRpcModule } from "src/microsoftgraphropc/microsoftropc.module";
import { ConfigModule } from "@nestjs/config";

@Module(
    {
        imports: [
            PrismaModule,
            HttpModule,
            MicrosoftGraphAppModule,
            MicrosoftGraphRpcModule,
            ConfigModule.forRoot()
        ],
        controllers: [TeamsController],
        providers: [TeamsService],
        exports: [TeamsService]
    }
)
export class TeamsModule {}