const { ChannelType, PermissionsBitField } = require('discord.js');

/**
 * Ensures we have a single "status panel" message per guild:
 * - find/create status channel (by ID, then by name, then create)
 * - find existing message by stored messageId, else create it
 * - store channelId/messageId via db if available
 */
async function ensurePinnedStatusMessage({ guild, env, log, db }) {
    const guildId = guild.id;

    const channelKey = `status.channelId.${guildId}`;
    const messageKey = `status.messageId.${guildId}`;

    const preferredName = env.STATUS_CHANNEL_NAME || 'chiv2-server-status';

    let channelId = null;
    let messageId = null;

    try { channelId = await db.get?.(channelKey); } catch (_) { }
    try { messageId = await db.get?.(messageKey); } catch (_) { }

    // 1) Resolve channel
    let channel = null;

    if (channelId) {
        try { channel = await guild.channels.fetch(channelId); } catch (_) { }
    }

    if (!channel) {
        channel = guild.channels.cache.find(
            (c) => c.type === ChannelType.GuildText && c.name === preferredName
        ) || null;
    }

    if (!channel) {
        // Create channel with safe defaults
        channel = await guild.channels.create({
            name: preferredName,
            type: ChannelType.GuildText,
            reason: 'Chiv2 server status panel channel',
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.ReadMessageHistory,
                    ],
                    deny: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.AddReactions,
                    ],
                },
            ],
        });
    }

    // store channel id
    try { await db.set?.(channelKey, channel.id); } catch (_) { }

    // 2) Resolve message
    let msg = null;

    if (messageId) {
        try { msg = await channel.messages.fetch(messageId); } catch (_) { }
    }

    if (!msg) {
        msg = await channel.send({
            content: 'Initializing status panel…',
        });

        // Pin it (best-effort)
        try { await msg.pin(); } catch (e) {
            log?.warn?.({ err: String(e) }, 'Could not pin status message (missing permissions?)');
        }

        try { await db.set?.(messageKey, msg.id); } catch (_) { }
    }

    return msg;
}

module.exports = { ensurePinnedStatusMessage };