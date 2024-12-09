import { Module } from '@nestjs/common';
import { MicrosofGraphRpcService } from './microsoftropc.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],  
    controllers: [],
    providers: [MicrosofGraphRpcService],
    exports: [MicrosofGraphRpcService]
})
export class MicrosoftGraphRpcModule { }
