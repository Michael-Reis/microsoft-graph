import { Injectable } from "@nestjs/common";
import { createReadStream } from "fs";
import OpenAI from "openai";
import fs from "fs";
import axios from "axios";


@Injectable()
export class OpenIaService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENIA_KEY,
            baseURL: "https://api.openai.com/v1",
        });
    }

    async transcreverVideo() {
        try {
            const path = "public/video.mp4";
            const video = createReadStream(path);

            const url = "https://api.openai.com/v1/chat/completions";
            const response = await axios.post(url, {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant."
                    },
                    {
                        role: "user",
                        content: "What is the meaning of life?"
                    }
                ]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENIA_KEY}`
                }
            })


            console.log(response.data);


            // const transcrito = await this.openai.audio.transcriptions.create({
            //     file: video,
            //     model: "whisper-1",
            //     language: "pt",
            //     response_format: "json",
            //     temperature: 0,
            //     prompt: "Transcreva o áudio do vídeo",
            // })

            // console.log(transcrito);
            // fs.writeFileSync("transcricao.log", JSON.stringify(transcrito));
        } catch (error) {
            console.error(error.response.data);
        }


        return;
    }
}