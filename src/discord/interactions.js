const { handleStatusPanelInteraction } = require("./status/panelInteractions");

async function registerInteractionHandler({ interaction, env, log, db, client }) {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands?.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute({ interaction, env, log, db, client });
      return;
    }

    // Panel buttons / selects
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await handleStatusPanelInteraction({ interaction, env, log, db, client });
      return;
    }
  } catch (err) {
    log?.warn?.({ err: String(err) }, "Interaction handler failed");
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: "Something went wrong handling that interaction.", ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: "Something went wrong handling that interaction.", ephemeral: true }).catch(() => {});
    }
  }
}

module.exports = { registerInteractionHandler };
