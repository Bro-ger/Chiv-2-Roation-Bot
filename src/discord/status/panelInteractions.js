const { EmbedBuilder } = require("discord.js");

async function toggleRotation({ interaction, db }) {
    const guildId = interaction.guildId;
    const state = await db.getPanelState(guildId);
    const showRotation = !state.showRotation;

    await db.setPanelState(guildId, { ...state, showRotation });

    // Safely rebuild embed
    const existing = interaction.message.embeds?.[0];
    const eb = existing ? EmbedBuilder.from(existing) : new EmbedBuilder().setTitle("Chiv2 Server Status");

    // Optionally remove rotation fields when hiding
    if (!showRotation) {
        const filtered = (eb.data.fields ?? []).filter((f) => f.name !== "Rotation");
        eb.setFields(filtered);
    }

    await interaction.update({
        embeds: [eb],
        components: interaction.message.components // statusUpdater will refresh full components next tick anyway
    });
}