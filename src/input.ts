import { prompt } from 'enquirer';
import { KlinePeriod } from './downloader';
import { DateTime } from 'luxon';

const DATE_FORMAT = 'yyyy-MM';

export type RequestParams = {
  currencyPair: string;
  period: KlinePeriod;
  startDate: string;
  endDate: string;
  path: string;
};

export async function query() {
  const input = await prompt<RequestParams>([
    {
      type: 'input',
      name: 'currencyPair',
      message: 'What currency pair to fetch? (e.g. BTCUSDT)',
      initial: 'BTCUSDT',
    },
    {
      type: 'select',
      name: 'period',
      message: 'Which period should be used?',
      required: true,
      choices: [
        { name: '1s', value: '1s' },
        { name: '1m', value: '1m' },
        { name: '3m', value: '3m' },
        { name: '5m', value: '5m' },
        { name: '15m', value: '15m' },
        { name: '30m', value: '30m' },
        { name: '1h', value: '1h' },
        { name: '2h', value: '2h' },
        { name: '4h', value: '4h' },
        { name: '6h', value: '6h' },
        { name: '8h', value: '8h' },
        { name: '12h', value: '12h' },
        { name: '1d', value: '1d' },
        { name: '3d', value: '3d' },
        { name: '1w', value: '1w' },
        { name: '1mo', value: '1mo' },
      ],
    },
    {
      type: 'input',
      name: 'startDate',
      message: `What should be the start month? (${DATE_FORMAT})`,
      initial: DateTime.now().minus({ months: 2 }).toFormat('yyyy-MM'),
      validate: (value) => DateTime.fromFormat(value, DATE_FORMAT).isValid,
    },
    {
      type: 'input',
      name: 'endDate',
      initial: DateTime.now().minus({ months: 1 }).toFormat('yyyy-MM'),
      message: `What should be the end month? (${DATE_FORMAT})`,
      validate: (value) => DateTime.fromFormat(value, DATE_FORMAT).isValid,
    },
    {
      type: 'input',
      name: 'path',
      message: 'What should be the filename for the csv file?',
      initial: 'data.csv',
    },
  ]);
  return {
    ...input,
    startDate: DateTime.fromFormat(input.startDate, DATE_FORMAT).toJSDate(),
    endDate: DateTime.fromFormat(input.endDate, DATE_FORMAT).toJSDate(),
  };
}
