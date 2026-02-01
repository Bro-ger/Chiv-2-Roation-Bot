const KEY = (guildId) => `panel:${guildId}`;

async function getPanelState({ db, guildId }) {
    let raw = null;
    try {
        raw = await db.get?.(KEY(guildId));
    } catch {
        raw = null;
    }

    let parsed = {};
    try {
        parsed = raw ? JSON.parse(raw) : {};
    } catch {
        parsed = {};
    }

    return {
        hideRotation: Boolean(parsed.hideRotation),
        selectedPreset: parsed.selectedPreset || null,
        stagingMode: Boolean(parsed.stagingMode)
    };
}

async function setPanelState({ db, guildId, patch }) {
    const data = JSON.stringify(patch);
    await db.set?.(KEY(guildId), data);
}

module.exports = { getPanelState, setPanelState };