const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

/**
 * This project loads commands from: src/discord/commands/*.js
 *
 * Fastest way to see new commands immediately (no cache lag):
 *  - set DISCORD_GUILD_ID in .env
 *  - run: npm run deploy
 *
 * If you previously deployed GLOBAL commands and want to remove stale ones,
 * you can set CLEAR_GLOBAL=true and run deploy once.
 */
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const clearGlobal = String(process.env.CLEAR_GLOBAL || '').toLowerCase() === 'true';

if (!token || !clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
}

const commands = [];

// NOTE: This file is expected to live in tools/ (repo root/tools/...)
const commandsPath = path.join(__dirname, '..', 'src', 'discord', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const command = require(path.join(commandsPath, file));
  if (!command?.data?.toJSON) {
    // Skip non-command files safely
    // eslint-disable-next-line no-console
    console.warn(`Skipping ${file}: missing .data.toJSON()`);
    continue;
  }
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    if (clearGlobal) {
      // eslint-disable-next-line no-console
      console.log('Clearing GLOBAL commands (body: [])...');
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      // eslint-disable-next-line no-console
      console.log('Global commands cleared.');
    }

    if (guildId) {
      // eslint-disable-next-line no-console
      console.log(`Deploying ${commands.length} GUILD commands to ${guildId}...`);
      // "Double put" helps avoid weird cache in some clients
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      // eslint-disable-next-line no-console
      console.log('Done. (Guild commands update immediately.)');
    } else {
      // eslint-disable-next-line no-console
      console.log(`Deploying ${commands.length} GLOBAL commands...`);
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      // eslint-disable-next-line no-console
      console.log('Done. (Global can take up to ~1 hour to propagate.)');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
})();
