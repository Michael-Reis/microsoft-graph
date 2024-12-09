import { Module } from '@nestjs/common';
import { MicrosoftHttpService } from './http.microsoft.service';
import { FakeHttpService } from './http.fake.service';

@Module({
  providers: [MicrosoftHttpService, FakeHttpService],
  exports: [MicrosoftHttpService, FakeHttpService],
})
export class HttpModule {}
