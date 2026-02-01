const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    if (guildId) {
      console.log(`Deploying ${commands.length} guild commands to ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log('Done.');
    } else {
      console.log(`Deploying ${commands.length} global commands...`);
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Done.');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
