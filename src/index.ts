// import { join } from 'path';
// import { downloadKline } from './downloader';

// console.log('AAAAAAAA');
// downloadKline(
//   'ADAUSDT',
//   '1s',
//   new Date('2023-07-11'),
//   new Date('2023-08-11'),
//   join(__dirname, '../ADAUSDT.csv'),
// );

import { run } from './runner';

if (require.main === module) {
  run();
}
