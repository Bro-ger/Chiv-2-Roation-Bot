const dotenv = require('dotenv');
const { z } = require('zod');

function loadEnv() {
  dotenv.config();

  const schema = z.object({
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_GUILD_ID: z.string().optional(),

    POLL_INTERVAL_SECONDS: z.coerce.number().int().min(10).max(600).default(30),
    STATUS_CHANNEL_NAME: z.string().min(1).default('chiv2-server-status'),

    // optional defaults (can be overridden per guild using slash commands)
    NITRADO_TOKEN: z.string().optional(),
    NITRADO_SERVICE_ID: z.string().optional(),

    // optional defaults for RCON
    RCON_HOST: z.string().optional(),
    RCON_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    RCON_PASSWORD: z.string().optional(),
  });

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid .env configuration:\n${msg}`);
  }
  return parsed.data;
}

module.exports = { loadEnv };
