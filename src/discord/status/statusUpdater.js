// src/discord/status/statusUpdater.js
const { ensurePinnedStatusMessage, buildStatusComponents } = require("./pinnedStatus");
const { getPanelState } = require("./panelState");
const { ROTATION_PRESETS } = require("./presets");

// If you already have these in your project, keep the requires.
// If not, adjust these imports to match your repo structure.
const { getGuildConfig } = require("../../db/guildConfig");
const { NitradoClient } = require("../../nitrado/client");
const { normalizeGameserverResponse } = require("../../nitrado/normalize");

// ---------------------------
// Helpers
// ---------------------------
function presetListFromObject(obj) {
    if (!obj || typeof obj !== "object") return [];
    return Object.entries(obj)
        .map(([key, p]) => ({
            key,
            label: p?.label || key,
            description: p?.description || p?.desc || "",
            rotation: p?.rotation || []
        }))
        .filter((p) => p.key && p.label);
}

function nowStamp() {
    return new Date().toLocaleString();
}

async function ensureStatusChannel({ guild, env }) {
    const desiredName = (env?.STATUS_CHANNEL_NAME || "chiv2-server-status").toLowerCase();

    // fetch channels to ensure cache populated
    const channels = await guild.channels.fetch();

    // Find by exact name (text channel)
    let channel = channels.find(
        (c) => c && c.isTextBased?.() && typeof c.name === "string" && c.name.toLowerCase() === desiredName
    );

    if (channel) return channel;

    // Create if missing
    channel = await guild.channels.create({
        name: desiredName,
        reason: "Chiv2 bot status channel"
    });

    return channel;
}

async function fetchServerStatus({ env, db, guildId, log }) {
    const cfg = (db && getGuildConfig) ? (getGuildConfig(db, guildId) || {}) : {};

    const token = cfg?.nitrado_token || env.NITRADO_TOKEN;
    const serviceId = cfg?.nitrado_service_id || env.NITRADO_SERVICE_ID;

    if (!token || !serviceId) {
        return {
            name: cfg?.server_name || "Chivalry 2 Server",
            status: "UNCONFIGURED",
            players: null,
            maxPlayers: null,
            nextMap: null,
            rotation: [],
            _error: "Missing Nitrado token/service id. Use /setnitrado or env vars."
        };
    }

    const api = new NitradoClient({ token, log });
    const raw = await api.getGameserver(serviceId);
    return normalizeGameserverResponse(raw);
}

function buildStatusEmbed({ guild, serverStatus, panelState }) {
    const serverName = serverStatus?.name || guild?.name || "Chivalry 2 Server";
    const statusText = String(serverStatus?.status || "unknown").toUpperCase();

    const players =
        (serverStatus?.players == null || serverStatus?.maxPlayers == null)
            ? "—"
            : `${serverStatus.players}/${serverStatus.maxPlayers}`;

    const nextMap = serverStatus?.nextMap || "—";
    const rotation = Array.isArray(serverStatus?.rotation) ? serverStatus.rotation : [];

    const showRotation = !!panelState?.showRotation;

    const rotationLines = showRotation
        ? (rotation.length
            ? [
                `▶ **Next:** ${rotation[0]}`,
                ...rotation.slice(1, 10).map((m) => `• ${m}`),
                rotation.length > 10 ? `…and ${rotation.length - 10} more` : null
            ].filter(Boolean).join("\n")
            : "_No rotation data found (map-rotation empty)._")
        : "_Hidden (click **Show Rotation**)_";

    const selectedPreset = panelState?.selectedPresetKey
        ? `\`${panelState.selectedPresetKey}\``
        : "`regular`";

    return {
        title: `${serverName} — Status`,
        description: [
            statusText === "STARTED" ? "🟢 **STARTED**" : `🟠 **${statusText}**`,
            "",
            `**Players**\n${players}`,
            "",
            `**Next Map**\n${nextMap}`,
            "",
            `**Rotation (Next Up)**\n${rotationLines}`,
            "",
            `**Preset**: ${selectedPreset}`,
            "",
            `Chivalry 2 • Nitrado Status • Auto-updated • ${nowStamp()}`
        ].join("\n")
    };
}

// ---------------------------
// Core updater
// ---------------------------
async function updateStatusForGuild({ client, env, log, db, guildId }) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;

    const panelState = getPanelState(guildId);
    const rotationPresets = presetListFromObject(ROTATION_PRESETS);

    const channel = await ensureStatusChannel({ guild, env });
    const msg = await ensurePinnedStatusMessage({ channel, log });

    const serverStatus = await fetchServerStatus({ env, db, guildId, log });

    const embed = buildStatusEmbed({ guild, serverStatus, panelState });
    const components = buildStatusComponents({
        showRotation: !!panelState.showRotation,
        rotationPresets,
        selectedPresetKey: panelState.selectedPresetKey
    });

    await msg.edit({ content: "", embeds: [embed], components });
}

async function tick({ client, env, log, db }) {
    // Ensure guild cache is populated
    await client.guilds.fetch().catch(() => null);

    const guildIds = [...client.guilds.cache.keys()];

    for (const guildId of guildIds) {
        try {
            await updateStatusForGuild({ client, env, log, db, guildId });
        } catch (e) {
            log?.warn?.({ guildId, err: String(e) }, "Status loop tick failed");
        }
    }
}

function startStatusLoop({ client, env, log, db }) {
    const intervalMs = Number(env.STATUS_REFRESH_MS || 30000);

    tick({ client, env, log, db }).catch((e) => {
        log?.warn?.({ err: String(e) }, "Initial status tick failed");
    });

    setInterval(() => {
        tick({ client, env, log, db }).catch((e) => {
            log?.warn?.({ err: String(e) }, "Status loop tick failed");
        });
    }, intervalMs);
}

module.exports = {
    startStatusLoop,
    updateStatusForGuild,
    fetchServerStatus
};