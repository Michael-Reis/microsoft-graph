import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { HttpModule } from './http/http.module';
import { TeamsModule } from './teams/teams.module';
import { MicrosoftGraphRpcModule } from './microsoftgraphropc/microsoftropc.module';
import { TokenModule } from './token/token.module';

// --- Modulos/rotas desativados por enquanto (apenas o Teams esta em uso) ---
// import { OpenIaService } from './openia/openIa.service';
// import { openIaModule } from './openia/openIa.module';
// import { MicrosoftGraphAppModule } from './microsoftgraphapp/microsoftapp.module';
// import { OneDriveModule } from './onedrive/onedrive.module';
// import { MicrosoftGraphDelegatedModule } from './microsoftgraphdelegated/microsoftdelegated.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: Number(config.get<string>('REDIS_PORT') ?? 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          retryStrategy: (times: number) => Math.min(times * 500, 5000),
        },
      }),
    }),
    PrismaModule,
    HttpModule,
    TeamsModule,
    MicrosoftGraphRpcModule,
    TokenModule,
    ScheduleModule.forRoot(),
    // Desativados por enquanto (so o Teams em uso):
    // openIaModule,
    // MicrosoftGraphAppModule,
    // OneDriveModule,
    // MicrosoftGraphDelegatedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
