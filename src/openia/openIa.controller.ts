import { Controller, Post } from "@nestjs/common";
import { OpenIaService } from "./openIa.service";


@Controller("openIA")
export class openIAController {
    constructor(private readonly openIaService: OpenIaService) { }


    @Post()
    async transcreverVideo() {
        return this.openIaService.transcreverVideo();
    }

}
