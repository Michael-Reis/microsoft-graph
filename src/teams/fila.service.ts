import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const TEAMS_QUEUE = "teams-messages";

export interface EnvioJob {
    chat: string;
    mensagem: string;
    token: string;
    tokenNome?: string;
}

@Injectable()
export class FilaService {
    constructor(
        @InjectQueue(TEAMS_QUEUE) private readonly fila: Queue<EnvioJob>,
    ) { }

    // Coloca a mensagem na fila (Redis) e retorna na hora. O envio ocorre no processador, um de cada vez.
    async enfileirar(chat: string, mensagem: string, token: string, tokenNome?: string) {
        if (!chat || !mensagem) {
            throw new BadRequestException("Informe 'chat' (nome do grupo) e 'mensagem'.");
        }

        const job = await this.fila.add(
            "enviar",
            { chat, mensagem, token, tokenNome },
            {
                attempts: 3, // tenta novamente em caso de falha transitoria
                backoff: { type: "exponential", delay: 3000 },
                removeOnComplete: 1000, // mantem os ultimos 1000 concluidos para consulta
                removeOnFail: 5000,
            },
        );

        return { ok: true, enfileirado: true, jobId: job.id, status: "PENDENTE" };
    }

    // Consulta o status de um item da fila pelo jobId
    async consultar(jobId: string) {
        const job = await this.fila.getJob(jobId);
        if (!job) return null;

        const state = await job.getState(); // waiting | active | completed | failed | delayed ...
        return {
            jobId: job.id,
            status: state,
            chat: job.data.chat,
            tentativas: job.attemptsMade,
            retorno: job.returnvalue ?? null,
            falha: job.failedReason ?? null,
        };
    }
}
