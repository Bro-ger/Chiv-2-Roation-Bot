const { SlashCommandBuilder } = require('discord.js');
const { getGuildConfig } = require('../../db/guildConfig');
const { NitradoClient } = require('../../nitrado/client');
const { normalizeGameserverResponse } = require('../../nitrado/normalize');
const { a2sInfo, a2sPlayer } = require('../../query/a2s');

function fmtHostPort(host, port) {
    return `${host}:${port}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('querytest')
        .setDescription('Probe the server query port (A2S) to see if player names are accessible.'),

    async execute(interaction, { env, log, db }) {
        const guildId = interaction.guildId;
        await interaction.reply({ content: 'Running query probe…', ephemeral: true });

        const cfg = getGuildConfig(db, guildId) || {};
        const token = cfg.nitrado_token || env.NITRADO_TOKEN;
        const serviceId = cfg.nitrado_service_id || env.NITRADO_SERVICE_ID;

        if (!token || !serviceId) {
            return interaction.editReply('Missing Nitrado token/service id. Use /setnitrado or set env vars.');
        }

        // pull ip + query port from Nitrado
        let host = null;
        let port = null;
        try {
            const api = new NitradoClient({ token, log });
            const payload = await api.getGameserver(serviceId);
            const server = normalizeGameserverResponse(payload);

            host = server.ip;
            port = server.queryPort;

            if (!host || !port) {
                return interaction.editReply(`Could not determine query endpoint from Nitrado payload. ip=${String(host)} queryPort=${String(port)}`);
            }
        } catch (err) {
            log.warn({ err: { message: err.message, status: err.status, url: err.url } }, 'querytest: nitrado fetch failed');
            return interaction.editReply(`Failed to fetch server details from Nitrado. (${err.status || 'error'})`);
        }

        const target = fmtHostPort(host, port);

        // A2S_INFO
        let info;
        try {
            info = await a2sInfo({ host, port, timeoutMs: 2000 });
        } catch (err) {
            const msg =
                err.message === 'timeout'
                    ? `No UDP A2S response from **${target}** (timeout).`
                    : `No A2S_INFO response from **${target}** (${err.message}).`;

            return interaction.editReply(
                `${msg}\n\nThis usually means the game/server does not expose Steam A2S queries on that port (common for some console-focused builds).`
            );
        }

        // A2S_PLAYER (optional)
        let players = null;
        try {
            players = await a2sPlayer({ host, port, timeoutMs: 2000 });
        } catch (err) {
            players = null;
        }

        const lines = [];
        lines.push(`✅ A2S_INFO responded from **${target}**`);
        lines.push(`**Name:** ${info.name || '—'}`);
        lines.push(`**Map:** ${info.map || '—'}`);
        lines.push(`**Players:** ${info.players}/${info.maxPlayers} (bots: ${info.bots})`);
        lines.push(`**Game:** ${info.game || '—'} (${info.folder || '—'})`);
        lines.push(`**Version:** ${info.version || '—'}`);

        if (players && players.length) {
            const names = players.map(p => p.name).filter(Boolean);
            const top = names.slice(0, 10);
            lines.push(`\n✅ A2S_PLAYER responded — showing top ${top.length}:`);
            lines.push(top.map((n, i) => `${i + 1}. ${n}`).join('\n'));
        } else {
            lines.push(`\n⚠️ A2S_PLAYER did not return a player list.`);
            lines.push(`This can mean the server blocks player queries, requires a different protocol, or simply doesn't expose names.`);
        }

        return interaction.editReply(lines.join('\n'));
    }
};