import * as fs from 'fs';
import * as path from 'path';
import { Injectable, BadRequestException } from "@nestjs/common";
import { MicrosoftAppService } from "src/microsoftgraphapp/microsoftapp.service";
import { PrismaService } from "src/prisma/prisma.service";
import { MicrosoftHttpService } from "src/http/http.microsoft.service";

@Injectable()
export class OneDriveService {

    constructor(
        private readonly http: MicrosoftHttpService,
        private readonly prismaService: PrismaService,
        private readonly microsoftService: MicrosoftAppService
    ) { }

    async ListaPastasOneDrive(email: string) {
        try {
            await this.microsoftService.initializeAccessToken();
            const accessToken = this.microsoftService.accessToken;
            const retorno = await this.http.axios.get(`https://graph.microsoft.com/v1.0/users/${email}/drive/root/children`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return retorno.data.value;
        } catch (error) {
            console.log(error.response)
            fs.appendFileSync('error.txt', JSON.stringify(error) + '\n');
            throw new BadRequestException(`Erro ao listar pastas do OneDrive: ${error.message}`);
        }
    }

    async ListaArquivosPastaOneDrive(email: string, idPasta: string) {

        let arquivos = [];
        let url = `https://graph.microsoft.com/v1.0/users/${email}/drive/items/${idPasta}/children`;

        while (url) {
            try {
                await this.microsoftService.initializeAccessToken();
                const res = await this.http.axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${this.microsoftService.accessToken}`
                    }
                });

                arquivos = arquivos.concat(res.data.value);
                const nextPage = res.data['@odata.nextLink'] || null;
                url = nextPage || null;

            } catch (error) {
                fs.appendFileSync('error.txt', JSON.stringify(error) + '\n');
                throw new BadRequestException(`Erro ao listar arquivos da pasta do OneDrive: ${error.message}`);
            }
        }

        return arquivos;
    }

    async DownloadArquivoOneDrive(email: string, caminho: string, items: any, local: string) {
        for (const item of items) {
            const videoExiste = await this.prismaService.valuation.findFirst({
                where: {
                    videoId: item.id,
                    descricao: item.name
                }
            });

            if (videoExiste) {
                console.log(`video ${item.name} já baixado`);
                continue;
            }

            try {
                await this.microsoftService.initializeAccessToken();
                const response = await this.http.axios.get(`https://graph.microsoft.com/v1.0/users/${email}/drive/items/${item.id}/content`, {
                    headers: {
                        Authorization: `Bearer ${this.microsoftService.accessToken}`
                    },
                    responseType: 'stream',
                    timeout: 0, 
                });

                console.log(`Iniciando download do arquivo ${caminho}`);
                const filePath = path.join(caminho, item.name);
                const writer = fs.createWriteStream(filePath);

                let downloadedBytes = 0;
                const totalBytes = parseInt(response.headers['content-length'], 10);

                response.data.on('data', (chunk: Buffer) => {
                    downloadedBytes += chunk.length;
                    const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2);
                    console.log(`Progresso: ${percentage}% do arquivo ${item.name}`);
                });

                response.data.on('error', (err: any) => {
                    console.error(`Erro no download do arquivo ${item.name}: ${err.message}`);
                    writer.end();
                });

                response.data.on('end', async () => {
                    console.log(`Download do arquivo ${item.name} concluído.`);
                    await this.prismaService.valuation.create({
                        data: {
                            local: local,
                            videoId: item.id,
                            descricao: item.name
                        },
                    });
                });

                response.data.pipe(writer);

                writer.on('finish', () => {
                    console.log(`Arquivo ${item.name} salvo em ${filePath}`);
                });

                writer.on('error', (err) => {
                    console.error(`Erro ao salvar o arquivo ${item.name}:`, err);
                });

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

            } catch (error) {
                console.error(`Erro ao baixar o arquivo ${item.name}:`, error);
                fs.appendFileSync('error.txt', JSON.stringify(error) + '\n');
                throw new BadRequestException(`Erro ao baixar arquivo ${item.name}: ${error?.message}`);

            }
        }
    }

}