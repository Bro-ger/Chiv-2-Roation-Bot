const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events
} = require('discord.js');

const path = require('path');
const fs = require('fs');
const { registerInteractionHandler } = require('./interactions');

async function createDiscordClient({ env, log, db }) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds
    ],
    partials: [Partials.Channel]
  });

  client.commands = new Collection();

  // load command modules
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }

  client.on(Events.InteractionCreate, (interaction) => registerInteractionHandler({ interaction, env, log, db, client }));
  return client;
}

module.exports = { createDiscordClient };
