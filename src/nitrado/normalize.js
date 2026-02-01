/**
 * Nitrado payloads vary by game.
 * Normalize into a stable shape for embeds + commands.
 */
function splitLines(str) {
    if (!str) return [];
    return String(str)
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
}

function firstLine(str) {
    return splitLines(str)[0] || null;
}

function toNumberOrNull(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function normalizeGameserverResponse(raw) {
    // Common shape: { status: "success", data: { gameserver: { ... } } }
    const gs = raw?.data?.gameserver || raw?.gameserver || raw?.data || raw || {};

    const status = gs?.status || gs?.status_text || gs?.state || 'unknown';

    // Server name often lives in settings.config.ServerName
    const serverName =
        gs?.settings?.config?.ServerName ||
        gs?.settings?.config?.servername ||
        gs?.label ||
        gs?.game_human ||
        gs?.game ||
        'Chivalry 2 Server';

    const rawMax =
        gs?.slots ??
        gs?.max_players ??
        gs?.player_max ??
        gs?.query?.player_max ??
        gs?.query?.players?.max;

    const maxPlayers = (rawMax === undefined || rawMax === null) ? null : toNumberOrNull(rawMax);

    // Only set players if explicitly present
    const rawPlayers =
        gs?.players ??
        gs?.player_current ??
        gs?.query?.player_current ??
        gs?.query?.players?.online ??
        gs?.query?.players?.current;

    const players = (rawPlayers === undefined || rawPlayers === null) ? null : toNumberOrNull(rawPlayers);

    // IP + query port (useful for /querytest)
    const ip = gs?.ip || null;
    const queryPort = toNumberOrNull(gs?.query_port);

    // Rotation is present in settings.config["map-rotation"]
    const rotationRaw = gs?.settings?.config?.['map-rotation'] || gs?.settings?.config?.map_rotation;
    const rotation = splitLines(rotationRaw);
    const nextMap = rotation[0] || null;

    // Live/current map generally not present for Chiv2; show next map explicitly
    const map =
        gs?.map ||
        gs?.map_name ||
        gs?.query?.map ||
        (nextMap ? `Next: ${nextMap}` : '—');

    return {
        name: serverName,
        status,
        map,
        nextMap,
        rotation,
        players,
        maxPlayers,
        ip,
        queryPort
    };
}

module.exports = { normalizeGameserverResponse };