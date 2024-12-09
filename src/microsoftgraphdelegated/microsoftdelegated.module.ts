import { Module } from "@nestjs/common";
import { MicrosoftDelegatedService } from "./microsoftdelegated.service";
import { MicrosoftDelegatedController } from "./microsoftdelegated.controller";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    controllers: [MicrosoftDelegatedController],
    providers: [MicrosoftDelegatedService],
})
export class MicrosoftGraphDelegatedModule {}
