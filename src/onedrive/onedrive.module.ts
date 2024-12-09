import { Module } from "@nestjs/common";
import { HttpModule } from "src/http/http.module";
import { MicrosoftGraphAppModule } from "src/microsoftgraphapp/microsoftapp.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { OneDriveService } from "./onedrive.service";
@Module(
    {
        imports: [
            PrismaModule,
            HttpModule,
            MicrosoftGraphAppModule
        ],
        controllers: [],
        providers: [OneDriveService],
        exports: [OneDriveService]
    }
)
export class OneDriveModule {}