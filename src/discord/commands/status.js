const { SlashCommandBuilder, MessageFlags } = require('discord.js');

function fmtPlayers(players, maxPlayers) {
  const cur = (typeof players === 'number' && Number.isFinite(players)) ? players : '—';
  const max = (typeof maxPlayers === 'number' && Number.isFinite(maxPlayers)) ? maxPlayers : '—';
  return `${cur}/${max}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Refresh the server status embed right now.'),

  async execute({ interaction, client, env, log, db }) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: 'This command must be run in a server.', flags: MessageFlags.Ephemeral });
    }

    // Lazy-require so command deployment doesn't crash if runtime deps are missing.
    const { updateGuildStatus, fetchServerStatus } = require('../status/statusUpdater');

    await interaction.reply({ content: 'Refreshing…', flags: MessageFlags.Ephemeral });

    await updateGuildStatus({ client, env, log, db, guild });

    const res = await fetchServerStatus({ env, db, log, guildId: guild.id });
    if (!res.ok) {
      return interaction.editReply(`Refreshed. (Status fetch error: ${res.error})`);
    }

    const playersText = fmtPlayers(res.server.players, res.server.maxPlayers);
    return interaction.editReply(`Refreshed. **${res.server.status}**, players: **${playersText}**`);
  }
};
