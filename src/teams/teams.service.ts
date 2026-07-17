import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MicrosoftHttpService } from "src/http/http.microsoft.service";
import { MicrosofGraphRpcService } from "src/microsoftgraphropc/microsoftropc.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TeamsService {

    constructor(
        private readonly http: MicrosoftHttpService,
        private readonly microsoftGraphRpcService: MicrosofGraphRpcService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async EnviaMensagem(nomeChat: string, mensagem: string, token: string, tokenNome?: string) {
        if (!nomeChat || !mensagem) {
            throw new BadRequestException("Informe 'chat' (nome do grupo) e 'mensagem'.");
        }

        try {
            const chats = await this.listaTodosChats();
            const alvo = nomeChat.trim().toLowerCase();
            const chatSelecionado = chats.find((c: any) => (c.topic || "").trim().toLowerCase() === alvo);

            if (!chatSelecionado) {
                const disponiveis = chats.filter((c: any) => c.topic).map((c: any) => c.topic);
                throw new BadRequestException(
                    `Chat "${nomeChat}" não encontrado. A conta remetente precisa ser membro do grupo. ` +
                    `Grupos disponíveis: ${disponiveis.join(" | ") || "(nenhum grupo com nome)"}`
                );
            }

            const resultado = await this.enviarMensagemChat(chatSelecionado.id, mensagem);

            await this.registrarLog({
                chat: chatSelecionado.topic,
                mensagem,
                status: "SUCESSO",
                messageId: resultado?.id,
                token,
                tokenNome,
            });

            return { ok: true, chat: chatSelecionado.topic, messageId: resultado?.id };
        } catch (error: any) {
            // Auditoria tambem das tentativas que falharam
            await this.registrarLog({
                chat: nomeChat,
                mensagem,
                status: "ERRO",
                erro: error?.response?.data ? JSON.stringify(error.response.data) : error?.message,
                token,
                tokenNome,
            });
            throw error;
        }
    }

    // Grava um registro de auditoria de uma mensagem disparada (nunca derruba o fluxo)
    private async registrarLog(dados: {
        chat: string;
        mensagem: string;
        status: string;
        messageId?: string;
        erro?: string;
        token: string;
        tokenNome?: string;
    }) {
        try {
            await this.prisma.messageLog.create({ data: dados });
        } catch (e: any) {
            console.error("Falha ao gravar log de auditoria:", e?.message);
        }
    }

    // Lista TODOS os chats do usuário autenticado, seguindo a paginação do Graph.
    async listaTodosChats() {
        const token = await this.microsoftGraphRpcService.getAccessToken();
        let url = "https://graph.microsoft.com/v1.0/me/chats?$top=50";
        const todos: any[] = [];

        try {
            while (url) {
                const result = await this.http.axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                todos.push(...result.data.value);
                url = result.data["@odata.nextLink"] || null;
            }
            return todos;
        } catch (error: any) {
            console.log(error.response?.data || error.message);
            throw new BadRequestException("Erro ao listar os chats da conta remetente");
        }
    }

    async listaUsuariosPorEmail(email: string) {

        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.get(`https://graph.microsoft.com/v1.0/users?$filter=mail eq '${email}'`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const [data] = result.data.value;

            if (!data) {
                throw new BadRequestException("Usuário não encontrado");
            }

            return data;

        } catch (error: any) {
            console.log(error.response.data)
            throw new BadRequestException(error.message || "Erro ao buscar usuário");
        }

    }

    async listaChatUsuario(idUsuario: string) {

        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();

            const result = await this.http.axios.get(`https://graph.microsoft.com/v1.0/users/${idUsuario}/chats`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const chats = result.data.value;

            if (!chats.length) {
                throw new BadRequestException("Chat não encontrado");
            }

            return chats;

        } catch (error: any) {
            console.log(error.message || "Erro ao buscar chat");
        }
    }

    async listaEquipesPorUsuario(idUsuario: string) {
        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.get(`https://graph.microsoft.com/v1.0/users/${idUsuario}/joinedTeams`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const equipes = result.data.value;

            if (!equipes.length) {
                throw new BadRequestException("Equipe não encontrada");
            }

            return equipes;

        } catch (error: any) {
            console.log(error.message || "Erro ao buscar equipe");
        }

    }

    async listaCanaisPorEquipe(idEquipe: string) {
        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.get(`https://graph.microsoft.com/v1.0/teams/${idEquipe}/channels`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const canais = result.data.value;

            if (!canais.length) {
                throw new BadRequestException("Canal não encontrado");
            }

            return canais;

        } catch (error: any) {
            console.log(error.message || "Erro ao buscar canal");
        }
    }

    async enviarMensagemCanal(idEquipe: string, idCanal: string, mensagem: string) {
        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.post(`https://graph.microsoft.com/v1.0/teams/${idEquipe}/channels/${idCanal}/messages`, {
                body: {
                    contentType: this.tipoConteudo(mensagem),
                    content: mensagem
                }
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return result.data;

        } catch (error: any) {
            console.log(error.response?.data || "Erro ao enviar mensagem");
            throw new BadRequestException(error.message || "Erro ao enviar mensagem");
        }
    }

    async criaCanalMigracao(idEquipe: string) {
        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.post(`https://graph.microsoft.com/v1.0/teams/${idEquipe}/channels`, {
                "@microsoft.graph.channelCreationMode": "migration",
                "displayName": "Architecture Discussion",
                "description": "This channel is where we debate all future architecture plans",
                "membershipType": "standard",
                "isFavoriteByDefault": true,
                "createdDateTime": "2020-03-14T11:22:17.047Z"

            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("Canal criado com sucesso");
            return result.data;
        } catch (error: any) {
            console.log(error.response?.data || "Erro ao criar canal");
            throw new BadRequestException(error.message || "Erro ao criar canal");
        }

    }

    // Se a mensagem contem tags HTML (ex.: <b>, <br>), envia como "html" para o Teams
    // renderizar; sem tags, envia como "text" (preserva quebras de linha \n).
    private tipoConteudo(mensagem: string): "html" | "text" {
        return /<\/?[a-z][^>]*>/i.test(mensagem) ? "html" : "text";
    }

    async enviarMensagemChat(idChat: string, mensagem: string) {
        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.post(`https://graph.microsoft.com/v1.0/chats/${idChat}/messages`, {
                body: {
                    contentType: this.tipoConteudo(mensagem),
                    content: mensagem
                }
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return result.data;

        } catch (error: any) {
            console.log(error.response?.data || "Erro ao enviar mensagem");
            throw new BadRequestException(error.message || "Erro ao enviar mensagem");
        }
    }

}

