const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { upsertGuildConfig } = require('../../db/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setupstatus')
    .setDescription('Create/set the status channel and pinned status embed.')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Optional: choose a channel to use for status instead of auto-creating.')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute({ interaction, env, log, db, client }) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: 'This command must be run in a server.', flags: MessageFlags.Ephemeral });
    }

    const ch = interaction.options.getChannel('channel');
    if (ch) {
      upsertGuildConfig(db, guild.id, { status_channel_id: ch.id, status_message_id: null });
    }

    // Lazy-require so command deployment doesn't crash if runtime deps are missing.
    const { updateGuildStatus } = require('../status/statusUpdater');

    await interaction.reply({ content: 'Setting up status…', flags: MessageFlags.Ephemeral });
    await updateGuildStatus({ client, env, log, db, guild });
    await interaction.followUp({ content: 'Done. Your status embed is live and will auto-update.', flags: MessageFlags.Ephemeral });
  }
};
