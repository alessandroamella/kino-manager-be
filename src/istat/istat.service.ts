import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import axios from 'axios';
import { ComuneDto, ComuniDto } from './dto/comune.dto';

@Injectable()
export class IstatService {
  private readonly COMUNI_CACHE_KEY = 'comuni';
  private readonly COMUNI_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  private readonly axiosInstance = axios.create({
    baseURL: 'https://axqvoqvbfjpaamphztgd.functions.supabase.co/',
  });

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private async _getComuni(): Promise<ComuneDto[]> {
    const cachedComuni = await this.cacheManager.get<ComuneDto[]>(
      this.COMUNI_CACHE_KEY,
    );
    if (cachedComuni) {
      this.logger.debug('Returning cached Comuni');
      return cachedComuni;
    }

    this.logger.debug('Fetching Comuni from external API');
    const { data } = await this.axiosInstance.get<ComuniDto>('/comuni');
    await this.cacheManager.set(
      this.COMUNI_CACHE_KEY,
      data.comuni,
      this.COMUNI_TTL_MS,
    );
    this.logger.info('Fetched and cached Comuni from external API');
    return data.comuni;
  }

  public async getComuni(q?: string): Promise<ComuneDto[]> {
    const comuni = await this._getComuni();
    if (!q) {
      return comuni;
    }

    return comuni.filter((comune) =>
      comune.nome.toLowerCase().includes(q.toLowerCase()),
    );
  }
}
