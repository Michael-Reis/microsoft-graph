import { Module } from "@nestjs/common";
import { MicrosoftAppService } from "./microsoftapp.service";
import { HttpModule } from "src/http/http.module";

@Module({
    imports: [
        HttpModule
    ],
    providers: [
        MicrosoftAppService
    ],
    exports: [MicrosoftAppService],
})
export class MicrosoftGraphAppModule { }