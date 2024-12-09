import { Module } from "@nestjs/common";
import { OpenIaService } from "./openIa.service";
import { openIAController } from "./openIa.controller";

@Module({
    imports: [],
    controllers: [openIAController],
    providers: [OpenIaService]
})
export class openIaModule {

}