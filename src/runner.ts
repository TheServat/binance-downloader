import { downloadKline } from './downloader';
import { query } from './input';

export async function run(): Promise<void> {
  try {
    const queryResult = await query();
    await downloadKline(
      queryResult.currencyPair,
      queryResult.period,
      queryResult.startDate,
      queryResult.endDate,
      queryResult.path,
    );
  } catch (e) {
    console.error(e);
  }
}
