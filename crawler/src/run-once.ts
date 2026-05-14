// Manual one-shot run, useful for local testing or backfilling.
// Usage: `npm run run-once`

import 'dotenv/config';
import { runCrawl } from './runner.js';

(async () => {
  const result = await runCrawl();
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
