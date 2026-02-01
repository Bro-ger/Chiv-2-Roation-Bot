// src/discord/status/pinnedStatus.js
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require("discord.js");

const PANEL_MESSAGE_MARKER = "Chiv2 Server Status"; // embed title marker

function pinsToArray(pinsRaw) {
    if (!pinsRaw) return [];

    // Already an array
    if (Array.isArray(pinsRaw)) return pinsRaw;

    // discord.js Collection-like: has .values()
    if (typeof pinsRaw.values === "function") {
        try {
            const vals = pinsRaw.values(); // might be iterator OR something else
            if (vals && typeof vals[Symbol.iterator] === "function") return [...vals];
            if (Array.isArray(vals)) return vals;
        } catch (_) {
            // fall through
        }
    }

    // Map-like: has .forEach()
    if (typeof pinsRaw.forEach === "function") {
        const out = [];
        try {
            pinsRaw.forEach((v) => out.push(v));
            return out;
        } catch (_) {
            // fall through
        }
    }

    // Array-like: has .map()
    if (typeof pinsRaw.map === "function") {
        try {
            return pinsRaw.map((m) => m);
        } catch (_) {
            // fall through
        }
    }

    // Plain object
    if (typeof pinsRaw === "object") {
        return Object.values(pinsRaw);
    }

    return [];
}

async function ensurePinnedStatusMessage({ channel, log }) {
    // Prefer new API
    let pinsRaw;
    if (channel?.messages?.fetchPins) {
        pinsRaw = await channel.messages.fetchPins();
    } else if (channel?.messages?.fetchPinned) {
        // Fallback for older discord.js
        pinsRaw = await channel.messages.fetchPinned();
    } else {
        pinsRaw = null;
    }

    const pins = pinsToArray(pinsRaw);

    const existing = pins.find((m) => {
        const title = m?.embeds?.[0]?.title;
        return typeof title === "string" && title.includes(PANEL_MESSAGE_MARKER);
    });

    if (existing) return existing;

    const msg = await channel.send({
        embeds: [{ title: PANEL_MESSAGE_MARKER, description: "Initializing status panel…" }],
        components: []
    });

    if (!msg.pinned) {
        await msg.pin().catch((e) => log?.warn?.({ err: String(e) }, "Pin failed"));
    }

    return msg;
}

function buildStatusComponents({ showRotation, rotationPresets, selectedPresetKey }) {
    const rows = [];

    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("panel_toggle_rotation")
                .setLabel(showRotation ? "Hide Rotation" : "Show Rotation")
                .setStyle(ButtonStyle.Secondary)
        )
    );

    if (showRotation) {
        const options = (rotationPresets ?? [])
            .filter((p) => p?.key && p?.label)
            .map((p) => ({
                label: p.label,
                description: p.description?.slice(0, 100),
                value: p.key,
                default: p.key === selectedPresetKey
            }));

        rows.push(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("panel_rotation_select")
                    .setPlaceholder(options.length ? "Choose a rotation preset…" : "No presets available")
                    .setMinValues(1)
                    .setMaxValues(1)
                    .setDisabled(options.length === 0)
                    .addOptions(options.length ? options : [{ label: "No presets available", value: "__none" }])
            )
        );

        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("panel_apply_rotation")
                    .setLabel("Apply rotation")
                    .setStyle(ButtonStyle.Primary)
            )
        );
    }

    return rows;
}

module.exports = {
    ensurePinnedStatusMessage,
    buildStatusComponents
};