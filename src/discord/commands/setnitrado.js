const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { upsertGuildConfig } = require('../../db/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setnitrado')
    .setDescription('Set Nitrado token + service id for this Discord server (stored in SQLite).')
    .addStringOption(opt => opt.setName('token').setDescription('Nitrado OAuth2 access token (Bearer)').setRequired(true))
    .addStringOption(opt => opt.setName('service_id').setDescription('Nitrado service id for your gameserver').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute({ interaction, db }) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'Run this inside a server.', ephemeral: true });

    const token = interaction.options.getString('token', true).trim();
    const serviceId = interaction.options.getString('service_id', true).trim();

    upsertGuildConfig(db, guild.id, { nitrado_token: token, nitrado_service_id: serviceId });

    await interaction.reply({
      content: 'Saved Nitrado config for this server. (Stored locally in SQLite; do not commit your data folder.)',
      ephemeral: true
    });
  }
};
