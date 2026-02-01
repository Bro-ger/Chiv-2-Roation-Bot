const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { upsertGuildConfig, getGuildConfig } = require('../../db/guildConfig');
const { RconClient } = require('../../rcon/rconClient');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rcon')
    .setDescription('Configure and use RCON (optional).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc =>
      sc.setName('set')
        .setDescription('Set RCON host/port/password for this guild.')
        .addStringOption(o => o.setName('host').setDescription('RCON host/IP').setRequired(true))
        .addIntegerOption(o => o.setName('port').setDescription('RCON port').setRequired(true))
        .addStringOption(o => o.setName('password').setDescription('RCON password').setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('exec')
        .setDescription('Execute a raw RCON command (advanced).')
        .addStringOption(o => o.setName('command').setDescription('Command text').setRequired(true))
    ),

  async execute({ interaction, db, log }) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'Run inside a server.', ephemeral: true });

    const sub = interaction.options.getSubcommand(true);

    if (sub === 'set') {
      const host = interaction.options.getString('host', true).trim();
      const port = interaction.options.getInteger('port', true);
      const password = interaction.options.getString('password', true).trim();
      upsertGuildConfig(db, guild.id, { rcon_host: host, rcon_port: port, rcon_password: password });
      return interaction.reply({ content: 'Saved RCON settings. (Note: RCON protocol is a stub by default in this template.)', ephemeral: true });
    }

    if (sub === 'exec') {
      const cfg = getGuildConfig(db, guild.id) || {};
      const host = cfg.rcon_host;
      const port = cfg.rcon_port;
      const password = cfg.rcon_password;
      if (!host || !port || !password) {
        return interaction.reply({ content: 'RCON is not configured. Run /rcon set first.', ephemeral: true });
      }

      const command = interaction.options.getString('command', true);
      await interaction.deferReply({ ephemeral: true });

      try {
        const rcon = new RconClient({ host, port, password, log });
        const out = await rcon.exec(command);
          await interaction.editReply(
              'Executed. Output:\n```\n' + String(out).slice(0, 1500) + '\n```'
          );
      } catch (err) {
        await interaction.editReply(`RCON error: ${err.message}`);
      }
    }
  }
};
