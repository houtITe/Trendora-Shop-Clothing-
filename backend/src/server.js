const app = require('./app');
const env = require('./config/env');
const { assertDbConnection } = require('./config/database');

async function start() {
  try {
    await assertDbConnection();
    console.log('[db] MySQL connection OK');
  } catch (err) {
    console.error('[db] Could not connect to MySQL:', err.message);
    console.error('      Check your .env DB_* values, and that MySQL is running.');
    console.error('      Run `npm run db:init` then `npm run db:seed` if the tables are empty.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`Trendora API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  return server;
}

const serverPromise = start();

// Guard rails so a stray rejection/exception never silently kills the API.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

module.exports = serverPromise;
