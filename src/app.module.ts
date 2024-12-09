import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenIaService } from './openia/openIa.service';
import { openIaModule } from './openia/openIa.module';
import { ConfigModule } from '@nestjs/config';
import { MicrosoftGraphAppModule } from './microsoftgraphapp/microsoftapp.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HttpModule } from './http/http.module';
import { OneDriveModule } from './onedrive/onedrive.module';
import { TeamsModule } from './teams/teams.module';
import { MicrosoftGraphRpcModule } from './microsoftgraphropc/microsoftropc.module';
import { MicrosoftGraphDelegatedModule } from './microsoftgraphdelegated/microsoftdelegated.module';


@Module({
  imports: [
    openIaModule,
    MicrosoftGraphAppModule,
    PrismaModule,
    HttpModule,
    OneDriveModule,
    TeamsModule,
    MicrosoftGraphDelegatedModule,
    MicrosoftGraphRpcModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
