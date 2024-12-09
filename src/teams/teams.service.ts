import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MicrosoftHttpService } from "src/http/http.microsoft.service";
import { MicrosofGraphRpcService } from "src/microsoftgraphropc/microsoftropc.service";

@Injectable()
export class TeamsService {

    constructor(
        private readonly http: MicrosoftHttpService,
        private readonly microsoftGraphRpcService: MicrosofGraphRpcService,
        private readonly configService: ConfigService,
    ) { }

    async EnviaMensagem() {
        const nomeChat = "Análise de risco | Comitê";
        const usuario = await this.listaUsuariosPorEmail(this.configService.get<string>('MICROSOFT_GRAPH_ROPC_USER'));
        const chats = await this.listaChatUsuario(usuario.id);
        const chatSelecionado = chats.find((chat: any) => chat.topic === nomeChat);

        if (!chatSelecionado) {
            throw new BadRequestException("Chat não encontrado");
        }

        await this.enviarMensagemChat(chatSelecionado.id, "Teste de mensagem");
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

        } catch (error) {
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

        } catch (error) {
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

        } catch (error) {
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

        } catch (error) {
            console.log(error.message || "Erro ao buscar canal");
        }
    }

    async enviarMensagemCanal(idEquipe: string, idCanal: string, mensagem: string) {
        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.post(`https://graph.microsoft.com/v1.0/teams/${idEquipe}/channels/${idCanal}/messages`, {
                body: {
                    content: mensagem
                }
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return result.data;

        } catch (error) {
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
        } catch (error) {
            console.log(error.response?.data || "Erro ao criar canal");
            throw new BadRequestException(error.message || "Erro ao criar canal");
        }

    }

    async enviarMensagemChat(idChat: string, mensagem: string) {
        try {
            const token = await this.microsoftGraphRpcService.getAccessToken();
            const result = await this.http.axios.post(`https://graph.microsoft.com/v1.0/chats/${idChat}/messages`, {
                body: {
                    content: mensagem
                }
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return result.data;

        } catch (error) {
            console.log(error.response?.data || "Erro ao enviar mensagem");
            throw new BadRequestException(error.message || "Erro ao enviar mensagem");
        }
    }

}

