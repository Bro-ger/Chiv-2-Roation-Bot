const { createDiscordClient } = require('./discord/client');
const { loadEnv } = require('./config/env');
const { createLogger } = require('./tools/logger');
const { initDb } = require('./db');
const { startStatusLoop } = require('./discord/status/statusUpdater');
const { Events } = require('discord.js');

(async () => {
  const env = loadEnv();
  const log = createLogger(env);

  const db = initDb(env, log);
  const client = await createDiscordClient({ env, log, db });

  // discord.js v15+: use ClientReady (not 'ready')
  client.once(Events.ClientReady, async () => {
    log.info({ user: client.user?.tag }, 'Bot ready');
    startStatusLoop({ client, env, log, db });
  });

  await client.login(env.DISCORD_TOKEN);
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
