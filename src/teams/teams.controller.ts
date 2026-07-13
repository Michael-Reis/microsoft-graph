import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { FilaService } from "./fila.service";
import { TokenGuard } from "src/token/token.guard";

@Controller('teams')
export class TeamsController {

    constructor(
        private readonly filaService: FilaService
    ) { }

    // Enfileira uma mensagem para envio no Teams (envio ocorre de forma assincrona, um de cada vez).
    // Exige token valido (header "Authorization: Bearer <token>" ou campo "token" no corpo).
    @Post('envia_mensagem')
    @HttpCode(202)
    @UseGuards(TokenGuard)
    async enviaMensagem(
        @Body() body: { chat?: string; nomeChat?: string; mensagem?: string; message?: string },
        @Req() req: any
    ) {
        const chat = body?.chat ?? body?.nomeChat;
        const mensagem = body?.mensagem ?? body?.message;
        const { token, nome } = req.apiToken;
        return this.filaService.enfileirar(chat, mensagem, token, nome);
    }

    // Consulta o status de um item da fila pelo jobId.
    @Get('fila/:id')
    @UseGuards(TokenGuard)
    async statusFila(@Param('id') id: string) {
        const item = await this.filaService.consultar(id);
        if (!item) {
            throw new NotFoundException("Item da fila não encontrado");
        }
        return item;
    }
}
