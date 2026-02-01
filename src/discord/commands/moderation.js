const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../../db/guildConfig');
const { RconClient } = require('../../rcon/rconClient');

// Chivalry 2 community documentation commonly references KickById / BanById. (Server-dependent)
module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Kick/ban/unban (requires RCON wiring).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sc =>
      sc.setName('kick')
        .setDescription('Kick a player by server id.')
        .addStringOption(o => o.setName('id').setDescription('Player id').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
    )
    .addSubcommand(sc =>
      sc.setName('ban')
        .setDescription('Ban a player by server id.')
        .addStringOption(o => o.setName('id').setDescription('Player id').setRequired(true))
        .addIntegerOption(o => o.setName('duration_minutes').setDescription('Ban duration in minutes').setRequired(false))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
    )
    .addSubcommand(sc =>
      sc.setName('unban')
        .setDescription('Unban a player by id.')
        .addStringOption(o => o.setName('id').setDescription('Player id').setRequired(true))
    ),

  async execute({ interaction, db, log }) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'Run inside a server.', ephemeral: true });

    const cfg = getGuildConfig(db, guild.id) || {};
    const host = cfg.rcon_host;
    const port = cfg.rcon_port;
    const password = cfg.rcon_password;

    if (!host || !port || !password) {
      return interaction.reply({ content: 'RCON not configured. Run /rcon set first.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand(true);
    const rcon = new RconClient({ host, port, password, log });

    await interaction.deferReply({ ephemeral: true });

    try {
      if (sub === 'kick') {
        const id = interaction.options.getString('id', true);
        const reason = interaction.options.getString('reason') || '';
        await rcon.exec(`KickById ${id} ${reason}`.trim());
        return interaction.editReply(`Kick attempted for id ${id}.`);
      }

      if (sub === 'ban') {
        const id = interaction.options.getString('id', true);
        const mins = interaction.options.getInteger('duration_minutes');
        const reason = interaction.options.getString('reason') || '';
        const cmd = mins ? `BanById ${id} ${mins} ${reason}`.trim() : `BanById ${id} ${reason}`.trim();
        await rcon.exec(cmd);
        return interaction.editReply(`Ban attempted for id ${id}.`);
      }

      if (sub === 'unban') {
        const id = interaction.options.getString('id', true);
        await rcon.exec(`UnbanById ${id}`.trim());
        return interaction.editReply(`Unban attempted for id ${id}.`);
      }
    } catch (err) {
      return interaction.editReply(`RCON error: ${err.message}`);
    }
  }
};
