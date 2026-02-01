const { getGuildConfig, upsertGuildConfig } = require('../db/guildConfig');
const { NitradoClient } = require('./client');

function joinLines(list) {
  return (Array.isArray(list) ? list : [])
    .filter(Boolean)
    .map(s => String(s).trim())
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Apply a preset rotation to Nitrado by writing settings.config["map-rotation"].
 * Also stores active preset fields in guildConfig for display in the pinned embed.
 */
async function applyRotationPreset({ env, db, log, guildId, preset }) {
  const cfg = getGuildConfig(db, guildId) || {};

  const token = cfg.nitrado_token || env.NITRADO_TOKEN;
  const serviceId = cfg.nitrado_service_id || env.NITRADO_SERVICE_ID;

  if (!token || !serviceId) {
    throw new Error('Missing Nitrado token/service id. Use /setnitrado or set env vars.');
  }

  if (!preset?.rotation || !Array.isArray(preset.rotation) || preset.rotation.length === 0) {
    throw new Error('Preset has no rotation list.');
  }

  const api = new NitradoClient({ token, log });
  const rotationStr = joinLines(preset.rotation);

  await api.updateGameserverSettings(serviceId, { 'map-rotation': rotationStr });

  if (String(env.NITRADO_RESTART_ON_APPLY || '').toLowerCase() === 'true') {
    await api.restartGameserver(serviceId);
  }

  upsertGuildConfig(db, guildId, {
    active_rotation_preset: preset.label || preset.name || null,
    active_rotation_preset_desc: preset.desc || preset.description || null,
  });
}

module.exports = { applyRotationPreset };
