// Crawler entrypoint — schedules cron + serves /health.

import 'dotenv/config';
import { createServer } from 'node:http';
import cron from 'node-cron';
import { runCrawl } from './runner.js';

const PORT = Number(process.env.PORT ?? 3001);

interface HealthState {
  startedAt: string;
  lastRunAt: string | null;
  lastRunOk: boolean | null;
  lastRunSummary: string | null;
}

const state: HealthState = {
  startedAt: new Date().toISOString(),
  lastRunAt: null,
  lastRunOk: null,
  lastRunSummary: null,
};

async function tick(): Promise<void> {
  state.lastRunAt = new Date().toISOString();
  try {
    const result = await runCrawl();
    const totalNew = Object.values(result.stats).reduce((acc, s) => acc + s.articles_new, 0);
    const errorCount = Object.values(result.stats).reduce((acc, s) => acc + s.errors.length, 0);
    state.lastRunOk = errorCount === 0;
    state.lastRunSummary = `${totalNew} new, ${errorCount} errors across ${Object.keys(result.stats).length} sources`;
    console.log(`[crawler] tick OK: ${state.lastRunSummary}`);
  } catch (err) {
    state.lastRunOk = false;
    state.lastRunSummary = err instanceof Error ? err.message : String(err);
    console.error('[crawler] tick FAILED', err);
  }
}

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state, null, 2));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[crawler] healthcheck on http://0.0.0.0:${PORT}/health`);
});

// Brief §5.2: 15 min in waking hours, 30 min overnight.
cron.schedule('*/15 7-23 * * *', tick, { timezone: 'Europe/Paris' });
cron.schedule('*/30 0-6 * * *', tick, { timezone: 'Europe/Paris' });

// One run on startup so we don't wait up to 15 min for the first tick.
tick();
