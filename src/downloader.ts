import { DateTime } from 'luxon';
import axios from 'axios-observable';
import { range } from './utils';
import pino from 'pino';
import * as yauzl from 'yauzl';
import { appendFileSync, statSync, truncateSync, writeFileSync } from 'fs';
import { lastValueFrom, retry } from 'rxjs';
import { AxiosError } from 'axios';

const URL_BASE = 'https://data.binance.vision/data/spot/monthly/klines/';
const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
export type KlinePeriod =
  | '1s'
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1mo';

const unzip = (buffer: Buffer, to: string) =>
  new Promise<boolean>((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, result) => {
      if (err) {
        return reject(err);
      }
      result.readEntry();
      logger.debug(`writing to ${to}`);
      result.on('entry', async (entry) => {
        result.openReadStream(entry, (err, stream) => {
          if (err) {
            return reject(err);
          }
          stream.on('data', (data) => {
            appendFileSync(to, data);
          });
          stream.on('end', () => resolve(true));
        });
      });
    });
  });

export async function downloadKline(
  currencyPair: string,
  period: KlinePeriod,
  startDate: Date,
  endDate: Date,
  to: string,
) {
  try {
    const start = DateTime.fromJSDate(startDate).startOf('month');
    const end = DateTime.fromJSDate(endDate).startOf('month');

    if (end < start) {
      throw new Error('End date is set before start date');
    }

    const urls = range(end.diff(start, 'months').months + 1)
      .reverse()
      .map((i) => {
        const date = DateTime.fromJSDate(endDate).minus({ months: i });
        const url = `${URL_BASE}${currencyPair}/${period}/${currencyPair}-${period}-${date.toFormat(
          'yyyy',
        )}-${date.toFormat('MM')}.zip`;
        return url;
      });
    try {
      const stat = statSync(to);
      if (stat.isFile) {
        logger.debug(`${to} is exists truncating...`);
        truncateSync(to);
      }
    } catch (error) {
      writeFileSync(to, '');
    }
    writeFileSync(
      to,
      `openTime,open,high,low,close,volume,closeTime,quoteAssetVolume,numberOfTrades,takerBuyBaseAssetVolume,takerBuyQuoteAssetVolume,ignore\n`,
    );
    for await (const url of urls) {
      logger.debug(`Fetching ${url}`);
      const response = await lastValueFrom(
        axios
          .get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            onDownloadProgress: (progressEvent) => {
              logger.debug(
                `Progress ${(progressEvent.progress * 100).toFixed(
                  2,
                )}% - ${progressEvent.estimated?.toFixed(1)} sec`,
              );
            },
          })
          .pipe(retry({ count: 100, delay: 1000 })),
      );
      await unzip(response.data, to);
    }
  } catch (e) {
    if ((e as AxiosError).isAxiosError && e.response?.status === 404) {
      throw new Error(
        `Could not find historical data for URL: ${e.config.url}`,
      );
    }
    throw e;
  }
}
