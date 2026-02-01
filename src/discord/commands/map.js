const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../../db/guildConfig');
const { RconClient } = require('../../rcon/rconClient');

/**
 * Map switching is server-dependent. Some servers use commands like:
 *   ChangeMap <map>
 *   SetGameMode <mode>
 * or a combined command. You’ll need to wire in the correct one for your host/server build.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Force a map/mode switch (requires RCON wiring).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc =>
      sc.setName('force')
        .setDescription('Attempt to force a map + mode.')
        .addStringOption(o => o.setName('mode').setDescription('Mode e.g., TO, LTS, FFA').setRequired(true))
        .addStringOption(o => o.setName('map').setDescription('Map e.g., TO_Coxwell').setRequired(true))
    ),

  async execute({ interaction, db, log }) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'Run inside a server.', ephemeral: true });

    const cfg = getGuildConfig(db, guild.id) || {};
    if (!cfg.rcon_host || !cfg.rcon_port || !cfg.rcon_password) {
      return interaction.reply({ content: 'RCON not configured. Run /rcon set first.', ephemeral: true });
    }

    const mode = interaction.options.getString('mode', true);
    const map = interaction.options.getString('map', true);

    await interaction.deferReply({ ephemeral: true });

    try {
      const rcon = new RconClient({ host: cfg.rcon_host, port: cfg.rcon_port, password: cfg.rcon_password, log });
      // Placeholder commands; update to match your server
      await rcon.exec(`SetGameMode ${mode}`);
      await rcon.exec(`ChangeMap ${map}`);
      await interaction.editReply(`Map switch attempted: **${mode} — ${map}**`);
    } catch (err) {
      await interaction.editReply(`RCON error: ${err.message}`);
    }
  }
};
