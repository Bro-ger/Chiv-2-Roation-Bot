const { SlashCommandBuilder } = require('discord.js');
const { getMonthlyDailyPeaks } = require('../../db/statusSamples');

function defaultMonthYYYYMM() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show monthly daily peak player counts.')
        .addStringOption(o =>
            o.setName('month')
                .setDescription('YYYY-MM (default: current month)')
                .setRequired(false)
        ),

    async execute(interaction, { db }) {
        const month = (interaction.options.getString('month') || defaultMonthYYYYMM()).trim();
        const guildId = interaction.guildId;

        const { peaks, bestDay, bestPeak } = getMonthlyDailyPeaks(db, guildId, month);

        if (!peaks.length) {
            return interaction.reply({ content: `No samples recorded for **${month}** yet.`, ephemeral: true });
        }

        const top = peaks.slice(0, 10)
            .map((r, i) => `#${i + 1} **${r.peak}** — ${r.day}`)
            .join('\n');

        const header = `**Monthly daily peaks (${month})**\n🏆 Best day: **${bestDay}** with **${bestPeak}** players\n\n`;

        return interaction.reply({ content: `${header}${top}`, ephemeral: true });
    }
};