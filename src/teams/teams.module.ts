import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { HttpModule } from "src/http/http.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { TeamsService } from "./teams.service";
import { TeamsController } from "./teams.controller";
import { MicrosoftGraphRpcModule } from "src/microsoftgraphropc/microsoftropc.module";
import { ConfigModule } from "@nestjs/config";
import { TokenModule } from "src/token/token.module";
import { FilaService, TEAMS_QUEUE } from "./fila.service";
import { FilaProcessor } from "./fila.processor";

@Module(
    {
        imports: [
            PrismaModule,
            HttpModule,
            MicrosoftGraphRpcModule,
            ConfigModule.forRoot(),
            TokenModule,
            BullModule.registerQueue({ name: TEAMS_QUEUE })
        ],
        controllers: [TeamsController],
        providers: [TeamsService, FilaService, FilaProcessor],
        exports: [TeamsService]
    }
)
export class TeamsModule {}
