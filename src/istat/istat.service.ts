import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import axios from 'axios';
import { ComuneDto } from './dto/comune.dto';
import Fuse from 'fuse.js';

@Injectable()
export class IstatService {
  private readonly COMUNI_CACHE_KEY = 'comuni';
  private readonly CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  private readonly axiosInstance = axios.create({
    baseURL: 'https://axqvoqvbfjpaamphztgd.functions.supabase.co/',
  });

  private fuse: Fuse<ComuneDto>;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private async _getComuni(): Promise<ComuneDto[]> {
    let comuni = await this.cacheManager.get<ComuneDto[]>(
      this.COMUNI_CACHE_KEY,
    );
    if (!comuni) {
      try {
        this.logger.debug('Fetching Comuni from external API');
        const { data } = await this.axiosInstance.get<ComuneDto[]>('/comuni');
        await this.cacheManager.set(
          this.COMUNI_CACHE_KEY,
          data,
          this.CACHE_TTL_MS,
        );
        this.logger.info(
          `Fetched and cached 
        ${data.length} Comuni from external API`,
        );
        comuni = data;
      } catch (err) {
        this.logger.error('Failed to fetch Comuni from external API:');
        this.logger.error(err?.response?.data || (err as Error)?.message);
        console.error(err?.response?.data || err);
        throw new InternalServerErrorException();
      }
    }
    this.fuse = new Fuse(comuni, {
      keys: ['nome', 'nomeStraniero'],
      threshold: 0.3,
    });
    return comuni;
  }

  public async getComuni(q?: string): Promise<ComuneDto[]> {
    const comuni = await this._getComuni();

    if (!q) {
      return comuni.slice(0, 30);
    }

    if (!this.fuse) {
      this.logger.error(
        'Fuse.js not initialized yet. Returning unfiltered results.',
      );
      return comuni.filter(
        (comune) =>
          comune.nome.toLowerCase().includes(q.toLowerCase()) ||
          comune.nomeStraniero?.toLowerCase().includes(q.toLowerCase()),
      );
    }

    const results = this.fuse.search(q);
    this.logger.debug(
      `Found ${results.length} matching Comuni for query "${q}"`,
    );
    // limit to 30 results
    return results.map((result) => result.item).slice(0, 30);
  }

  // input: any-cased comune, output: correctly capitalized comune
  public async getComuneData(comune: string): Promise<ComuneDto | null> {
    const comuni = await this._getComuni();
    const found = comuni.find(
      (c) => c.nome.toLowerCase() === comune.toLowerCase(),
    );
    if (!found) {
      this.logger.warn(`Comune ${comune} not found`);
      return null;
    }
    return found;
  }
}
