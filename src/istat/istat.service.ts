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
  private readonly COMUNI_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  private readonly axiosInstance = axios.create({
    baseURL: 'https://axqvoqvbfjpaamphztgd.functions.supabase.co/',
  });

  private fuse: Fuse<ComuneDto>;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private async _getComuni(): Promise<ComuneDto[]> {
    try {
      const cachedComuni = await this.cacheManager.get<ComuneDto[]>(
        this.COMUNI_CACHE_KEY,
      );
      if (cachedComuni) {
        this.fuse = new Fuse(cachedComuni, {
          keys: ['nome' /*, 'provincia.nome', 'provincia.regione'*/],
          threshold: 0.3,
        });
        this.logger.debug(`Returning ${cachedComuni.length} cached Comuni`);
        return cachedComuni;
      }
      this.logger.debug('No cached Comuni found');
    } catch (err) {
      this.logger.error('Failed to get cached Comuni:');
      this.logger.error((err as Error)?.message);
      console.error(err);
      throw new InternalServerErrorException();
    }

    try {
      this.logger.debug('Fetching Comuni from external API');
      const { data } = await this.axiosInstance.get<ComuneDto[]>('/comuni');
      await this.cacheManager.set(
        this.COMUNI_CACHE_KEY,
        data,
        this.COMUNI_TTL_MS,
      );
      this.logger.info(
        `Fetched and cached ${data.length} Comuni from external API`,
      );
      // Initialize Fuse.js after fetching and caching data
      this.fuse = new Fuse(data, {
        keys: ['nome' /*, 'provincia.nome', 'provincia.regione'*/],
        threshold: 0.3,
      });
      return data;
    } catch (err) {
      this.logger.error('Failed to fetch Comuni from external API:');
      this.logger.error(err?.response?.data || (err as Error)?.message);
      console.error(err?.response?.data || err);
      throw new InternalServerErrorException();
    }
  }

  public async getComuni(q?: string): Promise<ComuneDto[]> {
    const comuni = await this._getComuni();

    if (!q) {
      return comuni;
    }

    if (!this.fuse) {
      this.logger.warn(
        'Fuse.js not initialized yet. Returning unfiltered results.',
      );
      return comuni; // Fallback if Fuse is not initialized (should not happen if _getComuni is awaited)
    }

    const results = this.fuse.search(q);
    this.logger.debug(
      `Found ${results.length} matching Comuni for query "${q}"`,
    );
    return results.map((result) => result.item); // Return the actual ComuneDto objects
  }
}
