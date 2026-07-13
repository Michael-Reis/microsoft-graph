import { Processor, WorkerHost } from "@nestjs/bullmq";
import { BadRequestException, Logger } from "@nestjs/common";
import { Job, UnrecoverableError } from "bullmq";
import { EnvioJob, TEAMS_QUEUE } from "./fila.service";
import { TeamsService } from "./teams.service";

// Worker da fila: processa UMA mensagem de cada vez (concurrency: 1).
@Processor(TEAMS_QUEUE, { concurrency: 1 })
export class FilaProcessor extends WorkerHost {
    private readonly logger = new Logger("FilaProcessor");

    constructor(private readonly teamsService: TeamsService) {
        super();
    }

    async process(job: Job<EnvioJob>) {
        const { chat, mensagem, token, tokenNome } = job.data;
        this.logger.log(`Processando job #${job.id} -> "${chat}"`);

        try {
            const resultado = await this.teamsService.EnviaMensagem(chat, mensagem, token, tokenNome);
            // A auditoria (MessageLog) e gravada pelo TeamsService. Aqui so retornamos o resultado.
            return { chat: resultado?.chat, messageId: resultado?.messageId };
        } catch (error: any) {
            // Erro permanente (ex.: chat inexistente / dados invalidos) -> nao adianta repetir.
            if (error instanceof BadRequestException) {
                throw new UnrecoverableError(error.message);
            }
            // Erro transitorio (rede/Graph 429/5xx) -> BullMQ tenta novamente (attempts/backoff).
            throw error;
        }
    }
}
