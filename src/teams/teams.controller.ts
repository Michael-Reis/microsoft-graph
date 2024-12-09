import { Body, Controller, Post } from "@nestjs/common";
import { TeamsService } from "./teams.service";

@Controller('teams')
export class TeamsController {

    constructor(
        private readonly teamsService: TeamsService
    ) { }

    @Post('envia_mensagem')
    async enviaMensagem(
        @Body() body: any
    ) {
        return this.teamsService.EnviaMensagem();
    }
}
