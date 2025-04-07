import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { getMunicipalities } from 'codice-fiscale-ts';
import Fuse from 'fuse.js';
import { isNil, omitBy } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ComuneDtoShort } from './dto/comune.dto';

@Injectable()
export class IstatService {
  private readonly COMUNI_CACHE_KEY = 'comuni_v2'; // different from previous cache key to avoid conflicts
  private readonly CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  private fuse: Fuse<ComuneDtoShort>;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private async _getComuni(): Promise<ComuneDtoShort[]> {
    let comuni = await this.cacheManager.get<ComuneDtoShort[]>(
      this.COMUNI_CACHE_KEY,
    );
    if (!comuni) {
      try {
        this.logger.debug('Fetching Comuni from codice-fiscale-ts library');
        const municipalities = await getMunicipalities();

        // Convert the library data format to our DTO format
        const data: ComuneDtoShort[] = municipalities.map(
          ([, name, province]) => {
            return omitBy(
              {
                name,
                province,
              },
              isNil,
            ) as ComuneDtoShort;
          },
        );

        await this.cacheManager.set(
          this.COMUNI_CACHE_KEY,
          data,
          this.CACHE_TTL_MS,
        );
        this.logger.info(
          `Fetched and cached ${data.length} Comuni from codice-fiscale-ts library`,
        );
        comuni = data;
      } catch (err) {
        this.logger.error(
          'Failed to fetch Comuni from codice-fiscale-ts library:',
        );
        this.logger.error((err as Error)?.message);
        console.error(err);
        throw new InternalServerErrorException();
      }
    }
    this.fuse = new Fuse(comuni, {
      keys: ['name'] as (keyof ComuneDtoShort)[],
      threshold: 0.2,
    });
    return comuni;
  }

  public async getComuni(q?: string): Promise<ComuneDtoShort[]> {
    const comuni = await this._getComuni();

    if (!q) {
      return comuni.slice(0, 30);
    }

    if (!this.fuse) {
      this.logger.error(
        'Fuse.js not initialized yet. Returning unfiltered results.',
      );
      return comuni.filter((comune) =>
        comune.name.toLowerCase().includes(q.toLowerCase()),
      );
    }

    const results = this.fuse.search(q);
    this.logger.debug(
      `Found ${results.length} matching Comuni for query "${q}"`,
    );
    // limit to 30 results
    return results.map((result) => result.item).slice(0, 30);
  }
}
