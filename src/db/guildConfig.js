function getGuildConfig(store, guildId) {
  return store.data.guild_config[guildId] || null;
}

function upsertGuildConfig(store, guildId, patch) {
  const existing = getGuildConfig(store, guildId) || { guild_id: guildId };
  const merged = { ...existing, ...patch, guild_id: guildId, updated_at: new Date().toISOString() };
  store.data.guild_config[guildId] = merged;
  store.save();
  return merged;
}

module.exports = { getGuildConfig, upsertGuildConfig };
