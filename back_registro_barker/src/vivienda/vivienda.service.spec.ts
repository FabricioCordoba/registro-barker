import { Test, TestingModule } from '@nestjs/testing';
import { ViviendaService } from './vivienda.service';

describe('ViviendaService', () => {
  let service: ViviendaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViviendaService],
    }).compile();

    service = module.get<ViviendaService>(ViviendaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
